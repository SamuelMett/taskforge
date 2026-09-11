import { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: cleanEmail });
      setSent(true);
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
            <div className="text-2xl font-semibold">Reset your password</div>
            <div className="mt-1 text-sm text-zinc-400">
              Enter your account email and we'll send you a reset link.
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          {sent ? (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              If that email is registered, a reset link is on its way. Check
              your inbox (and spam folder) — the link expires in 30 minutes.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-4">
              <div>
                <label className="text-sm text-zinc-300">Email</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  required
                  autoFocus
                  disabled={loading}
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send reset link"}
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
