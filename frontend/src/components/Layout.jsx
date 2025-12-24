import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children, search, setSearch, rightPanel }) {
  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-zinc-950 text-zinc-100">
      <div className="flex min-h-screen w-full">
        <Sidebar />

        {/* main + optional right panel */}
        <div className="flex min-w-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar search={search} setSearch={setSearch} />

            {/* FULL width content (no max-w container) */}
            <main className="w-full flex-1 px-6 py-8">{children}</main>
          </div>

          {rightPanel && (
            <aside className="hidden xl:block w-[360px] shrink-0 border-l border-zinc-900 bg-zinc-950/40 px-6 py-8">
              <div className="sticky top-24">{rightPanel}</div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
