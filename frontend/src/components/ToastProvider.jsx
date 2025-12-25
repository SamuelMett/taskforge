import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

const ToastCtx = createContext(null);

function cn(...xs) {
  return xs.filter(Boolean).join(" ");
}

function ToastItem({ t, onClose }) {
  const tone =
    t.type === "success"
      ? "border-emerald-500/25 bg-emerald-500/10 text-emerald-100"
      : t.type === "error"
      ? "border-red-500/25 bg-red-500/10 text-red-100"
      : "border-zinc-700 bg-zinc-900/80 text-zinc-100";

  const titleTone =
    t.type === "success"
      ? "text-emerald-50"
      : t.type === "error"
      ? "text-red-50"
      : "text-zinc-50";

  return (
    <div
      className={cn(
        "rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
        "flex items-start justify-between gap-3",
        tone
      )}
    >
      <div className="min-w-0">
        {t.title && <div className={cn("text-sm font-semibold", titleTone)}>{t.title}</div>}
        {t.message && <div className="mt-0.5 text-sm text-zinc-200/90">{t.message}</div>}
      </div>

      <button
        type="button"
        onClick={() => onClose(t.id)}
        className="shrink-0 rounded-lg border border-zinc-700 bg-zinc-950/40 px-2 py-1 text-xs hover:bg-zinc-800"
        aria-label="Close"
      >
        ✕
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const tm = timers.current.get(id);
    if (tm) clearTimeout(tm);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    ({ type = "info", title = "", message = "", duration = 3500 }) => {
      const id = crypto?.randomUUID?.() || String(Date.now() + Math.random());
      const toast = { id, type, title, message };

      setToasts((prev) => [toast, ...prev].slice(0, 4)); 

      const tm = setTimeout(() => remove(id), duration);
      timers.current.set(id, tm);

      return id;
    },
    [remove]
  );

  const api = useMemo(
    () => ({
      push,
      success: (message, title = "Success") => push({ type: "success", title, message }),
      error: (message, title = "Error") => push({ type: "error", title, message }),
      info: (message, title = "Info") => push({ type: "info", title, message }),
      remove,
    }),
    [push, remove]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/* Toast container */}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[9999] w-[360px] space-y-2">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastItem t={t} onClose={remove} />
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider />");
  return ctx;
}
