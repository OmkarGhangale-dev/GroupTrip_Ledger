import React, { useEffect, useState } from "react";
import LoginView from "./LoginView";
import { acceptInvite, getInvitePreview } from "../services/inviteService";

export default function InviteAcceptView({ token }) {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const loggedIn = !!localStorage.getItem("token");

  let me = {};
  try {
    me = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    me = {};
  }

  useEffect(() => {
    getInvitePreview(token)
      .then(setPreview)
      .catch(() => setError("This invite link is not valid."))
      .finally(() => setLoading(false));
  }, [token]);

  const goHome = () => window.location.replace("/");

  const handleAccept = async () => {
    setBusy(true);
    setError("");
    try {
      await acceptInvite(token);
      goHome();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Could not join the trip.");
    } finally {
      setBusy(false);
    }
  };

  const switchAccount = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.reload();
  };

  const shell = (children) => (
    <div className="min-h-screen flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md flex flex-col gap-4">{children}</div>
    </div>
  );

  if (loading) return shell(<p className="text-on-surface text-center">Checking your invite...</p>);

  if (error && !preview) {
    return shell(
      <div className="p-6 rounded-xl bg-surface-container-low/80 border border-white/5 text-center">
        <p className="text-error mb-4">{error}</p>
        <button onClick={goHome} className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold cursor-pointer">
          Go to the app
        </button>
      </div>
    );
  }

  if (!preview?.valid) {
    return shell(
      <div className="p-6 rounded-xl bg-surface-container-low/80 border border-white/5 text-center">
        <p className="text-on-surface mb-4">{preview?.reason || "This invite is not valid."}</p>
        <button onClick={goHome} className="px-5 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-bold cursor-pointer">
          Go to the app
        </button>
      </div>
    );
  }

  const heading = (
    <div className="p-6 rounded-xl bg-surface-container-low/80 backdrop-blur-xl border border-white/5 text-center">
      <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">
        You're invited
      </span>
      <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold mt-2">
        {preview.trip_name}
      </h2>
      <p className="text-on-surface-variant text-sm">
        {preview.destination}
        {preview.invited_by ? ` · invited by ${preview.invited_by}` : ""}
      </p>
      {preview.email && (
        <p className="text-on-surface-variant text-xs mt-2">
          This invite is for {preview.email}. Sign in with that Google account.
        </p>
      )}
    </div>
  );

  if (!loggedIn) {
    return (
      <div className="flex flex-col items-center gap-4 pt-8 px-4">
        <div className="w-full max-w-md">{heading}</div>
        <p className="text-on-surface-variant text-sm">Sign in to accept the invitation.</p>
        <LoginView onLoginSuccess={() => window.location.reload()} />
      </div>
    );
  }

  return shell(
    <>
      {heading}
      <div className="p-6 rounded-xl bg-surface-container-low/80 border border-white/5 flex flex-col gap-3">
        <p className="text-on-surface-variant text-sm text-center">
          Signed in as <b className="text-on-surface">{me.email || "your account"}</b>
        </p>
        {error && (
          <div className="px-4 py-3 rounded-xl bg-error-container/20 text-error border border-error/30 text-sm">
            {error}
          </div>
        )}
        <button
          onClick={handleAccept}
          disabled={busy}
          className="px-5 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-bold disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Joining..." : "Join trip"}
        </button>
        <button onClick={switchAccount} className="text-on-surface-variant text-sm underline cursor-pointer">
          Not you? Use a different account
        </button>
      </div>
    </>
  );
}