import React, { useCallback, useEffect, useState } from "react";
import { useTrip } from "../context/TripContext";
import {
  createInvite,
  getInvites,
  revokeInvite,
} from "../services/inviteService";

const errText = (err, fallback) => {
  const d = err?.response?.data?.detail;
  return typeof d === "string" ? d : fallback;
};

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(ta);
      return ok;
    } catch {
      return false;
    }
  }
}

export default function InviteCard() {
  const { trip } = useTrip();
  const [showEmail, setShowEmail] = useState(false);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState(null);
  const [pending, setPending] = useState([]);

  const loadPending = useCallback(async () => {
    if (!trip?.id) return;
    try {
      setPending(await getInvites(trip.id));
    } catch {
      setPending([]);
    }
  }, [trip?.id]);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleCopy = async () => {
    if (!trip?.id) return;
    setBusy("link");
    setNotice(null);
    try {
      const inv = await createInvite(trip.id);
      const ok = await copyText(inv.invite_url);
      setNotice({
        type: "ok",
        text: ok
          ? "Invite link copied. Anyone who signs in with Google using it can join."
          : "Copy this link and share it:",
        link: inv.invite_url,
      });
      loadPending();
    } catch (err) {
      setNotice({
        type: "error",
        text: errText(err, "Could not create the invite link."),
      });
    } finally {
      setBusy("");
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !trip?.id) return;
    setBusy("email");
    setNotice(null);
    try {
      const inv = await createInvite(trip.id, value);
      if (inv.email_sent) {
        setNotice({ type: "ok", text: `Invite emailed to ${value}.` });
        setEmail("");
        setShowEmail(false);
      } else {
        setNotice({
          type: "error",
          text: `The invite was created but the email could not be sent (${
            inv.email_error || "unknown error"
          }). Share this link instead:`,
          link: inv.invite_url,
        });
      }
      loadPending();
    } catch (err) {
      setNotice({
        type: "error",
        text: errText(err, "Could not send the invite."),
      });
    } finally {
      setBusy("");
    }
  };

  const handleRevoke = async (id) => {
    try {
      await revokeInvite(id);
    } finally {
      loadPending();
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 rounded-xl bg-surface-container-low/60 backdrop-blur-xl border border-white/5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="max-w-xl">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold mb-1">
            Invite your fellow travelers
          </h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Send an email invite or share a link. People are added to the trip
            only after they open the invite, sign in with Google and accept.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={busy !== "" || !trip}
            className="px-5 py-3 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface font-label-md text-label-md disabled:opacity-50 cursor-pointer"
          >
            {busy === "link" ? "Creating link..." : "Copy Invite Link"}
          </button>
          <button
            type="button"
            onClick={() => setShowEmail((v) => !v)}
            disabled={!trip}
            className="px-5 py-3 rounded-xl bg-secondary-container text-on-surface font-label-md text-label-md font-bold disabled:opacity-50 cursor-pointer"
          >
            Send Email Invite
          </button>
        </div>
      </div>

      {showEmail && (
        <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleSendEmail}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="friend@gmail.com"
            required
            className="flex-1 px-4 py-3 bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/60 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
          />
          <button
            type="submit"
            disabled={busy !== "" || !email.trim()}
            className="px-6 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold disabled:opacity-50 cursor-pointer"
          >
            {busy === "email" ? "Sending..." : "Send"}
          </button>
        </form>
      )}

      {notice && (
        <div
          className={`px-4 py-3 rounded-xl border font-body-sm text-body-sm ${
            notice.type === "ok"
              ? "bg-primary-container/10 text-on-surface border-primary/30"
              : "bg-error-container/20 text-error border-error/30"
          }`}
        >
          <div>{notice.text}</div>
          {notice.link && (
            <input
              readOnly
              value={notice.link}
              onFocus={(e) => e.target.select()}
              className="mt-2 w-full px-3 py-2 rounded-lg bg-surface-container-lowest/80 text-on-surface text-xs border border-white/5"
            />
          )}
        </div>
      )}

      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
            Waiting for them to accept
          </span>
          {pending.map((inv) => (
            <div
              key={inv.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-surface-container/50 border border-white/5"
            >
              <div className="text-on-surface font-body-sm text-body-sm">
                {inv.email || "Shareable invite link"}
                <span className="text-on-surface-variant text-xs ml-2">
                  expires {new Date(inv.expires_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRevoke(inv.id)}
                className="text-error/80 hover:text-error font-label-sm text-label-sm cursor-pointer"
              >
                Revoke
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}