import Topbar from "./Topbar";

export default function Layout({ children, search, setSearch, rightPanel }) {
  return (
    <div className="min-h-screen w-screen overflow-x-hidden bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
      <div className="min-h-screen w-full">
        <Topbar search={search} setSearch={setSearch} />

        <div className="flex min-h-[calc(100vh-64px)] w-full">
          <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>

          {rightPanel && (
            <aside className="hidden xl:block w-[340px] 2xl:w-[360px] shrink-0 border-l border-zinc-200 bg-white/60 px-6 py-8 dark:border-zinc-900 dark:bg-zinc-950/40">
              <div className="sticky top-24">{rightPanel}</div>
            </aside>
          )}
        </div>
      </div>
    </div>
  );
}
