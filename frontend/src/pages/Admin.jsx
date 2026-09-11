import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { useToast } from "../components/ToastProvider";

export default function Admin() {
  const toast = useToast();
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);

  const [grantEmail, setGrantEmail] = useState("");
  const [granting, setGranting] = useState(false);

  async function loadAll() {
    setLoading(true);
    try {
      const meRes = await api.get("/admin/me");
      setIsAdmin(meRes.data.is_admin);

      if (meRes.data.is_admin) {
        const [statsRes, usersRes, adminsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/users"),
          api.get("/admin/admins"),
        ]);
        setStats(statsRes.data);
        setUsers(usersRes.data);
        setAdmins(adminsRes.data);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function grantAdmin(e) {
    e.preventDefault();
    setGranting(true);
    try {
      await api.post("/admin/admins", { email: grantEmail.trim().toLowerCase() });
      toast.success(`${grantEmail} is now an admin`);
      setGrantEmail("");
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't grant admin access");
    } finally {
      setGranting(false);
    }
  }

  async function revokeAdmin(id, email) {
    try {
      await api.delete(`/admin/admins/${id}`);
      toast.success(`Revoked admin access for ${email}`);
      loadAll();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't revoke admin access");
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

        {!loading && !isAdmin && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
            <div className="font-semibold">Admin access required</div>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              This account doesn't have admin access. Ask an existing admin
              to grant it to your email.
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

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
              <div className="font-semibold">Admins</div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                People with admin access to this dashboard.
              </p>

              <div className="mt-4 space-y-2">
                {admins.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-100 px-3 py-2 text-sm dark:border-zinc-800"
                  >
                    <span>{a.email}</span>
                    <button
                      onClick={() => revokeAdmin(a.id, a.email)}
                      className="text-xs font-medium text-red-600 hover:text-red-500 dark:text-red-400"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>

              <form onSubmit={grantAdmin} className="mt-4 flex gap-2">
                <input
                  value={grantEmail}
                  onChange={(e) => setGrantEmail(e.target.value)}
                  placeholder="someone@example.com"
                  type="email"
                  required
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <button
                  disabled={granting}
                  className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {granting ? "Granting..." : "Grant admin"}
                </button>
              </form>
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
