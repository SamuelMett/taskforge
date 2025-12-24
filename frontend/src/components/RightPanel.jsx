export default function RightPanel({ children }) {
  return (
    <aside className="hidden xl:flex w-[360px] shrink-0 border-l border-zinc-800 bg-zinc-900/40">
      <div className="w-full overflow-y-auto p-6">
        {children || (
          <div className="text-sm text-zinc-400">
            Select a task to preview
          </div>
        )}
      </div>
    </aside>
  );
}
