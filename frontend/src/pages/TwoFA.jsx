import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, setAuthToken } from "../api/client";
import { useToast } from "../components/ToastProvider";

export default function TwoFA() {
  const toast = useToast();
  const nav = useNavigate();

  const email = localStorage.getItem("pending_2fa_email") || "";
  const tempToken = localStorage.getItem("pending_2fa_token") || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/login-2fa", {
        email,
        code,
        temp_token: tempToken || undefined,
      });

      const token = res.data?.access_token;
      if (!token) throw new Error("No access_token returned");

      localStorage.removeItem("pending_2fa_email");
      localStorage.removeItem("pending_2fa_token");

      localStorage.setItem("token", token);
      setAuthToken(token);

      // optional: store this for UI badges
      localStorage.setItem("twofa_enabled", "true");

      toast.success("Logged in ");
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
          {email ? `Account: ${email}` : "Account not found (missing email)"}
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <input
            value={code}
            onChange={(e) =>
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            placeholder="123456"
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
