import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { useTheme } from "../components/ThemeProvider";

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();

  const [search, setSearch] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  async function loadMe() {
    try {
      const res = await api.get("/auth/me");
      const data = res?.data || {};
      const em = data.email || localStorage.getItem("email") || "";
      setEmail(em);
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  return (
    <Layout search={search} setSearch={setSearch} rightPanel={null}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Personalize your TaskForge experience.
          </p>
        </div>

        {/* Theme */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Theme</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose Light or Dark mode. Saved automatically.
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Toggle: {theme === "dark" ? "Dark" : "Light"}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                theme === "light"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-200"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                theme === "dark"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-200"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="font-semibold">Account</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as: <span className="font-medium">{email}</span>
          </div>
        </div>
      </div>
    </Layout>
  );
}
