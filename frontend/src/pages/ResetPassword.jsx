import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function ResetPassword() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/reset-password", {
        token,
        new_password: password,
      });
      setDone(true);
      setTimeout(() => nav("/login"), 2000);
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow">
          <div className="mb-5">
            <div className="text-2xl font-semibold">Set a new password</div>
            <div className="mt-1 text-sm text-zinc-400">
              Choose a new password for your account.
            </div>
          </div>

          {!token && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              This link is missing its reset token. Request a new one from
              the forgot-password page.
            </div>
          )}

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {done ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Password updated. Redirecting you to login...
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-300">New password</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  type="password"
                  autoComplete="new-password"
                  required
                  autoFocus
                  disabled={loading || !token}
                />
              </div>

              <div>
                <label className="text-sm text-zinc-300">
                  Confirm new password
                </label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  required
                  disabled={loading || !token}
                />
              </div>

              <button
                disabled={loading || !token}
                className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update password"}
              </button>
            </form>
          )}

          <p className="mt-4 text-sm text-zinc-400">
            <Link className="text-indigo-400 hover:text-indigo-300" to="/login">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
