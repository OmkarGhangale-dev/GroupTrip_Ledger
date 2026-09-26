import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../context/TripContext";
import { scanReceipt } from "../services/expenseService";

const MAX_BYTES = 5 * 1024 * 1024;

const CATEGORIES = [
  "Food & Dining",
  "Transportation",
  "Accommodation",
  "Activities & Tours",
  "Groceries & Supplies",
  "Entertainment",
  "Shopping",
  "Emergency / Medical",
  "Other",
];

const money = (n, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n || 0);

export default function ReceiptScanner() {
  const { participants, addExpense } = useTrip();
  const inputRef = useRef(null);

  const [previewUrl, setPreviewUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Other");
  const [paidBy, setPaidBy] = useState("");
  const [sharedIds, setSharedIds] = useState([]);

  const active = useMemo(
    () => participants.filter((p) => p.status !== "removed"),
    [participants],
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const defaultPayer = () => {
    let me = {};
    try {
      me = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      me = {};
    }
    const mine = active.find(
      (p) =>
        p.email && me.email && p.email.toLowerCase() === me.email.toLowerCase(),
    );
    return mine?.id || active[0]?.id || "";
  };

  const reset = () => {
    setResult(null);
    setPreviewUrl("");
    setError("");
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPG or PNG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 5 MB. Try a smaller photo.");
      return;
    }

    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));
    setBusy(true);
    try {
      const r = await scanReceipt(file);
      setResult(r);
      setTitle(r.merchant_name || "Receipt expense");
      setAmount(String(r.total_amount));
      setCategory(CATEGORIES.includes(r.category) ? r.category : "Other");
      setPaidBy(defaultPayer());
      setSharedIds(active.map((p) => p.id));
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(
        typeof d === "string"
          ? d
          : "Could not scan that receipt. Try a clearer photo.",
      );
      setPreviewUrl("");
    } finally {
      setBusy(false);
    }
  };

  const toggleShared = (id) =>
    setSharedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const canSave =
    result && title.trim() && Number(amount) > 0 && paidBy && sharedIds.length > 0;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const notes = [];
      if (result.transaction_date) notes.push(`Receipt date: ${result.transaction_date}`);
      if (result.tax_amount) notes.push(`Tax: ${result.tax_amount}`);
      if (result.line_items.length) {
        notes.push(
          "Items: " +
            result.line_items
              .map(
                (i) =>
                  `${i.item_name}${i.item_quantity > 1 ? ` x${i.item_quantity}` : ""}${
                    i.item_total != null ? ` (${i.item_total})` : ""
                  }`,
              )
              .join(", "),
        );
      }

      await addExpense({
        title: title.trim(),
        amount: Number(amount),
        currency: result.currency,
        category,
        paid_by_id: paidBy,
        description: `Scanned receipt | ${notes.join(" | ")}`.slice(0, 900),
        split_method: "equal",
        splits: sharedIds.map((id) => ({ participant_id: id })),
      });
      reset();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Failed to add the expense.");
    } finally {
      setSaving(false);
    }
  };

  const perPerson = sharedIds.length ? Number(amount || 0) / sharedIds.length : 0;

  return (
    <div className="flex flex-col gap-4 p-5 md:p-6 rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-md border border-white/5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          handleFile(f);
        }}
      />

      {/* 1. UPLOAD */}
      {!result && !busy && (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={`flex flex-col items-center justify-center gap-2 px-6 py-8 rounded-xl border-2 border-dashed cursor-pointer text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary-container/10"
              : "border-white/15 hover:border-primary/60"
          }`}
        >
          <span className="material-symbols-outlined text-4xl text-primary">
            document_scanner
          </span>
          <strong className="text-on-surface font-title-md text-title-md">
            Scan a receipt
          </strong>
          <span className="text-on-surface-variant font-body-sm text-body-sm">
            Click to upload or drop a photo here (JPG or PNG, up to 5 MB). The
            details are read automatically.
          </span>
        </div>
      )}

      {/* 2. SCANNING */}
      {busy && (
        <div className="flex items-center gap-4">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Receipt being scanned"
              className="w-24 h-32 object-cover rounded-lg border border-white/10"
            />
          )}
          <div className="text-on-surface font-body-md text-body-md">
            Reading your receipt...
            <div className="text-on-surface-variant text-sm">
              This takes a few seconds.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-error-container/20 text-error border border-error/30 font-body-sm text-body-sm">
          {error}
        </div>
      )}

      {/* 3. RESULT */}
      {result && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col md:flex-row gap-5">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Uploaded receipt"
                className="w-full md:w-48 max-h-64 object-contain rounded-lg border border-white/10 bg-black/20"
              />
            )}

            <div className="flex-1 flex flex-col gap-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  Merchant / title
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-lowest/80 text-on-surface normal-case tracking-normal border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  Total ({result.currency})
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-lowest/80 text-on-surface normal-case tracking-normal border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </label>
                <label className="flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-lowest/80 text-on-surface normal-case tracking-normal border border-white/10"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  Paid by
                  <select
                    value={paidBy}
                    onChange={(e) => setPaidBy(e.target.value)}
                    className="px-3 py-2.5 rounded-lg bg-surface-container-lowest/80 text-on-surface normal-case tracking-normal border border-white/10"
                  >
                    {active.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-wrap gap-x-6 gap-y-1 text-on-surface-variant font-body-sm text-body-sm">
                <span>Date on receipt: <b className="text-on-surface">{result.transaction_date || "not found"}</b></span>
                <span>Tax: <b className="text-on-surface">{result.tax_amount != null ? money(result.tax_amount, result.currency) : "not found"}</b></span>
              </div>
            </div>
          </div>

          {result.warnings?.length > 0 && (
            <div className="px-4 py-3 rounded-xl bg-primary-container/10 text-on-surface border border-primary/30 font-body-sm text-body-sm">
              {result.warnings.map((w, i) => (
                <div key={i}>⚠ {w}</div>
              ))}
            </div>
          )}

          {/* ITEMS */}
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Items found ({result.line_items.length})
            </span>
            {result.line_items.length === 0 ? (
              <p className="text-on-surface-variant text-sm mt-1">
                No individual items could be read. The total is still used.
              </p>
            ) : (
              <div className="overflow-x-auto mt-2 rounded-lg border border-white/5">
                <table className="w-full text-left font-body-sm text-body-sm">
                  <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase">
                    <tr>
                      <th className="px-4 py-2">Item</th>
                      <th className="px-4 py-2">Qty</th>
                      <th className="px-4 py-2">Price</th>
                      <th className="px-4 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-on-surface">
                    {result.line_items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{i.item_name}</td>
                        <td className="px-4 py-2">{i.item_quantity}</td>
                        <td className="px-4 py-2">{i.item_price != null ? money(i.item_price, result.currency) : "-"}</td>
                        <td className="px-4 py-2 text-right">{i.item_total != null ? money(i.item_total, result.currency) : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* WHO SHARES */}
          <div>
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Split equally between
            </span>
            <div className="flex flex-wrap gap-2 mt-2">
              {active.map((p) => {
                const on = sharedIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => toggleShared(p.id)}
                    className={`px-4 py-2 rounded-full font-label-md text-label-md cursor-pointer transition-colors ${
                      on
                        ? "bg-secondary-container text-on-surface"
                        : "bg-surface-container-high/40 text-on-surface-variant"
                    }`}
                  >
                    {on ? "✓ " : ""}
                    {p.name}
                  </button>
                );
              })}
            </div>
            {sharedIds.length > 0 && (
              <p className="text-on-surface-variant text-sm mt-2">
                About {money(perPerson, result.currency)} each.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={reset}
              disabled={saving}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high/60 hover:bg-surface-container-high text-on-surface-variant font-label-md text-label-md cursor-pointer"
            >
              Scan another
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave || saving}
              className="px-5 py-2.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold disabled:opacity-50 cursor-pointer"
            >
              {saving ? "Saving..." : "Add expense"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}