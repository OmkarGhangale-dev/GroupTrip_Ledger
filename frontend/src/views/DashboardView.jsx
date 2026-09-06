import React from "react";
import { useTrip } from "../context/TripContext";

export default function DashboardView({
  onOpenExpenseModal,
  onOpenParticipantModal,
  onOpenBookingModal,
  onOpenPaymentModal,
  onOpenItineraryModal,
  onOpenTripModal,
  setActiveTab,
}) {
  const {
    trip,
    participants,
    expenses,
    bookings,
    balances,
    settlements,
    itinerary,
    totalExpenses,
    totalBookingsAmount,
  } = useTrip();

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  if (!trip) {
    return (
      <div className="empty-view-container">
        <div className="empty-hero">
          <span className="empty-icon-lg">✈️</span>
          <h2>No Trips Created Yet</h2>
          <p>
            Get started by creating your first group trip to manage expenses,
            split bills, track bookings, and organize itineraries.
          </p>
          <button
            className="btn btn-primary btn-lg"
            onClick={() => onOpenTripModal()}
          >
            + Create Your First Trip
          </button>
        </div>
      </div>
    );
  }

  const budget = Number(trip.budget || 0);
  const budgetSpentPct =
    budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const remainingBudget = Math.max(0, budget - totalExpenses);

  return (
    <div className="view-content">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <div className="trip-badge-row">
            <span className="page-label">TRIP OVERVIEW</span>
            <span className={`status-pill status-${trip.status || "planning"}`}>
              {trip.status || "planning"}
            </span>
          </div>
          <h1>{trip.name}</h1>
          <p className="page-description">
            📍 {trip.destination}{" "}
            {trip.start_date && (
              <>
                {" • "}
                📅 {new Date(trip.start_date).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                })}
                {trip.end_date &&
                  ` - ${new Date(trip.end_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}`}
              </>
            )}
          </p>
        </div>

        <div className="header-actions">
          <button
            className="btn btn-primary"
            onClick={() => onOpenExpenseModal()}
            disabled={participants.length === 0}
            title={
              participants.length === 0
                ? "Add at least one member first"
                : "Add Expense"
            }
          >
            + Add Expense
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onOpenParticipantModal()}
          >
            + Add Member
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => onOpenPaymentModal()}
            disabled={participants.length < 2}
          >
            💳 Settle Up
          </button>
        </div>
      </div>

      {/* STATS GRID */}
      <div className="stats-grid">
        {/* TOTAL EXPENSES */}
        <div className="stat-card">
          <div className="stat-card-top">
            <span>Total Expenses</span>
            <span className="stat-icon icon-purple">₹</span>
          </div>
          <h2>{money(totalExpenses)}</h2>
          <div className="stat-progress-wrap">
            <div className="stat-progress-bar">
              <div
                className="stat-progress-fill"
                style={{
                  width: `${budgetSpentPct}%`,
                  background:
                    budgetSpentPct > 90
                      ? "#ef4444"
                      : budgetSpentPct > 70
                      ? "#f59e0b"
                      : "#635bff",
                }}
              ></div>
            </div>
            <span className="stat-progress-text">
              {budget > 0
                ? `${budgetSpentPct}% of ${money(budget)} budget`
                : "No budget set"}
            </span>
          </div>
        </div>

        {/* TRIP MEMBERS */}
        <div className="stat-card" onClick={() => setActiveTab("participants")}>
          <div className="stat-card-top">
            <span>Trip Members</span>
            <span className="stat-icon icon-blue">👥</span>
          </div>
          <h2>{participants.length}</h2>
          <p className="stat-footer-text">
            {participants.filter((p) => p.status === "active").length} active
            travelers
          </p>
        </div>

        {/* BOOKINGS */}
        <div className="stat-card" onClick={() => setActiveTab("bookings")}>
          <div className="stat-card-top">
            <span>Bookings</span>
            <span className="stat-icon icon-green">📅</span>
          </div>
          <h2>{bookings.length}</h2>
          <p className="stat-footer-text">
            Total {money(totalBookingsAmount)} reserved
          </p>
        </div>

        {/* SETTLEMENTS DUE */}
        <div className="stat-card" onClick={() => setActiveTab("settlements")}>
          <div className="stat-card-top">
            <span>Smart Settlements</span>
            <span className="stat-icon icon-orange">💰</span>
          </div>
          <h2>{settlements.length}</h2>
          <p className="stat-footer-text">
            {settlements.length === 0
              ? "All debts are settled!"
              : `${settlements.length} pending transfer(s)`}
          </p>
        </div>
      </div>

      {/* TWO COLUMN CONTENT */}
      <div className="dashboard-grid">
        {/* RECENT EXPENSES */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Recent Expenses</h3>
              <p>Latest group spending for this trip</p>
            </div>
            <button
              className="view-link-btn"
              onClick={() => setActiveTab("expenses")}
            >
              View All →
            </button>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-card-state">
              <span className="empty-icon-sm">🧾</span>
              <h4>No expenses recorded yet</h4>
              <p>Add food, travel, or lodging expenses to start splitting.</p>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onOpenExpenseModal()}
                disabled={participants.length === 0}
              >
                + Add First Expense
              </button>
            </div>
          ) : (
            <div className="dashboard-list">
              {expenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="list-item-row">
                  <div className="list-item-left">
                    <span className="category-badge-dot">🧾</span>
                    <div>
                      <strong>{exp.title}</strong>
                      <div className="item-sub-info">
                        <span>{exp.category || "General"}</span>
                        <span>•</span>
                        <span>
                          Paid by{" "}
                          {exp.paid_by_participant?.name ||
                            participants.find((p) => p.id === exp.paid_by_id)
                              ?.name ||
                            "Member"}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <strong className="amount-highlight">
                      {money(exp.amount)}
                    </strong>
                    <span className="split-badge-tag">
                      {exp.split_method}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* BALANCES SNAPSHOT */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Net Balances</h3>
              <p>Current standing for each participant</p>
            </div>
            <button
              className="view-link-btn"
              onClick={() => setActiveTab("payments")}
            >
              Details →
            </button>
          </div>

          {balances.length === 0 ? (
            <div className="empty-card-state">
              <span className="empty-icon-sm">⚖️</span>
              <h4>No balances calculated</h4>
              <p>Balances will update automatically as expenses are added.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {balances.map((b) => {
                const isPositive = b.net_balance > 0.01;
                const isNegative = b.net_balance < -0.01;
                return (
                  <div key={b.participant_id} className="list-item-row">
                    <div className="list-item-left">
                      <div className="member-avatar-sm">
                        {b.participant_name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong>{b.participant_name}</strong>
                        <div className="item-sub-info">
                          <span>
                            {isPositive
                              ? "Gets back"
                              : isNegative
                              ? "Owes group"
                              : "Settled up"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="list-item-right">
                      <span
                        className={`balance-tag ${
                          isPositive
                            ? "positive"
                            : isNegative
                            ? "negative"
                            : "settled"
                        }`}
                      >
                        {isPositive ? `+${money(b.net_balance)}` : money(b.net_balance)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM ROW: ITINERARY & SETTLEMENTS */}
      <div className="dashboard-grid" style={{ marginTop: "24px" }}>
        {/* SMART SETTLEMENTS PREVIEW */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Suggested Settlements</h3>
              <p>Optimized peer-to-peer transfers</p>
            </div>
            <button
              className="view-link-btn"
              onClick={() => setActiveTab("settlements")}
            >
              Settle All →
            </button>
          </div>

          {settlements.length === 0 ? (
            <div className="empty-card-state">
              <span className="empty-icon-sm">🎉</span>
              <h4>Everyone is settled up!</h4>
              <p>No outstanding balances between group members.</p>
            </div>
          ) : (
            <div className="dashboard-list">
              {settlements.slice(0, 4).map((s, idx) => (
                <div key={idx} className="settlement-preview-row">
                  <div className="settlement-from">
                    <strong>{s.from_name}</strong>
                    <small>pays</small>
                  </div>
                  <div className="settlement-amount-box">
                    <span>{money(s.amount)}</span>
                    <span className="arrow-icon">➔</span>
                  </div>
                  <div className="settlement-to">
                    <strong>{s.to_name}</strong>
                    <small>receives</small>
                  </div>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() =>
                      onOpenPaymentModal({
                        from_participant_id: s.from_participant_id,
                        to_participant_id: s.to_participant_id,
                        amount: s.amount,
                      })
                    }
                  >
                    Pay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* UPCOMING ITINERARY */}
        <div className="dashboard-card">
          <div className="card-header">
            <div>
              <h3>Trip Schedule & Itinerary</h3>
              <p>Planned events and activities</p>
            </div>
            <button
              className="view-link-btn"
              onClick={() => setActiveTab("itinerary")}
            >
              Full Schedule →
            </button>
          </div>

          {itinerary.length === 0 ? (
            <div className="empty-card-state">
              <span className="empty-icon-sm">📍</span>
              <h4>No events in itinerary</h4>
              <p>Plan out flight arrivals, dinners, activities, and tours.</p>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => onOpenItineraryModal()}
              >
                + Add Schedule Item
              </button>
            </div>
          ) : (
            <div className="dashboard-list">
              {itinerary.slice(0, 4).map((item) => (
                <div key={item.id} className="list-item-row">
                  <div className="list-item-left">
                    <span className="category-badge-dot">📍</span>
                    <div>
                      <strong>{item.title}</strong>
                      <div className="item-sub-info">
                        {item.date && (
                          <span>
                            {new Date(item.date).toLocaleDateString("en-IN", {
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {item.start_time && (
                          <>
                            <span>•</span>
                            <span>{item.start_time.substring(0, 5)}</span>
                          </>
                        )}
                        {item.location && (
                          <>
                            <span>•</span>
                            <span>{item.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="list-item-right">
                    <span className="itinerary-type-badge">{item.item_type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
