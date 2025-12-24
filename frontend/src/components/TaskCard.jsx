function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
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
          <div className="truncate font-medium">{task.title}</div>

          {task.description ? (
            <div className="mt-1 line-clamp-2 text-sm text-zinc-400">
              {task.description}
            </div>
          ) : (
            <div className="mt-1 text-sm text-zinc-500 italic">
              No description
            </div>
          )}

          <div className="mt-2 text-xs text-zinc-500">
            {task.due_at ? `Due: ${fmt(task.due_at)}` : "No due date"}
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
