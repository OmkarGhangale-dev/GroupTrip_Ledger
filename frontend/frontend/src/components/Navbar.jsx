import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";
import api from "../services/api";

export default function Navbar({ onOpenNewTripModal, onOpenLogin }) {
  const { trips, trip, setTrip, reload, loading } = useTrip();
  const [dbStatus, setDbStatus] = useState("checking");

  const checkHealth = async () => {
    try {
      setDbStatus("checking");
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
        <div className="navbar-brand-badge">
          <div className="brand-logo-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="brand-badge-text">
            <strong>Pomaii</strong>
            <small>Explore. Dream. Discover.</small>
          </div>
        </div>

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
      </div>

      <div className="navbar-actions">
        {localStorage.getItem("token") ? (
          <div
            className="user-profile"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              onOpenLogin();
            }}
            title="Click to Sign Out"
            style={{ cursor: "pointer" }}
          >
            <div className="profile-avatar">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="profile-info">
              <strong>
                {JSON.parse(localStorage.getItem("user") || "{}").name ||
                  "User Account"}
              </strong>
              <small>Sign Out</small>
            </div>
          </div>
        ) : (
          <div
            className="user-profile"
            onClick={onOpenLogin}
            title="Click to view Login Page"
            style={{ cursor: "pointer" }}
          >
            <div className="profile-avatar">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="profile-info">
              <strong>Group Trip</strong>
              <small>Sign In / Login</small>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
