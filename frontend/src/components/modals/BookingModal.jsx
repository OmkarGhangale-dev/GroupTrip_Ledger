import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

const BOOKING_TYPES = [
  { id: "flight", label: "✈️ Flight" },
  { id: "hotel", label: "🏨 Hotel / Stay" },
  { id: "activity", label: "🏄 Activity / Tour" },
  { id: "transport", label: "🚆 / 🚗 Transport" },
  { id: "other", label: "📌 Other" },
];

export default function BookingModal({ isOpen, onClose, initialData = null }) {
  const { participants, addBooking, editBooking } = useTrip();

  const [bookingType, setBookingType] = useState("flight");
  const [provider, setProvider] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("confirmed");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [cancellationPolicy, setCancellationPolicy] = useState("");
  const [startDatetime, setStartDatetime] = useState("");
  const [endDatetime, setEndDatetime] = useState("");
  const [location, setLocation] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeParticipants = participants.filter((p) => p.status !== "removed");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setBookingType(initialData.booking_type || "flight");
      setProvider(initialData.provider || "");
      setDescription(initialData.description || "");
      setAmount(initialData.amount ? String(initialData.amount) : "");
      setStatus(initialData.status || "confirmed");
      setReferenceNumber(initialData.reference_number || "");
      setCancellationPolicy(initialData.cancellation_policy || "");
      setStartDatetime(
        initialData.start_datetime
          ? initialData.start_datetime.substring(0, 16)
          : ""
      );
      setEndDatetime(
        initialData.end_datetime ? initialData.end_datetime.substring(0, 16) : ""
      );
      setLocation(initialData.location || "");
      setSelectedParticipants(
        initialData.participant_ids ||
          initialData.participants?.map((p) => p.id) ||
          []
      );
    } else {
      setBookingType("flight");
      setProvider("");
      setDescription("");
      setAmount("");
      setStatus("confirmed");
      setReferenceNumber("");
      setCancellationPolicy("");
      setStartDatetime("");
      setEndDatetime("");
      setLocation("");
      setSelectedParticipants(activeParticipants.map((p) => p.id));
    }
    setErrorMsg("");
  }, [initialData, isOpen, participants]);

  if (!isOpen) return null;

  const handleToggleParticipant = (id) => {
    setSelectedParticipants((prev) =>
      prev.includes(id) ? prev.filter((pId) => pId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) {
      setErrorMsg("Amount must be greater than 0.");
      return;
    }

    const payload = {
      booking_type: bookingType,
      provider: provider.trim() || null,
      description: description.trim() || null,
      amount: amountNum,
      status: status,
      reference_number: referenceNumber.trim() || null,
      cancellation_policy: cancellationPolicy.trim() || null,
      start_datetime: startDatetime ? new Date(startDatetime).toISOString() : null,
      end_datetime: endDatetime ? new Date(endDatetime).toISOString() : null,
      location: location.trim() || null,
      participant_ids: selectedParticipants,
    };

    try {
      setSubmitting(true);
      if (initialData?.id) {
        await editBooking(initialData.id, payload);
      } else {
        await addBooking(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? "Edit Booking" : "Add Trip Booking"}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Booking Type</label>
              <select
                value={bookingType}
                onChange={(e) => setBookingType(e.target.value)}
              >
                {BOOKING_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ flex: 1.5 }}>
              <label>Provider / Vendor</label>
              <input
                type="text"
                placeholder="e.g., IndiGo Airlines / Marriott Resort"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>
                Cost (₹) <span className="req">*</span>
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
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="confirmed">Confirmed</option>
                <option value="pending">Pending</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>

            <div className="form-group">
              <label>Reference # / PNR</label>
              <input
                type="text"
                placeholder="e.g., 6E-98432 / BK-10294"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Location / Address</label>
              <input
                type="text"
                placeholder="e.g., Calangute, North Goa"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start / Check-In Datetime</label>
              <input
                type="datetime-local"
                value={startDatetime}
                onChange={(e) => setStartDatetime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End / Check-Out Datetime</label>
              <input
                type="datetime-local"
                value={endDatetime}
                onChange={(e) => setEndDatetime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Description / Notes</label>
            <input
              type="text"
              placeholder="e.g., Flight 6E-201 from Mumbai to Goa"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Cancellation Policy (Optional)</label>
            <input
              type="text"
              placeholder="e.g., Free cancellation up to 48 hrs before check-in"
              value={cancellationPolicy}
              onChange={(e) => setCancellationPolicy(e.target.value)}
            />
          </div>

          {/* PARTICIPANTS CHECKBOXES */}
          <div className="form-group">
            <label>Assigned Participants</label>
            <div className="checkbox-pills-wrap">
              {activeParticipants.map((p) => {
                const checked = selectedParticipants.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`pill-btn ${checked ? "active" : ""}`}
                    onClick={() => handleToggleParticipant(p.id)}
                  >
                    {checked ? "✓ " : "+ "} {p.name}
                  </button>
                );
              })}
            </div>
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
              {submitting ? "Saving..." : initialData ? "Update Booking" : "Save Booking"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
