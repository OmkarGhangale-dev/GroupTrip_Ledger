import React from "react";
import { useTrip } from "../context/TripContext";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { participants, expenses, bookings, settlements, itinerary } = useTrip();

  const navItems = [
    {
      group: "MAIN",
      items: [
        { id: "dashboard", label: "Dashboard", icon: "📊" },
        {
          id: "participants",
          label: "Participants",
          icon: "👥",
          count: participants.length,
        },
        {
          id: "expenses",
          label: "Expenses",
          icon: "🧾",
          count: expenses.length,
        },
        {
          id: "bookings",
          label: "Bookings",
          icon: "📅",
          count: bookings.length,
        },
      ],
    },
    {
      group: "FINANCE & SETTLEMENTS",
      items: [
        { id: "payments", label: "Payments & Balances", icon: "💳" },
        {
          id: "settlements",
          label: "Smart Settlements",
          icon: "💰",
          badge: settlements.length > 0 ? `${settlements.length} due` : null,
        },
      ],
    },
    {
      group: "PLANNING",
      items: [
        {
          id: "itinerary",
          label: "Itinerary",
          icon: "📍",
          count: itinerary.length,
        },
        { id: "settings", label: "Trip Settings", icon: "⚙️" },
      ],
    },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-logo">GT</div>
        <div className="sidebar-brand-text">
          <h2>GroupTrip</h2>
          <span>Ledger System</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((sec) => (
          <div key={sec.group} className="sidebar-group">
            <p className="nav-title">{sec.group}</p>
            {sec.items.map((item) => (
              <button
                key={item.id}
                type="button"
                className={`nav-item ${activeTab === item.id ? "active" : ""}`}
                onClick={() => setActiveTab(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
                {item.count !== undefined && item.count > 0 && (
                  <span className="nav-count-badge">{item.count}</span>
                )}
                {item.badge && (
                  <span className="nav-alert-badge">{item.badge}</span>
                )}
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="sync-status">
          <span className="sync-dot"></span>
          <span>Live Sync Active</span>
        </div>
      </div>
    </aside>
  );
}