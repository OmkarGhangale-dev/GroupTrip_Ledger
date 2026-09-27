import React, { useState } from "react";
import { useTrip } from "../context/TripContext";
import { parseExpenseText } from "../services/expenseService";

const money = (n, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);

export default function QuickAddExpense() {
  const { trip, addExpense } = useTrip();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(null);
  const [autoAdd, setAutoAdd] = useState(false);
  const [error, setError] = useState("");

  const save = async (p, originalText) => {
    await addExpense({
      title: p.title,
      amount: p.amount,
      currency: p.currency,
      category: p.category,
      paid_by_id: p.paid_by_id,
      description: `Quick entry: "${originalText}"`,
      split_method: p.split_method,
      splits: p.splits.map((s) =>
        p.split_method === "custom"
          ? { participant_id: s.participant_id, amount: s.amount }
          : { participant_id: s.participant_id },
      ),
    });
    setPreview(null);
    setText("");
  };

  const handleParse = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !trip?.id) return;

    setBusy(true);
    setError("");
    setPreview(null);

    try {
      const parsed = await parseExpenseText(trip.id, value);
      if (autoAdd) {
        await save(parsed, value);
      } else {
        setPreview(parsed);
      }
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(
        typeof detail === "string"
          ? detail
          : "Couldn't read that. Try: I paid 2400 for dinner for me, Rahul and Aman.",
      );
    } finally {
      setBusy(false);
    }
  };

  const handleConfirm = async () => {
    setBusy(true);
    setError("");
    try {
      await save(preview, text.trim());
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to add expense.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 p-5 md:p-6 rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-md border border-white/5">
      <form className="flex flex-col sm:flex-row gap-3" onSubmit={handleParse}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder='Type an expense, e.g. "Rahul paid 500 for Uber for me and Rahul"'
          disabled={busy || !trip}
          maxLength={500}
          className="flex-1 px-4 py-3.5 bg-surface-container-lowest/80 text-on-surface placeholder:text-on-surface-variant/60 font-body-md text-body-md rounded-xl focus:outline-none focus:ring-1 focus:ring-primary border border-white/5"
        />
        <button
          type="submit"
          disabled={busy || !text.trim() || !trip}
          className="px-6 py-3.5 rounded-xl bg-black hover:bg-slate-800 text-white font-label-md text-label-md font-bold transition-all disabled:opacity-50 cursor-pointer"
        >
          {busy ? "Reading..." : "Add"}
        </button>
      </form>

      <label className="flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm cursor-pointer">
        <input
          type="checkbox"
          checked={autoAdd}
          onChange={(e) => setAutoAdd(e.target.checked)}
        />
        <span>Add without asking me to confirm</span>
      </label>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-error-container/20 text-error border border-error/30 font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {preview && (
        <div className="flex flex-col gap-3 p-4 rounded-xl bg-surface-container/60 border border-white/5">
          <div className="flex items-center justify-between text-on-surface">
            <strong className="font-headline-sm text-headline-sm">
              {preview.title}
            </strong>
            <span className="text-primary font-bold">
              {money(preview.amount, preview.currency)}
            </span>
          </div>

          <div className="text-on-surface-variant font-label-sm text-label-sm">
            {preview.category} · Paid by {preview.paid_by_name} ·{" "}
            {preview.split_method === "custom" ? "Custom split" : "Split equally"}
          </div>

          {preview.notes?.length > 0 && (
            <ul className="flex flex-col gap-0.5 text-on-surface-variant font-label-sm text-label-sm">
              {preview.notes.map((n, i) => (
                <li key={i}>• {n}</li>
              ))}
            </ul>
          )}

          <ul className="flex flex-col gap-1.5">
            {preview.splits.map((s) => (
              <li
                key={s.participant_id}
                className="flex justify-between text-on-surface font-body-sm text-body-sm"
              >
                <span>{s.name}</span>
                <span>{money(s.amount, preview.currency)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={busy}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={busy}
              className="px-5 py-2.5 rounded-xl bg-black hover:bg-slate-800 text-white font-label-md text-label-md font-bold disabled:opacity-50 cursor-pointer"
            >
              {busy ? "Saving..." : "Add expense"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}