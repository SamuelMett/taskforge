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
      ? "border-red-500/30 bg-red-500/10 text-red-200"
      : p === "low"
      ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
      : "border-zinc-500/30 bg-zinc-500/10 text-zinc-200";

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
    ? "border-amber-500/30 bg-amber-500/10 text-amber-200"
    : "border-zinc-700 bg-zinc-900 text-zinc-200";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[11px] ${cls}`}>
      {overdue ? "Overdue" : "Due"}: {fmt(dueAt)}
    </span>
  );
}

export default function TaskCard({
  task,
  onToggleDone,
  onDelete,
  onSelect,
  selected,
}) {
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
          ? "border-indigo-500/50 bg-indigo-500/10"
          : "border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <div className="truncate font-medium">
              {task.is_done ? (
                <span className="text-zinc-400 line-through">{task.title}</span>
              ) : (
                task.title
              )}
            </div>

            <PriorityBadge priority={task.priority} />
          </div>

          {task.description ? (
            <div className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {task.description}
            </div>
          ) : (
            <div className="mt-1 text-sm text-zinc-500 italic">No description</div>
          )}

          <div className="mt-2 flex flex-wrap gap-2">
            <DueChip dueAt={task.due_at} isDone={task.is_done} />
            {!task.due_at && (
              <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2 py-0.5 text-[11px] text-zinc-400">
                No due date
              </span>
            )}
            <span
              className={[
                "rounded-full border px-2 py-0.5 text-[11px]",
                task.is_done
                  ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
                  : "border-zinc-800 bg-zinc-950 text-zinc-300",
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
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs hover:bg-zinc-800"
          >
            {task.is_done ? "Undone" : "Done"}
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(task);
            }}
            className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1 text-xs text-red-200 hover:bg-red-500/20"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
