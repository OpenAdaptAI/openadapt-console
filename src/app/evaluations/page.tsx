"use client";

import { useState } from "react";

// Mock data
const evaluations = [
  {
    id: "eval-001",
    name: "live_eval_0320",
    model: "qwen3.5-9b-lora-v3",
    agent: "planner-grounder",
    tasks: 7,
    tasksPassed: 6,
    accuracy: 85.7,
    date: "Mar 20, 2026 09:15",
    duration: "42 min",
    status: "completed" as const,
  },
  {
    id: "eval-002",
    name: "live_eval_0318",
    model: "qwen3.5-9b-lora-v2",
    agent: "planner-grounder",
    tasks: 7,
    tasksPassed: 5,
    accuracy: 71.4,
    date: "Mar 18, 2026 14:30",
    duration: "38 min",
    status: "completed" as const,
  },
  {
    id: "eval-003",
    name: "live_eval_0315",
    model: "qwen3-7b",
    agent: "api-claude",
    tasks: 7,
    tasksPassed: 4,
    accuracy: 57.1,
    date: "Mar 15, 2026 10:00",
    duration: "45 min",
    status: "completed" as const,
  },
  {
    id: "eval-004",
    name: "live_eval_0320_exp",
    model: "qwen3.5-9b-grpo",
    agent: "planner-grounder",
    tasks: 4,
    tasksPassed: 0,
    accuracy: 0,
    date: "Mar 20, 2026 11:30",
    duration: "--",
    status: "running" as const,
  },
  {
    id: "eval-005",
    name: "live_eval_0312",
    model: "qwen3-7b",
    agent: "api-claude",
    tasks: 7,
    tasksPassed: 3,
    accuracy: 42.9,
    date: "Mar 12, 2026 16:45",
    duration: "51 min",
    status: "failed" as const,
  },
  {
    id: "eval-006",
    name: "live_eval_0310",
    model: "qwen3-7b-base",
    agent: "api-claude",
    tasks: 7,
    tasksPassed: 2,
    accuracy: 28.6,
    date: "Mar 10, 2026 09:00",
    duration: "55 min",
    status: "completed" as const,
  },
  {
    id: "eval-007",
    name: "live_eval_0308",
    model: "qwen3-7b-base",
    agent: "api-claude",
    tasks: 7,
    tasksPassed: 1,
    accuracy: 14.3,
    date: "Mar 8, 2026 11:20",
    duration: "48 min",
    status: "completed" as const,
  },
];

const availableModels = [
  "qwen3.5-9b-lora-v3",
  "qwen3.5-9b-lora-v2",
  "qwen3.5-9b-grpo",
  "qwen3-7b",
  "qwen3-7b-base",
];

const availableAgents = [
  "planner-grounder",
  "api-claude",
  "api-openai",
  "retrieval-claude",
];

const availableTasks = [
  { id: "change-font", label: "Change Font (WordPad)" },
  { id: "copy-file", label: "Copy File" },
  { id: "add-bookmark", label: "Add Bookmark" },
  { id: "notepad_1", label: "Notepad Basic" },
  { id: "notepad_2", label: "Notepad Advanced" },
  { id: "paint_1", label: "Paint Drawing" },
  { id: "calculator_1", label: "Calculator" },
];

function StatusBadge({
  status,
}: {
  status: "completed" | "running" | "failed";
}) {
  const styles = {
    completed: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    running: "bg-amber-50 text-amber-700 ring-amber-600/20",
    failed: "bg-red-50 text-red-700 ring-red-600/20",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles[status]}`}
    >
      {status === "running" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
      )}
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

export default function EvaluationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([
    "change-font",
    "copy-file",
  ]);

  const toggleTask = (taskId: string) => {
    setSelectedTasks((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  return (
    <div>
      {/* Page header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Evaluations</h1>
          <p className="mt-1 text-sm text-slate-500">
            Run, view, and compare evaluation results across models and tasks.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-console-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-console-700 transition-colors"
        >
          {showForm ? "Cancel" : "Run New Evaluation"}
        </button>
      </div>

      {/* New evaluation form */}
      {showForm && (
        <div className="mb-8 rounded-xl border border-console-200 bg-white p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-6">
            Configure Evaluation Run
          </h2>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Model
              </label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500">
                {availableModels.map((model) => (
                  <option key={model} value={model}>
                    {model}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Agent
              </label>
              <select className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500">
                {availableAgents.map((agent) => (
                  <option key={agent} value={agent}>
                    {agent}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Tasks
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(task.id)}
                    className={`rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                      selectedTasks.includes(task.id)
                        ? "border-console-500 bg-console-50 text-console-700 font-medium"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300"
                    }`}
                  >
                    {selectedTasks.includes(task.id) && (
                      <svg
                        className="mr-1 inline h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4.5 12.75l6 6 9-13.5"
                        />
                      </svg>
                    )}
                    {task.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Max Steps
              </label>
              <input
                type="number"
                defaultValue={15}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Server
              </label>
              <input
                type="text"
                defaultValue="localhost:5001"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-console-500 focus:ring-1 focus:ring-console-500"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <button className="rounded-lg bg-console-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-console-700 transition-colors">
              Run Evaluation
            </button>
            <span className="text-sm text-slate-500">
              {selectedTasks.length} task{selectedTasks.length !== 1 ? "s" : ""}{" "}
              selected
            </span>
          </div>
        </div>
      )}

      {/* Evaluations table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Run Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Model
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Tasks
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Accuracy
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                  Status
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
              {evaluations.map((evalRun) => (
                <tr
                  key={evalRun.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                    {evalRun.name}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    <span className="font-mono text-xs bg-slate-100 rounded px-1.5 py-0.5">
                      {evalRun.model}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {evalRun.agent}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                    {evalRun.status === "completed" || evalRun.status === "failed"
                      ? `${evalRun.tasksPassed}/${evalRun.tasks}`
                      : `--/${evalRun.tasks}`}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                    {evalRun.status === "running" ? (
                      <span className="text-slate-400">--</span>
                    ) : (
                      <span
                        className={
                          evalRun.accuracy >= 80
                            ? "text-emerald-600"
                            : evalRun.accuracy >= 60
                            ? "text-amber-600"
                            : "text-red-600"
                        }
                      >
                        {evalRun.accuracy}%
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {evalRun.duration}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={evalRun.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    {evalRun.date}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <div className="flex gap-2">
                      <button className="text-sm text-console-600 hover:text-console-700 font-medium">
                        View
                      </button>
                      {evalRun.status === "completed" && (
                        <button className="text-sm text-slate-500 hover:text-slate-700">
                          Re-run
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
