import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { api } from "../api/client";
import { useTheme } from "../components/ThemeProvider";
import { useToast } from "../components/ToastProvider";

export default function Settings() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [email, setEmail] = useState(localStorage.getItem("email") || "");

  const [twofaEnabled, setTwofaEnabled] = useState(null);
  const [qrImage, setQrImage] = useState("");
  const [settingUp, setSettingUp] = useState(false);
  const [confirmCode, setConfirmCode] = useState("");
  const [busy, setBusy] = useState(false);

  const [disablingTwofa, setDisablingTwofa] = useState(false);
  const [disableTwofaPassword, setDisableTwofaPassword] = useState("");
  const [disableTwofaBusy, setDisableTwofaBusy] = useState(false);

  const [isVerified, setIsVerified] = useState(null);
  const [resending, setResending] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  async function loadMe() {
    try {
      const res = await api.get("/auth/me");
      const data = res?.data || {};
      const em = data.email || localStorage.getItem("email") || "";
      setEmail(em);
      setTwofaEnabled(Boolean(data.twofa_enabled));
    } catch {
      // ignore
    }

    try {
      const res = await api.get("/auth/verification-status");
      setIsVerified(Boolean(res?.data?.is_verified));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function resendVerification() {
    setResending(true);
    try {
      const res = await api.post("/auth/resend-verification");
      toast.success(res?.data?.message || "Verification email sent");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't send verification email");
    } finally {
      setResending(false);
    }
  }

  async function changePassword(e) {
    e.preventDefault();

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("New passwords don't match.");
      return;
    }

    setChangingPassword(true);
    try {
      await api.post("/auth/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't update password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function disableTwofa(e) {
    e.preventDefault();
    setDisableTwofaBusy(true);
    try {
      await api.post("/auth/2fa/disable", { password: disableTwofaPassword });
      toast.success("2FA disabled");
      setTwofaEnabled(false);
      setDisablingTwofa(false);
      setDisableTwofaPassword("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't disable 2FA");
    } finally {
      setDisableTwofaBusy(false);
    }
  }

  async function startTwofaSetup() {
    setBusy(true);
    try {
      const res = await api.post("/auth/2fa/setup");
      setQrImage(`data:image/png;base64,${res.data.qr_png_base64}`);
      setSettingUp(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't start 2FA setup");
    } finally {
      setBusy(false);
    }
  }

  async function confirmTwofa(e) {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post("/auth/2fa/confirm", { code: confirmCode });
      toast.success("2FA enabled");
      setSettingUp(false);
      setQrImage("");
      setConfirmCode("");
      setTwofaEnabled(true);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Invalid code");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Layout search={search} setSearch={setSearch} rightPanel={null}>
      <div className="mx-auto max-w-3xl space-y-6">
        {/* Header */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Personalize your TaskForge experience.
          </p>
        </div>

        {/* Theme */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Theme</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Choose Light or Dark mode. Saved automatically.
              </div>
            </div>

            <button
              onClick={toggleTheme}
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
            >
              Toggle: {theme === "dark" ? "Dark" : "Light"}
            </button>
          </div>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setTheme("light")}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                theme === "light"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-200"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={[
                "rounded-xl px-4 py-2 text-sm border",
                theme === "dark"
                  ? "bg-indigo-600/10 border-indigo-500/40 text-indigo-700 dark:text-indigo-200"
                  : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800",
              ].join(" ")}
            >
              Dark
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="font-semibold">Account</div>
          <div className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Signed in as: <span className="font-medium">{email}</span>
          </div>

          {isVerified === false && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
              <span className="text-sm text-amber-700 dark:text-amber-300">
                Your email isn't verified yet.
              </span>
              <button
                onClick={resendVerification}
                disabled={resending}
                className="whitespace-nowrap rounded-lg border border-amber-500/40 px-3 py-1 text-xs font-medium text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:text-amber-300"
              >
                {resending ? "Sending..." : "Resend verification email"}
              </button>
            </div>
          )}

          {isVerified === true && (
            <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              Email verified
            </div>
          )}
        </div>

        {/* Change password */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="font-semibold">Change password</div>
          <div className="text-sm text-zinc-600 dark:text-zinc-400">
            Update your account password.
          </div>

          <form onSubmit={changePassword} className="mt-4 space-y-3">
            <input
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              type="password"
              placeholder="Current password"
              autoComplete="current-password"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <input
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              type="password"
              placeholder="New password (at least 8 characters)"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <input
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              type="password"
              placeholder="Confirm new password"
              autoComplete="new-password"
              required
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            />
            <button
              disabled={changingPassword}
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
            >
              {changingPassword ? "Updating..." : "Update password"}
            </button>
          </form>
        </div>

        {/* Two-factor authentication */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/30">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="font-semibold">Two-factor authentication</div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Require a 6-digit authenticator code at login, in addition to
                your password.
              </div>
            </div>

            {twofaEnabled === true && !disablingTwofa && (
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-600 dark:text-emerald-400">
                  Enabled
                </span>
                <button
                  onClick={() => setDisablingTwofa(true)}
                  className="whitespace-nowrap rounded-xl border border-zinc-200 px-3 py-1.5 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Disable
                </button>
              </div>
            )}

            {twofaEnabled === false && !settingUp && (
              <button
                onClick={startTwofaSetup}
                disabled={busy}
                className="whitespace-nowrap rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
              >
                {busy ? "Starting..." : "Enable 2FA"}
              </button>
            )}
          </div>

          {disablingTwofa && (
            <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Enter your password to confirm disabling 2FA.
              </p>
              <form onSubmit={disableTwofa} className="mt-3 flex gap-2">
                <input
                  value={disableTwofaPassword}
                  onChange={(e) => setDisableTwofaPassword(e.target.value)}
                  type="password"
                  placeholder="Password"
                  autoFocus
                  className="w-full max-w-xs rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <button
                  disabled={disableTwofaBusy || !disableTwofaPassword}
                  className="whitespace-nowrap rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-60"
                >
                  {disableTwofaBusy ? "Disabling..." : "Disable 2FA"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDisablingTwofa(false);
                    setDisableTwofaPassword("");
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}

          {settingUp && (
            <div className="mt-5 border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Scan this QR code with your authenticator app (Google
                Authenticator, Authy, 1Password, etc.), then enter the 6-digit
                code it shows.
              </p>

              {qrImage && (
                <img
                  src={qrImage}
                  alt="2FA QR code"
                  className="mt-4 h-44 w-44 rounded-lg border border-zinc-200 dark:border-zinc-800"
                />
              )}

              <form onSubmit={confirmTwofa} className="mt-4 flex gap-2">
                <input
                  value={confirmCode}
                  onChange={(e) =>
                    setConfirmCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                  }
                  inputMode="numeric"
                  placeholder="123456"
                  autoFocus
                  className="w-full max-w-[160px] rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                />
                <button
                  disabled={busy || confirmCode.length !== 6}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-60"
                >
                  {busy ? "Confirming..." : "Confirm"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSettingUp(false);
                    setQrImage("");
                    setConfirmCode("");
                  }}
                  className="rounded-xl border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
