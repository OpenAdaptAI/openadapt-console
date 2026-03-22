"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { loadTrace } from "../lib/trace-parser";
import { SAMPLE_TRACE } from "../lib/sample-data";
import type { Episode, FailureMode, Milestone, StepRecord, Trace } from "../lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatSeconds(s: number): string {
  if (s < 60) return `${Math.round(s)}s`;
  const mins = Math.floor(s / 60);
  const secs = Math.round(s % 60);
  return `${mins}m ${secs}s`;
}

function failureModeLabel(mode: FailureMode): string {
  if (!mode) return "Success";
  const labels: Record<string, string> = {
    loop_detected: "Loop Detected",
    timeout: "Timeout",
    server_error: "Server Error",
    agent_error: "Agent Error",
    planner_wrong_target: "Wrong Target",
    grounder_miss: "Grounder Miss",
    task_incomplete: "Task Incomplete",
    unknown_failure: "Unknown Failure",
  };
  return labels[mode] || mode;
}

function failureModeColor(mode: FailureMode): string {
  if (!mode) return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  const colors: Record<string, string> = {
    loop_detected: "bg-orange-50 text-orange-700 ring-orange-600/20",
    timeout: "bg-amber-50 text-amber-700 ring-amber-600/20",
    server_error: "bg-red-50 text-red-700 ring-red-600/20",
    agent_error: "bg-red-50 text-red-700 ring-red-600/20",
    planner_wrong_target: "bg-rose-50 text-rose-700 ring-rose-600/20",
    grounder_miss: "bg-rose-50 text-rose-700 ring-rose-600/20",
    task_incomplete: "bg-amber-50 text-amber-700 ring-amber-600/20",
    unknown_failure: "bg-slate-100 text-slate-600 ring-slate-500/20",
  };
  return colors[mode] || "bg-slate-100 text-slate-600 ring-slate-500/20";
}

// ---------------------------------------------------------------------------
// Action overlay component
// ---------------------------------------------------------------------------

