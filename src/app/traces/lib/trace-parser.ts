/**
 * Client-side JSONL trace parser.
 *
 * Parses trajectory JSONL (from PlannerTrajectoryLogger) and full-eval JSONL
 * (from run_full_eval.py) into the Trace data structure.
 */

import type {
  ActionType,
  Episode,
  FailureMode,
  PlannerOutput,
  StepRecord,
  Trace,
  TraceMetadata,
  TraceSummary,
} from "./types";

// ---------------------------------------------------------------------------
// Format detection
// ---------------------------------------------------------------------------

interface RawRecord {
  [key: string]: unknown;
}

function isTrajectoryRecord(record: RawRecord): boolean {
  return "episode_id" in record && "step_index" in record;
}

function isFullEvalRecord(record: RawRecord): boolean {
  return "task_id" in record && ("score" in record || "success" in record);
}

function isMetaRecord(record: RawRecord): boolean {
  return !!record._meta;
}

// ---------------------------------------------------------------------------
// Failure classification (mirrors trace_analyzer.py)
// ---------------------------------------------------------------------------

const SERVER_ERROR_RE =
  /connection|timeout|unreachable|500|502|503|504|refused|broken.pipe|reset.by.peer/i;

function classifyFailure(ep: Episode, maxSteps = 15): FailureMode {
  if (ep.success && ep.score >= 1.0) return null;

  if (ep.score > 0 && ep.score < 1.0) return "task_incomplete";

  if (ep.error_type === "infrastructure") return "server_error";
  if (ep.error && SERVER_ERROR_RE.test(ep.error)) return "server_error";
  if (ep.error_type === "agent") return "agent_error";

  if (ep.num_steps >= maxSteps) return "timeout";

  // Loop: 3+ consecutive identical actions
  if (ep.steps.length >= 3) {
    for (let i = 0; i < ep.steps.length - 2; i++) {
      const s1 = ep.steps[i];
      const s2 = ep.steps[i + 1];
      const s3 = ep.steps[i + 2];
      if (
        s1.action_type &&
        s1.action_type === s2.action_type &&
        s2.action_type === s3.action_type &&
        s1.target &&
        s1.target === s2.target &&
        s2.target === s3.target
      ) {
        return "loop_detected";
      }
    }
  }

  // Wrong target
  if (ep.steps.some((s) => s.decision && s.decision.toLowerCase().includes("fail"))) {
    return "planner_wrong_target";
  }

  return "unknown_failure";
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseTrajectoryRecords(records: RawRecord[]): Episode[] {
  // Group by episode_id
  const groups = new Map<string, RawRecord[]>();
  for (const rec of records) {
    const eid = (rec.episode_id as string) || "unknown";
    if (!groups.has(eid)) groups.set(eid, []);
    groups.get(eid)!.push(rec);
  }

  const episodes: Episode[] = [];

  for (const [eid, recs] of groups) {
    recs.sort((a, b) => ((a.step_index as number) || 0) - ((b.step_index as number) || 0));

    const steps: StepRecord[] = [];
    let taskInstruction = "";

    for (const rec of recs) {
      let plannerOut: PlannerOutput = {};
      const rawPlannerOut = rec.planner_output;
      if (typeof rawPlannerOut === "string") {
        try {
          plannerOut = JSON.parse(rawPlannerOut);
        } catch {
          plannerOut = {};
        }
      } else if (rawPlannerOut && typeof rawPlannerOut === "object") {
        plannerOut = rawPlannerOut as PlannerOutput;
      }

      // Extract coordinate from planner output or action value
      let coordinate: [number, number] | undefined;
      if (plannerOut.coordinate) {
        coordinate = plannerOut.coordinate;
      } else if (plannerOut.action_value && typeof plannerOut.action_value === "string") {
        // Try to parse "click(450, 320)" style
        const coordMatch = plannerOut.action_value.match(/\((\d+),\s*(\d+)\)/);
        if (coordMatch) {
          coordinate = [parseInt(coordMatch[1], 10), parseInt(coordMatch[2], 10)];
        }
      }

      const actionType = (plannerOut.action_type || rec.action_type || undefined) as
        | ActionType
        | undefined;

      steps.push({
        step_index: (rec.step_index as number) || 0,
        screenshot_path: rec.screenshot_path as string | undefined,
        action_type: actionType,
        target: (plannerOut.target_description as string) || undefined,
        instruction: (plannerOut.instruction as string) || undefined,
        reasoning: (plannerOut.reasoning as string) || undefined,
        decision: (plannerOut.decision as string) || undefined,
        action_history: (rec.action_history as string[]) || [],
        planner_output: plannerOut,
        coordinate,
        typed_text:
          actionType === "type" ? (plannerOut.action_value as string) : undefined,
        key_combo:
          actionType === "key" ? (plannerOut.action_value as string) : undefined,
      });

      if (!taskInstruction && rec.task_instruction) {
        taskInstruction = rec.task_instruction as string;
      }
    }

    const reward = recs[0]?.episode_reward as number | undefined;
    const success = reward != null ? reward > 0 : false;
    const score = reward ?? 0;

    const episode: Episode = {
      episode_id: eid,
      task_id: eid,
      task_instruction: taskInstruction,
      score,
      success,
      num_steps: steps.length,
      elapsed_seconds: 0,
      steps,
    };

    episode.failure_mode = classifyFailure(episode);
    episodes.push(episode);
  }

  return episodes;
}

function parseFullEvalRecords(
  records: RawRecord[],
  meta: RawRecord | null
): Episode[] {
  const episodes: Episode[] = [];

  for (const rec of records) {
    const taskId = rec.task_id as string;
    if (!taskId) continue;

    const episode: Episode = {
      episode_id: taskId,
      task_id: taskId,
      task_instruction: (rec.task_instruction as string) || "",
      score: (rec.score as number) || 0,
      success: (rec.success as boolean) || false,
      num_steps: (rec.steps as number) || 0,
      elapsed_seconds: (rec.elapsed_seconds as number) || 0,
      error: rec.error as string | undefined,
      error_type: rec.error_type as string | undefined,
      started_at: rec.started_at as string | undefined,
      finished_at: rec.finished_at as string | undefined,
      milestones_passed: rec.milestones_passed as number | undefined,
      milestones_total: rec.milestones_total as number | undefined,
      model: meta?.planner_model as string | undefined,
      steps: [],
    };

    episode.failure_mode = classifyFailure(episode);
    episodes.push(episode);
  }

  return episodes;
}

// ---------------------------------------------------------------------------
// Summary computation
// ---------------------------------------------------------------------------

function computeSummary(episodes: Episode[]): TraceSummary {
  const total = episodes.length;
  if (total === 0) {
    return {
      total_episodes: 0,
      total_steps: 0,
      success_rate: 0,
      avg_score: 0,
      avg_steps_per_episode: 0,
      avg_time_per_episode: 0,
      total_time: 0,
      failure_modes: [],
      action_distribution: {},
    };
  }

  const successes = episodes.filter((e) => e.success).length;
  const totalSteps = episodes.reduce((s, e) => s + e.num_steps, 0);
  const totalTime = episodes.reduce((s, e) => s + e.elapsed_seconds, 0);
  const avgScore = episodes.reduce((s, e) => s + e.score, 0) / total;

  // Failure modes
  const modeCounts = new Map<string, number>();
  for (const ep of episodes) {
    if (ep.failure_mode) {
      modeCounts.set(ep.failure_mode, (modeCounts.get(ep.failure_mode) || 0) + 1);
    }
  }
  const totalFailed = Array.from(modeCounts.values()).reduce((a, b) => a + b, 0);
  const failureModes = Array.from(modeCounts.entries())
    .map(([mode, count]) => ({
      mode,
      count,
      percentage: totalFailed > 0 ? Math.round((count / totalFailed) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // Action distribution
  const actionCounts: Record<string, number> = {};
  for (const ep of episodes) {
    for (const step of ep.steps) {
      const action = step.action_type || "unknown";
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    }
  }

  return {
    total_episodes: total,
    total_steps: totalSteps,
    success_rate: Math.round((successes / total) * 10000) / 10000,
    avg_score: Math.round(avgScore * 10000) / 10000,
    avg_steps_per_episode: Math.round((totalSteps / total) * 100) / 100,
    avg_time_per_episode: Math.round((totalTime / total) * 100) / 100,
    total_time: Math.round(totalTime * 100) / 100,
    failure_modes: failureModes,
    action_distribution: actionCounts,
  };
}

// ---------------------------------------------------------------------------
// Main parse function
// ---------------------------------------------------------------------------

/**
 * Parse a JSONL string into a Trace object.
 *
 * Auto-detects whether the input is:
 * - Trajectory JSONL (PlannerTrajectoryLogger output)
 * - Full-eval JSONL (run_full_eval.py output)
 * - Mixed format
 */
export function parseJsonl(jsonlText: string, fileName: string): Trace {
  const lines = jsonlText.split("\n").filter((l) => l.trim());
  const records: RawRecord[] = [];
  let metaRecord: RawRecord | null = null;

  for (const line of lines) {
    try {
      const parsed = JSON.parse(line) as RawRecord;
      if (isMetaRecord(parsed)) {
        metaRecord = parsed;
      } else {
        records.push(parsed);
      }
    } catch {
      // Skip malformed lines
    }
  }

  if (records.length === 0) {
    throw new Error("No valid records found in JSONL file");
  }

  // Detect format from first non-meta record
  const firstRecord = records[0];
  let episodes: Episode[];
  let sourceFormat: TraceMetadata["source_format"];

  if (isTrajectoryRecord(firstRecord)) {
    episodes = parseTrajectoryRecords(records);
    sourceFormat = "trajectory_dir";
  } else if (isFullEvalRecord(firstRecord)) {
    episodes = parseFullEvalRecords(records, metaRecord);
    sourceFormat = "full_eval_jsonl";
  } else {
    // Try trajectory first, then full-eval
    episodes = parseTrajectoryRecords(records);
    if (episodes.length === 0) {
      episodes = parseFullEvalRecords(records, metaRecord);
    }
    sourceFormat = "unknown";
  }

  const id = `trace_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const name = fileName.replace(/\.jsonl$/i, "");

  const metadata: TraceMetadata = {
    planner_model: metaRecord?.planner_model as string | undefined,
    grounder_model: metaRecord?.grounder_model as string | undefined,
    run_name: metaRecord?.run_name as string | undefined,
    created_at: new Date().toISOString(),
    source_format: sourceFormat,
  };

  return {
    id,
    name,
    metadata,
    episodes,
    summary: computeSummary(episodes),
  };
}

/**
 * Load a trace from sessionStorage by id.
 */
export function loadTrace(id: string): Trace | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`trace_${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Trace;
  } catch {
    return null;
  }
}

/**
 * Save a trace to sessionStorage.
 */
export function saveTrace(trace: Trace): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`trace_${trace.id}`, JSON.stringify(trace));

  // Update the index
  const indexRaw = sessionStorage.getItem("trace_index") || "[]";
  const index: { id: string; name: string; created_at: string; episodes: number; score: number }[] =
    JSON.parse(indexRaw);

  // Remove existing entry if any
  const filtered = index.filter((e) => e.id !== trace.id);
  filtered.unshift({
    id: trace.id,
    name: trace.name,
    created_at: trace.metadata.created_at || new Date().toISOString(),
    episodes: trace.summary.total_episodes,
    score: trace.summary.avg_score,
  });

  // Keep max 20
  sessionStorage.setItem("trace_index", JSON.stringify(filtered.slice(0, 20)));
}

/**
 * List all saved traces from sessionStorage.
 */
export function listTraces(): { id: string; name: string; created_at: string; episodes: number; score: number }[] {
  if (typeof window === "undefined") return [];
  const indexRaw = sessionStorage.getItem("trace_index") || "[]";
  try {
    return JSON.parse(indexRaw);
  } catch {
    return [];
  }
}

/**
 * Delete a trace from sessionStorage.
 */
export function deleteTrace(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(`trace_${id}`);

  const indexRaw = sessionStorage.getItem("trace_index") || "[]";
  const index = JSON.parse(indexRaw) as { id: string }[];
  sessionStorage.setItem(
    "trace_index",
    JSON.stringify(index.filter((e) => e.id !== id))
  );
}
