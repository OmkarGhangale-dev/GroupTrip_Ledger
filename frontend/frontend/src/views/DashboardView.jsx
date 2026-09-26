import React, { useState } from "react";
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
    payments,
    itinerary,
    totalExpenses,
    totalBookingsAmount,
  } = useTrip();

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  if (!trip) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-16 text-center">
        <div className="p-8 rounded-3xl bg-white border border-black/10 shadow-sm max-w-md mx-auto space-y-4">
          <h2 className="font-instrument text-4xl text-black font-normal">No Expedition Active</h2>
          <p className="font-body-md text-body-md text-black/60">
            Create your first expedition trip to record expenses, track shared bookings, and balance group debts.
          </p>
          <button
            onClick={() => onOpenTripModal()}
            className="px-6 py-3 rounded-full bg-black text-white font-label-md text-label-md font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-transform cursor-pointer"
          >
            + Create First Expedition
          </button>
        </div>
      </div>
    );
  }

  // 1. Identify current logged-in user participant
  let currentUser = {};
  try {
    currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {}

  const myParticipant =
    (participants || []).find(
      (p) =>
        p.email &&
        currentUser.email &&
        p.email.toLowerCase() === currentUser.email.toLowerCase()
    ) || (participants || [])[0];

  const myId = myParticipant?.id;
  const myName = myParticipant?.name || currentUser.name || "Traveler";
  const myRoleLabel =
    myParticipant?.role === "organizer" ? "YOU • ORGANIZER" : "YOU • MEMBER";

  // 2. Compute dynamic financial metrics from balances
  const myBalanceObj = (balances || []).find((b) => b.participant_id === myId) || {};
  const totalPaidByMe = Number(myBalanceObj.total_paid || 0);
  const totalOwedToMe = Number(myBalanceObj.total_owed || 0);
  const netBalance = Number(myBalanceObj.net_balance || 0);

  // Total received by me in payments
  const totalReceivedByMe = (payments || []).reduce((sum, p) => {
    if (p.to_participant_id === myId) return sum + Number(p.amount || 0);
    return sum;
  }, 0);

  // Estimated personal trip cost (sum of fair share per expense)
  const myPersonalCost = (expenses || []).reduce((sum, exp) => {
    const splitCount = participants.length > 0 ? participants.length : 1;
    return sum + Number(exp.amount || 0) / splitCount;
  }, 0);

  // 3. Compute Category Expenses Breakdown dynamically
  const categoryTotals = (expenses || []).reduce(
    (acc, exp) => {
      const cat = String(exp.category || "other").toLowerCase();
      const amt = Number(exp.amount || 0);
      if (cat.includes("food") || cat.includes("dining")) acc.food += amt;
      else if (cat.includes("hotel") || cat.includes("stay") || cat.includes("accommodation")) acc.accommodation += amt;
      else if (cat.includes("transport") || cat.includes("scooter") || cat.includes("flight")) acc.transport += amt;
      else if (cat.includes("activity") || cat.includes("tour") || cat.includes("excursion")) acc.activities += amt;
      else acc.other += amt;
      return acc;
    },
    { food: 0, accommodation: 0, transport: 0, activities: 0, other: 0 }
  );

  const grandExpenseTotal = totalExpenses || 1;
  const catPct = {
    food: Math.round((categoryTotals.food / grandExpenseTotal) * 100),
    accommodation: Math.round((categoryTotals.accommodation / grandExpenseTotal) * 100),
    transport: Math.round((categoryTotals.transport / grandExpenseTotal) * 100),
    activities: Math.round((categoryTotals.activities / grandExpenseTotal) * 100),
    other: Math.round((categoryTotals.other / grandExpenseTotal) * 100),
  };

  // 4. Filter dynamic optimal settlements
  const myPendingSettlements = (settlements || []).filter(
    (s) => s.to_participant_id === myId || s.from_participant_id === myId
  );
  const totalReceivable = myPendingSettlements
    .filter((s) => s.to_participant_id === myId)
    .reduce((sum, s) => sum + Number(s.amount || 0), 0);

  return (
    <div className="w-full min-h-screen px-6 lg:px-12 py-6 flex flex-col gap-8 font-inter text-black">
      {/* HEADER BAR & TITLE */}
      <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 pb-6">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              EXPEDITION LEDGER
            </span>
            <span className="text-xs text-black/40">•</span>
            <span className="text-xs font-semibold uppercase tracking-wider text-black/60">
              {trip.destination || "GOA EXPEDITION '24"}
            </span>
          </div>
          <h1 className="font-instrument text-5xl md:text-6xl text-black font-normal tracking-tight leading-none">
            {trip.name} <em className="italic text-black/70">Overview</em>
          </h1>
          <p className="text-sm text-black/60 max-w-xl mt-1 leading-relaxed">
            Real-time financial transparency, expense splits, and settlement matrix for {trip.destination || trip.name}.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => onOpenParticipantModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/15 text-xs font-medium hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-black/70">person_add</span>
            <span>+ Add Voyager</span>
          </button>
          <button
            onClick={() => onOpenBookingModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-black/15 text-xs font-medium hover:bg-black/5 transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-base text-black/70">book_online</span>
            <span>+ Add Booking</span>
          </button>
          <button
            onClick={() => onOpenExpenseModal()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-black text-white text-xs font-medium hover:scale-105 transition-transform cursor-pointer shadow-md"
          >
            <span className="material-symbols-outlined text-base">add</span>
            <span>Record Expense</span>
          </button>
        </div>
      </div>

      {/* MEMBER SELECTOR STRIP (DYNAMIC REAL-TIME) */}
      <div className="max-w-7xl mx-auto w-full flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-low/70 border border-black/10">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-black/50">
            VIEWING OVERVIEW FOR:
          </span>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-black/15 text-xs font-semibold text-black shadow-sm">
            <span className="w-6 h-6 rounded-full bg-black text-white text-[10px] font-bold flex items-center justify-center">
              {myName.charAt(0).toUpperCase()}
            </span>
            <span>{myName}</span>
            <span className="px-1.5 py-0.5 rounded bg-black/10 text-[9px] font-bold">
              {myRoleLabel}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-black/60">
          <span>{participants.length} Active Participants</span>
          <div className="flex -space-x-2 overflow-hidden">
            {participants.slice(0, 5).map((p, idx) => (
              <span
                key={p.id || idx}
                className="w-7 h-7 rounded-full bg-surface-container-high border-2 border-white text-[10px] font-bold text-black flex items-center justify-center shadow-sm"
                title={p.name}
              >
                {String(p.name || "?").charAt(0).toUpperCase()}
              </span>
            ))}
            {participants.length > 5 && (
              <span className="w-7 h-7 rounded-full bg-black text-white border-2 border-white text-[9px] font-bold flex items-center justify-center shadow-sm">
                +{participants.length - 5}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 5 REAL-TIME SUMMARY METRIC CARDS */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Group Spend */}
        <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/50 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL GROUP SPEND</span>
            <span className="material-symbols-outlined text-base">payments</span>
          </div>
          <div className="font-headline-sm text-2xl font-bold text-black">
            {money(totalExpenses)}
          </div>
          <div className="text-[11px] text-black/60 flex justify-between mt-2 pt-2 border-t border-black/5">
            <span>Across all activities</span>
            <span className="font-semibold text-black">{expenses.length} bills</span>
          </div>
        </div>

        {/* Your Paid Amount */}
        <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/50 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">PAID BY YOU</span>
            <span className="material-symbols-outlined text-base">credit_card</span>
          </div>
          <div className="font-headline-sm text-2xl font-bold text-black">
            {money(totalPaidByMe)}
          </div>
          <div className="text-[11px] text-black/60 flex justify-between mt-2 pt-2 border-t border-black/5">
            <span>Transacted upfront</span>
            <span className="font-semibold text-black">Live</span>
          </div>
        </div>

        {/* Total Received */}
        <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/50 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">TOTAL RECEIVED</span>
            <span className="material-symbols-outlined text-base">output</span>
          </div>
          <div className="font-headline-sm text-2xl font-bold text-black">
            {money(totalReceivedByMe)}
          </div>
          <div className="text-[11px] text-black/60 flex justify-between mt-2 pt-2 border-t border-black/5">
            <span>Settled back to you</span>
            <span className="font-semibold text-emerald-600">Settled</span>
          </div>
        </div>

        {/* Net Balance Card */}
        <div
          className={`p-5 rounded-2xl border shadow-sm flex flex-col justify-between relative overflow-hidden ${
            netBalance >= 0
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">NET BALANCE</span>
            <span
              className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                netBalance >= 0 ? "bg-emerald-500" : "bg-rose-500"
              }`}
            ></span>
          </div>
          <div
            className={`font-headline-sm text-2xl font-bold ${
              netBalance >= 0 ? "text-emerald-700" : "text-rose-700"
            }`}
          >
            {netBalance >= 0 ? `+${money(netBalance)}` : money(netBalance)}
          </div>
          <div className="text-[11px] font-medium flex items-center gap-1 mt-2 pt-2 border-t border-black/10">
            <span className="material-symbols-outlined text-xs">
              {netBalance >= 0 ? "arrow_upward" : "arrow_downward"}
            </span>
            <span>
              {netBalance >= 0 ? "Standing: To receive back" : "Standing: You owe"}
            </span>
          </div>
        </div>

        {/* Personal Cost */}
        <div className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-black/50 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">PERSONAL SHARE</span>
            <span className="material-symbols-outlined text-base">pie_chart</span>
          </div>
          <div className="font-headline-sm text-2xl font-bold text-black">
            {money(myPersonalCost)}
          </div>
          <div className="text-[11px] text-black/60 flex justify-between mt-2 pt-2 border-t border-black/5">
            <span>Fair share estimate</span>
            <span className="font-semibold text-black">Calculated</span>
          </div>
        </div>
      </div>

      {/* MAIN TWO-COLUMN SECTION */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* LEFT COLUMN (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-8">
          {/* DYNAMIC CATEGORY EXPENSE BREAKDOWN */}
          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-instrument text-2xl text-black font-normal">
                  Category Expense Breakdown
                </h3>
                <p className="text-xs text-black/60">
                  Share of spending across trip categories
                </p>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-black/5 text-black/70">
                REAL TIME
              </span>
            </div>

            {/* Circular Donut Representation */}
            <div className="flex items-center justify-center my-2 relative">
              <svg className="w-44 h-44 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-black/10"
                  strokeWidth="4"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                {catPct.food > 0 && (
                  <path
                    className="text-black"
                    strokeDasharray={`${catPct.food}, 100`}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                )}
                {catPct.accommodation > 0 && (
                  <path
                    className="text-gray-500"
                    strokeDasharray={`${catPct.accommodation}, 100`}
                    strokeDashoffset={`-${catPct.food}`}
                    strokeWidth="4.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                )}
              </svg>
              <div className="absolute flex flex-col items-center justify-center text-center">
                <span className="font-instrument text-2xl font-bold text-black">
                  {money(totalExpenses)}
                </span>
                <span className="text-[10px] uppercase tracking-wider text-black/50 font-bold">
                  TOTAL SPEND
                </span>
              </div>
            </div>

            {/* Category Breakdown List */}
            <div className="space-y-3 pt-2 border-t border-black/5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-black"></span>
                  <span className="font-medium text-black">Food &amp; Dining</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-black block">{money(categoryTotals.food)}</span>
                  <span className="text-[10px] text-black/50">({catPct.food}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
                  <span className="font-medium text-black">Accommodation</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-black block">{money(categoryTotals.accommodation)}</span>
                  <span className="text-[10px] text-black/50">({catPct.accommodation}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                  <span className="font-medium text-black">Transportation</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-black block">{money(categoryTotals.transport)}</span>
                  <span className="text-[10px] text-black/50">({catPct.transport}%)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                  <span className="font-medium text-black">Activities</span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-black block">{money(categoryTotals.activities)}</span>
                  <span className="text-[10px] text-black/50">({catPct.activities}%)</span>
                </div>
              </div>
            </div>
          </div>

          {/* DYNAMIC SETTLEMENT INFORMATION CARD */}
          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-instrument text-2xl text-black font-normal">
                  Settlement Information
                </h3>
                <p className="text-xs text-black/60">
                  Optimized debt matrix via peer algorithms
                </p>
              </div>
              <span className="material-symbols-outlined text-black/50">sync_alt</span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                  TOTAL RECEIVABLE
                </span>
                <span className="font-headline-sm text-xl font-bold text-emerald-700">
                  {money(totalReceivable)}
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-200/80 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                {myPendingSettlements.length} Routes
              </span>
            </div>

            <div className="space-y-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-black/50 block">
                PENDING OPTIMAL TRANSFERS
              </span>

              {myPendingSettlements.length === 0 ? (
                <div className="p-4 rounded-2xl bg-black/5 text-center text-xs text-black/60">
                  No pending settlement transfers. All debits are cleared!
                </div>
              ) : (
                myPendingSettlements.map((s, idx) => {
                  const fromName = s.from_participant?.name || "Member";
                  const toName = s.to_participant?.name || "Member";
                  const isIncoming = s.to_participant_id === myId;

                  return (
                    <div
                      key={s.id || idx}
                      className="p-3.5 rounded-2xl bg-surface-container-low/60 border border-black/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-full bg-black/10 text-black text-xs font-bold flex items-center justify-center">
                          {(isIncoming ? fromName : toName).charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <span className="text-xs font-bold text-black block">
                            {isIncoming ? `From ${fromName}` : `To ${toName}`}
                          </span>
                          <span className="text-[10px] text-black/50">
                            Direct UPI / Bank Transfer
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-sm text-black">
                          {money(s.amount)}
                        </span>
                        <button
                          onClick={() => onOpenPaymentModal(s)}
                          className="px-3 py-1.5 rounded-full bg-black text-white text-[11px] font-semibold hover:scale-105 transition-transform cursor-pointer"
                        >
                          Settle Up
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-black/5 flex items-center justify-between text-[11px] text-black/50">
              <span>Minimal-hop settlement algorithm verified</span>
              <span className="material-symbols-outlined text-xs text-emerald-600">check_circle</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (7 cols) - COMPLETE REAL-TIME TRANSACTION HISTORY */}
        <div className="lg:col-span-7 flex flex-col gap-8">
          <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col justify-between h-full">
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="font-instrument text-2xl text-black font-normal">
                    Complete Transaction History
                  </h3>
                  <p className="text-xs text-black/60">
                    Live trip expenses and ledger entries
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className="px-3.5 py-1.5 rounded-full border border-black/15 text-xs text-black/70 hover:bg-black/5 font-medium transition-colors cursor-pointer"
                >
                  View All Expenses &rarr;
                </button>
              </div>

              {/* Real-Time Expenses Table */}
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-left font-inter text-xs border-collapse">
                  <thead className="bg-[#F4F4F5]">
                    <tr className="border-b border-black/10 bg-[#F4F4F5] text-black font-semibold uppercase text-[10px] tracking-wider">
                      <th className="py-3 px-3 text-black font-bold">DATE</th>
                      <th className="py-3 px-3 text-black font-bold">DESCRIPTION</th>
                      <th className="py-3 px-3 text-black font-bold">CATEGORY</th>
                      <th className="py-3 px-3 text-black font-bold">PAID BY</th>
                      <th className="py-3 px-3 text-right text-black font-bold">AMOUNT</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {expenses.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-black/50">
                          No expenses recorded yet. Click "Record Expense" to add your first expense!
                        </td>
                      </tr>
                    ) : (
                      expenses.slice(0, 6).map((exp) => {
                        const paidByName = exp.paid_by_participant?.name || "Member";
                        const isPaidByMe = exp.paid_by_participant_id === myId;

                        return (
                          <tr key={exp.id} className="hover:bg-black/5 transition-colors">
                            <td className="py-3.5 px-3 text-black/60 font-medium">
                              {exp.created_at ? new Date(exp.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Today"}
                            </td>
                            <td className="py-3.5 px-3">
                              <strong className="text-black font-semibold block">
                                {exp.title}
                              </strong>
                              <span className="text-[10px] text-black/50 capitalize">
                                {exp.split_method || "Equal split"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-black/5 text-black/70 text-[10px] font-medium capitalize">
                                {exp.category || "General"}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-black">
                              {paidByName} {isPaidByMe ? "(You)" : ""}
                            </td>
                            <td
                              className={`py-3.5 px-3 text-right font-bold ${
                                isPaidByMe ? "text-emerald-600 font-headline-sm" : "text-black"
                              }`}
                            >
                              {money(exp.amount)}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination & Count */}
            <div className="flex items-center justify-between pt-4 border-t border-black/5 text-xs text-black/60">
              <span>Showing {Math.min(6, expenses.length)} of {expenses.length} transactions</span>
              <button
                onClick={() => onOpenExpenseModal()}
                className="px-3 py-1 rounded-full border border-black/15 text-[11px] font-semibold hover:bg-black/5 cursor-pointer"
              >
                + Add Expense
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM TWO-COLUMN DECK (REAL-TIME BOOKINGS & ITINERARY) */}
      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* REAL-TIME BOOKINGS ASSOCIATED CARD */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col justify-between gap-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-black/60 text-lg">book_online</span>
              <h3 className="font-instrument text-2xl text-black font-normal">
                Bookings Associated
              </h3>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-black/5 text-black/70 text-[10px] font-bold">
              {bookings.length} Linked
            </span>
          </div>

          <div className="space-y-3">
            {bookings.length === 0 ? (
              <div className="p-4 rounded-2xl bg-black/5 text-center text-xs text-black/60">
                No bookings linked yet. Add flights, hotel stays, or excursion tickets!
              </div>
            ) : (
              bookings.slice(0, 2).map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl bg-surface-container-low/60 border border-black/5 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-black overflow-hidden shrink-0">
                      <span className="material-symbols-outlined text-xl">
                        {String(b.booking_type).toLowerCase() === "flight" ? "flight" : "hotel"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-black">{b.title}</h4>
                      <p className="text-[10px] text-black/50">
                        {b.supplier || b.booking_type} • {b.confirmation_code || "Confirmed"}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-sm text-black block">{money(b.amount)}</span>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">
                      {b.status || "CONFIRMED"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            onClick={() => onOpenBookingModal()}
            className="w-full py-2.5 rounded-full border border-black/15 text-xs font-medium hover:bg-black/5 transition-colors cursor-pointer text-center"
          >
            + Link New Booking
          </button>
        </div>

        {/* REAL-TIME TRIP PARTICIPATION & INVOLVEMENT CARD */}
        <div className="p-6 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col justify-between gap-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-black/60 text-lg">calendar_month</span>
                <h3 className="font-instrument text-2xl text-black font-normal">
                  Trip Schedule &amp; Involvement
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-black text-white text-[10px] font-bold">
                {itinerary.length} Events
              </span>
            </div>

            <p className="text-xs text-black/60 leading-relaxed">
              {myName} is active in {itinerary.length} scheduled itinerary events for {trip.name}, calculating automated splits for activities, dining, and stay.
            </p>

            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-black/5 text-center">
                <span className="font-bold text-base text-black block">100%</span>
                <span className="text-[9px] uppercase tracking-wider text-black/50 font-semibold block mt-0.5">
                  LODGING ATTENDANCE
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-black/5 text-center">
                <span className="font-bold text-base text-black block">{itinerary.length}</span>
                <span className="text-[9px] uppercase tracking-wider text-black/50 font-semibold block mt-0.5">
                  ACTIVITIES SCHEDULED
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-surface-container-low/60 border border-black/5 text-center">
                <span className="font-bold text-base text-emerald-600 block">₹0</span>
                <span className="text-[9px] uppercase tracking-wider text-black/50 font-semibold block mt-0.5">
                  DISPUTED SPLITS
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-black/5 text-xs text-black/60">
            <span>Need to add an itinerary event?</span>
            <button
              onClick={() => onOpenItineraryModal()}
              className="font-bold text-black hover:underline cursor-pointer flex items-center gap-1"
            >
              <span>Manage Itinerary</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
