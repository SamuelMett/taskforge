import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Section from "../components/Section";
import TaskCard from "../components/TaskCard";

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function fmt(dt) {
  try {
    return new Date(dt).toLocaleString();
  } catch {
    return "";
  }
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // all | active | done
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  async function loadTasks() {
    setError("");
    try {
      const res = await api.get("/tasks");
      const list = Array.isArray(res.data) ? res.data : [];
      setTasks(list);

      // keep selection in sync
      if (selected) {
        const updated = list.find((t) => t.id === selected.id);
        setSelected(updated || null);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load tasks");
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");
    try {
      const payload = {
        title,
        description: desc || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      };
      await api.post("/tasks", payload);
      setTitle("");
      setDesc("");
      setDueAt("");
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create task");
    }
  }

  async function toggleDone(task) {
    setError("");
    try {
      await api.patch(`/tasks/${task.id}`, { is_done: !task.is_done });
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to update task");
    }
  }

  async function deleteTask(task) {
    setError("");
    try {
      await api.delete(`/tasks/${task.id}`);
      if (selected?.id === task.id) setSelected(null);
      await loadTasks();
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete task");
    }
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return tasks.filter((t) => {
      if (tab === "active" && t.is_done) return false;
      if (tab === "done" && !t.is_done) return false;

      if (!q) return true;
      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    });
  }, [tasks, tab, search]);

  const grouped = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const overdue = [];
    const today = [];
    const upcoming = [];
    const noDue = [];

    for (const t of filtered) {
      if (!t.due_at) {
        noDue.push(t);
        continue;
      }
      const due = new Date(t.due_at);
      if (due < todayStart) overdue.push(t);
      else if (due >= todayStart && due < tomorrowStart) today.push(t);
      else upcoming.push(t);
    }

    const byDueAsc = (a, b) => new Date(a.due_at) - new Date(b.due_at);
    overdue.sort(byDueAsc);
    today.sort(byDueAsc);
    upcoming.sort(byDueAsc);

    return { overdue, today, upcoming, noDue };
  }, [filtered]);

  const rightPanel = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-zinc-200">Task details</h3>
        <p className="mt-1 text-xs text-zinc-400">
          {selected ? "Preview and actions." : "Select a task to preview."}
        </p>
      </div>

      {selected ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-sm font-semibold">{selected.title}</div>

          {selected.description ? (
            <div className="mt-2 text-sm text-zinc-300">
              {selected.description}
            </div>
          ) : (
            <div className="mt-2 text-sm text-zinc-500 italic">
              No description
            </div>
          )}

          <div className="mt-3 space-y-1 text-xs text-zinc-400">
            <div>
              Status:{" "}
              <span className="text-zinc-200">
                {selected.is_done ? "Done" : "Active"}
              </span>
            </div>
            <div>
              Due:{" "}
              <span className="text-zinc-200">
                {selected.due_at ? fmt(selected.due_at) : "No due date"}
              </span>
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <button
              onClick={() => toggleDone(selected)}
              className="w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/15"
            >
              {selected.is_done ? "Mark as active" : "Mark as done"}
            </button>

            <button
              onClick={() => deleteTask(selected)}
              className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/15"
            >
              Delete task
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
          Click a task card to preview it here.
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-xs font-semibold text-zinc-300">Insights</div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Total</span>
            <span className="text-zinc-100">{tasks.length}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Completed</span>
            <span className="text-zinc-100">
              {tasks.filter((t) => t.is_done).length}
            </span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Remaining</span>
            <span className="text-zinc-100">
              {tasks.filter((t) => !t.is_done).length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout search={search} setSearch={setSearch} rightPanel={rightPanel}>
      <div className="rounded-2xl border border-zinc-800/70 bg-zinc-900/20 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">Tasks</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Today, upcoming, and what’s overdue.
            </p>
          </div>

          <div className="flex gap-2">
            {["all", "active", "done"].map((k) => (
              <button
                key={k}
                onClick={() => setTab(k)}
                className={[
                  "rounded-xl px-4 py-2 text-sm border",
                  tab === k
                    ? "bg-indigo-600/20 border-indigo-500/40 text-indigo-100"
                    : "bg-zinc-900/40 border-zinc-800 text-zinc-300 hover:bg-zinc-900",
                ].join(" ")}
              >
                {k === "all" ? "All" : k === "active" ? "Active" : "Done"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-1 rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6">
          <h2 className="text-lg font-semibold">Create task</h2>

          <form onSubmit={createTask} className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Title</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Finish PR10 UI"
                required
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Description</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Optional details…"
                rows={4}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Due date</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={dueAt}
                onChange={(e) => setDueAt(e.target.value)}
              />
              <div className="mt-1 text-xs text-zinc-500">
                Tip: leave blank for “No due date”.
              </div>
            </div>

            <button className="w-full rounded-xl bg-indigo-600 py-2 font-medium hover:bg-indigo-500">
              Add task
            </button>

            <button
              type="button"
              onClick={loadTasks}
              className="w-full rounded-xl border border-zinc-800 bg-zinc-900 py-2 text-sm hover:bg-zinc-800"
            >
              Refresh
            </button>
          </form>
        </div>

        <div className="xl:col-span-2 grid gap-6 md:grid-cols-2">
          <Section title="Overdue" count={grouped.overdue.length}>
            {grouped.overdue.length === 0 ? (
              <div className="text-sm text-zinc-400">Nothing overdue 🎉</div>
            ) : (
              grouped.overdue.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onSelect={setSelected}
                  selected={selected?.id === t.id}
                />
              ))
            )}
          </Section>

          <Section title="Today" count={grouped.today.length}>
            {grouped.today.length === 0 ? (
              <div className="text-sm text-zinc-400">No tasks due today.</div>
            ) : (
              grouped.today.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onSelect={setSelected}
                  selected={selected?.id === t.id}
                />
              ))
            )}
          </Section>

          <Section title="Upcoming" count={grouped.upcoming.length}>
            {grouped.upcoming.length === 0 ? (
              <div className="text-sm text-zinc-400">Nothing coming up.</div>
            ) : (
              grouped.upcoming.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onSelect={setSelected}
                  selected={selected?.id === t.id}
                />
              ))
            )}
          </Section>

          <Section title="No due date" count={grouped.noDue.length}>
            {grouped.noDue.length === 0 ? (
              <div className="text-sm text-zinc-400">No undated tasks.</div>
            ) : (
              grouped.noDue.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onToggleDone={toggleDone}
                  onDelete={deleteTask}
                  onSelect={setSelected}
                  selected={selected?.id === t.id}
                />
              ))
            )}
          </Section>
        </div>
      </div>
    </Layout>
  );
}
