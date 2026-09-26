import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";
import api from "../services/api";

export default function Navbar({ onOpenNewTripModal, onOpenLogin, onLogout, isDark, toggleTheme }) {
  const { trips, trip, setTrip } = useTrip();
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

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/70 backdrop-blur-xl z-40 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
      <div className="h-16 w-full px-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight font-semibold leading-none">Pomaii</span>
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase mt-1">Explore. Dream. Discover.</span>
          </div>
          <div className="hidden md:flex items-center gap-2 pl-4">
            <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-surface-container/70 text-on-surface">
              <span className="material-symbols-outlined text-base text-primary">pin_drop</span>
              <select
                className="bg-transparent border-none text-on-surface font-label-md text-label-md outline-none cursor-pointer capitalize"
                value={trip?.id || ""}
                onChange={(e) => {
                  const selected = trips.find((t) => t.id === e.target.value);
                  if (selected) setTrip(selected);
                }}
              >
                {trips.map((t) => (
                  <option key={t.id} value={t.id} className="bg-surface-container text-on-surface">
                    {t.name} ({t.destination})
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={onOpenNewTripModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container transition-all shadow-[0_0_16px_rgba(255,154,77,0.35)] cursor-pointer"
            >
              <span className="material-symbols-outlined text-base">add</span>
              <span className="font-label-md text-label-md font-bold tracking-wide">New Trip</span>
            </button>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-container/30">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-secondary font-semibold uppercase tracking-wider">
              {dbStatus === "connected" ? "DB Connected" : "Connecting..."}
            </span>
          </div>
          {toggleTheme && (
            <button
              aria-label="Toggle theme"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-colors cursor-pointer"
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              <span className="material-symbols-outlined text-xl text-primary">
                {isDark ? "light_mode" : "dark_mode"}
              </span>
            </button>
          )}
          <button aria-label="Search records" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-colors">
            <span className="material-symbols-outlined text-xl">search</span>
          </button>
          <button aria-label="Notifications" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container/50 transition-colors relative">
            <span className="material-symbols-outlined text-xl">notifications</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary absolute top-2 right-2"></span>
          </button>
          <div
            className="flex items-center gap-3 pl-2 cursor-pointer"
            onClick={() => {
              localStorage.removeItem("token");
              localStorage.removeItem("user");
              if (onLogout) {
                onLogout();
              } else {
                onOpenLogin();
              }
            }}
            title="Click to Sign Out"
          >
            <div className="flex flex-col text-right hidden lg:block">
              <span className="font-label-md text-label-md text-on-surface font-semibold leading-none">{currentUser.name || "shreya"}</span>
              <span className="font-label-sm text-label-sm text-primary tracking-wide block mt-1">Trip Admin</span>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm ring-1 ring-primary/40">
              {(currentUser.name || "S").charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
