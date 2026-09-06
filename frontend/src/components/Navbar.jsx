import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";
import api from "../services/api";

export default function Navbar({ onOpenNewTripModal }) {
  const { trips, trip, setTrip, reload, loading } = useTrip();
  const [dbStatus, setDbStatus] = useState("checking");

  const checkHealth = async () => {
    try {
      setDbStatus("checking");
      // health check is at root /health/db (baseURL is /api/v1, so we can do relative ../../health/db or axios to http://127.0.0.1:8000/health/db)
      const res = await api.get("/../../health/db");
      if (res.data?.status === "ok") {
        setDbStatus("connected");
      } else {
        setDbStatus("error");
      }
    } catch {
      setDbStatus("offline");
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <div className="navbar-trip-selector">
          <span className="selector-label">ACTIVE TRIP:</span>
          {trips.length > 0 ? (
            <select
              className="trip-dropdown"
              value={trip?.id || ""}
              onChange={(e) => {
                const selected = trips.find((t) => t.id === e.target.value);
                if (selected) setTrip(selected);
              }}
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.destination})
                </option>
              ))}
            </select>
          ) : (
            <span className="no-trips-label">No Trips Available</span>
          )}
        </div>

        <button
          className="btn-new-trip-small"
          onClick={onOpenNewTripModal}
          title="Create New Trip"
        >
          + New Trip
        </button>
      </div>

      <div className="navbar-actions">
        <div
          className={`db-badge status-${dbStatus}`}
          title={`Backend & Database: ${dbStatus.toUpperCase()}`}
          onClick={checkHealth}
        >
          <span className="status-dot"></span>
          <span>
            {dbStatus === "connected"
              ? "DB Connected"
              : dbStatus === "checking"
              ? "Connecting..."
              : "DB Offline"}
          </span>
        </div>

        <button
          className="btn-icon-reload"
          onClick={() => reload()}
          title="Refresh Trip Data"
          disabled={loading}
        >
          🔄
        </button>

        <div className="user-profile">
          <div className="profile-avatar">🎒</div>
          <div className="profile-info">
            <strong>Group Trip</strong>
            <small>{trip?.currency || "INR"} Ledger</small>
          </div>
        </div>
      </div>
    </header>
  );
}