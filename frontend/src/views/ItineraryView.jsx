import React from "react";
import { useTrip } from "../context/TripContext";

export default function ItineraryView({ onOpenItineraryModal }) {
  const { itinerary, removeItineraryItem, bookings } = useTrip();

  const handleDelete = async (item) => {
    if (
      window.confirm(
        `Are you sure you want to remove "${item.title}" from the itinerary?`
      )
    ) {
      await removeItineraryItem(item.id);
    }
  };

  // Group itinerary by date
  const groupedByDate = itinerary.reduce((acc, item) => {
    const d = item.date
      ? new Date(item.date).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Unscheduled Events";
    if (!acc[d]) acc[d] = [];
    acc[d].push(item);
    return acc;
  }, {});

  const getItemIcon = (type) => {
    switch (type) {
      case "flight":
        return "✈️";
      case "hotel":
        return "🏨";
      case "food":
        return "🍽️";
      case "activity":
        return "🏄";
      case "transport":
        return "🚆";
      default:
        return "📍";
    }
  };

  return (
    <div className="view-content">
      <div className="page-header">
        <div>
          <span className="page-label">DAY-BY-DAY SCHEDULE</span>
          <h1>Trip Itinerary ({itinerary.length})</h1>
          <p className="page-description">
            Plan activities, flights, reservations, and timings for your group
            trip.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onOpenItineraryModal()}
        >
          + Add Schedule Item
        </button>
      </div>

      {itinerary.length === 0 ? (
        <div className="empty-state-large">
          <span className="empty-icon-lg">📍</span>
          <h3>Itinerary is Empty</h3>
          <p>
            Build your travel timeline by adding check-ins, dinners, flights,
            and excursions.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onOpenItineraryModal()}
          >
            + Add First Event
          </button>
        </div>
      ) : (
        <div className="itinerary-timeline-container">
          {Object.entries(groupedByDate).map(([dateStr, items]) => (
            <div key={dateStr} className="itinerary-day-group">
              <div className="itinerary-date-header">
                <span className="date-calendar-icon">📅</span>
                <h3>{dateStr}</h3>
                <span className="day-count-badge">
                  {items.length} item{items.length === 1 ? "" : "s"}
                </span>
              </div>

              <div className="itinerary-items-timeline">
                {items.map((item) => (
                  <div key={item.id} className="timeline-card">
                    <div className="timeline-card-left">
                      <div className="timeline-node-icon">
                        {getItemIcon(item.item_type)}
                      </div>
                      <div className="timeline-content">
                        <div className="timeline-title-row">
                          <h4>{item.title}</h4>
                          <span className="category-pill-tag">
                            {item.item_type}
                          </span>
                        </div>

                        <div className="timeline-meta-row">
                          {(item.start_time || item.end_time) && (
                            <span className="timeline-time">
                              ⏰ {item.start_time ? item.start_time.substring(0, 5) : ""}
                              {item.end_time ? ` - ${item.end_time.substring(0, 5)}` : ""}
                            </span>
                          )}
                          {item.location && (
                            <span className="timeline-location">
                              📍 {item.location}
                            </span>
                          )}
                        </div>

                        {item.description && (
                          <p className="timeline-desc">{item.description}</p>
                        )}

                        {item.notes && (
                          <div className="timeline-notes-box">
                            💡 <span>{item.notes}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="timeline-card-right">
                      <button
                        className="btn-icon-action"
                        onClick={() => onOpenItineraryModal(item)}
                        title="Edit Item"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-action btn-danger"
                        onClick={() => handleDelete(item)}
                        title="Delete Item"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
