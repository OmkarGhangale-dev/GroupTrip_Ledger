import React, { useEffect, useMemo, useRef, useState } from "react";
import { useTrip } from "../context/TripContext";
import { scanReceipt, splitReceiptWithText } from "../services/expenseService";

const MAX_BYTES = 4 * 1024 * 1024;

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

const METHODS = [
  { id: "equal", label: "Equal" },
  { id: "custom", label: "Custom ₹" },
  { id: "percentage", label: "Percentage %" },
  { id: "shares", label: "Shares" },
];

const money = (n, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n || 0);

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// split a total into n parts that add back up to the total exactly
const evenAmounts = (total, n) => {
  if (!n) return [];
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / n);
  const rem = cents - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
};

const evenPercents = (n) => {
  if (!n) return [];
  const base = Math.floor(10000 / n);
  const rem = 10000 - base * n;
  return Array.from({ length: n }, (_, i) => (base + (i < rem ? 1 : 0)) / 100);
};

export default function ReceiptScanner() {
  const { trip, participants, addExpense } = useTrip();
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

  const [method, setMethod] = useState("equal");
  const [config, setConfig] = useState({});

  const [nlText, setNlText] = useState("");
  const [nlBusy, setNlBusy] = useState(false);
  const [nlNotes, setNlNotes] = useState([]);

  const active = useMemo(
    () => participants.filter((p) => p.status !== "removed"),
    [participants],
  );
  const included = useMemo(
    () => active.filter((p) => sharedIds.includes(p.id)),
    [active, sharedIds],
  );
  const totalNum = Number(amount) || 0;

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // what each ticked person pays, for the current method
  const amounts = useMemo(() => {
    const out = {};
    if (!included.length) return out;

    if (method === "equal") {
      const parts = evenAmounts(totalNum, included.length);
      included.forEach((p, i) => (out[p.id] = parts[i]));
    } else if (method === "custom") {
      included.forEach((p) => (out[p.id] = Number(config[p.id]?.amount) || 0));
    } else if (method === "percentage") {
      included.forEach(
        (p) =>
          (out[p.id] = (totalNum * (Number(config[p.id]?.percentage) || 0)) / 100),
      );
    } else {
      const totalShares = included.reduce(
        (s, p) => s + (Number(config[p.id]?.shares) || 0),
        0,
      );
      included.forEach(
        (p) =>
          (out[p.id] = totalShares
            ? (totalNum * (Number(config[p.id]?.shares) || 0)) / totalShares
            : 0),
      );
    }
    return out;
  }, [included, method, config, totalNum]);

  const splitError = useMemo(() => {
    if (!included.length) return "Tick at least one person.";
    if (method === "custom") {
      const sum = included.reduce((s, p) => s + (amounts[p.id] || 0), 0);
      if (Math.abs(sum - totalNum) > 0.05) {
        return `Amounts add up to ${money(sum, result?.currency)}, but the total is ${money(totalNum, result?.currency)}.`;
      }
    }
    if (method === "percentage") {
      const pct = included.reduce(
        (s, p) => s + (Number(config[p.id]?.percentage) || 0),
        0,
      );
      if (Math.abs(pct - 100) > 0.05) {
        return `Percentages add up to ${pct.toFixed(2)}%, they must add up to 100%.`;
      }
    }
    if (method === "shares") {
      const sh = included.reduce(
        (s, p) => s + (Number(config[p.id]?.shares) || 0),
        0,
      );
      if (sh <= 0) return "Total shares must be more than 0.";
    }
    return "";
  }, [included, method, amounts, config, totalNum, result]);

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
    setMethod("equal");
    setConfig({});
    setNlText("");
    setNlNotes([]);
  };

  const handleFile = async (file) => {
    if (!file) return;
    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image (JPG or PNG).");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("That image is over 4 MB. Try a smaller photo.");
      return;
    }

    setResult(null);
    setPreviewUrl(URL.createObjectURL(file));
    setBusy(true);
    try {
      const r = await scanReceipt(file);
      const cfg = {};
      active.forEach((p) => {
        cfg[p.id] = { amount: "", percentage: "", shares: "1" };
      });
      setResult(r);
      setTitle(r.merchant_name || "Receipt expense");
      setAmount(String(r.total_amount));
      setCategory(CATEGORIES.includes(r.category) ? r.category : "Other");
      setPaidBy(defaultPayer());
      setSharedIds(active.map((p) => p.id));
      setMethod("equal");
      setConfig(cfg);
      setNlNotes([]);
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

  const setField = (id, key, value) =>
    setConfig((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));

  const switchMethod = (m) => {
    setMethod(m);
    const ids = included.map((p) => p.id);
    setConfig((prev) => {
      const next = { ...prev };
      if (m === "custom") {
        const vals = evenAmounts(totalNum, ids.length);
        ids.forEach((id, i) => {
          next[id] = { ...next[id], amount: String(vals[i]) };
        });
      }
      if (m === "percentage") {
        const vals = evenPercents(ids.length);
        ids.forEach((id, i) => {
          next[id] = { ...next[id], percentage: String(vals[i]) };
        });
      }
      if (m === "shares") {
        ids.forEach((id) => {
          next[id] = { ...next[id], shares: next[id]?.shares || "1" };
        });
      }
      return next;
    });
  };

  const toggleShared = (id) =>
    setSharedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  // type an instruction such as "Rahul had the omelette, split the rest"
  const handleNl = async (e) => {
    e.preventDefault();
    if (!nlText.trim() || !result || !trip?.id) return;
    setNlBusy(true);
    setError("");
    try {
      const r = await splitReceiptWithText({
        trip_id: trip.id,
        text: nlText.trim(),
        total_amount: totalNum,
        currency: result.currency,
        line_items: result.line_items.map((i) => ({
          item_name: i.item_name,
          item_total: i.item_total,
        })),
      });

      const cfg = {};
      active.forEach((p) => {
        cfg[p.id] = { amount: "", percentage: "", shares: "1" };
      });
      r.splits.forEach((s) => {
        cfg[s.participant_id] = {
          ...cfg[s.participant_id],
          amount: String(s.amount),
        };
      });
      setConfig(cfg);
      setSharedIds(r.splits.map((s) => s.participant_id));
      setMethod("custom");
      if (r.paid_by_id) setPaidBy(r.paid_by_id);
      setNlNotes(r.notes || []);
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(
        typeof d === "string" ? d : "Could not apply that instruction.",
      );
    } finally {
      setNlBusy(false);
    }
  };

  const buildSplits = () => {
    if (method === "equal") {
      return included.map((p) => ({ participant_id: p.id }));
    }
    if (method === "custom") {
      return included
        .map((p) => ({
          participant_id: p.id,
          amount: round2(config[p.id]?.amount),
        }))
        .filter((s) => s.amount > 0);
    }
    if (method === "percentage") {
      return included
        .map((p) => ({
          participant_id: p.id,
          percentage: round2(config[p.id]?.percentage),
        }))
        .filter((s) => s.percentage > 0);
    }
    return included.map((p) => ({
      participant_id: p.id,
      shares: Math.max(1, parseInt(config[p.id]?.shares, 10) || 1),
    }));
  };

  const canSave =
    result && title.trim() && totalNum > 0 && paidBy && !splitError;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setError("");
    try {
      const notes = [];
      if (result.transaction_date) {
        notes.push(`Receipt date: ${result.transaction_date}`);
      }
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
        amount: totalNum,
        currency: result.currency,
        category,
        paid_by_id: paidBy,
        description: `Scanned receipt | ${notes.join(" | ")}`.slice(0, 900),
        split_method: method,
        splits: buildSplits(),
      });
      reset();
    } catch (err) {
      const d = err?.response?.data?.detail;
      setError(typeof d === "string" ? d : "Failed to add the expense.");
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    "px-3 py-2.5 rounded-lg bg-surface-container-lowest/80 text-on-surface border border-white/10 focus:outline-none focus:ring-1 focus:ring-primary";

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

      {/* UPLOAD */}
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
            Click to upload or drop a photo here (JPG or PNG, up to 4 MB). The
            details are read automatically.
          </span>
        </div>
      )}

      {/* SCANNING */}
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

      {/* RESULT */}
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
                    className={`${inputCls} normal-case tracking-normal`}
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
                    className={`${inputCls} normal-case tracking-normal`}
                  />
                </label>
                <label className="flex flex-col gap-1 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  Category
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className={`${inputCls} normal-case tracking-normal`}
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
                    className={`${inputCls} normal-case tracking-normal`}
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
                <span>
                  Date on receipt:{" "}
                  <b className="text-on-surface">
                    {result.transaction_date || "not found"}
                  </b>
                </span>
                <span>
                  Tax:{" "}
                  <b className="text-on-surface">
                    {result.tax_amount != null
                      ? money(result.tax_amount, result.currency)
                      : "not found"}
                  </b>
                </span>
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
                  <thead className="bg-[#F4F4F5]">
                    <tr className="border-b border-black/10 bg-[#F4F4F5] text-black font-semibold uppercase text-[10px] tracking-wider">
                      <th className="px-4 py-2 text-black font-bold">ITEM</th>
                      <th className="px-4 py-2 text-black font-bold">QTY</th>
                      <th className="px-4 py-2 text-black font-bold">PRICE</th>
                      <th className="px-4 py-2 text-right text-black font-bold">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-on-surface">
                    {result.line_items.map((i, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2">{i.item_name}</td>
                        <td className="px-4 py-2">{i.item_quantity}</td>
                        <td className="px-4 py-2">
                          {i.item_price != null
                            ? money(i.item_price, result.currency)
                            : "-"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {i.item_total != null
                            ? money(i.item_total, result.currency)
                            : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* TYPE AN INSTRUCTION */}
          <form onSubmit={handleNl} className="flex flex-col gap-2">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
              Tell me how to split it
            </span>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={nlText}
                onChange={(e) => setNlText(e.target.value)}
                maxLength={500}
                placeholder='e.g. "Rahul had the omelette, Aman had the eggs, split the rest equally"'
                className={`flex-1 ${inputCls}`}
              />
              <button
                type="submit"
                disabled={nlBusy || !nlText.trim()}
                className="px-5 py-2.5 rounded-xl bg-secondary-container text-on-surface font-label-md text-label-md font-bold disabled:opacity-50 cursor-pointer"
              >
                {nlBusy ? "Working..." : "Apply"}
              </button>
            </div>
            {nlNotes.length > 0 && (
              <ul className="text-on-surface-variant font-body-sm text-body-sm flex flex-col gap-0.5">
                {nlNotes.map((n, i) => (
                  <li key={i}>• {n}</li>
                ))}
              </ul>
            )}
          </form>

          {/* SPLIT EDITOR */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">
                Split method
              </span>
              <div className="flex flex-wrap gap-2">
                {METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => switchMethod(m.id)}
                    className={`px-4 py-2 rounded-full font-label-md text-label-md cursor-pointer transition-colors ${
                      method === m.id
                        ? "bg-primary-container text-on-primary-container font-bold"
                        : "bg-surface-container-high/40 text-on-surface-variant hover:text-on-surface"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {active.map((p) => {
                const on = sharedIds.includes(p.id);
                return (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center gap-3 px-4 py-2.5 rounded-lg bg-surface-container/50 border border-white/5"
                  >
                    <label className="flex items-center gap-2 flex-1 min-w-[8rem] text-on-surface cursor-pointer">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={() => toggleShared(p.id)}
                      />
                      {p.name}
                    </label>

                    {on && method === "custom" && (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={config[p.id]?.amount ?? ""}
                        onChange={(e) => setField(p.id, "amount", e.target.value)}
                        className={`w-28 ${inputCls}`}
                      />
                    )}
                    {on && method === "percentage" && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={config[p.id]?.percentage ?? ""}
                          onChange={(e) =>
                            setField(p.id, "percentage", e.target.value)
                          }
                          className={`w-24 ${inputCls}`}
                        />
                        <span className="text-on-surface-variant">%</span>
                      </div>
                    )}
                    {on && method === "shares" && (
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={config[p.id]?.shares ?? "1"}
                          onChange={(e) => setField(p.id, "shares", e.target.value)}
                          className={`w-20 ${inputCls}`}
                        />
                        <span className="text-on-surface-variant">×</span>
                      </div>
                    )}

                    <span className="w-28 text-right text-primary font-bold">
                      {on ? money(amounts[p.id], result.currency) : "-"}
                    </span>
                  </div>
                );
              })}
            </div>

            {splitError && (
              <div className="px-4 py-2.5 rounded-lg bg-error-container/20 text-error border border-error/30 font-body-sm text-body-sm">
                {splitError}
              </div>
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