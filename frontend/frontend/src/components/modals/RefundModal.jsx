import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

export default function RefundModal({ isOpen, onClose, booking = null }) {
  const { addRefund } = useTrip();

  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (booking) {
      setAmount(booking.amount ? String(booking.amount) : "");
      setReason("");
    } else {
      setAmount("");
      setReason("");
    }
    setErrorMsg("");
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg("Refund amount must be greater than 0.");
      return;
    }

    const payload = {
      booking_id: booking.id,
      amount: amountNum,
      reason: reason.trim() || null,
    };

    try {
      setSubmitting(true);
      await addRefund(payload);
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to record refund.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Record Booking Refund</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <div className="modal-info-box">
          <p>
            <strong>Booking:</strong> {booking.provider || booking.booking_type}
          </p>
          <p>
            <strong>Original Amount:</strong> ₹{booking.amount}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Refund Amount (₹) <span className="req">*</span>
            </label>
            <input
              type="number"
              min="0.01"
              max={booking.amount}
              step="any"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Refund Reason</label>
            <textarea
              rows={3}
              placeholder="e.g., Flight cancelled by airline / hotel partial cancellation"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
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
              {submitting ? "Processing..." : "Confirm Refund"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
