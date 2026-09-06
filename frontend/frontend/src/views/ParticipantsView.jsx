import React, { useState } from "react";
import { useTrip } from "../context/TripContext";

export default function ParticipantsView({ onOpenParticipantModal }) {
  const { participants, balances, removeParticipant } = useTrip();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredParticipants = participants.filter((p) => {
    const q = searchTerm.toLowerCase();
    return (
      p.name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q) ||
      p.role?.toLowerCase().includes(q)
    );
  });

  const handleDelete = async (p) => {
    if (
      window.confirm(
        `Are you sure you want to remove ${p.name} from this trip?`
      )
    ) {
      await removeParticipant(p.id);
    }
  };

  const getBalance = (pId) => {
    const b = balances.find((bal) => bal.participant_id === pId);
    return b ? b.net_balance : 0;
  };

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="view-content">
      <div className="page-header page-header-participants">
        <div>
          <span className="page-label">TRIP MEMBERS</span>
          <h1>Participants ({participants.length})</h1>
          <p className="page-description">
            Manage everyone travelling in this trip, their roles, and personal
            balances.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => onOpenParticipantModal()}
        >
          + Add Trip Member
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="filter-search-bar">
        <div className="search-input-wrap">
          <input
            type="text"
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="empty-state-large">
          <h3>No Participants Yet</h3>
          <p>
            Add people joining this trip so they can be assigned to expenses,
            bookings, and settle balances.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onOpenParticipantModal()}
          >
            + Add First Member
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Net Balance</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredParticipants.map((p) => {
                const bal = getBalance(p.id);
                const isPositive = bal > 0.01;
                const isNegative = bal < -0.01;

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="member-cell">
                        <div className="member-avatar">
                          {p.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{p.name}</strong>
                          <span className="member-subtext">
                            Joined{" "}
                            {p.created_at
                              ? new Date(p.created_at).toLocaleDateString(
                                  "en-IN"
                                )
                              : "Recently"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>{p.email}</td>
                    <td>
                      <span className={`role-badge role-${p.role}`}>
                        {p.role}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`balance-tag ${
                          isPositive
                            ? "positive"
                            : isNegative
                            ? "negative"
                            : "settled"
                        }`}
                      >
                        {isPositive ? `+${money(bal)}` : money(bal)}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div className="table-row-actions">
                        <button
                          className="btn-icon-action"
                          onClick={() => onOpenParticipantModal(p)}
                          title="Edit Member"
                        >
                          Edit
                        </button>
                        <button
                          className="btn-icon-action btn-danger"
                          onClick={() => handleDelete(p)}
                          title="Remove Member"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
