import React, { useState } from "react";
import { useTrip } from "../context/TripContext";

export default function ExpensesView({ onOpenExpenseModal }) {
  const { expenses, participants, removeExpense, totalExpenses } = useTrip();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [expandedExpenseId, setExpandedExpenseId] = useState(null);

  const categories = [
    "All",
    "Food & Dining",
    "Transportation",
    "Accommodation",
    "Activities & Tours",
    "Groceries & Supplies",
    "Other",
  ];

  const filteredExpenses = expenses.filter((exp) => {
    const q = searchTerm.toLowerCase();
    const matchesSearch =
      exp.title?.toLowerCase().includes(q) ||
      exp.description?.toLowerCase().includes(q) ||
      exp.category?.toLowerCase().includes(q);

    const matchesCategory =
      selectedCategory === "All" || exp.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleDelete = async (exp) => {
    if (
      window.confirm(`Are you sure you want to delete expense "${exp.title}"?`)
    ) {
      await removeExpense(exp.id);
    }
  };

  const getParticipantName = (id) => {
    const p = participants.find((item) => item.id === id);
    return p ? p.name : "Member";
  };

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="view-content">
      <div className="page-header">
        <div>
          <span className="page-label">GROUP EXPENSES</span>
          <h1>Expenses & Splits</h1>
          <p className="page-description">
            Track group costs, see who paid, and review split allocations.
          </p>
        </div>

        <div className="header-actions">
          <div className="summary-pill">
            <small>Total Spent:</small>
            <strong>{money(totalExpenses)}</strong>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onOpenExpenseModal()}
            disabled={participants.length === 0}
          >
            + Add Expense
          </button>
        </div>
      </div>

      {/* FILTER & SEARCH */}
      <div className="filter-search-bar">
        <div className="search-input-wrap">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search expenses by title or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="category-chips-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip-btn ${selectedCategory === cat ? "active" : ""}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {expenses.length === 0 ? (
        <div className="empty-state-large">
          <span className="empty-icon-lg">🧾</span>
          <h3>No Expenses Logged</h3>
          <p>
            Start adding shared expenses to calculate balances and splits
            automatically.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onOpenExpenseModal()}
            disabled={participants.length === 0}
          >
            + Add First Expense
          </button>
        </div>
      ) : (
        <div className="cards-list">
          {filteredExpenses.map((exp) => {
            const isExpanded = expandedExpenseId === exp.id;
            const payerName =
              exp.paid_by_participant?.name || getParticipantName(exp.paid_by_id);

            return (
              <div key={exp.id} className="expense-card-item">
                <div
                  className="expense-card-main"
                  onClick={() =>
                    setExpandedExpenseId(isExpanded ? null : exp.id)
                  }
                >
                  <div className="expense-card-left">
                    <span className="expense-icon-box">🧾</span>
                    <div>
                      <div className="expense-card-title-row">
                        <h3>{exp.title}</h3>
                        <span className="category-pill-tag">
                          {exp.category || "General"}
                        </span>
                        <span className="split-method-tag">
                          Split: {exp.split_method}
                        </span>
                      </div>

                      <div className="expense-meta-info">
                        <span>
                          Paid by <strong>{payerName}</strong>
                        </span>
                        <span>•</span>
                        <span>
                          {exp.created_at
                            ? new Date(exp.created_at).toLocaleDateString(
                                "en-IN",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "Recently"}
                        </span>
                        {exp.description && (
                          <>
                            <span>•</span>
                            <span className="desc-preview">
                              {exp.description}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="expense-card-right">
                    <div className="expense-amount-box">
                      <strong>{money(exp.amount)}</strong>
                      <small>{exp.currency || "INR"}</small>
                    </div>

                    <div
                      className="expense-actions-wrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        className="btn-icon-action"
                        onClick={() => onOpenExpenseModal(exp)}
                        title="Edit Expense"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-icon-action btn-danger"
                        onClick={() => handleDelete(exp)}
                        title="Delete Expense"
                      >
                        🗑️
                      </button>
                      <button
                        className="btn-icon-action"
                        onClick={() =>
                          setExpandedExpenseId(isExpanded ? null : exp.id)
                        }
                        title="View Splits"
                      >
                        {isExpanded ? "▲" : "▼"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* EXPANDED SPLIT BREAKDOWN */}
                {isExpanded && (
                  <div className="splits-breakdown-box">
                    <h4>Split Breakdown</h4>
                    {exp.splits && exp.splits.length > 0 ? (
                      <div className="splits-chips-grid">
                        {exp.splits.map((s) => (
                          <div key={s.id} className="split-chip">
                            <div className="split-chip-user">
                              <span className="chip-avatar">
                                {getParticipantName(s.participant_id)
                                  .charAt(0)
                                  .toUpperCase()}
                              </span>
                              <span>
                                {getParticipantName(s.participant_id)}
                              </span>
                            </div>
                            <strong className="split-chip-amount">
                              {money(s.amount)}
                            </strong>
                            {s.percentage && (
                              <small>({s.percentage}%)</small>
                            )}
                            {s.shares && <small>({s.shares} shares)</small>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="subtext-muted">
                        Split equally amongst all trip participants.
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
