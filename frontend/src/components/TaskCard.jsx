function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
}

const priorityStripe = {
  high: "bg-red-500",
  med: "bg-zinc-400 dark:bg-zinc-600",
  low: "bg-emerald-500",
};

export default function TaskCard({ task, onToggleDone, onDelete, onSelect, selected }) {
  const priority = task.priority || "med";
  const isOverdue = !task.is_done && task.due_at && new Date(task.due_at) < new Date();

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
        "relative flex w-full cursor-pointer select-none items-center gap-3 border-t border-zinc-100 py-3 pl-4 pr-3 transition first:border-t-0 dark:border-zinc-900",
        "focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500/40",
        selected
          ? "bg-indigo-500/10"
          : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40",
      ].join(" ")}
    >
      <span
        className={`absolute left-0 top-0 h-full w-[3px] ${priorityStripe[priority]}`}
        aria-hidden="true"
      />

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleDone?.(task);
        }}
        aria-label={task.is_done ? "Mark as active" : "Mark as done"}
        className={[
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition",
          task.is_done
            ? "border-emerald-500 bg-emerald-500 text-white"
            : "border-zinc-300 hover:border-indigo-500 dark:border-zinc-600",
        ].join(" ")}
      >
        {task.is_done && (
          <svg viewBox="0 0 16 16" className="h-3 w-3">
            <path
              d="M3 8.5 6.5 12 13 4.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={[
              "truncate text-sm font-medium",
              task.is_done
                ? "text-zinc-500 line-through dark:text-zinc-500"
                : "text-zinc-900 dark:text-zinc-100",
            ].join(" ")}
          >
            {task.title}
          </span>
        </div>
        {task.description && (
          <div className="truncate text-xs text-zinc-500 dark:text-zinc-500">
            {task.description}
          </div>
        )}
      </div>

      {task.due_at && (
        <span
          className={[
            "shrink-0 whitespace-nowrap text-xs",
            isOverdue
              ? "font-medium text-amber-600 dark:text-amber-400"
              : "text-zinc-500 dark:text-zinc-400",
          ].join(" ")}
        >
          {fmt(task.due_at)}
        </span>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(task);
        }}
        aria-label="Delete task"
        className="shrink-0 rounded-md p-1 text-zinc-400 hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-600 dark:hover:text-red-400"
      >
        <svg viewBox="0 0 16 16" className="h-4 w-4">
          <path
            d="M4 4l8 8M12 4l-8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  );
}
