export default function Section({ title, count, children }) {
  return (
    <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/30 p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold tracking-wide text-zinc-200">
          {title}
        </h2>
        <div className="text-xs text-zinc-400">{count}</div>
      </div>

      <div className="mt-4 space-y-3">{children}</div>
    </div>
  );
}
