"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { parseJsonl, saveTrace, listTraces, deleteTrace } from "./lib/trace-parser";
import { SAMPLE_TRACE } from "./lib/sample-data";
import type { Trace } from "./lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function ScoreBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color =
    pct >= 80
      ? "text-emerald-700 bg-emerald-50 ring-emerald-600/20"
      : pct >= 50
      ? "text-amber-700 bg-amber-50 ring-amber-600/20"
      : "text-red-700 bg-red-50 ring-red-600/20";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${color}`}
    >
      {pct}%
    </span>
  );
}

// ---------------------------------------------------------------------------
// Upload drop zone
// ---------------------------------------------------------------------------

function UploadZone({
  onParsed,
  onError,
  parsing,
  error,
}: {
  onParsed: (trace: Trace) => void;
  onError: (msg: string) => void;
  parsing: boolean;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = useCallback(
    (file: File) => {
      if (!file.name.endsWith(".jsonl")) {
        onError("Please upload a .jsonl file");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        try {
          const trace = parseJsonl(text, file.name);
          onParsed(trace);
        } catch (err) {
          onError(err instanceof Error ? err.message : "Failed to parse JSONL");
        }
      };
      reader.readAsText(file);
    },
    [onParsed, onError]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragActive(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-8 py-16 transition-all ${
        dragActive
          ? "border-console-500 bg-console-50"
          : "border-slate-300 bg-slate-50 hover:border-console-400 hover:bg-console-50/50"
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".jsonl"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {parsing ? (
        <div className="flex flex-col items-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-console-600" />
          <p className="mt-4 text-sm font-medium text-slate-700">
            Parsing trace...
          </p>
        </div>
      ) : (
        <>
          <svg
            className={`h-12 w-12 ${dragActive ? "text-console-500" : "text-slate-400"}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
          <p className="mt-4 text-sm font-medium text-slate-700">
            Drop a <span className="font-mono text-console-600">.jsonl</span>{" "}
            trace file here
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Supports trajectory JSONL (PlannerTrajectoryLogger) and full-eval
            JSONL (run_full_eval.py)
          </p>
          {error && (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TracesPage() {
  const [traces, setTraces] = useState<
    { id: string; name: string; created_at: string; episodes: number; score: number }[]
  >([]);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load index on mount
  useEffect(() => {
    setTraces(listTraces());
  }, []);

  const handleParsed = useCallback((trace: Trace) => {
    setParsing(true);
    setError(null);
    try {
      saveTrace(trace);
      setTraces(listTraces());
      // Navigate to viewer
      window.location.href = `/traces/${trace.id}`;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save trace");
      setParsing(false);
    }
  }, []);

  const handleLoadSample = useCallback(() => {
    saveTrace(SAMPLE_TRACE);
    setTraces(listTraces());
    window.location.href = `/traces/${SAMPLE_TRACE.id}`;
  }, []);

  const handleDelete = useCallback((id: string) => {
    deleteTrace(id);
    setTraces(listTraces());
  }, []);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Trace Viewer</h1>
        <p className="mt-1 text-sm text-slate-500">
          Upload agent trace files to visualize step-by-step screenshots,
          actions, planner reasoning, and evaluation results.
        </p>
      </div>

      {/* Upload zone */}
      <UploadZone onParsed={handleParsed} onError={setError} parsing={parsing} error={error} />

      {/* Sample trace button */}
      <div className="mt-4 flex items-center justify-center">
        <button
          onClick={handleLoadSample}
          className="text-sm font-medium text-console-600 hover:text-console-700 transition-colors"
        >
          Or load a sample trace to explore the viewer
        </button>
      </div>

      {/* Recent traces */}
      {traces.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Recent Traces
          </h2>
          <div className="rounded-xl border border-slate-200 bg-white">
            <div className="divide-y divide-slate-100">
              {traces.map((t) => (
                <div
                  key={t.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
                >
                  <Link
                    href={`/traces/${t.id}`}
                    className="flex items-center gap-4 flex-1 min-w-0"
                  >
                    {/* Icon */}
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-console-50">
                      <svg
                        className="h-5 w-5 text-console-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776"
                        />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {t.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {t.episodes} episode{t.episodes !== 1 ? "s" : ""} &middot;{" "}
                        {formatDate(t.created_at)}
                      </p>
                    </div>
                  </Link>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <ScoreBadge score={t.score} />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleDelete(t.id);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                      title="Delete trace"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info cards */}
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-console-50 mb-3">
            <svg
              className="h-5 w-5 text-console-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Screenshot Timeline
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Step through screenshots with click markers, type highlights, and
            scroll indicators overlaid exactly where the agent acted.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 mb-3">
            <svg
              className="h-5 w-5 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Planner Reasoning
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            See exactly what the planner thought at every step -- its decision,
            instruction, reasoning, and target description.
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 mb-3">
            <svg
              className="h-5 w-5 text-amber-600"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
              />
            </svg>
          </div>
          <h3 className="text-sm font-semibold text-slate-900">
            Milestone Tracking
          </h3>
          <p className="mt-1 text-xs text-slate-500">
            Track partial credit with per-milestone pass/fail indicators.
            Instantly see where runs stall and which milestones are hardest.
          </p>
        </div>
      </div>
    </div>
  );
}
