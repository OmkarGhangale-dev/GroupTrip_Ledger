import React, { useState, useEffect } from "react";
import { useTrip } from "../../context/TripContext";

export default function ParticipantModal({ isOpen, onClose, initialData = null }) {
  const { addParticipant, editParticipant } = useTrip();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  const [status, setStatus] = useState("active");
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setEmail(initialData.email || "");
      setRole(initialData.role || "member");
      setStatus(initialData.status || "active");
    } else {
      setName("");
      setEmail("");
      setRole("member");
      setStatus("active");
    }
    setErrorMsg("");
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!name.trim()) {
      setErrorMsg("Participant name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMsg("A valid email address is required.");
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role,
      status: status,
    };

    try {
      setSubmitting(true);
      if (initialData?.id) {
        await editParticipant(initialData.id, payload);
      } else {
        await addParticipant(payload);
      }
      onClose();
    } catch (err) {
      setErrorMsg(err?.response?.data?.detail || "Failed to save participant.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{initialData ? "Edit Member" : "Add Trip Member"}</h3>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {errorMsg && <div className="modal-error">{errorMsg}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>
              Full Name <span className="req">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Alex Johnson"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>
              Email Address <span className="req">*</span>
            </label>
            <input
              type="email"
              placeholder="e.g., alex@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>

            <div className="form-group">
              <label>Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="active">Active</option>
                <option value="removed">Removed</option>
              </select>
            </div>
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
              {submitting ? "Saving..." : initialData ? "Update Member" : "Add Member"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