function ActionOverlay({
  step,
  containerWidth,
  containerHeight,
  screenshotNativeWidth,
  screenshotNativeHeight,
}: {
  step: StepRecord;
  containerWidth: number;
  containerHeight: number;
  screenshotNativeWidth: number;
  screenshotNativeHeight: number;
}) {
  if (!step.coordinate && step.action_type !== "done" && step.action_type !== "fail") {
    return null;
  }

  const scaleX = containerWidth / screenshotNativeWidth;
  const scaleY = containerHeight / screenshotNativeHeight;

  const [cx, cy] = step.coordinate || [0, 0];
  const x = cx * scaleX;
  const y = cy * scaleY;

  const actionType = step.action_type || "click";

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={containerWidth}
      height={containerHeight}
      style={{ overflow: "visible" }}
    >
      {/* Click action: red circle with crosshair */}
      {actionType === "click" && (
        <g>
          <circle
            cx={x}
            cy={y}
            r={14}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth={2.5}
          />
          <circle cx={x} cy={y} r={3} fill="#ef4444" />
          {/* Crosshair lines */}
          <line x1={x - 20} y1={y} x2={x - 8} y2={y} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={x + 8} y1={y} x2={x + 20} y2={y} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={x} y1={y - 20} x2={x} y2={y - 8} stroke="#ef4444" strokeWidth={1.5} />
          <line x1={x} y1={y + 8} x2={x} y2={y + 20} stroke="#ef4444" strokeWidth={1.5} />
        </g>
      )}

      {/* Double-click: concentric circles */}
      {actionType === "double_click" && (
        <g>
          <circle
            cx={x}
            cy={y}
            r={18}
            fill="none"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="4 2"
          />
          <circle
            cx={x}
            cy={y}
            r={10}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth={2.5}
          />
          <circle cx={x} cy={y} r={3} fill="#ef4444" />
        </g>
      )}

      {/* Type action: green underline + text badge */}
      {actionType === "type" && (
        <g>
          <rect
            x={x - 40}
            y={y - 12}
            width={80}
            height={24}
            rx={4}
            fill="rgba(34, 197, 94, 0.15)"
            stroke="#22c55e"
            strokeWidth={2}
          />
          {step.typed_text && (
            <g>
              <rect
                x={x - 40}
                y={y + 16}
                width={Math.max(80, step.typed_text.length * 7 + 16)}
                height={22}
                rx={4}
                fill="#15803d"
              />
              <text
                x={x - 32}
                y={y + 31}
                fill="white"
                fontSize={11}
                fontFamily="monospace"
              >
                {step.typed_text}
              </text>
            </g>
          )}
        </g>
      )}

      {/* Scroll: arrow indicator */}
      {actionType === "scroll" && (
        <g>
          <circle
            cx={x}
            cy={y}
            r={16}
            fill="rgba(59, 130, 246, 0.15)"
            stroke="#3b82f6"
            strokeWidth={2}
          />
          {/* Up arrow */}
          {(step.scroll_direction === "up" || !step.scroll_direction) && (
            <path
              d={`M${x},${y - 8} L${x - 6},${y + 2} L${x + 6},${y + 2} Z`}
              fill="#3b82f6"
            />
          )}
          {step.scroll_direction === "down" && (
            <path
              d={`M${x},${y + 8} L${x - 6},${y - 2} L${x + 6},${y - 2} Z`}
              fill="#3b82f6"
            />
          )}
        </g>
      )}

      {/* Key combo: keyboard badge */}
      {actionType === "key" && step.key_combo && (
        <g>
          <rect
            x={x - 30}
            y={y - 12}
            width={Math.max(60, step.key_combo.length * 8 + 16)}
            height={24}
            rx={6}
            fill="#1e293b"
            stroke="#475569"
            strokeWidth={1}
          />
          <text
            x={x - 22}
            y={y + 4}
            fill="white"
            fontSize={11}
            fontFamily="monospace"
            fontWeight="bold"
          >
            {step.key_combo}
          </text>
        </g>
      )}

      {/* Done: green checkmark overlay */}
      {actionType === "done" && (
        <g>
          <circle
            cx={containerWidth / 2}
            cy={containerHeight / 2}
            r={28}
            fill="rgba(34, 197, 94, 0.2)"
            stroke="#22c55e"
            strokeWidth={3}
          />
          <path
            d={`M${containerWidth / 2 - 10},${containerHeight / 2} L${containerWidth / 2 - 3},${containerHeight / 2 + 10} L${containerWidth / 2 + 12},${containerHeight / 2 - 8}`}
            fill="none"
            stroke="#22c55e"
            strokeWidth={3.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {/* Fail: red X overlay */}
      {(actionType === "fail" || (step.decision === "fail" && actionType === "done")) && (
        <g>
          <circle
            cx={containerWidth / 2}
            cy={containerHeight / 2}
            r={28}
            fill="rgba(239, 68, 68, 0.2)"
            stroke="#ef4444"
            strokeWidth={3}
          />
          <line
            x1={containerWidth / 2 - 10}
            y1={containerHeight / 2 - 10}
            x2={containerWidth / 2 + 10}
            y2={containerHeight / 2 + 10}
            stroke="#ef4444"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
          <line
            x1={containerWidth / 2 + 10}
            y1={containerHeight / 2 - 10}
            x2={containerWidth / 2 - 10}
            y2={containerHeight / 2 + 10}
            stroke="#ef4444"
            strokeWidth={3.5}
            strokeLinecap="round"
          />
        </g>
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Milestone progress bar
// ---------------------------------------------------------------------------

function MilestoneBar({ milestones }: { milestones?: Milestone[] }) {
  if (!milestones || milestones.length === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      {milestones.map((m, i) => (
        <div key={i} className="group relative flex items-center gap-1">
          <div
            className={`h-7 flex items-center gap-1 rounded-md px-2 text-xs font-medium ${
              m.passed
                ? "bg-emerald-100 text-emerald-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {m.passed ? (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            ) : (
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            <span className="hidden sm:inline truncate max-w-[120px]">{m.description}</span>
          </div>
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-50">
            <div className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white shadow-lg whitespace-nowrap">
              {m.description} ({m.passed ? "passed" : "failed"}) - {Math.round(m.reward * 100)}% reward
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Episode selector
// ---------------------------------------------------------------------------

function EpisodeSelector({
  episodes,
  selectedId,
  onSelect,
}: {
  episodes: Episode[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  if (episodes.length <= 1) return null;

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {episodes.map((ep) => (
        <button
          key={ep.episode_id}
          onClick={() => onSelect(ep.episode_id)}
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all flex-shrink-0 ${
            selectedId === ep.episode_id
              ? "border-console-500 bg-console-50 text-console-800 font-medium shadow-sm"
              : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
          }`}
        >
          <span
            className={`inline-block h-2 w-2 rounded-full ${
              ep.success ? "bg-emerald-500" : ep.score > 0 ? "bg-amber-500" : "bg-red-500"
            }`}
          />
          <span className="truncate max-w-[160px]">{ep.task_id}</span>
          <span className="text-xs text-slate-400">{Math.round(ep.score * 100)}%</span>
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screenshot filmstrip
// ---------------------------------------------------------------------------

function Filmstrip({
  steps,
  selectedStep,
  onSelect,
}: {
  steps: StepRecord[];
  selectedStep: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
      {steps.map((step, i) => {
        const isSelected = i === selectedStep;
        const isError =
          step.decision === "fail" ||
          step.action_type === "fail" ||
          (step.target && step.target.includes("WRONG"));
        const isDone = step.action_type === "done" && step.decision !== "fail";

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative flex-shrink-0 rounded-lg border-2 transition-all ${
              isSelected
                ? "border-console-500 shadow-md ring-2 ring-console-200"
                : isError
                ? "border-red-300 hover:border-red-400"
                : isDone
                ? "border-emerald-300 hover:border-emerald-400"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            {/* Thumbnail placeholder */}
            <div
              className={`flex h-16 w-24 items-center justify-center rounded-md text-xs font-medium ${
                isSelected
                  ? "bg-console-50 text-console-700"
                  : isError
                  ? "bg-red-50 text-red-600"
                  : isDone
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-slate-50 text-slate-500"
              }`}
            >
              <div className="flex flex-col items-center gap-0.5">
                {/* Action type icon */}
                {step.action_type === "click" && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672z" />
                  </svg>
                )}
                {step.action_type === "type" && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                  </svg>
                )}
                {step.action_type === "key" && (
                  <span className="text-[10px] font-mono font-bold">KEY</span>
                )}
                {step.action_type === "scroll" && (
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
                  </svg>
                )}
                {(step.action_type === "done" || step.action_type === "fail") && (
                  step.decision === "fail" ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )
                )}
                <span>Step {i}</span>
              </div>
            </div>
            {/* Step number badge */}
            <div
              className={`absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                isSelected
                  ? "bg-console-600 text-white"
                  : "bg-slate-300 text-white"
              }`}
            >
              {i}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Planner reasoning panel
// ---------------------------------------------------------------------------

function ReasoningPanel({ step }: { step: StepRecord }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3 text-left"
      >
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-console-600"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
            />
          </svg>
          <span className="text-sm font-semibold text-slate-900">
            Planner Reasoning
          </span>
        </div>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 py-4 space-y-3">
          {step.decision && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Decision
              </span>
              <p className="mt-0.5">
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    step.decision === "done"
                      ? "bg-emerald-100 text-emerald-800"
                      : step.decision === "fail"
                      ? "bg-red-100 text-red-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {step.decision}
                </span>
              </p>
            </div>
          )}

          {step.instruction && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Instruction
              </span>
              <p className="mt-0.5 text-sm text-slate-800">{step.instruction}</p>
            </div>
          )}

          {step.target && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Target
              </span>
              <p className="mt-0.5 text-sm font-mono text-slate-700 bg-slate-50 rounded px-2 py-1">
                {step.target}
              </p>
            </div>
          )}

          {step.reasoning && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Reasoning
              </span>
              <p className="mt-0.5 text-sm text-slate-600 italic leading-relaxed">
                &ldquo;{step.reasoning}&rdquo;
              </p>
            </div>
          )}

          {step.action_type && (
            <div>
              <span className="text-xs font-medium uppercase tracking-wider text-slate-400">
                Action
              </span>
              <p className="mt-0.5 text-sm font-mono text-slate-700">
                {step.action_type}
                {step.coordinate && `(${step.coordinate[0]}, ${step.coordinate[1]})`}
                {step.typed_text && ` "${step.typed_text}"`}
                {step.key_combo && ` [${step.key_combo}]`}
              </p>
            </div>
          )}

          {step.action_history && step.action_history.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium uppercase tracking-wider text-slate-400 hover:text-slate-600">
                Action History ({step.action_history.length} prior)
              </summary>
              <div className="mt-1.5 space-y-0.5 max-h-32 overflow-y-auto">
                {step.action_history.map((a, i) => (
                  <p key={i} className="text-xs font-mono text-slate-500">
                    {i + 1}. {a}
                  </p>
                ))}
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Action history sidebar
// ---------------------------------------------------------------------------

function ActionTimeline({
  steps,
  selectedStep,
  onSelect,
}: {
  steps: StepRecord[];
  selectedStep: number;
  onSelect: (idx: number) => void;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <div className="px-5 py-3 border-b border-slate-100">
        <h3 className="text-sm font-semibold text-slate-900">Action Timeline</h3>
      </div>
      <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
        {steps.map((step, i) => {
          const isSelected = i === selectedStep;
          const isError =
            step.decision === "fail" ||
            step.action_type === "fail" ||
            (step.target && step.target.includes("WRONG"));

          return (
            <button
              key={i}
              onClick={() => onSelect(i)}
              className={`flex w-full items-start gap-3 px-5 py-3 text-left transition-colors ${
                isSelected
                  ? "bg-console-50"
                  : "hover:bg-slate-50"
              }`}
            >
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1 flex-shrink-0">
                <div
                  className={`h-3 w-3 rounded-full border-2 ${
                    isSelected
                      ? "border-console-600 bg-console-600"
                      : isError
                      ? "border-red-400 bg-red-100"
                      : "border-slate-300 bg-white"
                  }`}
                />
                {i < steps.length - 1 && (
                  <div className="w-px h-full min-h-[24px] bg-slate-200 mt-1" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold ${
                      isSelected ? "text-console-700" : "text-slate-500"
                    }`}
                  >
                    #{i}
                  </span>
                  <span
                    className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-mono font-semibold uppercase ${
                      isError
                        ? "bg-red-100 text-red-700"
                        : step.action_type === "done"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {step.action_type || "?"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-600 truncate">
                  {step.target || step.instruction || "No description"}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary stat cards
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext?: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium text-slate-500">{label}</p>
      <p className={`mt-1 text-xl font-bold ${color || "text-slate-900"}`}>
        {value}
      </p>
      {subtext && <p className="mt-0.5 text-xs text-slate-400">{subtext}</p>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page component
// ---------------------------------------------------------------------------

export default function TraceViewerPage({
  params,
}: {
  params: { id: string };
}) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const [selectedStepIdx, setSelectedStepIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  // Load trace
  useEffect(() => {
    const id = params.id;
    let loaded: Trace | null = null;

    if (id === SAMPLE_TRACE.id) {
      loaded = SAMPLE_TRACE;
    } else {
      loaded = loadTrace(id);
    }

    if (loaded) {
      setTrace(loaded);
      if (loaded.episodes.length > 0) {
        setSelectedEpisodeId(loaded.episodes[0].episode_id);
      }
    }
    setLoading(false);
  }, [params.id]);

  // Current episode and step
  const episode = useMemo(
    () => trace?.episodes.find((e) => e.episode_id === selectedEpisodeId) || null,
    [trace, selectedEpisodeId]
  );

  const currentStep = useMemo(
    () => (episode?.steps[selectedStepIdx] || null),
    [episode, selectedStepIdx]
  );

  // Keyboard navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (!episode) return;
      if (e.key === "ArrowRight" || e.key === "l") {
        setSelectedStepIdx((prev) =>
          Math.min(prev + 1, episode.steps.length - 1)
        );
      } else if (e.key === "ArrowLeft" || e.key === "h") {
        setSelectedStepIdx((prev) => Math.max(prev - 1, 0));
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [episode]);

  // Reset step when changing episode
  const handleEpisodeChange = useCallback((id: string) => {
    setSelectedEpisodeId(id);
    setSelectedStepIdx(0);
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-console-600" />
      </div>
    );
  }

  // Not found
  if (!trace) {
    return (
      <div className="flex h-96 flex-col items-center justify-center text-center">
        <svg
          className="h-16 w-16 text-slate-300 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
          />
        </svg>
        <h2 className="text-lg font-semibold text-slate-900">Trace not found</h2>
        <p className="mt-1 text-sm text-slate-500">
          This trace may have expired from the session.
        </p>
        <Link
          href="/traces"
          className="mt-4 text-sm font-medium text-console-600 hover:text-console-700"
        >
          Upload a new trace
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb + header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href="/traces"
            className="text-sm text-console-600 hover:text-console-700 font-medium"
          >
            Traces
          </Link>
          <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
          <span className="text-sm text-slate-600">{trace.name}</span>
        </div>
        <h1 className="text-2xl font-bold text-slate-900">{trace.name}</h1>
        {trace.metadata.planner_model && (
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">
              {trace.metadata.planner_model}
            </span>
            {trace.metadata.grounder_model && (
              <>
                {" + "}
                <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">
                  {trace.metadata.grounder_model}
                </span>
              </>
            )}
          </p>
        )}
      </div>

      {/* Summary stat cards */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <StatCard
          label="Episodes"
          value={String(trace.summary.total_episodes)}
        />
        <StatCard
          label="Success Rate"
          value={`${Math.round(trace.summary.success_rate * 100)}%`}
          color={
            trace.summary.success_rate >= 0.8
              ? "text-emerald-600"
              : trace.summary.success_rate >= 0.5
              ? "text-amber-600"
              : "text-red-600"
          }
        />
        <StatCard
          label="Avg Score"
          value={`${Math.round(trace.summary.avg_score * 100)}%`}
          color={
            trace.summary.avg_score >= 0.8
              ? "text-emerald-600"
              : trace.summary.avg_score >= 0.5
              ? "text-amber-600"
              : "text-red-600"
          }
        />
        <StatCard
          label="Total Steps"
          value={String(trace.summary.total_steps)}
        />
        <StatCard
          label="Avg Steps/Ep"
          value={String(trace.summary.avg_steps_per_episode)}
        />
        <StatCard
          label="Total Time"
          value={formatSeconds(trace.summary.total_time)}
        />
      </div>

      {/* Failure mode badges */}
      {trace.summary.failure_modes.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-500">Failure modes:</span>
          {trace.summary.failure_modes.map((fm) => (
            <span
              key={fm.mode}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${failureModeColor(fm.mode as FailureMode)}`}
            >
              {failureModeLabel(fm.mode as FailureMode)}
              <span className="opacity-70">({fm.count})</span>
            </span>
          ))}
        </div>
      )}

      {/* Episode selector */}
      {trace.episodes.length > 1 && (
        <div className="mb-6">
          <EpisodeSelector
            episodes={trace.episodes}
            selectedId={selectedEpisodeId}
            onSelect={handleEpisodeChange}
          />
        </div>
      )}

      {/* Current episode */}
      {episode && (
        <>
          {/* Episode header */}
          <div className="mb-4 rounded-xl border border-slate-200 bg-white px-5 py-4">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-base font-semibold text-slate-900 truncate">
                    {episode.task_id}
                  </h2>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${failureModeColor(episode.failure_mode || null)}`}
                  >
                    {episode.success ? "Passed" : failureModeLabel(episode.failure_mode || null)}
                  </span>
                </div>
                {episode.task_instruction && (
                  <p className="text-sm text-slate-600">
                    {episode.task_instruction}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <p className={`text-lg font-bold ${
                    episode.score >= 0.8
                      ? "text-emerald-600"
                      : episode.score >= 0.5
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}>
                    {Math.round(episode.score * 100)}%
                  </p>
                  <p className="text-xs text-slate-400">
                    {episode.num_steps} steps
                    {episode.elapsed_seconds > 0 && ` / ${formatSeconds(episode.elapsed_seconds)}`}
                  </p>
                </div>
              </div>
            </div>

            {/* Milestones */}
            {episode.milestones && episode.milestones.length > 0 && (
              <div className="mt-3 pt-3 border-t border-slate-100">
                <MilestoneBar milestones={episode.milestones} />
              </div>
            )}
          </div>

          {/* Filmstrip */}
          {episode.steps.length > 0 && (
            <div className="mb-4">
              <Filmstrip
                steps={episode.steps}
                selectedStep={selectedStepIdx}
                onSelect={setSelectedStepIdx}
              />
              <p className="mt-1 text-[11px] text-slate-400">
                Use arrow keys or click to navigate steps
              </p>
            </div>
          )}

          {/* Main content: screenshot + overlay + reasoning */}
          {currentStep && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Screenshot with overlay (2 cols) */}
              <div className="lg:col-span-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-slate-900">
                        Step {selectedStepIdx}
                      </h3>
                      {currentStep.action_type && (
                        <span className="inline-flex items-center rounded px-2 py-0.5 text-xs font-mono font-semibold bg-slate-100 text-slate-600 uppercase">
                          {currentStep.action_type}
                        </span>
                      )}
                      {currentStep.coordinate && (
                        <span className="text-xs text-slate-400 font-mono">
                          ({currentStep.coordinate[0]}, {currentStep.coordinate[1]})
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedStepIdx((p) => Math.max(p - 1, 0))}
                        disabled={selectedStepIdx === 0}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                        </svg>
                      </button>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {selectedStepIdx + 1} / {episode.steps.length}
                      </span>
                      <button
                        onClick={() =>
                          setSelectedStepIdx((p) =>
                            Math.min(p + 1, episode.steps.length - 1)
                          )
                        }
                        disabled={selectedStepIdx === episode.steps.length - 1}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 disabled:opacity-30 transition-colors"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Screenshot area with action overlay */}
                  <div className="relative rounded-lg bg-slate-100 overflow-hidden" style={{ aspectRatio: "16/10" }}>
                    {currentStep.screenshot_base64 ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`data:image/png;base64,${currentStep.screenshot_base64}`}
                        alt={`Step ${selectedStepIdx} screenshot`}
                        className="h-full w-full object-contain"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center">
                        <svg
                          className="h-16 w-16 text-slate-300"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth={0.75}
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                          />
                        </svg>
                        <p className="mt-3 text-sm text-slate-400">
                          Desktop screenshot
                        </p>
                        <p className="mt-0.5 text-xs text-slate-300">
                          Upload a trace with screenshots to see them here
                        </p>
                      </div>
                    )}

                    {/* Action overlay */}
                    <ActionOverlay
                      step={currentStep}
                      containerWidth={800}
                      containerHeight={500}
                      screenshotNativeWidth={1024}
                      screenshotNativeHeight={768}
                    />
                  </div>

                  {/* Action detail bar below screenshot */}
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                    {currentStep.action_type === "click" && currentStep.coordinate && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-red-500" />
                        <span className="text-slate-600">
                          Click at ({currentStep.coordinate[0]}, {currentStep.coordinate[1]})
                        </span>
                        {currentStep.target && (
                          <span className="text-slate-400">on &ldquo;{currentStep.target}&rdquo;</span>
                        )}
                      </div>
                    )}
                    {currentStep.action_type === "double_click" && currentStep.coordinate && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full border-2 border-red-500 bg-red-200" />
                        <span className="text-slate-600">
                          Double-click at ({currentStep.coordinate[0]}, {currentStep.coordinate[1]})
                        </span>
                      </div>
                    )}
                    {currentStep.action_type === "type" && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded bg-green-500" />
                        <span className="text-slate-600">
                          Type: <span className="font-mono">&ldquo;{currentStep.typed_text}&rdquo;</span>
                        </span>
                      </div>
                    )}
                    {currentStep.action_type === "key" && (
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono bg-slate-800 text-white rounded px-1.5 py-0.5 text-[10px]">
                          {currentStep.key_combo}
                        </span>
                        <span className="text-slate-600">Keyboard shortcut</span>
                      </div>
                    )}
                    {currentStep.action_type === "scroll" && (
                      <div className="flex items-center gap-1.5">
                        <div className="h-3 w-3 rounded-full bg-blue-500" />
                        <span className="text-slate-600">
                          Scroll {currentStep.scroll_direction || "down"}
                        </span>
                      </div>
                    )}
                    {currentStep.action_type === "done" && (
                      <div className="flex items-center gap-1.5">
                        {currentStep.decision === "fail" ? (
                          <>
                            <div className="h-3 w-3 rounded-full bg-red-500" />
                            <span className="text-red-600 font-medium">Agent reported failure</span>
                          </>
                        ) : (
                          <>
                            <div className="h-3 w-3 rounded-full bg-emerald-500" />
                            <span className="text-emerald-600 font-medium">Agent reported done</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right sidebar: Reasoning + Timeline (1 col) */}
              <div className="space-y-4">
                <ReasoningPanel step={currentStep} />
                <ActionTimeline
                  steps={episode.steps}
                  selectedStep={selectedStepIdx}
                  onSelect={setSelectedStepIdx}
                />
              </div>
            </div>
          )}

          {/* Empty state: no steps */}
          {episode.steps.length === 0 && (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-300"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">
                No step-level data
              </p>
              <p className="mt-1 text-sm text-slate-500">
                This episode has summary stats but no per-step trajectory data.
                Upload a trajectory JSONL (PlannerTrajectoryLogger output) for step-by-step details.
              </p>
            </div>
          )}
        </>
      )}

      {/* Action distribution */}
      {Object.keys(trace.summary.action_distribution).length > 0 && (
        <div className="mt-8 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">
            Action Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(trace.summary.action_distribution)
              .sort(([, a], [, b]) => b - a)
              .map(([action, count]) => {
                const total = trace.summary.total_steps || 1;
                const pct = Math.round((count / total) * 100);
                const color =
                  action === "click"
                    ? "bg-red-100 text-red-700"
                    : action === "type"
                    ? "bg-green-100 text-green-700"
                    : action === "scroll"
                    ? "bg-blue-100 text-blue-700"
                    : action === "key"
                    ? "bg-purple-100 text-purple-700"
                    : action === "done"
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-slate-100 text-slate-600";

                return (
                  <div
                    key={action}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 ${color}`}
                  >
                    <span className="text-sm font-mono font-semibold uppercase">
                      {action}
                    </span>
                    <span className="text-sm">
                      {count}
                    </span>
                    <span className="text-xs opacity-60">({pct}%)</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
