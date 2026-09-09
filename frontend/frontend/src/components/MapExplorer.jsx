import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Google Maps Tile Providers
const MAP_LAYERS = {
  roadmap: {
    name: "Google Roadmap",
    icon: "🗺️",
    url: "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps",
    maxZoom: 20,
  },
  satellite: {
    name: "Google Satellite",
    icon: "🛰️",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Satellite",
    maxZoom: 20,
  },
  terrain: {
    name: "Google Terrain",
    icon: "⛰️",
    url: "https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}",
    attribution: "&copy; Google Maps Terrain",
    maxZoom: 20,
  },
};

// Create Google Maps style SVG pin icons
function createGooglePinIcon(color = "#ea4335", glyph = "●") {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 44" width="32" height="44">
      <defs>
        <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <path filter="url(#shadow)" fill="${color}" d="M16 0C7.163 0 0 7.163 0 16c0 10.5 16 28 16 28s16-17.5 16-28c0-8.837-7.163-16-16-16z"/>
      <circle cx="16" cy="15" r="7" fill="#ffffff"/>
      <circle cx="16" cy="15" r="4.5" fill="${color}"/>
    </svg>
  `;
  return new L.DivIcon({
    html: svg,
    className: "google-map-marker-div",
    iconSize: [32, 44],
    iconAnchor: [16, 44],
    popupAnchor: [0, -42],
  });
}

const redGoogleIcon = createGooglePinIcon("#ea4335"); // Primary Google Red
const greenGoogleIcon = createGooglePinIcon("#1e8e3e"); // Success Google Green
const goldGoogleIcon = createGooglePinIcon("#fbbc04"); // Selected Gold
const blueGoogleIcon = createGooglePinIcon("#1a73e8"); // Itinerary Blue

// Curated destinations fallback recommendations (e.g. Uttarakhand and other top hubs)
const CURATED_DESTINATIONS = {
  uttarakhand: [
    {
      name: "Rishikesh - Laxman Jhula & Triveni Ghat",
      category: "🏛️ Spiritual & Adventure",
      type: "ACTIVITY",
      lat: 30.0869,
      lon: 78.2676,
      desc: "World Yoga Capital, iconic suspension bridge, river rafting & sunset Ganga Aarti.",
    },
    {
      name: "Nainital Lake & Mall Road",
      category: "🌊 Scenic Lake",
      type: "ACTIVITY",
      lat: 29.3803,
      lon: 79.4636,
      desc: "Famous eye-shaped freshwater lake surrounded by pine mountains and vibrant shopping street.",
    },
    {
      name: "Mussoorie - Kempty Falls & Gun Hill",
      category: "🏔️ Hill Station",
      type: "ACTIVITY",
      lat: 30.4598,
      lon: 78.0644,
      desc: "Queen of the Hills with panoramic Himalayan snow views, cable car ride & cascade falls.",
    },
    {
      name: "Jim Corbett National Park - Dhikala",
      category: "🐅 Wildlife Safari",
      type: "ACTIVITY",
      lat: 29.5300,
      lon: 78.7747,
      desc: "India's oldest national park known for Bengal tigers, wild elephants & jungle jeep safaris.",
    },
    {
      name: "Auli Ski Resort & Ropeway",
      category: "⛷️ Snow & Adventure",
      type: "ACTIVITY",
      lat: 30.5298,
      lon: 79.5694,
      desc: "Stunning alpine meadow, ski destination with highest cable car view of Nanda Devi peak.",
    },
    {
      name: "Har Ki Pauri - Haridwar",
      category: "🛕 Holy Ghat",
      type: "ACTIVITY",
      lat: 29.9560,
      lon: 78.1710,
      desc: "Sacred riverbank of the Ganges, legendary Maha Aarti with thousands of floating diyas.",
    },
  ],
  default: [
    {
      name: "City Central Heritage Plaza",
      category: "🏛️ Heritage",
      type: "ACTIVITY",
      lat: 28.6139,
      lon: 77.2090,
      desc: "Iconic historical monuments, wide promenades, and cultural landmarks.",
    },
    {
      name: "Old Town Food Trail & Street Eats",
      category: "🍽️ Dining",
      type: "MEAL",
      lat: 28.6505,
      lon: 77.2303,
      desc: "Authentic culinary heritage, traditional sweet shops and fragrant street food alleys.",
    },
  ],
};

// Component to dynamically fly map
function FlyToLocation({ position, zoom = 14 }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, zoom, { duration: 1.5 });
    }
  }, [position, zoom, map]);
  return null;
}

export default function MapExplorer({
  onAddToItinerary,
  tripStartDate,
  tripEndDate,
  tripDestination = "",
  existingLocations = [],
  targetPlaceQuery = "",
}) {
  const [activeLayer, setActiveLayer] = useState("roadmap");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [flyToCoords, setFlyToCoords] = useState(null);
  const [flyZoom, setFlyZoom] = useState(13);
  const [addedPlaces, setAddedPlaces] = useState([]);
  const [nearbyPlaces, setNearbyPlaces] = useState([]);
  const [loadingNearby, setLoadingNearby] = useState(false);

  // Date selection state
  const [visitDate, setVisitDate] = useState(tripStartDate || "");
  const [selectedDayNumber, setSelectedDayNumber] = useState(1);
  const [startTime, setStartTime] = useState("09:30");
  const [endTime, setEndTime] = useState("12:00");
  const [itemType, setItemType] = useState("ACTIVITY");
  const [notes, setNotes] = useState("");

  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  const ITEM_TYPES = [
    { id: "ACTIVITY", label: "🏛️ Activity / Sightseeing" },
    { id: "MEAL", label: "🍽️ Dining / Food" },
    { id: "ACCOMMODATION", label: "🏨 Check-in / Stay" },
    { id: "TRANSPORT", label: "🚌 Travel / Transit" },
    { id: "FREE_TIME", label: "🌴 Free Time" },
    { id: "OTHER", label: "📌 Other" },
  ];

  // Calculate day-by-day dates
  const getTripDays = useCallback(() => {
    if (!tripStartDate || !tripEndDate) return [];
    const days = [];
    let cur = new Date(tripStartDate);
    const end = new Date(tripEndDate);
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
  }, [tripStartDate, tripEndDate]);

  const tripDays = getTripDays();

  // Pick day button handler
  const handleSelectDay = (day) => {
    setSelectedDayNumber(day.dayNum);
    setVisitDate(day.dateStr);
  };

  // Auto geocode destination on mount to center map nicely
  useEffect(() => {
    const dest = tripDestination?.trim();
    if (!dest) return;

    // Check if curated preset exists
    const key = Object.keys(CURATED_DESTINATIONS).find((k) =>
      dest.toLowerCase().includes(k)
    );
    if (key) {
      setNearbyPlaces(CURATED_DESTINATIONS[key]);
      const first = CURATED_DESTINATIONS[key][0];
      if (first) {
        setFlyToCoords([first.lat, first.lon]);
        setFlyZoom(9);
      }
    } else {
      // Geocode destination via Nominatim
      fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          dest
        )}&format=json&limit=1`,
        {
          headers: { "User-Agent": "GroupTripLedger/2.0" },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lon = parseFloat(data[0].lon);
            setFlyToCoords([lat, lon]);
            setFlyZoom(10);
            fetchNearbyAttractions(lat, lon, dest);
          }
        })
        .catch((err) => console.warn("Destination geocode failed:", err));
    }
  }, [tripDestination]);

  // If a targetPlaceQuery was sent from ChatBot or external
  useEffect(() => {
    if (targetPlaceQuery) {
      setSearchQuery(targetPlaceQuery);
      searchPlaces(targetPlaceQuery);
    }
  }, [targetPlaceQuery]);

  // Fetch nearby attractions around coordinates
  const fetchNearbyAttractions = async (lat, lon, queryName) => {
    setLoadingNearby(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=attractions+near+${encodeURIComponent(
          queryName
        )}&format=json&limit=6&addressdetails=1`,
        {
          headers: { "User-Agent": "GroupTripLedger/2.0" },
        }
      );
      const data = await res.json();
      if (data && data.length > 0) {
        const mapped = data.map((item) => ({
          name: item.display_name.split(",").slice(0, 2).join(", "),
          category: item.type === "tourism" ? "🏛️ Attraction" : "📍 Spot",
          type: "ACTIVITY",
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
          desc: item.display_name.split(",").slice(2, 4).join(", "),
        }));
        setNearbyPlaces(mapped);
      }
    } catch (err) {
      console.warn("Nearby search failed:", err);
    } finally {
      setLoadingNearby(false);
    }
  };

  // Search places via Nominatim
  const searchPlaces = useCallback(async (query) => {
    if (!query || query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
          query
        )}&format=json&limit=8&addressdetails=1`,
        {
          headers: {
            "Accept-Language": "en",
            "User-Agent": "GroupTripLedger/2.0",
          },
        }
      );
      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      console.error("Search failed:", err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      searchPlaces(val);
    }, 450);
  };

  const handleSelectPlace = (place) => {
    const lat = parseFloat(place.lat);
    const lon = parseFloat(place.lon);
    const position = [lat, lon];
    const placeObj = {
      ...place,
      position,
      title: place.display_name.split(",").slice(0, 2).join(", "),
    };
    setSelectedPlace(placeObj);
    setFlyToCoords(position);
    setFlyZoom(15);
    setSearchResults([]);
    setSearchQuery(placeObj.title);

    // Also fetch recommendations nearby
    fetchNearbyAttractions(lat, lon, placeObj.title);
  };

  // Select place from recommended cards
  const handleSelectRecommended = (rec) => {
    const placeObj = {
      display_name: `${rec.name}, ${rec.desc || ""}`,
      lat: rec.lat,
      lon: rec.lon,
      position: [rec.lat, rec.lon],
      title: rec.name,
      type: rec.type || "ACTIVITY",
    };
    setSelectedPlace(placeObj);
    setFlyToCoords([rec.lat, rec.lon]);
    setFlyZoom(15);
    setSearchQuery(rec.name);
    setItemType(rec.type || "ACTIVITY");
  };

  // Add to Itinerary
  const handleAddToItinerary = () => {
    if (!selectedPlace) return;

    // Use selected visit date or fallback to Day 1
    const chosenDate = visitDate || (tripDays[0] ? tripDays[0].dateStr : null);

    const item = {
      title: selectedPlace.title || selectedPlace.display_name.split(",")[0],
      item_type: itemType,
      date: chosenDate,
      start_time: startTime || null,
      end_time: endTime || null,
      location: selectedPlace.display_name,
      notes: notes || `Google Maps Coords: ${selectedPlace.lat}, ${selectedPlace.lon}`,
    };

    onAddToItinerary(item);
    setAddedPlaces((prev) => [
      ...prev,
      {
        ...selectedPlace,
        visitDate: chosenDate,
        dayNumber: selectedDayNumber,
      },
    ]);

    // Keep place visible on map but reset query
    setNotes("");
  };

  return (
    <div className="map-explorer-container google-maps-theme">
      {/* LEFT SEARCH & RECOMMENDATIONS PANEL */}
      <div className="map-search-panel">
        <div className="map-panel-header">
          <div className="google-brand-header">
            <span className="google-maps-icon">🗺️</span>
            <div>
              <h3 className="map-panel-title">Google Maps Explorer</h3>
              <p className="map-panel-subtitle">
                {tripDestination
                  ? `Exploring around ${tripDestination}`
                  : "Search places & add them day-by-day"}
              </p>
            </div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="map-search-wrapper">
          <div className="map-search-input-group google-search-box">
            <span className="map-search-icon">🔍</span>
            <input
              ref={searchInputRef}
              type="text"
              className="map-search-input"
              placeholder="Search places, sights, cafes, hotels..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
            {searching && <span className="map-search-spinner">⏳</span>}
            {searchQuery && (
              <button
                className="map-search-clear"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                }}
              >
                ×
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="google-quick-chips">
            <button
              className="chip-btn"
              onClick={() => {
                setSearchQuery(`top attractions in ${tripDestination || ""}`);
                searchPlaces(`top attractions in ${tripDestination || ""}`);
              }}
            >
              🏛️ Attractions
            </button>
            <button
              className="chip-btn"
              onClick={() => {
                setSearchQuery(`best restaurants in ${tripDestination || ""}`);
                searchPlaces(`best restaurants in ${tripDestination || ""}`);
              }}
            >
              🍽️ Food
            </button>
            <button
              className="chip-btn"
              onClick={() => {
                setSearchQuery(`hotels in ${tripDestination || ""}`);
                searchPlaces(`hotels in ${tripDestination || ""}`);
              }}
            >
              🏨 Stays
            </button>
            <button
              className="chip-btn"
              onClick={() => {
                setSearchQuery(`viewpoints in ${tripDestination || ""}`);
                searchPlaces(`viewpoints in ${tripDestination || ""}`);
              }}
            >
              🌄 Views
            </button>
          </div>

          {/* Autocomplete Results */}
          {searchResults.length > 0 && (
            <div className="map-search-results google-autocomplete-dropdown">
              {searchResults.map((place, i) => (
                <button
                  key={i}
                  className="map-search-result-item"
                  onClick={() => handleSelectPlace(place)}
                >
                  <span className="result-icon">
                    {place.type === "restaurant" || place.type === "cafe"
                      ? "🍽️"
                      : place.type === "hotel"
                      ? "🏨"
                      : place.class === "tourism"
                      ? "🏛️"
                      : place.class === "natural"
                      ? "🌿"
                      : "📍"}
                  </span>
                  <div className="result-text">
                    <span className="result-name">
                      {place.display_name.split(",").slice(0, 2).join(", ")}
                    </span>
                    <span className="result-address">
                      {place.display_name.split(",").slice(2, 5).join(", ")}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Place Details & Add Form */}
        {selectedPlace && (
          <div className="map-place-form google-place-card">
            <div className="selected-place-header-bar">
              <span className="google-pin-tag">📍 Selected Location</span>
              <button
                className="close-selection-btn"
                onClick={() => setSelectedPlace(null)}
              >
                ✕
              </button>
            </div>

            <h4 className="selected-place-name">{selectedPlace.title}</h4>
            <p className="selected-place-addr">
              {selectedPlace.display_name.split(",").slice(1, 4).join(", ")}
            </p>

            {/* DAY SELECTOR SECTION */}
            <div className="day-picker-section">
              <label className="map-form-label">
                🗓️ WHICH DAY ARE YOU VISITING?
              </label>

              {tripDays.length > 0 ? (
                <div className="day-pill-grid">
                  {tripDays.map((day) => (
                    <button
                      key={day.dayNum}
                      type="button"
                      className={`day-pill-btn ${
                        visitDate === day.dateStr ? "day-pill-active" : ""
                      }`}
                      onClick={() => handleSelectDay(day)}
                    >
                      <span className="pill-day-num">Day {day.dayNum}</span>
                      <span className="pill-day-date">{day.formatted}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  type="date"
                  className="map-form-input"
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                />
              )}
            </div>

            {/* Form Fields: Event Type, Times */}
            <div className="map-form-grid">
              <div className="map-form-group">
                <label className="map-form-label">Category</label>
                <select
                  className="map-form-select"
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

              <div className="map-form-group">
                <label className="map-form-label">Time Slot</label>
                <div className="time-range-group">
                  <input
                    type="time"
                    className="map-form-input time-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                  <span className="time-sep">-</span>
                  <input
                    type="time"
                    className="map-form-input time-input"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="map-form-group" style={{ marginTop: "10px" }}>
              <label className="map-form-label">Notes (optional)</label>
              <input
                type="text"
                className="map-form-input"
                placeholder="e.g. Carry camera, book safari, morning timing"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <button
              className="map-add-btn google-btn-add"
              onClick={handleAddToItinerary}
            >
              <span>➕</span> Add to Itinerary ({visitDate ? new Date(visitDate).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Day"})
            </button>
          </div>
        )}

        {/* RECOMMENDED & NEARBY PLACES SECTION */}
        <div className="map-recommendations-section">
          <div className="rec-section-header">
            <h4 className="rec-title">
              <span>🌟</span> Recommended Places to Visit
            </h4>
            {loadingNearby && <span className="rec-loading">Updating...</span>}
          </div>

          <div className="rec-cards-scroll">
            {nearbyPlaces.map((rec, idx) => (
              <div key={idx} className="rec-place-card">
                <div className="rec-card-top">
                  <span className="rec-badge">{rec.category}</span>
                  <button
                    className="rec-fly-btn"
                    onClick={() => handleSelectRecommended(rec)}
                    title="View on Map"
                  >
                    📍 Show
                  </button>
                </div>
                <h5 className="rec-place-title">{rec.name}</h5>
                <p className="rec-place-desc">{rec.desc}</p>
                <div className="rec-card-bottom">
                  <button
                    className="rec-add-btn"
                    onClick={() => handleSelectRecommended(rec)}
                  >
                    ➕ Select & Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ADDED PLACES THIS SESSION */}
        {addedPlaces.length > 0 && (
          <div className="map-added-places">
            <h4 className="map-added-title">✅ Added to Itinerary ({addedPlaces.length})</h4>
            {addedPlaces.map((p, i) => (
              <div key={i} className="map-added-item">
                <span className="map-added-dot">🟢</span>
                <span className="map-added-name">{p.title || p.display_name.split(",")[0]}</span>
                {p.visitDate && (
                  <span className="map-added-date">
                    {new Date(p.visitDate).toLocaleDateString("en-IN", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* RIGHT GOOGLE MAPS CONTAINER */}
      <div className="map-view-container">
        {/* Google Maps Layer Switcher Widget (Roadmap, Satellite, Terrain) */}
        <div className="google-layer-switcher">
          {Object.entries(MAP_LAYERS).map(([key, layer]) => (
            <button
              key={key}
              className={`layer-switch-btn ${
                activeLayer === key ? "layer-switch-active" : ""
              }`}
              onClick={() => setActiveLayer(key)}
              title={layer.name}
            >
              <span>{layer.icon}</span> {layer.name.replace("Google ", "")}
            </button>
          ))}
        </div>

        <MapContainer
          center={[30.0869, 78.2676]} // Centered on Uttarakhand/India
          zoom={8}
          className="leaflet-map google-style-canvas"
          zoomControl={true}
        >
          {/* Authentic Google Maps Tile Layer */}
          <TileLayer
            attribution={MAP_LAYERS[activeLayer].attribution}
            url={MAP_LAYERS[activeLayer].url}
            maxZoom={MAP_LAYERS[activeLayer].maxZoom}
          />

          {flyToCoords && <FlyToLocation position={flyToCoords} zoom={flyZoom} />}

          {/* Selected Place Marker (Gold Google Pin) */}
          {selectedPlace && (
            <Marker position={selectedPlace.position} icon={goldGoogleIcon}>
              <Popup>
                <div className="google-popup-card">
                  <div className="google-popup-tag">Selected Location</div>
                  <strong className="google-popup-title">
                    {selectedPlace.title}
                  </strong>
                  <p className="google-popup-addr">
                    {selectedPlace.display_name.split(",").slice(1, 3).join(", ")}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Recommended Places Markers (Red Google Pins) */}
          {nearbyPlaces.map((rec, i) => (
            <Marker
              key={`rec-${i}`}
              position={[rec.lat, rec.lon]}
              icon={redGoogleIcon}
            >
              <Popup>
                <div className="google-popup-card">
                  <div className="google-popup-tag">{rec.category}</div>
                  <strong className="google-popup-title">{rec.name}</strong>
                  <p className="google-popup-addr">{rec.desc}</p>
                  <button
                    className="google-popup-btn"
                    onClick={() => handleSelectRecommended(rec)}
                  >
                    ➕ Select Place
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Added Places Markers (Green Google Pins) */}
          {addedPlaces.map((p, i) => (
            <Marker
              key={`added-${i}`}
              position={[parseFloat(p.lat), parseFloat(p.lon)]}
              icon={greenGoogleIcon}
            >
              <Popup>
                <div className="google-popup-card">
                  <span className="google-popup-status">✅ Scheduled in Itinerary</span>
                  <strong className="google-popup-title">
                    {p.title || p.display_name.split(",")[0]}
                  </strong>
                  {p.visitDate && (
                    <p className="google-popup-date">
                      📅{" "}
                      {new Date(p.visitDate).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Existing Itinerary Locations (Blue Google Pins) */}
          {existingLocations.map((loc, i) => (
            <Marker
              key={`existing-${i}`}
              position={[loc.lat, loc.lon]}
              icon={blueGoogleIcon}
            >
              <Popup>
                <div className="google-popup-card">
                  <strong className="google-popup-title">{loc.title}</strong>
                  {loc.date && (
                    <p className="google-popup-date">
                      📅{" "}
                      {new Date(loc.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        {/* Map Legend */}
        <div className="map-legend google-legend">
          <div className="map-legend-item">
            <span className="google-legend-dot" style={{ background: "#ea4335" }}></span>
            <span>Recommended Spots</span>
          </div>
          <div className="map-legend-item">
            <span className="google-legend-dot" style={{ background: "#fbbc04" }}></span>
            <span>Selected Place</span>
          </div>
          <div className="map-legend-item">
            <span className="google-legend-dot" style={{ background: "#1e8e3e" }}></span>
            <span>Added to Trip</span>
          </div>
        </div>
      </div>
    </div>
  );
}
