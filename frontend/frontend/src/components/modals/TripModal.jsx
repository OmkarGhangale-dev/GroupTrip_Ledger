import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

export default function TripModal({ isOpen, onClose, initialData = null }) {
  const { addTrip, editTrip } = useTrip();

  const [name, setName] = useState("");
  const [destination, setDestination] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("planning");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDestination(initialData.destination || "");
      setDescription(initialData.description || "");
      setStartDate(initialData.start_date ? initialData.start_date.split("T")[0] : "");
      setEndDate(initialData.end_date ? initialData.end_date.split("T")[0] : "");
      setCurrency(initialData.currency || "INR");
      setBudget(initialData.budget ? String(initialData.budget) : "");
      setStatus(initialData.status || "planning");
    } else {
      setName("");
      setDestination("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setCurrency("INR");
      setBudget("");
      setStatus("planning");
    }
    setErrorMsg("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Trip name is required.");
      return;
    }
    if (!destination.trim()) {
      setErrorMsg("Destination is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      destination: destination.trim(),
      description: description.trim() || null,
      start_date: startDate || null,
      end_date: endDate || null,
      currency: currency.trim() || "INR",
      budget: budget ? parseFloat(budget) : null,
      status: status,
    };

    try {
      setSubmitting(true);
      if (initialData?.id) {
        await editTrip(initialData.id, payload);
      } else {
        await addTrip(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save trip.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? "Edit Trip" : "Create New Trip"}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Trip Name <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Goa Beach Adventure"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Destination <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Goa, India"
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
              <label>Planned Budget</label>
              <input
                type="number"
                min="0"
                step="any"
                placeholder="50000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <input
                type="text"
                maxLength={10}
                placeholder="INR"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
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
              placeholder="Notes or details about this trip..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {submitting ? "Saving..." : initialData ? "Update Trip" : "Create Trip"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
