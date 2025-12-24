import { useEffect, useState } from "react";
import { api } from "../api/client";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  async function loadTasks() {
    setError("");
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load tasks");
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tasks", { title, description: desc });
      setTitle("");
      setDesc("");
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create task");
    }
  }

  useEffect(() => {
    loadTasks();
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold">TaskForge</h1>
            <p className="mt-1 text-zinc-400">Your tasks, clean and simple.</p>
          </div>

          <button
            className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
            onClick={() => {
              localStorage.removeItem("token");
              window.location.href = "/login";
            }}
          >
            Logout
          </button>
        </div>

        {error && (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <form
            onSubmit={createTask}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6"
          >
            <h2 className="text-lg font-semibold">Create task</h2>

            <div className="mt-4">
              <label className="text-sm text-zinc-300">Title</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="mt-4">
              <label className="text-sm text-zinc-300">Description</label>
              <textarea
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={4}
              />
            </div>

            <button className="mt-5 w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500">
              Add task
            </button>
          </form>

          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">My tasks</h2>
              <button
                className="text-sm text-zinc-300 hover:text-white"
                onClick={loadTasks}
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {tasks.length === 0 ? (
                <p className="text-sm text-zinc-400">No tasks yet.</p>
              ) : (
                tasks.map((t) => (
                  <div
                    key={t.id}
                    className="rounded-xl border border-zinc-800 bg-zinc-950/40 p-4"
                  >
                    <div className="font-medium">{t.title}</div>
                    {t.description && (
                      <div className="mt-1 text-sm text-zinc-400">
                        {t.description}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
