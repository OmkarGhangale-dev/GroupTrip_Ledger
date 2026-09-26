import React from "react";
import { useTrip } from "../context/TripContext";

export default function Sidebar({ activeTab, setActiveTab }) {
  const { participants, expenses, bookings, settlements, itinerary, trip } = useTrip();

  const navItems = [
    { id: "dashboard", label: "Dashboard", iconName: "grid_view" },
    { id: "participants", label: "Participants", iconName: "group", count: participants.length },
    { id: "expenses", label: "Expenses", iconName: "receipt_long", count: expenses.length },
    { id: "bookings", label: "Bookings", iconName: "airplane_ticket", count: bookings.length },
    { id: "payments", label: "Payments & Balances", iconName: "account_balance_wallet" },
    { id: "settlements", label: "Smart Settlements", iconName: "hub" },
    { id: "itinerary", label: "Itinerary", iconName: "explore", count: itinerary.length },
    { id: "settings", label: "Trip Settings", iconName: "tune" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-surface-container-lowest/90 backdrop-blur-2xl z-50 flex flex-col justify-between py-6 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="flex flex-col gap-6">
        <div className="px-6 flex items-center gap-3 cursor-pointer group" onClick={() => setActiveTab("landing")}>
          <div className="w-9 h-9 rounded-xl bg-secondary-container flex items-center justify-center text-primary shadow-[0_0_24px_rgba(255,154,77,0.28)] group-hover:scale-105 transition-transform">
            <span className="material-symbols-outlined text-xl">landscape</span>
          </div>
          <div>
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight block leading-none">Notosan</span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary block mt-1">Expedition Ledger</span>
          </div>
        </div>

        <div className="px-4">
          <div className="p-3 rounded-xl bg-surface-container/60 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse"></span>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Active Route</span>
            </div>
            <span className="font-label-sm text-label-sm text-primary font-bold">{trip?.destination || "Goa '24"}</span>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5 px-3">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl cursor-pointer transition-all duration-200 group text-left w-full ${
                activeTab === item.id
                  ? "bg-secondary-container text-on-surface font-semibold shadow-[0_0_20px_rgba(85,45,170,0.4)]"
                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
              }`}
            >
              <span className="material-symbols-outlined text-lg text-secondary group-hover:text-primary transition-colors">
                {item.iconName}
              </span>
              <span className="font-body-md text-body-md flex-1">{item.label}</span>
              {item.count > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-surface-container-high text-xs font-bold text-on-surface">
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="px-4 flex flex-col gap-3">
        <div className="p-3.5 rounded-xl bg-surface-container-high/40 backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(255,154,77,0.6)]"></div>
            <span className="font-label-sm text-label-sm text-on-surface uppercase tracking-wider font-semibold">Cloud Sync</span>
          </div>
          <span className="font-label-sm text-label-sm text-secondary">Live</span>
        </div>
        <div className="px-2 py-1 text-center">
          <p className="font-label-sm text-label-sm text-on-surface-variant/60 uppercase tracking-widest">Pomaii Ledger v2.4</p>
        </div>
      </div>
    </aside>
  );
}