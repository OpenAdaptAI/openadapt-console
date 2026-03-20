"use client";

import { useState } from "react";

// Mock data
const corrections = [
  {
    id: "corr-001",
    task: "change-font",
    taskLabel: "Change Font (WordPad)",
    stepNumber: 3,
    stepDescription: "Click font dropdown in toolbar",
    agentAction: {
      type: "click",
      x: 450,
      y: 320,
      target: "Format menu",
      reasoning:
        "Need to access font settings through the Format menu to change the font.",
    },
    confidence: 0.32,
    status: "pending" as const,
    captured: "Mar 20, 2026 14:22",
  },
  {
    id: "corr-002",
    task: "copy-file",
    taskLabel: "Copy File",
    stepNumber: 5,
    stepDescription: "Navigate to destination folder",
    agentAction: {
      type: "click",
      x: 200,
      y: 450,
      target: "Desktop icon",
      reasoning:
        "Navigate to the destination folder by clicking the Desktop icon in the sidebar.",
    },
    confidence: 0.41,
    status: "pending" as const,
    captured: "Mar 20, 2026 11:05",
  },
  {
    id: "corr-003",
    task: "add-bookmark",
    taskLabel: "Add Bookmark",
    stepNumber: 2,
    stepDescription: "Open bookmarks manager",
    agentAction: {
      type: "click",
      x: 580,
      y: 40,
      target: "Settings menu",
      reasoning:
        "Access bookmarks through the browser settings menu in the top right.",
    },
    confidence: 0.55,
    status: "pending" as const,
    captured: "Mar 19, 2026 09:33",
  },
  {
    id: "corr-004",
    task: "change-font",
    taskLabel: "Change Font (WordPad)",
    stepNumber: 5,
    stepDescription: "Select Arial from font list",
    agentAction: {
      type: "click",
      x: 310,
      y: 280,
      target: "Font list item",
      reasoning: "Click on Arial in the font dropdown list to select it.",
    },
    confidence: 0.38,
    status: "pending" as const,
    captured: "Mar 19, 2026 08:15",
  },
  {
    id: "corr-005",
    task: "notepad_1",
    taskLabel: "Notepad Basic",
    stepNumber: 1,
    stepDescription: "Open Notepad application",
    agentAction: {
      type: "click",
      x: 50,
      y: 750,
      target: "Start menu",
      reasoning: "Open the Start menu to search for Notepad.",
    },
    confidence: 0.62,
    status: "reviewed" as const,
    captured: "Mar 18, 2026 16:40",
  },
  {
    id: "corr-006",
    task: "copy-file",
    taskLabel: "Copy File",
    stepNumber: 3,
    stepDescription: "Right-click on file to copy",
    agentAction: {
      type: "click",
      x: 400,
      y: 350,
      target: "File icon",
      reasoning: "Right-click on the target file to open the context menu.",
    },
    confidence: 0.45,
    status: "applied" as const,
    captured: "Mar 17, 2026 10:20",
  },
  {
    id: "corr-007",
    task: "add-bookmark",
    taskLabel: "Add Bookmark",
    stepNumber: 4,
    stepDescription: "Confirm bookmark creation",
    agentAction: {
      type: "click",
      x: 600,
      y: 400,
      target: "Done button",
      reasoning: "Click the Done button to save the bookmark.",
    },
    confidence: 0.29,
    status: "pending" as const,
    captured: "Mar 17, 2026 09:50",
  },
];

function StatusBadge({
  status,
}: {
  status: "pending" | "reviewed" | "applied" | "dismissed";
}) {
  const styles = {
    pending: "bg-amber-50 text-amber-700 ring-amber-600/20",
    reviewed: "bg-blue-50 text-blue-700 ring-blue-600/20",
    applied: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dismissed: "bg-slate-100 text-slate-500 ring-slate-400/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function ConfidenceMeter({ confidence }: { confidence: number }) {
  const color =
    confidence < 0.4
      ? "bg-red-500"
      : confidence < 0.6
      ? "bg-amber-500"
      : "bg-emerald-500";

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-16 rounded-full bg-slate-100">
        <div
          className={`h-2 rounded-full ${color}`}
          style={{ width: `${confidence * 100}%` }}
        />
      </div>
      <span
        className={`text-sm font-medium ${
          confidence < 0.4
            ? "text-red-600"
            : confidence < 0.6
            ? "text-amber-600"
            : "text-emerald-600"
        }`}
      >
        {confidence.toFixed(2)}
      </span>
    </div>
  );
}

