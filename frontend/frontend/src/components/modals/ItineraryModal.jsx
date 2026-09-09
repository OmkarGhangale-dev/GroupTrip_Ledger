import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

const ITEM_TYPES = [
  { id: "ACTIVITY", label: "🏛️ Activity / Sightseeing" },
  { id: "MEAL", label: "🍽️ Dining / Food" },
  { id: "ACCOMMODATION", label: "🏨 Check-in / Stay" },
  { id: "TRANSPORT", label: "🚌 Travel Transit" },
  { id: "FREE_TIME", label: "🌴 Free Time" },
  { id: "OTHER", label: "📌 Other" },
];

const DESTINATION_SUGGESTIONS = {
  uttarakhand: [
    { title: "Rishikesh River Rafting & Cliff Jump", type: "ACTIVITY", location: "Rishikesh, Uttarakhand" },
    { title: "Triveni Ghat Sunset Ganga Aarti", type: "ACTIVITY", location: "Triveni Ghat, Rishikesh" },
    { title: "Nainital Lake Boating & Mall Road", type: "ACTIVITY", location: "Naini Lake, Nainital" },
    { title: "Authentic Kumaoni & Garhwali Thali Dinner", type: "MEAL", location: "Mall Road, Nainital" },
    { title: "Kempty Falls & Mussoorie Ropeway", type: "ACTIVITY", location: "Mussoorie, Uttarakhand" },
    { title: "Jim Corbett Jungle Morning Safari", type: "ACTIVITY", location: "Jim Corbett National Park" },
  ],
  default: [
    { title: "City Sightseeing & Walking Tour", type: "ACTIVITY", location: "City Center" },
    { title: "Famous Local Heritage Food Trail", type: "MEAL", location: "Old Town" },
    { title: "Sunset Viewpoint & Photography", type: "ACTIVITY", location: "Scenic Lookout" },
    { title: "Hotel Check-in & Rest", type: "ACCOMMODATION", location: "Trip Hotel" },
  ],
};

export default function ItineraryModal({
  isOpen,
  onClose,
  initialData = null,
}) {
  const { trip, bookings, addItineraryItem, editItineraryItem } = useTrip();

  const [title, setTitle] = useState("");
  const [itemType, setItemType] = useState("ACTIVITY");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("12:00");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [description, setDescription] = useState("");
  const [bookingId, setBookingId] = useState("");
  const [orderIndex, setOrderIndex] = useState(0);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Calculate day-by-day dates
  const getTripDays = () => {
    if (!trip?.start_date || !trip?.end_date) return [];
    const days = [];
    let cur = new Date(trip.start_date);
    const end = new Date(trip.end_date);
    let d = 1;
    while (cur <= end && d <= 30) {
      days.push({
        dayNum: d,
        dateStr: cur.toISOString().split("T")[0],
        formatted: cur.toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
      });
      cur.setDate(cur.getDate() + 1);
      d++;
    }
    return days;
  };

  const tripDays = getTripDays();

  // Find destination suggestions
  const getSuggestions = () => {
    const dest = (trip?.destination || trip?.name || "").toLowerCase();
    const matchKey = Object.keys(DESTINATION_SUGGESTIONS).find((k) =>
      dest.includes(k)
    );
    return matchKey ? DESTINATION_SUGGESTIONS[matchKey] : DESTINATION_SUGGESTIONS.default;
  };

  const suggestions = getSuggestions();

  useEffect(() => {
    if (!isOpen) return;

    if (initialData) {
      setTitle(initialData.title || "");
      setItemType(initialData.item_type || "ACTIVITY");
      setDate(initialData.date ? initialData.date.split("T")[0] : "");
      setStartTime(initialData.start_time || "09:30");
      setEndTime(initialData.end_time || "12:00");
      setLocation(initialData.location || "");
      setNotes(initialData.notes || "");
      setDescription(initialData.description || "");
      setBookingId(initialData.booking_id || "");
      setOrderIndex(initialData.order_index ?? 0);
    } else {
      setTitle("");
      setItemType("ACTIVITY");
      setDate(tripDays[0] ? tripDays[0].dateStr : "");
      setStartTime("09:30");
      setEndTime("12:00");
      setLocation("");
      setNotes("");
      setDescription("");
      setBookingId("");
      setOrderIndex(0);
    }
    setErrorMsg("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleApplySuggestion = (sug) => {
    setTitle(sug.title);
    setItemType(sug.type);
    setLocation(sug.location);
  };

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
        err?.response?.data?.detail || "Failed to save itinerary item."
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
            {initialData ? "✏️ Edit Itinerary Event" : "➕ Add Itinerary Event"}
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          {/* DAY SELECTION PILLS */}
          {tripDays.length > 0 && (
            <div className="form-group modal-day-picker-container">
              <label className="modal-section-label">
                🗓️ SELECT TRIP DAY ({tripDays.length} Days Planned):
              </label>
              <div className="modal-day-pills-list">
                {tripDays.map((d) => (
                  <button
                    key={d.dayNum}
                    type="button"
                    className={`modal-day-pill-btn ${
                      date === d.dateStr ? "modal-day-pill-active" : ""
                    }`}
                    onClick={() => setDate(d.dateStr)}
                  >
                    <span className="pill-day-title">Day {d.dayNum}</span>
                    <span className="pill-day-sub">{d.formatted}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* QUICK RECOMMENDATION CHIPS */}
          {!initialData && suggestions.length > 0 && (
            <div className="form-group modal-rec-chips-container">
              <label className="modal-section-label">
                💡 Quick Recommendations ({trip?.destination || "Destination"}):
              </label>
              <div className="modal-quick-chips">
                {suggestions.map((sug, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="modal-suggestion-chip"
                    onClick={() => handleApplySuggestion(sug)}
                  >
                    <span>➕</span> {sug.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label>
              Event Title <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., River Rafting & Cliff Jumping"
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
              placeholder="e.g., Rishikesh Shivpuri / Naini Lake"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          {bookings && bookings.length > 0 && (
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
              placeholder="e.g., Wear comfortable sports shoes, carry towels"
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
