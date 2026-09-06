import React, { useState } from "react";
import { useTrip } from "../context/TripContext";

export default function BookingsView({
  onOpenBookingModal,
  onOpenRefundModal,
}) {
  const {
    bookings,
    participants,
    removeBooking,
    markBookingUsed,
    totalBookingsAmount,
    loadBookingRefunds,
  } = useTrip();

  const [filterType, setFilterType] = useState("all");
  const [refundsMap, setRefundsMap] = useState({});
  const [loadingRefunds, setLoadingRefunds] = useState({});
  const [expandedBookingId, setExpandedBookingId] = useState(null);
  const [useBooking, setUseBooking] = useState(null);
  const [selectedPayer, setSelectedPayer] = useState("");
  const [markingUsed, setMarkingUsed] = useState(false);

  const bookingTypes = [
    { id: "all", label: "All" },
    { id: "flight", label: "Flights" },
    { id: "hotel", label: "Stays" },
    { id: "activity", label: "Activities" },
    { id: "transport", label: "Transport" },
    { id: "other", label: "Other" },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (filterType === "all") return true;
    return b.booking_type === filterType;
  });

  const handleDelete = async (b) => {
    if (
      window.confirm(
        `Are you sure you want to delete this booking for ${
          b.provider || b.booking_type
        }?`,
      )
    ) {
      await removeBooking(b.id);
    }
  };
  const handleMarkAsUsed = async () => {
    if (!useBooking || !selectedPayer) {
      return;
    }

    try {
      setMarkingUsed(true);

      await markBookingUsed(useBooking.id, selectedPayer);

      setUseBooking(null);
      setSelectedPayer("");
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingUsed(false);
    }
  };

  const handleToggleRefunds = async (bookingId) => {
    if (expandedBookingId === bookingId) {
      setExpandedBookingId(null);
      return;
    }

    setExpandedBookingId(bookingId);
    if (!refundsMap[bookingId]) {
      setLoadingRefunds((prev) => ({ ...prev, [bookingId]: true }));
      const list = await loadBookingRefunds(bookingId);
      setRefundsMap((prev) => ({ ...prev, [bookingId]: list }));
      setLoadingRefunds((prev) => ({ ...prev, [bookingId]: false }));
    }
  };

  const getParticipantName = (id) => {
    const p = participants.find((item) => item.id === id);
    return p ? p.name : "Member";
  };

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="view-content">
      <div className="page-header page-header-bookings">
        <div>
          <span className="page-label">TRIP RESERVATIONS</span>
          <h1>Bookings & Refunds</h1>
          <p className="page-description">
            Organize flights, hotels, tours, and transport reservations with
            refund tracking.
          </p>
        </div>

        <div className="header-actions">
          <div className="summary-pill">
            <small>Total Bookings:</small>
            <strong>{money(totalBookingsAmount)}</strong>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onOpenBookingModal()}
          >
            + Add Booking
          </button>
        </div>
      </div>

      {/* FILTER BUTTONS */}
      <div className="filter-search-bar">
        <div className="category-chips-wrap">
          {bookingTypes.map((t) => (
            <button
              key={t.id}
              className={`chip-btn ${filterType === t.id ? "active" : ""}`}
              onClick={() => setFilterType(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="empty-state-large">
          <h3>No Bookings Logged</h3>
          <p>
            Add hotel check-ins, flight numbers, tour tickets, and transport
            details.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onOpenBookingModal()}
          >
            + Add First Booking
          </button>
        </div>
      ) : (
        <div className="cards-list">
          {filteredBookings.map((b) => {
            const isExpanded = expandedBookingId === b.id;
            const refunds = refundsMap[b.id] || [];

            return (
              <div key={b.id} className="booking-card-item">
                <div className="booking-card-main">
                  <div className="booking-card-left">
                    <div className="booking-details-column">
                      <div className="booking-title-row">
                        <h3>{b.provider || b.booking_type.toUpperCase()}</h3>
                        <span className={`status-pill status-${b.status}`}>
                          {b.status}
                        </span>
                        {b.reference_number && (
                          <span className="pnr-tag">
                            Ref: {b.reference_number}
                          </span>
                        )}
                      </div>

                      {b.description && (
                        <p className="booking-desc">{b.description}</p>
                      )}

                      <div className="booking-meta-row">
                        {b.location && <span>{b.location}</span>}
                        {b.start_datetime && (
                          <span>
                            {new Date(b.start_datetime).toLocaleString(
                              "en-IN",
                              {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        )}
                        {b.end_datetime && (
                          <span>
                            →{" "}
                            {new Date(b.end_datetime).toLocaleString("en-IN", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                      </div>

                      {/* ASSIGNED PARTICIPANTS */}
                      {(b.participant_ids?.length > 0 ||
                        b.participants?.length > 0) && (
                        <div className="assigned-participants-row">
                          <small>Assigned to:</small>
                          {(b.participants || b.participant_ids).map((p) => {
                            const pName =
                              typeof p === "object"
                                ? p.name
                                : getParticipantName(p);
                            const pId = typeof p === "object" ? p.id : p;
                            return (
                              <span key={pId} className="participant-chip-sm">
                                {pName}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="booking-card-right">
                    <div className="booking-price-box">
                      <strong>{money(b.amount)}</strong>
                      <small>INR</small>
                    </div>

                    <div className="booking-actions-row">
                      {b.status !== "completed" &&
                        b.status !== "refunded" &&
                        b.status !== "cancelled" && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => {
                              setUseBooking(b);
                              setSelectedPayer("");
                            }}
                          >
                            Mark as Used
                          </button>
                        )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onOpenRefundModal(b)}
                        title="Record Refund for this booking"
                      >
                        Refund
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleToggleRefunds(b.id)}
                        title="View Refunds History"
                      >
                        {isExpanded ? "Hide Refunds" : "Refunds"}
                      </button>
                      <button
                        className="btn-icon-action"
                        onClick={() => onOpenBookingModal(b)}
                        title="Edit Booking"
                      >
                        Edit
                      </button>
                      <button
                        className="btn-icon-action btn-danger"
                        onClick={() => handleDelete(b)}
                        title="Delete Booking"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {/* REFUNDS HISTORY SECTION */}
                {isExpanded && (
                  <div className="refunds-history-section">
                    <h4>Refund Records</h4>
                    {loadingRefunds[b.id] ? (
                      <p>Loading refunds...</p>
                    ) : refunds.length === 0 ? (
                      <p className="subtext-muted">
                        No refund requests recorded for this booking yet.
                      </p>
                    ) : (
                      <div className="refunds-list">
                        {refunds.map((r) => (
                          <div key={r.id} className="refund-item-row">
                            <div>
                              <strong>₹{r.amount}</strong>
                              <span className="refund-status-tag">
                                {r.status}
                              </span>
                              {r.reason && (
                                <span className="refund-reason">
                                  - {r.reason}
                                </span>
                              )}
                            </div>
                            <small>
                              {r.refund_date
                                ? new Date(r.refund_date).toLocaleDateString(
                                    "en-IN",
                                  )
                                : "Recently"}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      {useBooking && (
        <div
          className="modal-overlay"
          onClick={() => {
            if (!markingUsed) {
              setUseBooking(null);
              setSelectedPayer("");
            }
          }}
        >
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Booking Used</h3>

              <button
                className="modal-close-btn"
                onClick={() => {
                  setUseBooking(null);
                  setSelectedPayer("");
                }}
                disabled={markingUsed}
              >
                ×
              </button>
            </div>

            <div className="modal-form">
              <p>You used this booking:</p>

              <strong>{useBooking.provider || useBooking.booking_type}</strong>

              <p>
                Amount: ₹{Number(useBooking.amount).toLocaleString("en-IN")}
              </p>

              <div className="form-group">
                <label>Who paid this amount?</label>

                <select
                  value={selectedPayer}
                  onChange={(e) => setSelectedPayer(e.target.value)}
                  disabled={markingUsed}
                >
                  <option value="">Select participant</option>

                  {participants
                    .filter((p) => p.status !== "removed")
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => {
                    setUseBooking(null);
                    setSelectedPayer("");
                  }}
                  disabled={markingUsed}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleMarkAsUsed}
                  disabled={!selectedPayer || markingUsed}
                >
                  {markingUsed ? "Saving..." : "Confirm & Add Expense"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
