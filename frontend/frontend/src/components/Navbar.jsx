import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";
import api from "../services/api";

export default function Navbar({ onOpenNewTripModal, onOpenLogin, onLogout, isDark, toggleTheme }) {
  const { trips, trip, setTrip, participants } = useTrip();
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

  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    currentUser = {};
  }

  // role of the signed-in user in the selected trip
  const myParticipant = (participants || []).find(
    (p) =>
      p.email &&
      currentUser.email &&
      p.email.toLowerCase() === currentUser.email.toLowerCase(),
  );
  const myRoleLabel =
    myParticipant?.role === "organizer" ? "Trip Organizer" : "Member";

  return (
    <header className="fixed top-0 left-64 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl z-40 border-b border-black/5">
      <div className="h-16 w-full px-6 flex items-center justify-between">
        {/* Left tagline & Trip Selector */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <span className="font-instrument italic text-lg text-black leading-none">
              Explore. Dream. Discover.
            </span>
          </div>

          {/* Search bar input */}
          <div className="relative hidden md:flex items-center w-72">
            <span className="material-symbols-outlined text-base text-black/40 absolute left-3 pointer-events-none">
              search
            </span>
            <input
              type="text"
              placeholder="Search Goa Expedition..."
              className="w-full pl-9 pr-4 py-1.5 rounded-full bg-black/5 border border-black/10 text-xs text-black placeholder:text-black/40 focus:outline-none focus:ring-1 focus:ring-black"
            />
          </div>
        </div>

        {/* Right Action Group */}
        <div className="flex items-center gap-3">
          {/* Select Trip dropdown */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-xs">
            <span className="material-symbols-outlined text-sm text-primary">pin_drop</span>
            <select
              className="bg-transparent border-none text-black font-medium text-xs outline-none cursor-pointer capitalize"
              value={trip?.id || ""}
              onChange={(e) => {
                const selected = trips.find((t) => t.id === e.target.value);
                if (selected) setTrip(selected);
              }}
            >
              {trips.map((t) => (
                <option key={t.id} value={t.id} className="bg-white text-black">
                  {t.name} ({t.destination})
                </option>
              ))}
            </select>
          </div>

          {/* Notification Bell */}
          <button
            aria-label="Notifications"
            className="w-9 h-9 rounded-full flex items-center justify-center text-black/60 hover:text-black hover:bg-black/5 transition-colors relative cursor-pointer"
          >
            <span className="material-symbols-outlined text-lg">notifications</span>
            <span className="w-1.5 h-1.5 rounded-full bg-black absolute top-2.5 right-2.5"></span>
          </button>



          {/* + New Trip Button */}
          <button
            onClick={onOpenNewTripModal}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-black text-white text-xs font-medium hover:scale-105 transition-transform cursor-pointer shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span>New Trip</span>
          </button>

          {/* User Profile Pill */}
          <div
            className="flex items-center gap-2 pl-2 cursor-pointer hover:opacity-80 transition-opacity"
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
            <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs shadow-sm">
              {(currentUser.name || "A").charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-black leading-none">
                {currentUser.name || "Alex Morgan"}
              </span>
              <span className="text-[10px] text-black/50 font-medium">
                {myRoleLabel}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}