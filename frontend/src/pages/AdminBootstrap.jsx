import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useToast } from "../components/ToastProvider";

export default function AdminBootstrap() {
  const toast = useToast();
  const nav = useNavigate();
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/bootstrap", { secret });
      toast.success("You're now an admin");
      nav("/admin");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid secret");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/40">
        <h1 className="text-xl font-semibold">Admin setup</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the ADMIN_BOOTSTRAP_SECRET you set on Render to claim admin
          access for this account. You must already be logged in.
        </p>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            type="password"
            placeholder="Bootstrap secret"
            autoFocus
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />

          <button
            disabled={loading || !secret}
            className="w-full rounded-xl bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Claiming..." : "Claim admin access"}
          </button>
        </form>
      </div>
    </div>
  );
}
