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

// convert ISO -> datetime-local string
function toLocalInputValue(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueAt, setDueAt] = useState("");

  const [error, setError] = useState("");
  const [tab, setTab] = useState("all"); // all | active | done
  const [search, setSearch] = useState("");

  const [selected, setSelected] = useState(null);

  // Edit form state (right panel)
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadTasks({ keepLoading = false } = {}) {
    if (!keepLoading) setLoadingTasks(true);
    setError("");
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);

      // keep selection in sync
      if (selected) {
        const updated = res.data.find((t) => t.id === selected.id);
        setSelected(updated || null);
      }
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to load tasks");
    } finally {
      setLoadingTasks(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/tasks", {
        title,
        description: desc || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
      });
      setTitle("");
      setDesc("");
      setDueAt("");
      await loadTasks({ keepLoading: true });
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to create task");
    }
  }

  async function toggleDone(task) {
    setError("");
    try {
      await api.patch(`/tasks/${task.id}`, { is_done: !task.is_done });
      await loadTasks({ keepLoading: true });
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to update task");
    }
  }

  async function deleteTask(task) {
    setError("");

    const ok = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await api.delete(`/tasks/${task.id}`);
      if (selected?.id === task.id) setSelected(null);
      await loadTasks({ keepLoading: true });
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to delete task");
    }
  }

  async function saveEdits() {
    if (!selected) return;
    setSaving(true);
    setError("");

    try {
      await api.patch(`/tasks/${selected.id}`, {
        title: editTitle,
        description: editDesc || null,
        due_at: editDueAt ? new Date(editDueAt).toISOString() : null,
      });

      await loadTasks({ keepLoading: true });
      // selection will refresh from loadTasks sync
    } catch (e) {
      setError(e?.response?.data?.detail || "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  function resetEditsFromSelected(task) {
    setEditTitle(task?.title || "");
    setEditDesc(task?.description || "");
    setEditDueAt(task?.due_at ? toLocalInputValue(task.due_at) : "");
  }

  useEffect(() => {
    loadTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Whenever selected changes, load edit fields
  useEffect(() => {
    if (selected) resetEditsFromSelected(selected);
    else {
      setEditTitle("");
      setEditDesc("");
      setEditDueAt("");
    }
  }, [selected]);

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
          {selected ? "Edit and manage the selected task." : "Select a task to preview."}
        </p>
      </div>

      {!selected ? (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4 text-sm text-zinc-400">
          Click a task card to preview + edit it here.
        </div>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-4">
          <div className="text-xs font-semibold text-zinc-400">Editing</div>

          <div className="mt-4 space-y-3">
            <div>
              <label className="text-sm text-zinc-300">Title</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Description</label>
              <textarea
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                rows={4}
                disabled={saving}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Due date</label>
              <input
                type="datetime-local"
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
                disabled={saving}
              />
              <div className="mt-1 text-xs text-zinc-500">
                Leave blank for “No due date”.
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                onClick={saveEdits}
                disabled={saving || !editTitle.trim()}
                className="rounded-xl bg-indigo-600 px-3 py-2 text-sm font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>

              <button
                onClick={() => resetEditsFromSelected(selected)}
                disabled={saving}
                className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm hover:bg-zinc-800 disabled:opacity-60"
              >
                Cancel
              </button>
            </div>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => toggleDone(selected)}
                disabled={saving}
                className="w-full rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100 hover:bg-emerald-500/15 disabled:opacity-60"
              >
                {selected.is_done ? "Mark as active" : "Mark as done"}
              </button>

              <button
                onClick={() => deleteTask(selected)}
                disabled={saving}
                className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-100 hover:bg-red-500/15 disabled:opacity-60"
              >
                Delete task
              </button>
            </div>

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
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-xs font-semibold text-zinc-300">Insights</div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Total</span>
            <span className="text-zinc-100">{tasks.length}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Completed</span>
            <span className="text-zinc-100">{tasks.filter((t) => t.is_done).length}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Remaining</span>
            <span className="text-zinc-100">{tasks.filter((t) => !t.is_done).length}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout search={search} setSearch={setSearch} rightPanel={rightPanel}>
      {/* Header */}
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

      {loadingTasks ? (
        <div className="mt-8 text-sm text-zinc-400">Loading tasks…</div>
      ) : tasks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-sm text-zinc-400">
          No tasks yet. Create one to get started.
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-3">
        {/* Create */}
        <div className="xl:col-span-1 rounded-2xl border border-zinc-900 bg-zinc-900/20 p-6">
          <h2 className="text-lg font-semibold">Create task</h2>

          <form onSubmit={createTask} className="mt-5 space-y-4">
            <div>
              <label className="text-sm text-zinc-300">Title</label>
              <input
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Type your task title..."
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
            </div>

            <button className="w-full rounded-xl bg-indigo-600 py-2 font-medium hover:bg-indigo-500">
              Add task
            </button>

            <button
              type="button"
              onClick={() => loadTasks({ keepLoading: true })}
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
