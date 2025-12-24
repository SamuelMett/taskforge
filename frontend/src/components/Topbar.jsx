export default function Topbar({ search, setSearch }) {
  const email = localStorage.getItem("email") || "signed-in";

  return (
    <div className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
        <div className="md:hidden text-lg font-semibold">TaskForge</div>

        <div className="flex-1">
          <input
            className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2 text-sm outline-none focus:border-indigo-500"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="hidden sm:flex items-center gap-2 text-sm text-zinc-300">
          <div className="h-8 w-8 rounded-full bg-indigo-600/30 border border-indigo-500/30" />
          <span className="max-w-[180px] truncate">{email}</span>
        </div>
      </div>
    </div>
  );
}
