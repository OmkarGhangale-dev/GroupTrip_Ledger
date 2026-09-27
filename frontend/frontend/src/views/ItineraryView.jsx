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

  const handleMapAddToItinerary = async (itemData) => {
    try {
      await addItineraryItem(itemData);
      showToast(`"${itemData.title}" added to itinerary! 📍`, "success");
    } catch {
      showToast("Failed to add place to itinerary.", "error");
    }
  };

  const typeIcon = {
    ACTIVITY: "hiking",
    MEAL: "restaurant",
    ACCOMMODATION: "hotel",
    TRANSPORT: "directions_bus",
    FREE_TIME: "beach_access",
    SIGHTSEEING: "photo_camera",
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Header */}
      <div className="relative w-full overflow-hidden -mt-16 pt-24 pb-14 px-6 md:px-12 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-background">
        <div className="absolute -top-24 right-1/4 w-[520px] h-[340px] bg-gradient-to-br from-primary-container/20 to-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col items-start gap-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-black font-label-sm text-xs uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
                <span>DAY-BY-DAY SCHEDULE</span>
                <span>•</span>
                <span>GOA EXPEDITION '24</span>
              </div>
              <h1 className="font-instrument text-5xl md:text-6xl text-on-surface font-normal tracking-tight leading-none">
                Trip Itinerary
              </h1>
              <span className="text-xs font-bold uppercase tracking-wider text-black/60">
                {itinerary.length} Event{itinerary.length === 1 ? "" : "s"} Scheduled
              </span>
            </div>
            <button
              className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-black hover:bg-slate-800 text-white font-label-md text-label-md transition-all duration-300 shadow-md cursor-pointer sm:self-start lg:self-end"
              onClick={() => onOpenItineraryModal()}
            >
              <span className="font-bold tracking-wide">+ Add Schedule Item</span>
              <div className="w-6 h-6 rounded-lg bg-on-primary-container/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="w-full px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-8">
        {/* View Switch Pills */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-label-md text-label-md font-semibold transition-all cursor-pointer ${
              activeTab === "timeline"
                ? "bg-secondary-container text-on-surface shadow-[0_0_18px_rgba(85,45,170,0.4)]"
                : "bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("timeline")}
          >
            <span className="material-symbols-outlined text-lg text-primary">calendar_view_day</span>
            <span>Timeline Schedule</span>
          </button>
          <button
            type="button"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-label-md text-label-md font-semibold transition-all cursor-pointer ${
              activeTab === "map"
                ? "bg-secondary-container text-on-surface shadow-[0_0_18px_rgba(85,45,170,0.4)]"
                : "bg-surface-container-low/70 hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
            }`}
            onClick={() => setActiveTab("map")}
          >
            <span className="material-symbols-outlined text-lg text-secondary">map</span>
            <span>Google Maps Explorer &amp; Recommendations</span>
          </button>
        </div>

        {activeTab === "map" ? (
          <div className="p-4 rounded-2xl bg-surface-container-low/60 backdrop-blur-xl shadow-xl border border-white/5">
            <MapExplorer
              trip={trip}
              targetQuery={targetPlaceQuery}
              onAddToItinerary={handleMapAddToItinerary}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {/* Day Filter Pills */}
            {tripDays.length > 0 && (
              <div className="flex items-center gap-2.5 overflow-x-auto py-2 border-b border-black/5 pb-4 mb-2 scrollbar-thin">
                <span className="text-xs font-bold uppercase tracking-wider text-black/60 shrink-0 mr-1">
                  Filter by Day:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDayFilter("ALL")}
                  className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedDayFilter === "ALL"
                      ? "bg-black text-white shadow-sm"
                      : "bg-black/5 hover:bg-black/10 text-black/70 border border-black/10"
                  }`}
                >
                  All Days ({itinerary.length})
                </button>
                {tripDays.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => setSelectedDayFilter(d.dateStr)}
                    className={`px-4 py-2 rounded-full text-xs transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                      selectedDayFilter === d.dateStr
                        ? "bg-black text-white font-bold shadow-sm"
                        : "bg-black/5 hover:bg-black/10 text-black/70 border border-black/10"
                    }`}
                  >
                    Day {d.dayNum} • {d.formatted}
                  </button>
                ))}
              </div>
            )}

            {itinerary.length === 0 ? (
              <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/60 backdrop-blur-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl border border-white/5">
                <div className="w-20 h-20 rounded-full bg-secondary-container/40 flex items-center justify-center text-primary shadow-[0_0_32px_rgba(255,154,77,0.2)]">
                  <span className="material-symbols-outlined text-4xl">event_upcoming</span>
                </div>
                <h3 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">Your Itinerary is Empty</h3>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                  Explore places on the interactive Google Map, ask TravelBot AI, or manually add your first activity.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
                  <button
                    className="px-6 py-3 rounded-xl bg-black hover:bg-slate-800 text-white font-label-md text-label-md font-bold shadow-md transition-all cursor-pointer"
                    onClick={() => onOpenItineraryModal()}
                  >
                    + Add First Event
                  </button>
                  <button
                    className="px-6 py-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-surface font-label-md text-label-md font-semibold transition-all cursor-pointer"
                    onClick={() => setActiveTab("map")}
                  >
                    Explore Google Maps
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6">
                {Object.keys(displayedGroups).map((dateKey) => {
                  const group = displayedGroups[dateKey];
                  if (!group || group.items.length === 0) return null;

                  return (
                    <div key={dateKey} className="p-6 rounded-2xl bg-surface-container-low/70 backdrop-blur-md shadow-xl border border-white/5 flex flex-col gap-4">
                      <div className="flex items-center gap-3 pb-3 border-b border-white/5">
                        <span className="material-symbols-outlined text-primary text-xl">event</span>
                        <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold">
                          {group.label}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-3">
                        {group.items.map((item) => (
                          <div key={item.id} className="p-4 rounded-xl bg-surface-container-lowest/60 hover:bg-surface-container/40 transition-colors flex items-center justify-between gap-4 border border-white/5">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                                <span className="material-symbols-outlined text-xl">
                                  {typeIcon[item.item_type] || "place"}
                                </span>
                              </div>
                              <div>
                                <strong className="text-on-surface font-semibold text-base block">{item.title}</strong>
                                <span className="text-xs text-on-surface-variant flex items-center gap-2 mt-0.5">
                                  {item.start_time && (
                                    <span className="flex items-center gap-1 text-primary">
                                      <span className="material-symbols-outlined text-xs">schedule</span>
                                      {item.start_time.substring(0, 5)}
                                    </span>
                                  )}
                                  {item.location && (
                                    <span className="flex items-center gap-1">
                                      <span className="material-symbols-outlined text-xs text-secondary">location_on</span>
                                      {item.location}
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded-full bg-secondary-container/50 text-on-secondary-container text-xs font-semibold uppercase">
                                {item.item_type}
                              </span>
                              <button
                                type="button"
                                className="p-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                                onClick={() => handleDelete(item)}
                              >
                                <span className="material-symbols-outlined text-lg">delete</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
