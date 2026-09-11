import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api } from "../api/client";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [status, setStatus] = useState("verifying"); // verifying | success | error
  const [error, setError] = useState("");
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!token) {
      setStatus("error");
      setError("This link is missing its verification token.");
      return;
    }

    api
      .post("/auth/verify-email", { token })
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err?.response?.data?.detail || "Invalid or expired link.");
      });
  }, [token]);

  return (
    <div className="min-h-screen w-full px-4">
      <div className="mx-auto flex min-h-screen w-full max-w-md items-center">
        <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 shadow">
          <div className="mb-5">
            <div className="text-2xl font-semibold">Email verification</div>
          </div>

          {status === "verifying" && (
            <div className="text-sm text-zinc-400">Verifying...</div>
          )}

          {status === "success" && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
              Your email is verified.
            </div>
          )}

          {status === "error" && (
            <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <p className="mt-4 text-sm text-zinc-400">
            <Link className="text-indigo-400 hover:text-indigo-300" to="/tasks">
              Go to TaskForge
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
