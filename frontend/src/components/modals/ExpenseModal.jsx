import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

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

export default function ExpenseModal({ isOpen, onClose, initialData = null }) {
  const { participants, bookings, addExpense, editExpense } = useTrip();

  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [paidById, setPaidById] = useState("");
  const [category, setCategory] = useState("Food & Dining");
  const [description, setDescription] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [bookingId, setBookingId] = useState("");
  const [splitMethod, setSplitMethod] = useState("equal");

  // Splits configuration per participant
  // map: participant_id -> { included: bool, amount: number, percentage: number, shares: number }
  const [splitConfig, setSplitConfig] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeParticipants = participants.filter((p) => p.status !== "removed");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setAmount(initialData.amount ? String(initialData.amount) : "");
      setPaidById(initialData.paid_by_id || "");
      setCategory(initialData.category || "Food & Dining");
      setDescription(initialData.description || "");
      setCurrency(initialData.currency || "INR");
      setBookingId(initialData.booking_id || "");
      setSplitMethod(initialData.split_method || "equal");

      // Populate splits if existing
      const initialSplits = {};
      activeParticipants.forEach((p) => {
        const found = initialData.splits?.find((s) => s.participant_id === p.id);
        if (found) {
          initialSplits[p.id] = {
            included: true,
            amount: found.amount || 0,
            percentage: found.percentage || 0,
            shares: found.shares || 1,
          };
        } else {
          initialSplits[p.id] = {
            included: false,
            amount: 0,
            percentage: 0,
            shares: 1,
          };
        }
      });
      setSplitConfig(initialSplits);
    } else {
      setTitle("");
      setAmount("");
      setPaidById(activeParticipants[0]?.id || "");
      setCategory("Food & Dining");
      setDescription("");
      setCurrency("INR");
      setBookingId("");
      setSplitMethod("equal");

      const defaultSplits = {};
      activeParticipants.forEach((p) => {
        defaultSplits[p.id] = {
          included: true,
          amount: 0,
          percentage: 0,
          shares: 1,
        };
      });
      setSplitConfig(defaultSplits);
    }
    setErrorMsg("");
  }, [initialData, isOpen, participants]);

  if (!isOpen) return null;

  const totalAmountNum = parseFloat(amount) || 0;
  const includedParticipants = activeParticipants.filter(
    (p) => splitConfig[p.id]?.included
  );

  // Equal split amount preview
  const perPersonEqual =
    includedParticipants.length > 0 && totalAmountNum > 0
      ? (totalAmountNum / includedParticipants.length).toFixed(2)
      : "0.00";

  // Calculate current sum for custom splits
  const customSum = includedParticipants.reduce(
    (sum, p) => sum + (parseFloat(splitConfig[p.id]?.amount) || 0),
    0
  );

  // Calculate current sum for percentage splits
  const percentageSum = includedParticipants.reduce(
    (sum, p) => sum + (parseFloat(splitConfig[p.id]?.percentage) || 0),
    0
  );

  // Calculate total shares
  const totalShares = includedParticipants.reduce(
    (sum, p) => sum + (parseInt(splitConfig[p.id]?.shares, 10) || 1),
    0
  );

  const handleToggleParticipant = (pId) => {
    setSplitConfig((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        included: !prev[pId]?.included,
      },
    }));
  };

  const handleSplitValueChange = (pId, field, val) => {
    setSplitConfig((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        [field]: val,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Expense title is required.");
      return;
    }
    if (totalAmountNum <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }
    if (!paidById) {
      setErrorMsg("Please select who paid for this expense.");
      return;
    }
    if (includedParticipants.length === 0) {
      setErrorMsg("Please include at least one participant in the split.");
      return;
    }

    // Build splits array
    let splitsPayload = [];

    if (splitMethod === "equal") {
      splitsPayload = includedParticipants.map((p) => ({
        participant_id: p.id,
      }));
    } else if (splitMethod === "custom") {
      const diff = Math.abs(customSum - totalAmountNum);
      if (diff > 0.05) {
        setErrorMsg(
          `Custom split amounts total ₹${customSum.toFixed(2)}, which must equal total amount ₹${totalAmountNum.toFixed(2)}.`
        );
        return;
      }
      splitsPayload = includedParticipants.map((p) => ({
        participant_id: p.id,
        amount: parseFloat(splitConfig[p.id]?.amount) || 0,
      }));
    } else if (splitMethod === "percentage") {
      const diff = Math.abs(percentageSum - 100);
      if (diff > 0.05) {
        setErrorMsg(
          `Percentages total ${percentageSum.toFixed(1)}%, which must sum to 100%.`
        );
        return;
      }
      splitsPayload = includedParticipants.map((p) => ({
        participant_id: p.id,
        percentage: parseFloat(splitConfig[p.id]?.percentage) || 0,
      }));
    } else if (splitMethod === "shares") {
      if (totalShares <= 0) {
        setErrorMsg("Total shares must be greater than 0.");
        return;
      }
      splitsPayload = includedParticipants.map((p) => ({
        participant_id: p.id,
        shares: parseInt(splitConfig[p.id]?.shares, 10) || 1,
      }));
    }

    const payload = {
      title: title.trim(),
      amount: totalAmountNum,
      paid_by_id: paidById,
      category: category,
      description: description.trim() || null,
      currency: currency.trim() || "INR",
      booking_id: bookingId || null,
      split_method: splitMethod,
      splits: splitsPayload,
    };

    try {
      setSubmitting(true);
      if (initialData?.id) {
        await editExpense(initialData.id, payload);
      } else {
        await addExpense(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save expense.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? "Edit Expense" : "Add New Expense"}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: 2 }}>
              <label>
                Expense Title <span className="req">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g., Dinner at Beach Shack"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label>
                Amount (₹) <span className="req">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>
                Paid By <span className="req">*</span>
              </label>
              <select
                value={paidById}
                onChange={(e) => setPaidById(e.target.value)}
                required
              >
                {activeParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.role})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {bookings.length > 0 && (
              <div className="form-group">
                <label>Link to Booking (Optional)</label>
                <select
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                >
                  <option value="">-- None --</option>
                  {bookings.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.provider || b.booking_type} (₹{b.amount})
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Seafood dinner with drinks"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* SPLIT ENGINE CONTROLS */}
          <div className="split-engine-section">
            <div className="split-header">
              <label>Split Method</label>
              <div className="split-tabs">
                {[
                  { id: "equal", label: "Equal (=)" },
                  { id: "custom", label: "Custom Amount (₹)" },
                  { id: "percentage", label: "Percentage (%)" },
                  { id: "shares", label: "Shares (1x, 2x)" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`split-tab-btn ${
                      splitMethod === tab.id ? "active" : ""
                    }`}
                    onClick={() => setSplitMethod(tab.id)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="split-participants-list">
              {activeParticipants.map((p) => {
                const isIncluded = splitConfig[p.id]?.included;
                return (
                  <div
                    key={p.id}
                    className={`split-row ${isIncluded ? "included" : "excluded"}`}
                  >
                    <label className="split-row-label">
                      <input
                        type="checkbox"
                        checked={!!isIncluded}
                        onChange={() => handleToggleParticipant(p.id)}
                      />
                      <span className="split-name">{p.name}</span>
                    </label>

                    <div className="split-row-input">
                      {splitMethod === "equal" && isIncluded && (
                        <span className="split-calc-val">
                          ₹{perPersonEqual} / person
                        </span>
                      )}

                      {splitMethod === "custom" && isIncluded && (
                        <div className="split-input-wrap">
                          <span>₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            placeholder="0.00"
                            value={splitConfig[p.id]?.amount || ""}
                            onChange={(e) =>
                              handleSplitValueChange(
                                p.id,
                                "amount",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}

                      {splitMethod === "percentage" && isIncluded && (
                        <div className="split-input-wrap">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="any"
                            placeholder="0"
                            value={splitConfig[p.id]?.percentage || ""}
                            onChange={(e) =>
                              handleSplitValueChange(
                                p.id,
                                "percentage",
                                e.target.value
                              )
                            }
                          />
                          <span>%</span>
                          <small style={{ color: "#777", marginLeft: "6px" }}>
                            (₹
                            {(
                              (totalAmountNum *
                                (parseFloat(splitConfig[p.id]?.percentage) || 0)) /
                              100
                            ).toFixed(2)}
                            )
                          </small>
                        </div>
                      )}

                      {splitMethod === "shares" && isIncluded && (
                        <div className="split-input-wrap">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            placeholder="1"
                            value={splitConfig[p.id]?.shares || "1"}
                            onChange={(e) =>
                              handleSplitValueChange(
                                p.id,
                                "shares",
                                e.target.value
                              )
                            }
                          />
                          <span>share(s)</span>
                          <small style={{ color: "#777", marginLeft: "6px" }}>
                            (₹
                            {totalShares > 0
                              ? (
                                  (totalAmountNum *
                                    (parseInt(splitConfig[p.id]?.shares, 10) || 1)) /
                                  totalShares
                                ).toFixed(2)
                              : "0.00"}
                            )
                          </small>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Split validation status */}
            {splitMethod === "custom" && (
              <div
                className={`split-summary-bar ${
                  Math.abs(customSum - totalAmountNum) < 0.05 ? "valid" : "invalid"
                }`}
              >
                <span>Sum: ₹{customSum.toFixed(2)}</span>
                <span>Total: ₹{totalAmountNum.toFixed(2)}</span>
                <span>
                  Diff: ₹{(totalAmountNum - customSum).toFixed(2)}
                </span>
              </div>
            )}

            {splitMethod === "percentage" && (
              <div
                className={`split-summary-bar ${
                  Math.abs(percentageSum - 100) < 0.05 ? "valid" : "invalid"
                }`}
              >
                <span>Sum: {percentageSum.toFixed(1)}%</span>
                <span>Target: 100%</span>
                <span>
                  Diff: {(100 - percentageSum).toFixed(1)}%
                </span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving..." : initialData ? "Update Expense" : "Add Expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
