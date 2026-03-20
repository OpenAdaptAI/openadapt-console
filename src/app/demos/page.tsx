"use client";

import { useState } from "react";

// Mock data
const workflows = [
  {
    id: "wf-001",
    name: "Change Font (WordPad)",
    demoCount: 5,
    accuracy: 85.7,
    status: "active" as const,
    demos: [
      {
        id: "demo-001",
        name: "change-font-demo-1",
        steps: 8,
        source: "native_capture" as const,
        date: "Mar 18, 2026",
        thumbnail: null,
      },
      {
        id: "demo-002",
        name: "change-font-demo-2",
        steps: 7,
        source: "waa_vnc" as const,
        date: "Mar 15, 2026",
        thumbnail: null,
      },
      {
        id: "demo-003",
        name: "change-font-demo-3",
        steps: 9,
        source: "native_capture" as const,
        date: "Mar 12, 2026",
        thumbnail: null,
      },
      {
        id: "demo-004",
        name: "change-font-correction-1",
        steps: 6,
        source: "imported" as const,
        date: "Mar 10, 2026",
        thumbnail: null,
      },
      {
        id: "demo-005",
        name: "change-font-demo-4",
        steps: 8,
        source: "screen_recording" as const,
        date: "Mar 8, 2026",
        thumbnail: null,
      },
    ],
  },
  {
    id: "wf-002",
    name: "Copy File",
    demoCount: 3,
    accuracy: 71.4,
    status: "active" as const,
    demos: [
      {
        id: "demo-006",
        name: "copy-file-demo-1",
        steps: 12,
        source: "native_capture" as const,
        date: "Mar 16, 2026",
        thumbnail: null,
      },
      {
        id: "demo-007",
        name: "copy-file-demo-2",
        steps: 10,
        source: "waa_vnc" as const,
        date: "Mar 14, 2026",
        thumbnail: null,
      },
      {
        id: "demo-008",
        name: "copy-file-demo-3",
        steps: 11,
        source: "imported" as const,
        date: "Mar 11, 2026",
        thumbnail: null,
      },
    ],
  },
  {
    id: "wf-003",
    name: "Add Bookmark",
    demoCount: 2,
    accuracy: 57.1,
    status: "active" as const,
    demos: [
      {
        id: "demo-009",
        name: "add-bookmark-demo-1",
        steps: 6,
        source: "native_capture" as const,
        date: "Mar 13, 2026",
        thumbnail: null,
      },
      {
        id: "demo-010",
        name: "add-bookmark-demo-2",
        steps: 7,
        source: "waa_vnc" as const,
        date: "Mar 9, 2026",
        thumbnail: null,
      },
    ],
  },
  {
    id: "wf-004",
    name: "Notepad Basic",
    demoCount: 4,
    accuracy: 92.3,
    status: "active" as const,
    demos: [
      {
        id: "demo-011",
        name: "notepad-demo-1",
        steps: 5,
        source: "native_capture" as const,
        date: "Mar 17, 2026",
        thumbnail: null,
      },
      {
        id: "demo-012",
        name: "notepad-demo-2",
        steps: 4,
        source: "waa_vnc" as const,
        date: "Mar 14, 2026",
        thumbnail: null,
      },
      {
        id: "demo-013",
        name: "notepad-demo-3",
        steps: 5,
        source: "imported" as const,
        date: "Mar 10, 2026",
        thumbnail: null,
      },
      {
        id: "demo-014",
        name: "notepad-demo-4",
        steps: 6,
        source: "native_capture" as const,
        date: "Mar 7, 2026",
        thumbnail: null,
      },
    ],
  },
  {
    id: "wf-005",
    name: "Paint Drawing",
    demoCount: 1,
    accuracy: 42.9,
    status: "draft" as const,
    demos: [
      {
        id: "demo-015",
        name: "paint-demo-1",
        steps: 15,
        source: "screen_recording" as const,
        date: "Mar 5, 2026",
        thumbnail: null,
      },
    ],
  },
  {
    id: "wf-006",
    name: "Calculator",
    demoCount: 0,
    accuracy: 0,
    status: "draft" as const,
    demos: [],
  },
];

