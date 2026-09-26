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
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="p-8 rounded-2xl bg-surface-container/60 backdrop-blur-xl max-w-md mx-auto space-y-4">
          <h2 className="font-headline-lg text-headline-lg text-on-surface">No Expedition Active</h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Create your first expedition trip to record expenses, track shared bookings, and balance group debts.
          </p>
          <button
            onClick={() => onOpenTripModal()}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-label-md text-label-md font-bold uppercase tracking-wider shadow-lg hover:shadow-[0_0_28px_rgba(255,154,77,0.4)] transition-all cursor-pointer"
          >
            + Create First Expedition
          </button>
        </div>
      </div>
    );
  }

  const budget = Number(trip.budget || 50000);
  const budgetSpentPct =
    budget > 0 ? Math.min(Math.round((totalExpenses / budget) * 100), 100) : 0;
  const budgetLeftPct = 100 - budgetSpentPct;

  return (
    <div className="w-full min-h-screen">
      {/* IMMERSIVE HERO BANNER */}
      <div className="relative w-full -mt-16 pt-24 pb-12 px-6 lg:px-12 overflow-hidden bg-surface-container-lowest">
        <div
          className="absolute inset-0 w-full h-full bg-cover bg-center opacity-40 mix-blend-screen pointer-events-none scale-105"
          style={{
            backgroundImage:
              "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDKDyBrJu-5LycUDuOC7afqB98UlCEwV96S7UfgZHlC3CN3MOhbEcBvTn3u20mOIgYG4ozFF6cxSChQeETjPP-uSPscY2S8qOMj8uy1yr1EgAhqn-_ZmtGvHDZnJG0VihX9YakggRiXyP_DJE4p_-I9r-EOCM9aynFxX3s2VdGv_O10Ff2YMHCx7fOH57TTwIVhjGBsPpbfw9gMhoPV46ua_VUfnAje-upqLzVHnoKLvMzP4HlNsKZVjA')",
          }}
        ></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-primary-container/20 blur-[120px] pointer-events-none"></div>
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full bg-secondary-container/30 blur-[100px] pointer-events-none"></div>

        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high/70 backdrop-blur-xl shadow-sm">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest">
                  Trip Overview • {trip.status || "Planning"}
                </span>
              </div>
              <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                Expedition #GA-2609
              </span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-surface-container/60 backdrop-blur-md">
              <span className="material-symbols-outlined text-secondary text-sm">schedule</span>
              <span className="font-label-sm text-label-sm text-on-surface tracking-wide">
                Departs in <strong className="text-primary font-bold">542 days</strong>
              </span>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-3 max-w-3xl">
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight leading-none capitalize">
                {trip.name}
              </h1>
              <div className="flex items-center gap-3 text-secondary font-label-md text-label-md tracking-wider flex-wrap">
                <span className="flex items-center gap-1.5 text-primary">
                  <span className="material-symbols-outlined text-base">explore</span>
                  {trip.destination}, Arabian Sea
                </span>
                <span className="text-outline">•</span>
                <span className="text-on-surface-variant">
                  {trip.start_date ? new Date(trip.start_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "26 Sept"} – {trip.end_date ? new Date(trip.end_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "30 Sept 2026"}
                </span>
                <span className="text-outline">•</span>
                <span className="text-secondary-fixed">5 Days of Coastal Wilderness</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onOpenExpenseModal()}
                disabled={participants.length === 0}
                className="group flex items-center bg-primary text-on-primary font-label-md text-label-md tracking-wider uppercase rounded-xl overflow-hidden shadow-lg hover:shadow-[0_0_28px_rgba(255,154,77,0.4)] transition-all cursor-pointer"
              >
                <span className="px-5 py-3 font-bold">+ Add Expense</span>
                <span className="w-11 h-11 bg-primary-container flex items-center justify-center text-on-primary-container group-hover:translate-x-0.5 transition-transform">
                  <span className="material-symbols-outlined text-lg">receipt_long</span>
                </span>
              </button>
              <button
                onClick={() => onOpenParticipantModal()}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-high/80 hover:bg-surface-container-highest text-on-surface font-label-md text-label-md tracking-wide transition-all backdrop-blur-lg shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-secondary text-base">person_add</span>
                <span>+ Add Member</span>
              </button>
              <button
                onClick={() => onOpenPaymentModal()}
                disabled={participants.length < 2}
                className="flex items-center gap-2 px-4 py-3 rounded-xl bg-surface-container-high/50 hover:bg-surface-container text-on-surface-variant hover:text-on-surface font-label-md text-label-md tracking-wide transition-all backdrop-blur-lg shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined text-base">balance</span>
                <span>Settle Up</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN SURFACE SECTION */}
      <div className="w-full px-6 lg:px-12 -mt-4 pb-20 relative z-20">
        <div className="max-w-7xl mx-auto flex flex-col gap-10">
          {/* KPI METRIC DECK */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* CARD 1 */}
            <div
              onClick={() => setActiveTab("expenses")}
              className="group relative rounded-xl p-5 bg-surface-container/60 hover:bg-surface-container-high/70 backdrop-blur-xl transition-all duration-300 shadow-md overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Expedition Spent</span>
                  <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1">{money(totalExpenses)}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary shadow-sm">
                  <span className="material-symbols-outlined text-xl">payments</span>
                </div>
              </div>
              <div className="mt-6 pt-4 space-y-2">
                <div className="flex items-center justify-between font-label-sm text-label-sm">
                  <span className="text-on-surface-variant">{budgetSpentPct}% of {money(budget)} budget</span>
                  <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary font-bold">{budgetLeftPct}% Left</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-surface-container-lowest overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-700" style={{ width: `${budgetSpentPct}%` }}></div>
                </div>
              </div>
            </div>

            {/* CARD 2 */}
            <div
              onClick={() => setActiveTab("participants")}
              className="group relative rounded-xl p-5 bg-surface-container/60 hover:bg-surface-container-high/70 backdrop-blur-xl transition-all duration-300 shadow-md overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Travelers En Route</span>
                  <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1">{participants.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-xl">hiking</span>
                </div>
              </div>
              <div className="mt-6 pt-4 flex items-center justify-between font-label-sm text-label-sm">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-xs uppercase">
                    {(participants[0]?.name || "S").charAt(0)}
                  </div>
                  <span className="text-on-surface font-medium truncate max-w-[110px]">{participants[0]?.name || "shreya"}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-surface-container-highest/60 text-primary text-xs font-semibold">Leader</span>
              </div>
            </div>

            {/* CARD 3 */}
            <div
              onClick={() => setActiveTab("bookings")}
              className="group relative rounded-xl p-5 bg-surface-container/60 hover:bg-surface-container-high/70 backdrop-blur-xl transition-all duration-300 shadow-md overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Confirmed Bookings</span>
                  <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1">{bookings.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-surface-container-highest/50 flex items-center justify-center text-tertiary shadow-sm">
                  <span className="material-symbols-outlined text-xl">luggage</span>
                </div>
              </div>
              <div className="mt-6 pt-4 flex items-center justify-between font-label-sm text-label-sm">
                <span className="text-on-surface-variant">Total Reserved</span>
                <span className="text-on-surface font-semibold">{money(totalBookingsAmount)}</span>
              </div>
            </div>

            {/* CARD 4 */}
            <div
              onClick={() => setActiveTab("settlements")}
              className="group relative rounded-xl p-5 bg-surface-container/60 hover:bg-surface-container-high/70 backdrop-blur-xl transition-all duration-300 shadow-md overflow-hidden flex flex-col justify-between cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant">Pending Settlements</span>
                  <span className="font-headline-lg text-headline-lg text-on-surface tracking-tight font-semibold mt-1">{settlements.length}</span>
                </div>
                <div className="w-10 h-10 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary shadow-sm">
                  <span className="material-symbols-outlined text-xl">verified</span>
                </div>
              </div>
              <div className="mt-6 pt-4 flex items-center gap-1.5 font-label-sm text-label-sm text-primary">
                <span className="material-symbols-outlined text-sm">check_circle</span>
                <span className="font-medium">{settlements.length === 0 ? "All debts settled!" : `${settlements.length} pending transfer(s)`}</span>
              </div>
            </div>
          </div>

          {/* ASYMMETRIC TWO-COLUMN GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: EXPENSES & ITINERARY */}
            <div className="lg:col-span-7 flex flex-col gap-8">
              {/* RECENT EXPENSES */}
              <div className="rounded-2xl p-6 bg-surface-container/60 backdrop-blur-xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Recent Expenses</h2>
                  </div>
                  <button onClick={() => setActiveTab("expenses")} className="flex items-center gap-1 font-label-md text-label-md text-secondary hover:text-primary transition-colors cursor-pointer">
                    <span>View All</span>
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>

                {expenses.length === 0 ? (
                  <div className="py-12 px-6 rounded-xl bg-surface-container-low/60 flex flex-col items-center justify-center text-center">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container flex items-center justify-center text-primary mb-4 shadow-sm">
                      <span className="material-symbols-outlined text-2xl">receipt_long</span>
                    </div>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold mb-2">No expenses recorded yet</h3>
                    <p className="font-body-sm text-body-sm text-on-surface-variant max-w-sm mb-6">
                      Add food, travel, accommodation, or beachside lodging expenses to activate real-time ledger splitting.
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                      <button
                        onClick={() => onOpenExpenseModal()}
                        disabled={participants.length === 0}
                        className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-label-md text-label-md font-bold shadow-md hover:bg-primary transition-all cursor-pointer"
                      >
                        + Log First Expense
                      </button>
                      <button
                        onClick={() => onOpenExpenseModal()}
                        className="px-4 py-2.5 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-label-md text-label-md transition-all cursor-pointer"
                      >
                        Import Receipt
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {expenses.slice(0, 5).map((exp) => (
                      <div key={exp.id} className="p-4 rounded-xl bg-surface-container/80 flex items-center justify-between">
                        <div>
                          <strong className="font-title-md text-title-md text-on-surface block">{exp.title}</strong>
                          <span className="font-body-sm text-body-sm text-on-surface-variant">
                            {exp.category || "General"} • Paid by {exp.paid_by_participant?.name || "Member"}
                          </span>
                        </div>
                        <div className="text-right">
                          <strong className="font-headline-sm text-headline-sm text-primary block">{money(exp.amount)}</strong>
                          <span className="px-2 py-0.5 rounded-full bg-secondary-container/40 text-secondary text-xs capitalize">
                            {exp.split_method}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-4 border-t border-white/5 flex items-center gap-2 flex-wrap">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">RECOMMENDED:</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs text-on-surface-variant">Lodging & Villas</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs text-on-surface-variant">Scooter Rentals</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs text-on-surface-variant">Shacks & Dining</span>
                  <span className="px-2.5 py-1 rounded-full bg-surface-container-low text-xs text-on-surface-variant">Watersports</span>
                </div>
              </div>

              {/* WAYPOINT ITINERARY CARD */}
              <div className="rounded-2xl p-6 bg-surface-container/60 backdrop-blur-xl border border-white/5 flex flex-col md:flex-row gap-6 items-center">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuDKDyBrJu-5LycUDuOC7afqB98UlCEwV96S7UfgZHlC3CN3MOhbEcBvTn3u20mOIgYG4ozFF6cxSChQeETjPP-uSPscY2S8qOMj8uy1yr1EgAhqn-_ZmtGvHDZnJG0VihX9YakggRiXyP_DJE4p_-I9r-EOCM9aynFxX3s2VdGv_O10Ff2YMHCx7fOH57TTwIVhjGBsPpbfw9gMhoPV46ua_VUfnAje-upqLzVHnoKLvMzP4HlNsKZVjA"
                  alt="Anjuna Coast"
                  className="w-full md:w-40 h-28 rounded-xl object-cover"
                />
                <div className="space-y-2 flex-1">
                  <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">explore</span>
                    WAYPOINT ITINERARY
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Anjuna & Morjim Coastline</h3>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Pre-calculated routes for 4 sunset viewpoints, coastal trails, and seaside culinary stops.
                  </p>
                  <div className="flex items-center gap-3 font-label-sm text-label-sm text-secondary">
                    <span>• 5 Planned Waypoints</span>
                    <span>• ₹0 Reserved</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: NET BALANCES & PARAMETERS */}
            <div className="lg:col-span-5 flex flex-col gap-8">
              {/* NET BALANCES */}
              <div className="rounded-2xl p-6 bg-surface-container/60 backdrop-blur-xl border border-white/5 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-secondary"></span>
                    <div>
                      <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Net Balances</h2>
                      <p className="font-body-sm text-body-sm text-on-surface-variant">Current standing for each participant</p>
                    </div>
                  </div>
                  <button aria-label="Refresh balances" className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">
                    <span className="material-symbols-outlined text-lg">sync</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-surface-container/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-on-secondary-container font-bold">
                      {(participants[0]?.name || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <strong className="font-title-md text-title-md text-on-surface">{participants[0]?.name || "Shreya"}</strong>
                        <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container text-[10px] font-bold">YOU</span>
                      </div>
                      <span className="font-body-sm text-body-sm text-on-surface-variant block">Expedition Admin</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-body-sm text-body-sm text-on-surface-variant block">Standing: <strong className="text-on-surface">₹0.00</strong></span>
                    <span className="font-label-sm text-label-sm text-secondary font-semibold">Settled up</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-surface-container-lowest/60 border border-white/5 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border-2 border-secondary text-secondary flex items-center justify-center font-bold text-sm">
                    ✓
                  </div>
                  <div>
                    <strong className="font-title-md text-title-md text-on-surface block">Ledger in Harmony</strong>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">All accounts balanced. No peer reimbursement required.</span>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("settlements")}
                  className="w-full py-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-surface font-label-md text-label-md font-semibold tracking-wider flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">hub</span>
                  <span>VIEW SETTLEMENT MATRIX</span>
                </button>
              </div>

              {/* EXPEDITION PARAMETERS */}
              <div className="rounded-2xl p-6 bg-surface-container/60 backdrop-blur-xl border border-white/5 space-y-4">
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-widest font-semibold block">EXPEDITION PARAMETERS</span>
                <div className="space-y-3 font-body-sm text-body-sm">
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Destination</span>
                    <span className="text-on-surface font-semibold">Goa, India</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Travel Dates</span>
                    <span className="text-on-surface font-semibold">Sep 26 – Sep 30, 2026</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Primary Currency</span>
                    <span className="text-on-surface font-semibold">INR (₹)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">Split Method</span>
                    <span className="text-primary font-semibold">Exact / Equal Proportion</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
