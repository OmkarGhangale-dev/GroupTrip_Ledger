import React, { useState } from "react";
import { useTrip } from "../context/TripContext";
import MapExplorer from "../components/MapExplorer";

export default function ItineraryView({
  onOpenItineraryModal,
  targetPlaceQuery = "",
  initialTab = "timeline",
}) {
  const { itinerary, removeItineraryItem, trip, addItineraryItem, showToast } =
    useTrip();
  const [activeTab, setActiveTab] = useState(initialTab); // "timeline" | "map"
  const [selectedDayFilter, setSelectedDayFilter] = useState("ALL"); // "ALL" | dateStr

  const handleDelete = async (item) => {
    if (
      window.confirm(
        `Are you sure you want to remove "${item.title}" from the itinerary?`
      )
    ) {
      await removeItineraryItem(item.id);
    }
  };

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

  // Group itinerary by date
  const groupedByDate = itinerary.reduce((acc, item) => {
    const rawDate = item.date ? item.date.split("T")[0] : "UNSCHEDULED";
    const displayLabel = item.date
      ? new Date(item.date).toLocaleDateString("en-IN", {
          weekday: "short",
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : "Unscheduled Events";

    if (!acc[rawDate]) {
      acc[rawDate] = {
        label: displayLabel,
        items: [],
      };
    }
    acc[rawDate].items.push(item);
    return acc;
  }, {});

  // Filter groups if a specific day is selected
  const displayedGroups =
    selectedDayFilter === "ALL"
      ? groupedByDate
      : {
          [selectedDayFilter]: groupedByDate[selectedDayFilter] || {
            label:
              tripDays.find((d) => d.dateStr === selectedDayFilter)?.formatted ||
              selectedDayFilter,
            items: [],
          },
        };

  // Handle "Add to Itinerary" from map
  const handleMapAddToItinerary = async (itemData) => {
    try {
      await addItineraryItem(itemData);
      showToast(`"${itemData.title}" added to itinerary! 📍`, "success");
    } catch (err) {
      showToast("Failed to add place to itinerary.", "error");
    }
  };

  const typeEmoji = {
    ACTIVITY: "🏛️",
    MEAL: "🍽️",
    ACCOMMODATION: "🏨",
    TRANSPORT: "🚌",
    FREE_TIME: "🌴",
    OTHER: "📌",
  };

  return (
    <div className="view-content">
      {/* Page Header */}
      <div className="page-header page-header-itinerary">
        <div>
          <span className="page-label">DAY-BY-DAY SCHEDULE</span>
          <h1>Trip Itinerary ({itinerary.length} Events)</h1>
          <p className="page-description">
            {trip?.destination
              ? `Planning itinerary for ${trip.name} (${trip.destination})`
              : "Plan activities, sights, reservations, and timings for your group trip."}
          </p>
        </div>

        <div className="itinerary-header-actions">
          <button
            className="btn btn-primary"
            onClick={() => onOpenItineraryModal()}
          >
            + Add Schedule Item
          </button>
        </div>
      </div>

      {/* Main View Tabs (Timeline vs Google Map Explorer) */}
      <div className="itinerary-tab-bar">
        <button
          className={`itinerary-tab-btn ${
            activeTab === "timeline" ? "itinerary-tab-active" : ""
          }`}
          onClick={() => setActiveTab("timeline")}
        >
          <span>📋</span> Timeline Schedule
        </button>
        <button
          className={`itinerary-tab-btn ${
            activeTab === "map" ? "itinerary-tab-active" : ""
          }`}
          onClick={() => setActiveTab("map")}
        >
          <span>🗺️</span> Google Maps Explorer & Recommendations
        </button>
      </div>

      {/* TIMELINE TAB */}
      {activeTab === "timeline" && (
        <>
          {/* DAY-BY-DAY FILTER BAR */}
          {tripDays.length > 0 && (
            <div className="itinerary-day-filter-bar">
              <span className="day-filter-title">Filter by Day:</span>
              <button
                className={`day-filter-chip ${
                  selectedDayFilter === "ALL" ? "day-filter-chip-active" : ""
                }`}
                onClick={() => setSelectedDayFilter("ALL")}
              >
                🌟 All Days ({itinerary.length})
              </button>
              {tripDays.map((d) => {
                const count = groupedByDate[d.dateStr]?.items?.length || 0;
                return (
                  <button
                    key={d.dayNum}
                    className={`day-filter-chip ${
                      selectedDayFilter === d.dateStr
                        ? "day-filter-chip-active"
                        : ""
                    }`}
                    onClick={() => setSelectedDayFilter(d.dateStr)}
                  >
                    <strong>Day {d.dayNum}</strong>
                    <span>({d.formatted})</span>
                    {count > 0 && (
                      <span className="day-chip-badge">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {itinerary.length === 0 ? (
            <div className="empty-state-large">
              <div className="empty-state-icon">🗓️</div>
              <h3>Your Itinerary is Empty</h3>
              <p>
                Explore places on the interactive Google Map, ask TravelBot AI,
                or manually add your first activity.
              </p>
              <div className="empty-state-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => onOpenItineraryModal()}
                >
                  + Add First Event
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => setActiveTab("map")}
                >
                  🗺️ Explore Google Maps
                </button>
              </div>
            </div>
          ) : (
            <div className="itinerary-timeline-container">
              {Object.entries(displayedGroups).map(([dateKey, groupData]) => (
                <div key={dateKey} className="itinerary-day-group">
                  <div className="itinerary-date-header">
                    <div className="date-header-left">
                      <span className="calendar-icon">📅</span>
                      <h3>{groupData.label}</h3>
                    </div>
                    <span className="day-count-badge">
                      {groupData.items.length} item
                      {groupData.items.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {groupData.items.length === 0 ? (
                    <div className="empty-day-state">
                      <p>No events scheduled for this day yet.</p>
                      <button
                        className="btn-link-action"
                        onClick={() => onOpenItineraryModal({ date: dateKey })}
                      >
                        + Schedule an activity for this day
                      </button>
                    </div>
                  ) : (
                    <div className="itinerary-items-timeline">
                      {groupData.items.map((item) => (
                        <div key={item.id} className="timeline-card">
                          <div className="timeline-card-left">
                            <div className="timeline-type-icon">
                              {typeEmoji[item.item_type] || "📌"}
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
                                    🕐{" "}
                                    {item.start_time
                                      ? item.start_time.substring(0, 5)
                                      : ""}
                                    {item.end_time
                                      ? ` - ${item.end_time.substring(0, 5)}`
                                      : ""}
                                  </span>
                                )}
                                {item.location && (
                                  <span className="timeline-location">
                                    📍{" "}
                                    {item.location
                                      .split(",")
                                      .slice(0, 2)
                                      .join(", ")}
                                  </span>
                                )}
                              </div>

                              {item.description && (
                                <p className="timeline-desc">
                                  {item.description}
                                </p>
                              )}

                              {item.notes && (
                                <div className="timeline-notes-box">
                                  <span>📝 {item.notes}</span>
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
                              ✏️ Edit
                            </button>
                            <button
                              className="btn-icon-action btn-danger"
                              onClick={() => handleDelete(item)}
                              title="Delete Item"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* MAP TAB */}
      {activeTab === "map" && (
        <div className="itinerary-map-tab">
          <MapExplorer
            onAddToItinerary={handleMapAddToItinerary}
            tripStartDate={trip?.start_date ? trip.start_date.split("T")[0] : ""}
            tripEndDate={trip?.end_date ? trip.end_date.split("T")[0] : ""}
            tripDestination={trip?.destination || trip?.name || ""}
            targetPlaceQuery={targetPlaceQuery}
          />
        </div>
      )}
    </div>
  );
}
