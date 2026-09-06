import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

const ITEM_TYPES = [
  { id: "ACTIVITY", label: "Activity / Sightseeing" },
  { id: "MEAL", label: "Dining / Food" },
  { id: "ACCOMMODATION", label: "Check-in / Stay" },
  { id: "TRANSPORT", label: "Travel Transit" },
  { id: "FREE_TIME", label: "Free Time" },
  { id: "OTHER", label: "Other" },
];

export default function ItineraryModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const { bookings, addItineraryItem, editItineraryItem } = useTrip();

  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState("ACTIVITY");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setItemType(initialData.item_type || "ACTIVITY");
      setDate(initialData.date ? initialData.date.split("T")[0] : "");
      setStartTime(initialData.start_time || "");
      setEndTime(initialData.end_time || "");
      setLocation(initialData.location || "");
      setNotes(initialData.notes || "");
      setDescription(initialData.description || "");
      setBookingId(initialData.booking_id || "");
      setOrderIndex(initialData.order_index ?? 0);
    } else {
      setTitle("");
      setItemType("ACTIVITY");
      setDate("");
      setStartTime("");
      setEndTime("");
      setLocation("");
      setNotes("");
      setDescription("");
      setBookingId("");
      setOrderIndex(0);
    }
    setErrorMsg("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Title is required.");
      return;
    }

    const payload = {
      title: title.trim(),
      item_type: itemType,
      date: date || null,
      start_time: startTime || null,
      end_time: endTime || null,
      location: location.trim() || null,
      notes: notes.trim() || null,
      description: description.trim() || null,
      booking_id: bookingId || null,
      order_index: parseInt(orderIndex, 10) || 0,
    };

    try {
      setSubmitting(true);
      if (initialData?.id) {
        await editItineraryItem(initialData.id, payload);
      } else {
        await addItineraryItem(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(
        err?.response?.data?.detail || "Failed to save itinerary item.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            {initialData ? "Edit Itinerary Event" : "Add Itinerary Event"}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Event Title <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Sunset Cruise at Mandovi River"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Event Type</label>
              <select
                value={itemType}
                onChange={(e) => setItemType(e.target.value)}
              >
                {ITEM_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Order / Priority</label>
              <input
                type="number"
                min="0"
                value={orderIndex}
                onChange={(e) => setOrderIndex(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Location / Venue</label>
            <input
              type="text"
              placeholder="e.g., Panaji Jetty, Goa"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {bookings.length > 0 && (
            <div className="form-group">
              <label>Linked Booking (Optional)</label>
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

          <div className="form-group">
            <label>Notes / Instructions</label>
            <textarea
              rows={2}
              placeholder="e.g., Wear comfortable sandals, bring camera"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
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
              {submitting
                ? "Saving..."
                : initialData
                  ? "Update Event"
                  : "Add to Itinerary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
