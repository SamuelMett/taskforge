import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/client";

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });

      const token = res.data?.access_token;

      if (!token) {
        setError(res.data?.detail || "No token returned. (2FA may be required)");
        return;
      }

      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      setAuthToken(token);

      nav("/tasks"); 
    } catch (err) {
      const msg = err?.response?.data?.detail || err?.message || "Login failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-zinc-950 via-zinc-950 to-indigo-950/30">
      <div className="min-h-screen w-full px-4 py-10 flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="text-2xl font-semibold tracking-tight text-zinc-100">
              TaskForge
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              Sign in to manage your tasks.
            </div>
          </div>

          {/* Card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow">
            <h2 className="text-xl font-semibold text-zinc-100">Login</h2>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="text-sm text-zinc-300">Email</label>
                <input
                  className="mt-1 w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-indigo-500"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="me@example.com"
                  type="email"
                  autoComplete="email"
                  required
                />
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
                />
              </div>

              <button
                disabled={loading}
                className="w-full rounded-lg bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="mt-4 text-sm text-zinc-400">
              No account?{" "}
              <Link className="text-indigo-400 hover:text-indigo-300" to="/register">
                Register
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-zinc-500">
            © {new Date().getFullYear()} TaskForge
          </div>
        </div>
      </div>
    </div>
  );
}
