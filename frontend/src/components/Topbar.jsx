import { useTheme } from "./ThemeProvider";

export default function Topbar({ search, setSearch }) {
  const email = localStorage.getItem("email") || "signed-in";
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/80">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
        <div className="md:hidden text-lg font-semibold">TaskForge</div>

        <div className="flex-1">
          <input
            className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          aria-label="Toggle theme"
          title="Toggle theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
          <div className="h-8 w-8 rounded-full bg-indigo-600/20 border border-indigo-500/30" />
          <span className="max-w-[180px] truncate">{email}</span>
        </div>
      </div>
    </div>
  );
}
