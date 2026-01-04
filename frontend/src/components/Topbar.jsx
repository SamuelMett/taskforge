import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeProvider";

function displayNameFromStorage() {
  const n = (localStorage.getItem("name") || "").trim();
  if (n) return n;

  const email = (localStorage.getItem("email") || "").trim();
  if (email && email.includes("@")) return email.split("@")[0];

  return "User";
}

export default function Topbar({ search, setSearch }) {
  const nav = useNavigate();
  const { theme, toggleTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const name = displayNameFromStorage();
  const initial = (name?.[0] || "U").toUpperCase();

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!open) return;
      const t = e.target;
      if (btnRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [open]);

  function logout() {
    localStorage.removeItem("token");
    // keep email/name if you want, or remove them too:
    // localStorage.removeItem("email");
    // localStorage.removeItem("name");
    setOpen(false);
    nav("/login");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/50">
      <div className="mx-auto flex h-16 w-full items-center gap-4 px-6">
        {/* Left brand */}
        <button
          onClick={() => nav("/")}
          className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
        >
          TaskForge
        </button>

        {/* Search */}
        <div className="flex min-w-0 flex-1">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />
        </div>

        {/* Theme button */}
        <button
          onClick={toggleTheme}
          className="rounded-2xl border border-zinc-200 bg-white px-3 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          title="Toggle theme"
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>

        {/* User menu */}
        <div className="relative">
          <button
            ref={btnRef}
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="relative z-50 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 cursor-pointer pointer-events-auto"
          >
            <span className="grid h-8 w-8 place-items-center rounded-full bg-indigo-600/15 text-sm font-semibold text-indigo-700 dark:text-indigo-200">
              {initial}
            </span>
            <span className="max-w-[160px] truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
              {name}
            </span>
          </button>

          {open && (
            <div
              ref={menuRef}
              className="absolute right-0 mt-2 w-52 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-950 z-50"
            >
              <button
                onClick={() => {
                  setOpen(false);
                  nav("/settings");
                }}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50 dark:text-zinc-100 dark:hover:bg-zinc-900"
              >
                Settings
              </button>

              <button
                onClick={logout}
                className="w-full rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 dark:text-red-200 dark:hover:bg-red-500/10"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
