import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/client";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState(localStorage.getItem("email") || "");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");

    const cleanEmail = email.trim().toLowerCase();
    if (!isValidEmail(cleanEmail)) {
      setError("Please enter a valid email address (example: you@gmail.com).");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      const token = res.data?.access_token;

      if (!token) {
        setError(res.data?.detail || "Login failed.");
        return;
      }

      // Normal login (no 2FA)
      localStorage.setItem("token", token);
      localStorage.setItem("email", cleanEmail);
      setAuthToken(token);

      // Clean up any old 2FA leftovers
      localStorage.removeItem("pending_2fa_email");
      localStorage.removeItem("pending_2fa_token");
      localStorage.removeItem("twofa_enabled");

      nav("/tasks");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Login failed. Please try again.";
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
            <div className="text-2xl font-semibold">TaskForge</div>
            <div className="mt-1 text-sm text-zinc-400">
              Sign in to manage your tasks.
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

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
                disabled={loading}
              />
              <div className="mt-1 text-xs text-zinc-500">
                Use your real email address.
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                required
                disabled={loading}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-400">
            No account?{" "}
            <Link
              className="text-indigo-400 hover:text-indigo-300"
              to="/register"
            >
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
