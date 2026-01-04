export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-zinc-200 bg-white/70 dark:border-zinc-900 dark:bg-zinc-950/60">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold">TaskForge</div>
        <div className="text-xs text-zinc-500 mt-1 dark:text-zinc-400">Dashboard</div>
      </div>

      <nav className="px-4 space-y-2">
        <a
          href="/tasks"
          className="block rounded-lg px-3 py-2 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Tasks
        </a>

        <a
          href="/settings"
          className="block rounded-lg px-3 py-2 text-sm border border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
        >
          Settings
        </a>
      </nav>

      <div className="mt-auto p-4">
        <button
          className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-900"
          onClick={() => {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }}
        >
          Logout
        </button>
      </div>
    </aside>
  );
}
