import { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { api, setAuthToken } from "../api/client";
import { useToast } from "../components/ToastProvider";

export default function TwoFA() {
  const toast = useToast();
  const nav = useNavigate();
  const location = useLocation();

  const email = location.state?.email || "";
  const password = location.state?.password || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email || !password) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 px-6">
        <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center dark:border-zinc-800 dark:bg-zinc-950/40">
          <h1 className="text-xl font-semibold">Session expired</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Please log in again to continue.
          </p>
          <Link
            to="/login"
            className="mt-4 inline-block rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login-2fa", {
        email,
        password,
        otp: code,
      });

      const token = res.data?.access_token;
      if (!token) throw new Error("No access_token returned");

      localStorage.setItem("token", token);
      localStorage.setItem("email", email);
      setAuthToken(token);

      toast.success("Logged in");
      nav("/tasks");
    } catch (err) {
      const msg = err?.response?.data?.detail || "Invalid 2FA code";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 px-6">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950/40">
        <h1 className="text-xl font-semibold">Two-Factor Code</h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Enter the 6-digit code from your authenticator app.
        </p>

        <div className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
          Account: {email}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            placeholder="123456"
            autoFocus
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
          />

          <button
            disabled={loading || code.length !== 6}
            className="w-full rounded-xl bg-indigo-600 py-2 font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
