import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api/client";
import Layout from "../components/Layout";
import Section from "../components/Section";
import TaskCard from "../components/TaskCard";
import { useToast } from "../components/ToastProvider";

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

function priorityRank(p) {
  const x = p || "med";
  if (x === "high") return 0;
  if (x === "med") return 1;
  return 2;
}

function SkeletonCard() {
  return (
    <div className="w-full rounded-xl border border-zinc-800 bg-zinc-950/40 p-4">
      <div className="h-4 w-2/3 rounded bg-zinc-800/60" />
      <div className="mt-3 h-3 w-full rounded bg-zinc-800/50" />
      <div className="mt-2 h-3 w-5/6 rounded bg-zinc-800/40" />
      <div className="mt-3 h-3 w-1/2 rounded bg-zinc-800/30" />
    </div>
  );
}

function openNativePicker(inputEl) {
  if (!inputEl) return;
  if (typeof inputEl.showPicker === "function") {
    inputEl.showPicker();
    return;
  }
  inputEl.focus();
  inputEl.click?.();
}

export default function Tasks() {
  const toast = useToast();

  const [tasks, setTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(true);

  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [priority, setPriority] = useState("med");

  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sort, setSort] = useState("due");
  const [selected, setSelected] = useState(null);

  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDueAt, setEditDueAt] = useState("");
  const [editPriority, setEditPriority] = useState("med");

  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);

  const dueRef = useRef(null);
  const editDueRef = useRef(null);

  async function loadTasks({ keepLoading = false, silent = false } = {}) {
    if (!keepLoading) setLoadingTasks(true);
    setError("");
    try {
      const res = await api.get("/tasks");
      setTasks(res.data);

      if (selected) {
        const updated = res.data.find((t) => t.id === selected.id);
        setSelected(updated || null);
      }

      if (!silent) toast.info("Tasks refreshed");
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to load tasks";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoadingTasks(false);
    }
  }

  async function createTask(e) {
    e.preventDefault();
    setError("");
    setCreating(true);

    try {
      await api.post("/tasks", {
        title,
        description: desc || null,
        due_at: dueAt ? new Date(dueAt).toISOString() : null,
        priority,
      });

      setTitle("");
      setDesc("");
      setDueAt("");
      setPriority("med");

      toast.success("Task created");
      await loadTasks({ keepLoading: true, silent: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to create task";
      setError(msg);
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  }

  async function toggleDone(task) {
    setError("");

    const prevTasks = tasks;
    const prevSelected = selected;

    const next = prevTasks.map((t) =>
      t.id === task.id ? { ...t, is_done: !t.is_done } : t
    );
    setTasks(next);

    if (prevSelected?.id === task.id) {
      setSelected({ ...prevSelected, is_done: !prevSelected.is_done });
    }

    try {
      await api.patch(`/tasks/${task.id}`, { is_done: !task.is_done });
      toast.success(task.is_done ? "Marked active" : "Marked done");
      await loadTasks({ keepLoading: true, silent: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to update task";
      setError(msg);
      toast.error(msg);

      setTasks(prevTasks);
      setSelected(prevSelected);
    }
  }

  async function deleteTask(task) {
    setError("");

    const ok = window.confirm(`Delete "${task.title}"? This cannot be undone.`);
    if (!ok) return;

    try {
      await api.delete(`/tasks/${task.id}`);
      if (selected?.id === task.id) setSelected(null);
      toast.success("Task deleted");
      await loadTasks({ keepLoading: true, silent: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to delete task";
      setError(msg);
      toast.error(msg);
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
        priority: editPriority,
      });

      toast.success("Changes saved");
      await loadTasks({ keepLoading: true, silent: true });
    } catch (e) {
      const msg = e?.response?.data?.detail || "Failed to save changes";
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  function resetEditsFromSelected(task) {
    setEditTitle(task?.title || "");
    setEditDesc(task?.description || "");
    setEditDueAt(task?.due_at ? toLocalInputValue(task.due_at) : "");
    setEditPriority(task?.priority || "med");
  }

  useEffect(() => {
    (async () => {
      setLoadingTasks(true);
      try {
        const res = await api.get("/tasks");
        setTasks(res.data);
      } catch (e) {
        const msg = e?.response?.data?.detail || "Failed to load tasks";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoadingTasks(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (selected) resetEditsFromSelected(selected);
    else {
      setEditTitle("");
      setEditDesc("");
      setEditDueAt("");
      setEditPriority("med");
    }
  }, [selected]);

  const stats = useMemo(() => {
    const now = new Date();
    const todayStart = startOfDay(now);
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    const total = tasks.length;
    const done = tasks.filter((t) => t.is_done).length;

    const overdue = tasks.filter((t) => {
      if (t.is_done) return false;
      if (!t.due_at) return false;
      return new Date(t.due_at) < todayStart;
    }).length;

    const dueToday = tasks.filter((t) => {
      if (t.is_done) return false;
      if (!t.due_at) return false;
      const due = new Date(t.due_at);
      return due >= todayStart && due < tomorrowStart;
    }).length;

    return { total, done, overdue, dueToday };
  }, [tasks]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    let list = tasks.filter((t) => {
      if (tab === "active" && t.is_done) return false;
      if (tab === "done" && !t.is_done) return false;

      if (priorityFilter !== "all" && (t.priority || "med") !== priorityFilter) {
        return false;
      }

      if (!q) return true;
      return (
        (t.title || "").toLowerCase().includes(q) ||
        (t.description || "").toLowerCase().includes(q)
      );
    });

    if (sort === "newest") {
      list = [...list].sort((a, b) => {
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
      });
    } else if (sort === "priority") {
      list = [...list].sort((a, b) => {
        const pr = priorityRank(a.priority) - priorityRank(b.priority);
        if (pr !== 0) return pr;
        const ad = a.created_at ? new Date(a.created_at).getTime() : 0;
        const bd = b.created_at ? new Date(b.created_at).getTime() : 0;
        return bd - ad;
      });
    } else {
      list = [...list].sort((a, b) => {
        const aHas = !!a.due_at;
        const bHas = !!b.due_at;
        if (aHas && !bHas) return -1;
        if (!aHas && bHas) return 1;
        if (!aHas && !bHas) return 0;
        return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
      });
    }

    return list;
  }, [tasks, tab, search, priorityFilter, sort]);

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

    if (sort === "priority") {
      const byPriority = (a, b) => priorityRank(a.priority) - priorityRank(b.priority);
      overdue.sort(byPriority);
      today.sort(byPriority);
      upcoming.sort(byPriority);
      noDue.sort(byPriority);
    }

    return { overdue, today, upcoming, noDue };
  }, [filtered, sort]);

  const hasAnyFiltered =
    grouped.overdue.length + grouped.today.length + grouped.upcoming.length + grouped.noDue.length > 0;

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
              <label className="text-sm text-zinc-300">Priority</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={editPriority}
                onChange={(e) => setEditPriority(e.target.value)}
                disabled={saving}
              >
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/*  */}
            <div>
              <label className="text-sm text-zinc-300">Due date</label>
              <div className="relative mt-1">
                <input
                  ref={editDueRef}
                  type="datetime-local"
                  step="60"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-24 outline-none focus:border-indigo-500"
                  value={editDueAt}
                  onChange={(e) => setEditDueAt(e.target.value)}
                  disabled={saving}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => openNativePicker(editDueRef.current)}
                  disabled={saving}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                >
                  Pick
                </button>
              </div>
              <div className="mt-1 text-xs text-zinc-500">Leave blank for “No due date”.</div>
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
                Status: <span className="text-zinc-200">{selected.is_done ? "Done" : "Active"}</span>
              </div>
              <div>
                Priority:{" "}
                <span className="text-zinc-200">
                  {selected.priority === "high" ? "High" : selected.priority === "low" ? "Low" : "Med"}
                </span>
              </div>
              <div>
                Due: <span className="text-zinc-200">{selected.due_at ? fmt(selected.due_at) : "No due date"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
        <div className="text-xs font-semibold text-zinc-300">Insights</div>
        <div className="mt-3 grid gap-2 text-sm">
          <div className="flex items-center justify-between text-zinc-300">
            <span>Total</span>
            <span className="text-zinc-100">{stats.total}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Completed</span>
            <span className="text-zinc-100">{stats.done}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Overdue</span>
            <span className="text-zinc-100">{stats.overdue}</span>
          </div>
          <div className="flex items-center justify-between text-zinc-300">
            <span>Due today</span>
            <span className="text-zinc-100">{stats.dueToday}</span>
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
            <p className="mt-1 text-sm text-zinc-400">Today, upcoming, and what’s overdue.</p>
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

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
          >
            <option value="all">All priorities</option>
            <option value="high">High</option>
            <option value="med">Med</option>
            <option value="low">Low</option>
          </select>

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-200 outline-none focus:border-indigo-500"
          >
            <option value="due">Sort: Due soon</option>
            <option value="newest">Sort: Newest</option>
            <option value="priority">Sort: Priority</option>
          </select>

          <button
            type="button"
            onClick={() => loadTasks({ keepLoading: true, silent: false })}
            className="ml-auto rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm hover:bg-zinc-800"
          >
            Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loadingTasks ? (
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-zinc-800/60" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-zinc-800/60" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-zinc-800/60" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
          <div className="space-y-3">
            <div className="h-4 w-24 rounded bg-zinc-800/60" />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-sm text-zinc-400">
          No tasks yet. Create one to get started.
        </div>
      ) : !hasAnyFiltered ? (
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-900/20 p-6 text-sm text-zinc-400">
          No tasks match your filters/search.
        </div>
      ) : null}

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
                placeholder="Type your task title..."
                required
                disabled={creating}
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
                disabled={creating}
              />
            </div>

            <div>
              <label className="text-sm text-zinc-300">Priority</label>
              <select
                className="mt-1 w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                disabled={creating}
              >
                <option value="high">High</option>
                <option value="med">Med</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/*  */}
            <div>
              <label className="text-sm text-zinc-300">Due date</label>
              <div className="relative mt-1">
                <input
                  ref={dueRef}
                  type="datetime-local"
                  step="60"
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-24 outline-none focus:border-indigo-500"
                  value={dueAt}
                  onChange={(e) => setDueAt(e.target.value)}
                  disabled={creating}
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => openNativePicker(dueRef.current)}
                  disabled={creating}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-200 hover:bg-zinc-800 disabled:opacity-60"
                >
                  Pick
                </button>
              </div>
              <div className="mt-1 text-xs text-zinc-500">
                Click <span className="text-zinc-300">Pick</span> to open the date/time selector.
              </div>
            </div>

            <button
              disabled={creating || !title.trim()}
              className="w-full rounded-xl bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {creating ? "Adding..." : "Add task"}
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
