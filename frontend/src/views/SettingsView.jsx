import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";

export default function SettingsView({ onOpenTripModal }) {
  const { trip, editTrip, removeTrip, trips } = useTrip();

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [budget, setBudget] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [status, setStatus] = useState("planning");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (trip) {
      setName(trip.name || "");
      setDestination(trip.destination || "");
      setDescription(trip.description || "");
      setStartDate(trip.start_date ? trip.start_date.split("T")[0] : "");
      setEndDate(trip.end_date ? trip.end_date.split("T")[0] : "");
      setBudget(trip.budget ? String(trip.budget) : "");
      setCurrency(trip.currency || "INR");
      setStatus(trip.status || "planning");
    }
  }, [trip]);

  if (!trip) {
    return (
      <div className="view-content">
        <p>Please select or create a trip first.</p>
      </div>
    );
  }

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      await editTrip(trip.id, {
        name: name.trim(),
        destination: destination.trim(),
        description: description.trim() || null,
        start_date: startDate || null,
        end_date: endDate || null,
        budget: budget ? parseFloat(budget) : null,
        currency: currency.trim() || "INR",
        status: status,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTrip = async () => {
    if (
      window.confirm(
        `Are you sure you want to PERMANENTLY DELETE "${trip.name}" and all its expenses, participants, and bookings?`
      )
    ) {
      await removeTrip(trip.id);
    }
  };

  return (
    <div className="view-content">
      <div className="page-header">
        <div>
          <span className="page-label">CONFIGURATION</span>
          <h1>Trip Settings</h1>
          <p className="page-description">
            Update trip information, budget targets, dates, or manage this trip.
          </p>
        </div>
      </div>

      <div className="settings-grid">
        <div className="settings-card">
          <h3>Trip Details</h3>
          <p className="subtext-muted" style={{ marginBottom: "20px" }}>
            General parameters and budget tracking.
          </p>

          <form onSubmit={handleSave} className="modal-form">
            <div className="form-group">
              <label>Trip Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Planned Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Trip Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div style={{ marginTop: "20px" }}>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* METADATA & DANGER ZONE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="settings-card">
            <h3>Database Info</h3>
            <div className="meta-info-list">
              <div className="meta-item">
                <small>Trip ID (UUID):</small>
                <code>{trip.id}</code>
              </div>
              <div className="meta-item">
                <small>Created At:</small>
                <span>
                  {trip.created_at
                    ? new Date(trip.created_at).toLocaleString("en-IN")
                    : "N/A"}
                </span>
              </div>
              <div className="meta-item">
                <small>Last Updated:</small>
                <span>
                  {trip.updated_at
                    ? new Date(trip.updated_at).toLocaleString("en-IN")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="settings-card danger-card">
            <h3 style={{ color: "#b91c1c" }}>Danger Zone</h3>
            <p className="subtext-muted">
              Deleting a trip will permanently remove all associated participants,
              expenses, splits, bookings, and itinerary records.
            </p>

            <button
              type="button"
              className="btn btn-danger"
              style={{ marginTop: "15px" }}
              onClick={handleDeleteTrip}
            >
              🗑️ Delete This Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
