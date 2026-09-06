import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

export default function PaymentModal({ isOpen, onClose, initialData = null }) {
  const { participants, addPayment } = useTrip();

  const [fromParticipantId, setFromParticipantId] = useState("");
  const [toParticipantId, setToParticipantId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("completed");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeParticipants = participants.filter((p) => p.status !== "removed");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setFromParticipantId(
        initialData.from_participant_id || activeParticipants[0]?.id || ""
      );
      setToParticipantId(
        initialData.to_participant_id ||
          activeParticipants.find((p) => p.id !== initialData.from_participant_id)
            ?.id ||
          ""
      );
      setAmount(initialData.amount ? String(initialData.amount) : "");
      setCurrency(initialData.currency || "INR");
      setNote(initialData.note || "Settlement payment");
      setStatus(initialData.status || "completed");
    } else {
      setFromParticipantId(activeParticipants[0]?.id || "");
      setToParticipantId(activeParticipants[1]?.id || "");
      setAmount("");
      setCurrency("INR");
      setNote("");
      setStatus("completed");
    }
    setErrorMsg("");
  }, [initialData, isOpen, participants]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg("Please enter a valid amount greater than 0.");
      return;
    }

    if (!fromParticipantId || !toParticipantId) {
      setErrorMsg("Please select both payer and payee.");
      return;
    }

    if (fromParticipantId === toParticipantId) {
      setErrorMsg("Payer and Payee cannot be the same person.");
      return;
    }

    const payload = {
      from_participant_id: fromParticipantId,
      to_participant_id: toParticipantId,
      amount: amountNum,
      currency: currency.trim() || "INR",
      note: note.trim() || null,
      status: status,
    };

    try {
      setSubmitting(true);
      await addPayment(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to record payment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Record Payment / Settlement</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>
                Payer (From) <span className="req">*</span>
              </label>
              <select
                value={fromParticipantId}
                onChange={(e) => setFromParticipantId(e.target.value)}
                required
              >
                <option value="">-- Select Payer --</option>
                {activeParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>
                Payee (To) <span className="req">*</span>
              </label>
              <select
                value={toParticipantId}
                onChange={(e) => setToParticipantId(e.target.value)}
                required
              >
                <option value="">-- Select Payee --</option>
                {activeParticipants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
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

            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Note / Reference (Optional)</label>
            <input
              type="text"
              placeholder="e.g., UPI / Cash settlement for hotel"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
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
              {submitting ? "Recording..." : "Record Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
