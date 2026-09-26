import React, { useState } from "react";
import { useTrip } from "../context/TripContext";

export default function BookingsView({ onOpenBookingModal, onOpenRefundModal }) {
  const { bookings, removeBooking, totalBookingsAmount } = useTrip();
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const categoryTabs = [
    { id: "all", label: "All", icon: "apps", count: bookings.length },
    { id: "flights", label: "Flights", icon: "flight_takeoff" },
    { id: "stays", label: "Stays", icon: "hotel" },
    { id: "activities", label: "Activities", icon: "surfing" },
    { id: "transport", label: "Transport", icon: "directions_car" },
    { id: "other", label: "Other", icon: "more_horiz" },
  ];

  const filtered = bookings.filter((b) => {
    const matchesTab =
      activeTab === "all" ||
      (b.booking_type && b.booking_type.toLowerCase().includes(activeTab.slice(0, -1)));
    const matchesSearch =
      b.title.toLowerCase().includes(search.toLowerCase()) ||
      (b.booking_reference &&
        b.booking_reference.toLowerCase().includes(search.toLowerCase()));
    return matchesTab && matchesSearch;
  });

  return (
    <div className="flex flex-col w-full">
      {/* Atmospheric Scrim & Hero Banner */}
      <div className="relative w-full overflow-hidden rounded-2xl bg-surface-container-low shadow-xl border border-white/5">
        <div className="absolute inset-0 bg-gradient-to-r from-surface-container-lowest via-surface-container to-surface-dim opacity-90"></div>
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full bg-primary-container/20 blur-3xl pointer-events-none"></div>
        <div className="absolute -left-12 -bottom-16 w-80 h-80 rounded-full bg-secondary-container/40 blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-8 md:p-10 flex flex-col justify-between gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 backdrop-blur-md shadow-sm border border-white/5">
                <span className="material-symbols-outlined text-primary text-base">confirmation_number</span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-bold">TRIP RESERVATIONS</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-container/40 backdrop-blur-md">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-secondary tracking-wider uppercase font-semibold">Route: Goa '24</span>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-on-surface-variant">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-primary">navigation</span>
                <span className="font-label-sm text-label-sm tracking-widest uppercase">15.2993° N, 74.1240° E</span>
              </div>
              <span className="text-outline-variant">•</span>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Expedition Ledger</span>
            </div>
          </div>

          <div className="max-w-2xl">
            <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none mb-3">
              Bookings &amp; Refunds
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">
              Organize flights, hotels, tours, and transport reservations with refund tracking and synchronised split payments across travelers.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/5">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-xl bg-surface-container-lowest/80 backdrop-blur-md shadow-md border border-white/5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-2xl">account_balance_wallet</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">TOTAL BOOKINGS</span>
                  <span className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">{money(totalBookingsAmount)}</span>
                </div>
              </div>
              <div className="hidden md:flex items-center gap-3 p-4 rounded-xl bg-surface-container-lowest/40 backdrop-blur-sm border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-secondary-container/40 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined text-xl">replay</span>
                </div>
                <div>
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider block">REFUNDS PENDING</span>
                  <span className="font-headline-sm text-headline-sm text-secondary font-medium">₹0</span>
                </div>
              </div>
            </div>
            <button
              className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container shadow-[0_0_24px_rgba(255,154,77,0.35)] transition-all duration-200 cursor-pointer"
              onClick={() => onOpenBookingModal()}
              type="button"
            >
              <span className="font-label-md text-label-md font-bold uppercase tracking-wider">+ Add Booking</span>
              <span className="w-6 h-6 rounded-md bg-on-primary-container/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
                <span className="material-symbols-outlined text-base">arrow_forward</span>
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter & Segment Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 my-8">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          {categoryTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-label-md text-label-md transition-all cursor-pointer ${
                  isActive
                    ? "bg-secondary-container text-on-surface font-semibold shadow-[0_0_20px_rgba(85,45,170,0.3)]"
                    : "bg-surface-container/60 hover:bg-surface-container text-on-surface-variant hover:text-on-surface"
                }`}
              >
                <span className={`material-symbols-outlined text-sm ${isActive ? "text-primary" : "text-secondary"}`}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-surface-container-lowest/60 text-secondary font-bold">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-on-surface-variant text-base">search</span>
            <input
              className="pl-9 pr-4 py-1.5 rounded-xl bg-surface-container-low/70 text-on-surface font-body-sm text-body-sm placeholder:text-on-surface-variant/50 focus:outline-none focus:bg-surface-container shadow-sm border border-white/5"
              placeholder="Search vouchers, PNR..."
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Bookings List / Empty State */}
      {filtered.length === 0 ? (
        <div className="relative w-full rounded-2xl bg-surface-container-low/60 backdrop-blur-2xl p-8 sm:p-14 shadow-xl flex flex-col items-center justify-center text-center overflow-hidden border border-white/5">
          <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-secondary-container/20 blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-60 h-60 rounded-full bg-primary/10 blur-2xl pointer-events-none"></div>
          <div className="relative z-10 mb-6">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-container-high/70 backdrop-blur-xl flex items-center justify-center shadow-[0_0_32px_rgba(85,45,170,0.35)] mx-auto group hover:scale-105 transition-transform duration-300 border border-white/5">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-gradient-to-br from-secondary-container to-surface-container-highest flex items-center justify-center text-primary shadow-inner">
                <span className="material-symbols-outlined text-3xl sm:text-4xl">calendar_month</span>
              </div>
            </div>
          </div>
          <div className="relative z-10 max-w-lg mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container mb-3 shadow-sm border border-white/5">
              <span className="material-symbols-outlined text-xs text-primary">hotel_class</span>
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-widest font-semibold">Ledger Empty</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight mb-3">
              No Bookings Logged
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Add hotel check-ins, flight numbers, tour tickets, and transport details. We'll automatically reconcile shared costs, trace refundable deposits, and track voucher confirmations.
            </p>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4">
            <button
              className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold uppercase tracking-wider shadow-[0_0_28px_rgba(255,154,77,0.4)] transition-all duration-200 cursor-pointer"
              onClick={() => onOpenBookingModal()}
              type="button"
            >
              <span className="material-symbols-outlined text-lg">add_circle</span>
              <span>+ Add First Booking</span>
            </button>
          </div>

          <div className="relative z-10 mt-12 pt-8 w-full max-w-3xl flex flex-col items-center border-t border-white/5">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant/70 mb-4 block">
              Popular Goa Expeditions to Record
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full text-left">
              <div
                className="p-4 rounded-xl bg-surface-container/50 hover:bg-surface-container backdrop-blur-md transition-all cursor-pointer group shadow-sm border border-white/5"
                onClick={() => onOpenBookingModal()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">flight</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">arrow_outward</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold block">IndiGo 6E-241</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">BOM → GOI Flight</span>
              </div>
              <div
                className="p-4 rounded-xl bg-surface-container/50 hover:bg-surface-container backdrop-blur-md transition-all cursor-pointer group shadow-sm border border-white/5"
                onClick={() => onOpenBookingModal()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-secondary text-lg">villa</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-secondary transition-colors text-sm">arrow_outward</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold block">Anjuna Cliff Villa</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">3 Nights Beachfront</span>
              </div>
              <div
                className="p-4 rounded-xl bg-surface-container/50 hover:bg-surface-container backdrop-blur-md transition-all cursor-pointer group shadow-sm border border-white/5"
                onClick={() => onOpenBookingModal()}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="material-symbols-outlined text-primary text-lg">kayaking</span>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors text-sm">arrow_outward</span>
                </div>
                <span className="font-label-md text-label-md text-on-surface font-semibold block">Mandovi Kayak Pass</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant block mt-0.5">Sunset River Expedition</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-md border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-surface-container-lowest/50 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-4 px-6">Reservation</th>
                  <th className="py-4 px-6">Type</th>
                  <th className="py-4 px-6">Provider / PNR</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Amount</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-body-md text-body-md text-on-surface">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-container/30 transition-colors">
                    <td className="py-4 px-6">
                      <strong className="text-on-surface font-semibold block">{b.title}</strong>
                      <span className="text-xs text-on-surface-variant/70">
                        {b.provider || "Standard Reservation"}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-3 py-1 rounded-lg bg-surface-container text-on-surface-variant text-xs capitalize">
                        {b.booking_type}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-primary font-semibold text-xs">
                        {b.booking_reference || "CONFIRMED"}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-on-surface-variant">
                      {b.booking_date ? new Date(b.booking_date).toLocaleDateString("en-IN") : "Upcoming"}
                    </td>
                    <td className="py-4 px-6 text-primary font-bold">
                      {money(b.amount)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer"
                          onClick={() => onOpenBookingModal(b)}
                        >
                          <span className="material-symbols-outlined text-lg">edit</span>
                        </button>
                        <button
                          type="button"
                          className="p-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer"
                          onClick={() => removeBooking(b.id)}
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottom Ledger Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="p-6 rounded-2xl bg-surface-container-low/70 backdrop-blur-md shadow-md border border-white/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-secondary-container/50 flex items-center justify-center text-secondary shrink-0">
            <span className="material-symbols-outlined text-xl">shield_locked</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight mb-1">
              Automated Refund Escrow
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              When bookings are canceled or modified, Pomaii recalculates each participant's fair balance instantly without awkward group chat reminders.
            </p>
          </div>
        </div>
        <div className="p-6 rounded-2xl bg-surface-container-low/70 backdrop-blur-md shadow-md border border-white/5 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-xl">perm_media</span>
          </div>
          <div>
            <h3 className="font-headline-sm text-headline-sm text-on-surface tracking-tight mb-1">
              Offline Ticket Passports
            </h3>
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              Stored confirmation PDFs, barcodes, and boarding passes remain cached locally on all members' phones during remote coastal excursions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