export default function CorrectionsPage() {
  const [selectedCorrection, setSelectedCorrection] = useState<string | null>(
    null
  );
  const [filter, setFilter] = useState<
    "all" | "pending" | "reviewed" | "applied"
  >("all");

  const currentCorrection = corrections.find(
    (c) => c.id === selectedCorrection
  );

  const filteredCorrections =
    filter === "all"
      ? corrections
      : corrections.filter((c) => c.status === filter);

  const pendingCount = corrections.filter(
    (c) => c.status === "pending"
  ).length;

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Corrections</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review flagged steps with low verification confidence and provide
          corrections to improve the agent.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Pending Review</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {pendingCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Reviewed</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {corrections.filter((c) => c.status === "reviewed").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Applied to Training</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {corrections.filter((c) => c.status === "applied").length}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Avg. Confidence</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">
            {(
              corrections.reduce((sum, c) => sum + c.confidence, 0) /
              corrections.length
            ).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Selected correction detail view */}
      {selectedCorrection && currentCorrection && (
        <div className="mb-8 rounded-xl border border-console-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedCorrection(null)}
                className="flex items-center gap-1 text-sm text-console-600 hover:text-console-700 font-medium"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 19.5L8.25 12l7.5-7.5"
                  />
                </svg>
                Back
              </button>
              <h2 className="text-lg font-semibold text-slate-900">
                {currentCorrection.taskLabel} / Step{" "}
                {currentCorrection.stepNumber}
              </h2>
              <StatusBadge status={currentCorrection.status} />
            </div>
            <ConfidenceMeter confidence={currentCorrection.confidence} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* What the agent did */}
            <div className="rounded-lg border border-slate-200 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                What the agent did
              </h3>
              {/* Screenshot placeholder */}
              <div className="flex h-48 items-center justify-center rounded-lg bg-slate-100 mb-4 relative">
                <svg
                  className="h-12 w-12 text-slate-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                  />
                </svg>
                {/* Click marker */}
                <div
                  className="absolute h-6 w-6 rounded-full border-2 border-red-500 bg-red-500/20"
                  style={{ left: "60%", top: "55%" }}
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-bold text-red-700">
                      X
                    </span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Action:</span>
                  <span className="font-mono text-slate-900">
                    {currentCorrection.agentAction.type}(
                    {currentCorrection.agentAction.x},{" "}
                    {currentCorrection.agentAction.y})
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Target:</span>
                  <span className="text-slate-900">
                    {currentCorrection.agentAction.target}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-slate-500">Reasoning:</span>
                  <p className="mt-1 text-slate-700 italic">
                    &quot;{currentCorrection.agentAction.reasoning}&quot;
                  </p>
                </div>
              </div>
            </div>

            {/* What should have happened */}
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-4">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                What should have happened
              </h3>
              {/* Screenshot placeholder with correction target */}
              <div className="flex h-48 items-center justify-center rounded-lg bg-white border border-dashed border-emerald-300 mb-4 relative cursor-crosshair">
                <div className="text-center">
                  <svg
                    className="mx-auto h-8 w-8 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-9.47 5.227 7.917-3.286-.672zM12 2.25V4.5m5.834.166l-1.591 1.591M20.25 10.5H18M7.757 14.743l-1.59 1.59M6 10.5H3.75m4.007-4.243l-1.59-1.59"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-emerald-600">
                    Click to mark correct target
                  </p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Describe the correct action
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g., Should have clicked the font dropdown in the toolbar (coordinates ~320, 45), not the Format menu."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500"
                  defaultValue={`Should have ${currentCorrection.stepDescription.toLowerCase()} instead of clicking ${currentCorrection.agentAction.target}.`}
                />
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center gap-3">
            <button className="rounded-lg bg-console-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-console-700 transition-colors">
              Save Correction
            </button>
            <button className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors">
              Skip
            </button>
            <button className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-500 hover:bg-slate-50 transition-colors">
              Not a Real Error
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-slate-100 p-1 w-fit">
        {(
          ["all", "pending", "reviewed", "applied"] as const
        ).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              filter === f
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f === "pending" && ` (${pendingCount})`}
          </button>
        ))}
      </div>

      {/* Corrections list */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="divide-y divide-slate-100">
          {filteredCorrections.map((correction) => (
            <div
              key={correction.id}
              className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors cursor-pointer"
              onClick={() => setSelectedCorrection(correction.id)}
            >
              <div className="flex items-center gap-4">
                {/* Screenshot thumbnail placeholder */}
                <div className="flex h-14 w-20 items-center justify-center rounded bg-slate-100 flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-slate-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
                    />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {correction.taskLabel}
                    </p>
                    <span className="text-xs text-slate-400">
                      Step {correction.stepNumber}
                    </span>
                    <StatusBadge status={correction.status} />
                  </div>
                  <p className="mt-0.5 text-sm text-slate-500">
                    Agent: {correction.agentAction.type}(
                    {correction.agentAction.x}, {correction.agentAction.y}) on
                    &quot;{correction.agentAction.target}&quot;
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {correction.captured}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <ConfidenceMeter confidence={correction.confidence} />
                <div className="flex gap-2">
                  {correction.status === "pending" && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="rounded-lg bg-console-50 px-3 py-1.5 text-xs font-medium text-console-700 hover:bg-console-100 transition-colors"
                      >
                        Review
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trigger retraining */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Retrain with Corrections
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {corrections.filter((c) => c.status === "reviewed").length} new
              correction{corrections.filter((c) => c.status === "reviewed").length !== 1 ? "s" : ""}{" "}
              since last training run. Start a GRPO training run incorporating
              these corrections.
            </p>
          </div>
          <button className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition-colors">
            Start Training Run
          </button>
        </div>
      </div>
    </div>
  );
}
