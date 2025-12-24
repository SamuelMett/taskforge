export default function Sidebar() {
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col border-r border-zinc-900 bg-zinc-950/60">
      <div className="px-6 py-6">
        <div className="text-lg font-semibold">TaskForge</div>
        <div className="text-xs text-zinc-400 mt-1">Dashboard</div>
      </div>

      <nav className="px-4 space-y-1">
        <a
          href="/tasks"
          className="block rounded-lg px-3 py-2 text-sm bg-zinc-900/60 border border-zinc-800"
        >
          Tasks
        </a>
      </nav>

      <div className="mt-auto p-4">
        <button
          className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
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