function SourceBadge({
  source,
}: {
  source: "native_capture" | "waa_vnc" | "screen_recording" | "imported";
}) {
  const styles = {
    native_capture: "bg-blue-50 text-blue-700",
    waa_vnc: "bg-purple-50 text-purple-700",
    screen_recording: "bg-teal-50 text-teal-700",
    imported: "bg-slate-100 text-slate-600",
  };
  const labels = {
    native_capture: "Native",
    waa_vnc: "VNC",
    screen_recording: "Recording",
    imported: "Imported",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[source]}`}
    >
      {labels[source]}
    </span>
  );
}

function StatusBadge({ status }: { status: "active" | "draft" | "archived" }) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    draft: "bg-slate-100 text-slate-600 ring-slate-500/20",
    archived: "bg-slate-50 text-slate-400 ring-slate-400/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function DemosPage() {
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);

  const currentWorkflow = workflows.find((w) => w.id === selectedWorkflow);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Demonstrations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Browse, upload, and manage demonstration recordings for each
            workflow.
          </p>
        </div>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="rounded-lg bg-console-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-console-700 transition-colors"
        >
          Upload Demo
        </button>
      </div>

      {/* Upload form */}
      {showUpload && (
        <div className="mb-8 rounded-xl border border-console-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">
            Upload Demonstration
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Recording File
              </label>
              <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 transition-colors hover:border-console-400 hover:bg-console-50">
                <div className="text-center">
                  <svg
                    className="mx-auto h-10 w-10 text-slate-400"
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
                  <p className="mt-3 text-sm text-slate-600">
                    Drag and drop a ZIP file, or{" "}
                    <span className="font-medium text-console-600">
                      click to browse
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    Screenshots + actions.json, or openadapt-capture export
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Workflow
              </label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500">
                <option value="">Select workflow...</option>
                {workflows.map((wf) => (
                  <option key={wf.id} value={wf.id}>
                    {wf.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Demo Name
              </label>
              <input
                type="text"
                placeholder="e.g., change-font-demo-6"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button className="rounded-lg bg-console-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-console-700 transition-colors">
              Upload and Process
            </button>
            <button
              onClick={() => setShowUpload(false)}
              className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Workflow grid */}
      {!selectedWorkflow && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workflows.map((wf) => (
            <button
              key={wf.id}
              onClick={() => setSelectedWorkflow(wf.id)}
              className="rounded-xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-console-300 hover:shadow-sm"
            >
              {/* Thumbnail placeholder */}
              <div className="flex h-32 items-center justify-center rounded-lg bg-slate-100 mb-4">
                <svg
                  className="h-10 w-10 text-slate-300"
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
              </div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-slate-900">
                  {wf.name}
                </h3>
                <StatusBadge status={wf.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                  {wf.demoCount} demo{wf.demoCount !== 1 ? "s" : ""}
                </span>
                <span
                  className={`font-medium ${
                    wf.accuracy >= 80
                      ? "text-emerald-600"
                      : wf.accuracy >= 60
                      ? "text-amber-600"
                      : wf.accuracy > 0
                      ? "text-red-600"
                      : "text-slate-400"
                  }`}
                >
                  {wf.accuracy > 0 ? `${wf.accuracy}%` : "No evals"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Demo list for selected workflow */}
      {selectedWorkflow && currentWorkflow && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <button
              onClick={() => setSelectedWorkflow(null)}
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
              Back to Workflows
            </button>
          </div>

          <div className="mb-6 rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {currentWorkflow.name}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  {currentWorkflow.demoCount} demonstration
                  {currentWorkflow.demoCount !== 1 ? "s" : ""} recorded
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={currentWorkflow.status} />
                <span
                  className={`text-lg font-bold ${
                    currentWorkflow.accuracy >= 80
                      ? "text-emerald-600"
                      : currentWorkflow.accuracy >= 60
                      ? "text-amber-600"
                      : "text-red-600"
                  }`}
                >
                  {currentWorkflow.accuracy}% accuracy
                </span>
              </div>
            </div>
          </div>

          {currentWorkflow.demos.length === 0 ? (
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              <p className="mt-4 text-sm font-medium text-slate-900">
                No demonstrations yet
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Upload a recording to get started.
              </p>
              <button
                onClick={() => setShowUpload(true)}
                className="mt-4 rounded-lg bg-console-600 px-4 py-2 text-sm font-semibold text-white hover:bg-console-700"
              >
                Upload Demo
              </button>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Preview
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Steps
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Source
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {currentWorkflow.demos.map((demo) => (
                    <tr
                      key={demo.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex h-12 w-20 items-center justify-center rounded bg-slate-100">
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
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                        {demo.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                        {demo.steps} steps
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <SourceBadge source={demo.source} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                        {demo.date}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="flex gap-2">
                          <button className="text-sm text-console-600 hover:text-console-700 font-medium">
                            Playback
                          </button>
                          <button className="text-sm text-slate-500 hover:text-slate-700">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
