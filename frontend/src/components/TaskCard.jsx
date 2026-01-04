function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
}

function PriorityBadge({ priority }) {
  const p = priority || "med";
  const label = p === "high" ? "High" : p === "low" ? "Low" : "Med";

  const cls =
    p === "high"
      ? "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-200"
      : p === "low"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-200"
      : "border-zinc-400/40 bg-zinc-500/10 text-zinc-700 dark:text-zinc-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {label}
    </span>
  );
}

function DueChip({ dueAt, isDone }) {
  if (!dueAt) return null;

  const due = new Date(dueAt);
  const now = new Date();
  const overdue = !isDone && due < now;

  const cls = overdue
    ? "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-200"
    : "border-zinc-300 bg-white text-zinc-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {overdue ? "Overdue" : "Due"}: {fmt(dueAt)}
    </span>
  );
}

export default function TaskCard({ task, onToggleDone, onDelete, onSelect, selected }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect?.(task)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect?.(task);
        }
      }}
      className={[
        "w-full cursor-pointer select-none rounded-xl border p-4 transition",
        "focus:outline-none focus:ring-2 focus:ring-indigo-500/40",
        selected
          ? "border-indigo-500/40 bg-indigo-500/10"
          : "border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40 dark:hover:bg-zinc-900/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium">
              {task.is_done ? (
                <span className="text-zinc-500 line-through dark:text-zinc-400">{task.title}</span>
              ) : (
                task.title
              )}
            </div>

            <PriorityBadge priority={task.priority} />
          </div>

          {task.description ? (
            <div className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
              {task.description}
            </div>
          ) : (
            <div className="mt-1 text-sm text-zinc-500 italic dark:text-zinc-500">No description</div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <DueChip dueAt={task.due_at} isDone={task.is_done} />
            {!task.due_at && (
              <span className="rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[11px] text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                No due date
              </span>
            )}
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px]",
                task.is_done
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-100"
                  : "border-zinc-200 bg-white text-zinc-700 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300",
              ].join(" ")}
            >
              {task.is_done ? "Done" : "Active"}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleDone?.(task);
            }}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1 text-xs hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          >
            {task.is_done ? "Undone" : "Done"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task);
            }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-700 hover:bg-red-500/20 dark:text-red-200"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
