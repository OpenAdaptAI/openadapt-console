/**
 * TypeScript types for the trace viewer.
 *
 * These mirror the data structures in openadapt_evals/analysis/trace_analyzer.py
 * (Episode, StepRecord) and the PlannerTrajectoryLogger JSONL format.
 */

// ---------------------------------------------------------------------------
// Step-level data
// ---------------------------------------------------------------------------

export type ActionType =
  | "click"
  | "double_click"
  | "type"
  | "scroll"
  | "key"
  | "done"
  | "fail"
  | "wait"
  | "screenshot"
  | string;

export interface PlannerOutput {
  decision?: string;
  action_type?: ActionType;
  action_value?: string;
  target_description?: string;
  reasoning?: string;
  instruction?: string;
  coordinate?: [number, number];
}

export interface StepRecord {
  step_index: number;
  screenshot_path?: string;
  /** Base64-encoded screenshot PNG (for uploaded traces) */
  screenshot_base64?: string;
  action_type?: ActionType;
  target?: string;
  instruction?: string;
  reasoning?: string;
  decision?: string;
  action_history?: string[];
  /** Raw planner_output from trajectory JSONL */
  planner_output?: PlannerOutput;
  /** Coordinate of the action (x, y) in screenshot pixel space */
  coordinate?: [number, number];
  /** For scroll actions */
  scroll_direction?: "up" | "down" | "left" | "right";
  /** For type actions */
  typed_text?: string;
  /** For key actions */
  key_combo?: string;
}

// ---------------------------------------------------------------------------
// Milestone data
// ---------------------------------------------------------------------------

export interface Milestone {
  description: string;
  reward: number;
  passed?: boolean;
}

// ---------------------------------------------------------------------------
// Episode-level data
// ---------------------------------------------------------------------------

export type FailureMode =
  | "loop_detected"
  | "timeout"
  | "server_error"
  | "agent_error"
  | "planner_wrong_target"
  | "grounder_miss"
  | "task_incomplete"
  | "unknown_failure"
  | null;

export interface Episode {
  episode_id: string;
  task_id: string;
  task_instruction: string;
  score: number;
  success: boolean;
  num_steps: number;
  elapsed_seconds: number;
  error?: string;
  error_type?: string;
  started_at?: string;
  finished_at?: string;
  milestones_passed?: number;
  milestones_total?: number;
  milestones?: Milestone[];
  steps: StepRecord[];
  model?: string;
  failure_mode?: FailureMode;
}

// ---------------------------------------------------------------------------
// Trace (collection of episodes from one run)
// ---------------------------------------------------------------------------

export interface TraceMetadata {
  planner_model?: string;
  grounder_model?: string;
  run_name?: string;
  created_at?: string;
  source_format: "trajectory_dir" | "full_eval_jsonl" | "benchmark_dir" | "unknown";
}

export interface Trace {
  id: string;
  name: string;
  metadata: TraceMetadata;
  episodes: Episode[];
  /** Aggregate stats computed at parse time */
  summary: TraceSummary;
}

export interface TraceSummary {
  total_episodes: number;
  total_steps: number;
  success_rate: number;
  avg_score: number;
  avg_steps_per_episode: number;
  avg_time_per_episode: number;
  total_time: number;
  failure_modes: { mode: string; count: number; percentage: number }[];
  action_distribution: Record<string, number>;
}
