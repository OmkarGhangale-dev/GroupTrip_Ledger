import React, { useState, useEffect } from "react";
import { useTrip } from "../context/TripContext";

export default function SettingsView({ onOpenTripModal }) {
  const { trip, editTrip, removeTrip } = useTrip();

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
      <div className="flex flex-col items-center justify-center p-12 text-center bg-surface-container-low/60 backdrop-blur-xl rounded-2xl border border-white/5">
        <p className="text-on-surface-variant font-body-md">Please select or create a trip first.</p>
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
    <div className="flex flex-col w-full">
      {/* Immersive Hero Header */}
      <div className="relative w-full overflow-hidden -mt-16 pt-24 pb-14 px-6 md:px-12 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-background">
        <div className="absolute -top-24 right-1/4 w-[520px] h-[340px] bg-gradient-to-br from-primary-container/20 to-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-4">
          <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-secondary-container/40 backdrop-blur-md w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">CONFIGURATION</span>
            <span className="text-secondary/60 text-xs">•</span>
            <span className="font-label-sm text-label-sm text-secondary">GOA EXPEDITION '24</span>
          </div>
          <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none">
            Trip Settings
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
            Update trip information, budget targets, dates, or manage expedition parameters.
          </p>
        </div>
      </div>

      {/* Main Form Content */}
      <div className="w-full px-6 md:px-12 py-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Column */}
        <div className="lg:col-span-2 p-6 md:p-8 rounded-2xl bg-surface-container-low/70 backdrop-blur-xl shadow-xl border border-white/5">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-1">Trip Details</h3>
          <p className="font-body-sm text-body-sm text-on-surface-variant mb-6">General parameters and budget tracking.</p>

          <form onSubmit={handleSave} className="flex flex-col gap-5">
            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Trip Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
              />
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Destination</label>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
                />
              </div>
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Planned Budget (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Currency</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
                />
              </div>

              <div>
                <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Trip Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
                >
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-2">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-surface-container-lowest/80 text-on-surface font-body-md text-body-md focus:outline-none focus:ring-1 focus:ring-primary shadow-inner border border-white/5"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-6 py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_24px_rgba(255,154,77,0.35)] transition-all cursor-pointer disabled:opacity-50"
                disabled={saving}
              >
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>

        {/* Info & Danger Side Column */}
        <div className="flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-surface-container-low/70 backdrop-blur-xl shadow-xl border border-white/5">
            <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-4">Database Info</h3>
            <div className="flex flex-col gap-3 font-body-sm text-body-sm">
              <div>
                <small className="text-on-surface-variant uppercase tracking-wider text-[10px] font-bold block mb-1">Trip ID (UUID):</small>
                <code className="px-3 py-1.5 rounded-lg bg-surface-container-lowest text-primary text-xs font-mono block overflow-x-auto border border-white/5">{trip.id}</code>
              </div>
              <div>
                <small className="text-on-surface-variant uppercase tracking-wider text-[10px] font-bold block mb-1">Created At:</small>
                <span className="text-on-surface font-medium">
                  {trip.created_at ? new Date(trip.created_at).toLocaleString("en-IN") : "N/A"}
                </span>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-rose-950/30 backdrop-blur-xl shadow-xl border border-rose-500/20">
            <h3 className="font-headline-sm text-headline-sm text-rose-400 font-semibold mb-2">Danger Zone</h3>
            <p className="font-body-sm text-body-sm text-on-surface-variant mb-4 leading-relaxed">
              Deleting a trip will permanently remove all associated participants, expenses, splits, bookings, and itinerary records.
            </p>

            <button
              type="button"
              className="w-full py-3 px-4 rounded-xl bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white font-label-md text-label-md font-bold border border-rose-500/40 transition-all cursor-pointer"
              onClick={handleDeleteTrip}
            >
              Delete This Trip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
