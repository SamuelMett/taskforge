import React, { createContext, useContext, useCallback, useMemo, useState } from "react";

const ToastCtx = createContext(null);

function cx(...xs) {
  return xs.filter(Boolean).join(" ");
}

function normalizeMsg(msg) {
  if (!msg) return "";
  if (typeof msg === "string") return msg;
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message) => {
    const id = crypto.randomUUID?.() || String(Date.now() + Math.random());
    const toast = { id, type, message: normalizeMsg(message) };
    setToasts((prev) => [...prev, toast]);

    // auto-dismiss
    window.setTimeout(() => remove(id), 3000);
  }, [remove]);

  const api = useMemo(
    () => ({
      success: (m) => push("success", m),
      error: (m) => push("error", m),
      info: (m) => push("info", m),
    }),
    [push]
  );

  return (
    <ToastCtx.Provider value={api}>
      {children}

      {/*  */}
      <div className="fixed bottom-6 right-6 z-50 flex w-[340px] max-w-[calc(100vw-2rem)] flex-col gap-3">
        {toasts.map((t) => {
          const style =
            t.type === "success"
              ? 
                "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-100"
              : t.type === "error"
              ? "border-red-200 bg-red-50 text-red-900 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-100"
              : "border-zinc-200 bg-white text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-100";

          const title =
            t.type === "success" ? "Success" : t.type === "error" ? "Error" : "Info";

          return (
            <div
              key={t.id}
              className={cx(
                "relative rounded-2xl border p-4 shadow-lg backdrop-blur",
                style
              )}
              role="status"
            >
              <button
                onClick={() => remove(t.id)}
                className={cx(
                  "absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-xl border text-sm",
                  "border-zinc-200 bg-white/70 hover:bg-white",
                  "dark:border-zinc-700 dark:bg-zinc-900/60 dark:hover:bg-zinc-900"
                )}
                aria-label="Close toast"
              >
                ✕
              </button>

              <div className="pr-10">
                <div className="text-sm font-semibold">{title}</div>
                <div className="mt-1 text-sm opacity-90">{t.message}</div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
