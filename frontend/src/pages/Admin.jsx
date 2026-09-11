import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { useToast } from "../components/ToastProvider";

export default function Admin() {
  const toast = useToast();
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminExists, setAdminExists] = useState(false);
  const [claiming, setClaiming] = useState(false);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  async function loadAdminStatus() {
    setLoading(true);
    try {
      const res = await api.get("/admin/me");
      setIsAdmin(res.data.is_admin);
      setAdminExists(res.data.admin_exists);

      if (res.data.is_admin) {
        const [statsRes, usersRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminStatus();
  }, []);

  async function claimAdmin() {
    setClaiming(true);
    try {
      await api.post("/admin/bootstrap");
      toast.success("You're now an admin");
      loadAdminStatus();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't claim admin access");
      setAdminExists(true);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <Layout search={search} setSearch={setSearch} rightPanel={null}>
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <h1 className="text-2xl font-semibold">Admin</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Usage overview for TaskForge.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
            Loading...
          </div>
        )}

        {!loading && !isAdmin && !adminExists && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="font-semibold">No admin set yet</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Nobody has claimed admin access on this instance. The first
              person to claim it becomes the permanent admin.
            </p>
            <button
              onClick={claimAdmin}
              disabled={claiming}
              className="mt-4 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {claiming ? "Claiming..." : "Claim admin access"}
            </button>
          </div>
        )}

        {!loading && !isAdmin && adminExists && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="font-semibold">Admin access required</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              This account isn't an admin, and admin access has already been
              claimed by someone else.
            </p>
          </div>
        )}

        {!loading && isAdmin && stats && (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ["Total users", stats.total_users],
                ["Users with 2FA", stats.users_with_2fa],
                ["Total tasks", stats.total_tasks],
                ["Completed tasks", stats.completed_tasks],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/30"
                >
                  <div className="text-2xl font-semibold tabular-nums">
                    {value}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    {label}
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="border-b border-zinc-200 p-4 font-semibold dark:border-zinc-800">
                Users ({users.length})
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="px-4 py-2 font-medium">ID</th>
                      <th className="px-4 py-2 font-medium">Email</th>
                      <th className="px-4 py-2 font-medium">2FA</th>
                      <th className="px-4 py-2 font-medium">Tasks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                      >
                        <td className="px-4 py-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                          {u.id}
                        </td>
                        <td className="px-4 py-2">{u.email}</td>
                        <td className="px-4 py-2">
                          {u.twofa_enabled ? (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                              On
                            </span>
                          ) : (
                            <span className="text-xs text-zinc-400 dark:text-zinc-500">
                              Off
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 tabular-nums">
                          {u.task_count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
