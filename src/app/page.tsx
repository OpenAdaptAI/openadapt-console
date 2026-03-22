import Link from "next/link";

// Mock data
const stats = [
  {
    label: "Total Workflows",
    value: "12",
    change: "+2 this month",
    changeType: "positive" as const,
  },
  {
    label: "Average Accuracy",
    value: "87.3%",
    change: "+4.2% vs last week",
    changeType: "positive" as const,
  },
  {
    label: "Corrections Pending",
    value: "14",
    change: "3 captured today",
    changeType: "neutral" as const,
  },
  {
    label: "Last Evaluation",
    value: "2h ago",
    change: "85.7% accuracy",
    changeType: "positive" as const,
  },
];

const recentEvaluations = [
  {
    id: "eval-001",
    name: "live_eval_0320",
    model: "qwen3.5-9b-lora-v3",
    tasks: 7,
    accuracy: 85.7,
    date: "Mar 20, 2026",
    status: "completed" as const,
  },
  {
    id: "eval-002",
    name: "live_eval_0318",
    model: "qwen3.5-9b-lora-v2",
    tasks: 7,
    accuracy: 71.4,
    date: "Mar 18, 2026",
    status: "completed" as const,
  },
  {
    id: "eval-003",
    name: "live_eval_0315",
    model: "qwen3-7b",
    tasks: 7,
    accuracy: 57.1,
    date: "Mar 15, 2026",
    status: "completed" as const,
  },
  {
    id: "eval-004",
    name: "live_eval_0320_exp",
    model: "qwen3.5-9b-grpo",
    tasks: 4,
    accuracy: 0,
    date: "Mar 20, 2026",
    status: "running" as const,
  },
  {
    id: "eval-005",
    name: "live_eval_0312",
    model: "qwen3-7b",
    tasks: 7,
    accuracy: 42.9,
    date: "Mar 12, 2026",
    status: "failed" as const,
  },
];

const correctionQueue = [
  {
    id: "corr-001",
    task: "change-font",
    step: "Step 3",
    confidence: 0.32,
    captured: "Mar 20 14:22",
  },
  {
    id: "corr-002",
    task: "copy-file",
    step: "Step 5",
    confidence: 0.41,
    captured: "Mar 20 11:05",
  },
  {
    id: "corr-003",
    task: "add-bookmark",
    step: "Step 2",
    confidence: 0.55,
    captured: "Mar 19 09:33",
  },
];

function StatusBadge({ status }: { status: "completed" | "running" | "failed" }) {
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

export default function Dashboard() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="mt-1 text-sm text-slate-500">
          OpenAdapt Console — Governed Desktop Agent Platform
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-slate-200 bg-white p-6"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {stat.value}
            </p>
            <p
              className={`mt-1 text-sm ${
                stat.changeType === "positive"
                  ? "text-emerald-600"
                  : "text-slate-500"
              }`}
            >
              {stat.change}
            </p>
          </div>
        ))}
      </div>

      {/* Accuracy trend placeholder */}
      <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Accuracy Over Time
          </h2>
          <div className="flex gap-2">
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
              <option>All Workflows</option>
              <option>change-font</option>
              <option>copy-file</option>
              <option>add-bookmark</option>
            </select>
            <select className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600">
              <option>Last 30 days</option>
              <option>Last 7 days</option>
              <option>Last 90 days</option>
            </select>
          </div>
        </div>
        {/* Chart placeholder */}
        <div className="mt-6 flex h-48 items-end gap-1">
          {[42.9, 48.2, 51.0, 54.3, 57.1, 62.5, 65.0, 68.4, 71.4, 74.2, 78.6, 82.1, 85.7].map(
            (value, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full rounded-t bg-console-500 transition-all hover:bg-console-600"
                  style={{ height: `${(value / 100) * 180}px` }}
                />
              </div>
            )
          )}
        </div>
        <div className="mt-2 flex justify-between text-xs text-slate-400">
          <span>Mar 1</span>
          <span>Mar 5</span>
          <span>Mar 10</span>
          <span>Mar 15</span>
          <span>Mar 20</span>
        </div>
      </div>

      {/* Two-column layout: Recent evals + Corrections */}
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent evaluations */}
        <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Recent Evaluations
            </h2>
            <Link
              href="/evaluations"
              className="text-sm font-medium text-console-600 hover:text-console-700"
            >
              View all
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Run Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Tasks
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Accuracy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentEvaluations.map((evalRun) => (
                  <tr
                    key={evalRun.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {evalRun.name}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {evalRun.model}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">
                      {evalRun.tasks}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">
                      {evalRun.status === "running"
                        ? "--"
                        : `${evalRun.accuracy}%`}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4">
                      <StatusBadge status={evalRun.status} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                      {evalRun.date}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Correction queue */}
        <div className="rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="text-lg font-semibold text-slate-900">
              Correction Queue
            </h2>
            <Link
              href="/corrections"
              className="text-sm font-medium text-console-600 hover:text-console-700"
            >
              Review all
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {correctionQueue.map((item) => (
              <div key={item.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {item.task}
                    </p>
                    <p className="text-xs text-slate-500">{item.step}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-medium ${
                        item.confidence < 0.4
                          ? "text-red-600"
                          : item.confidence < 0.6
                          ? "text-amber-600"
                          : "text-slate-600"
                      }`}
                    >
                      {item.confidence.toFixed(2)}
                    </p>
                    <p className="text-xs text-slate-400">{item.captured}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-slate-200 px-6 py-3">
            <Link
              href="/corrections"
              className="block w-full rounded-lg bg-console-50 px-4 py-2 text-center text-sm font-medium text-console-700 hover:bg-console-100 transition-colors"
            >
              Review 14 Pending Corrections
            </Link>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          href="/evaluations"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-console-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-console-100">
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
                d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Run New Evaluation
            </p>
            <p className="text-xs text-slate-500">
              Test your agent on a task set
            </p>
          </div>
        </Link>
        <Link
          href="/traces"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-console-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
            <svg
              className="h-5 w-5 text-purple-600"
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
          <div>
            <p className="text-sm font-semibold text-slate-900">
              View Traces
            </p>
            <p className="text-xs text-slate-500">
              Replay agent runs step-by-step
            </p>
          </div>
        </Link>
        <Link
          href="/demos"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-console-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
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
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Upload Demo
            </p>
            <p className="text-xs text-slate-500">
              Add a new demonstration recording
            </p>
          </div>
        </Link>
        <Link
          href="/corrections"
          className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 transition-all hover:border-console-300 hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100">
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
                d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-900">
              Review Corrections
            </p>
            <p className="text-xs text-slate-500">
              14 steps need human review
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
