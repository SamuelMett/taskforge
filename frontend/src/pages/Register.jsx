import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function Register() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
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
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/register", {
        email: cleanEmail,
        password,
      });

      // helpful UX: prefill login email
      localStorage.setItem("email", cleanEmail);

      nav("/login");
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Registration failed";
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
            <div className="text-2xl font-semibold">Create account</div>
            <div className="mt-1 text-sm text-zinc-400">
              Use a real email so you can log in from anywhere.
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
                Example: you@gmail.com
              </div>
            </div>

            <div>
              <label className="text-sm text-zinc-300">Password</label>
              <input
                className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                type="password"
                autoComplete="new-password"
                required
                disabled={loading}
              />
            </div>

            <button
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 py-2 font-medium hover:bg-indigo-500 disabled:opacity-60"
            >
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-400">
            Already have an account?{" "}
            <Link className="text-indigo-400 hover:text-indigo-300" to="/login">
              Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
