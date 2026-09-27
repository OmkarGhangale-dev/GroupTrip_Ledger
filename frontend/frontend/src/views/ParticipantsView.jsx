import React, { useState } from "react";
import { useTrip } from "../context/TripContext";
import InviteCard from "../components/InviteCard";

export default function ParticipantsView({ onOpenParticipantModal }) {
  const { trip, participants, balances, removeParticipant } = useTrip();
  const [search, setSearch] = useState("");

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;
  const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-IN") : "Recently");

  let me = {};
  try {
    me = JSON.parse(localStorage.getItem("user") || "{}");
  } catch {
    me = {};
  }
  const isMe = (p) =>
    p.email && me.email && p.email.toLowerCase() === me.email.toLowerCase();

  const getBalance = (id) => {
    const b = (balances || []).find((x) => x.participant_id === id);
    return b ? Number(b.net_balance) || 0 : 0;
  };

  const organizerCount = participants.filter((p) => p.role === "organizer").length;
  const netOutstanding = (balances || []).reduce(
    (sum, b) => sum + (Number(b.net_balance) > 0 ? Number(b.net_balance) : 0),
    0
  );

  const q = search.toLowerCase();
  const filtered = participants.filter(
    (p) =>
      String(p.name || "").toLowerCase().includes(q) ||
      String(p.email || "").toLowerCase().includes(q) ||
      String(p.role || "").toLowerCase().includes(q)
  );

  return (
    <div className="w-full min-h-screen px-6 lg:px-12 py-8 font-inter text-black">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col items-start gap-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-black font-label-sm text-xs uppercase tracking-widest font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
              <span>TRIP MEMBERS</span>
              <span>•</span>
              <span>{trip?.name || "GOA TRIP"}</span>
            </div>
            <h1 className="font-instrument text-5xl md:text-6xl text-black tracking-tight leading-none font-normal">
              Participants <em className="italic text-black/60">({participants.length})</em>
            </h1>
          </div>

          <button
            type="button"
            onClick={() =>
              document
                .getElementById("invite-card")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="group flex items-center bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-full overflow-hidden shadow-md hover:scale-105 transition-all cursor-pointer self-start lg:self-auto"
          >
            <span className="px-5 py-3 font-bold">+ Invite Member</span>
            <span className="w-10 h-10 bg-white/20 flex items-center justify-center text-white group-hover:translate-x-0.5 transition-transform">
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </span>
          </button>
        </div>

        {/* METRIC SUMMARY DECK */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl p-5 bg-white border border-black/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-black">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">Party Roster</span>
              <span className="font-instrument text-2xl text-black font-bold">{participants.length} Confirmed</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white border border-black/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-black">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">Net Outstanding</span>
              <span className="font-instrument text-2xl text-black font-bold">{money(netOutstanding)}</span>
            </div>
          </div>

          <div className="rounded-2xl p-5 bg-white border border-black/10 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black/5 flex items-center justify-center text-black">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-black/50 block">Leadership</span>
              <span className="font-instrument text-2xl text-black font-bold">
                {organizerCount} Organizer{organizerCount === 1 ? "" : "s"}
              </span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative flex items-center">
            <span className="material-symbols-outlined text-black/40 text-lg absolute left-3 pointer-events-none">search</span>
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-black/15 text-black placeholder:text-black/40 text-xs focus:outline-none focus:ring-1 focus:ring-black shadow-sm"
            />
          </div>
        </div>

        {/* PARTICIPANTS TABLE */}
        <div className="rounded-3xl bg-white border border-black/10 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F4F4F5]">
                <tr className="bg-[#F4F4F5] text-black font-semibold uppercase text-[10px] tracking-wider border-b border-black/10">
                  <th className="px-6 py-4 text-black font-bold">MEMBER</th>
                  <th className="px-6 py-4 text-black font-bold">EMAIL</th>
                  <th className="px-6 py-4 text-black font-bold">ROLE</th>
                  <th className="px-6 py-4 text-black font-bold">STATUS</th>
                  <th className="px-6 py-4 text-black font-bold">NET BALANCE</th>
                  <th className="px-6 py-4 text-right text-black font-bold">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-black/50">
                      No travelers found in roster.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => {
                    const bal = getBalance(p.id);
                    const owed = bal > 0.01;
                    const owes = bal < -0.01;
                    const isOrganizer = p.role === "organizer";
                    const removed = p.status === "removed";

                    return (
                      <tr key={p.id} className="hover:bg-black/5 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-black/10 text-black font-bold flex items-center justify-center text-xs">
                              {String(p.name || "?").charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <strong className="font-bold text-black text-sm">{p.name}</strong>
                                {isMe(p) && (
                                  <span className="px-1.5 py-0.5 rounded bg-black text-white text-[9px] font-bold">YOU</span>
                                )}
                              </div>
                              <span className="text-black/50 text-[11px] block">
                                {isOrganizer ? "Trip organizer" : "Traveler"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-black font-medium block">{p.email}</span>
                          <span className="text-black/50 text-[11px] flex items-center gap-1">
                            <span className="material-symbols-outlined text-xs">calendar_today</span>
                            Joined {fmtDate(p.joined_at || p.created_at)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-fit uppercase ${
                              isOrganizer
                                ? "bg-black/10 text-black"
                                : "bg-black/5 text-black/70"
                            }`}
                          >
                            <span className="material-symbols-outlined text-xs">
                              {isOrganizer ? "shield" : "person"}
                            </span>
                            {isOrganizer ? "Organizer" : "Member"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`flex items-center gap-1.5 font-semibold text-[11px] uppercase ${
                              removed ? "text-rose-600" : "text-emerald-700"
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                removed ? "bg-rose-500" : "bg-emerald-500 animate-pulse"
                              }`}
                            ></span>
                            {removed ? "Removed" : "Active"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <strong
                            className={`text-sm font-bold block ${
                              owed ? "text-emerald-700" : owes ? "text-rose-600" : "text-black"
                            }`}
                          >
                            {owed ? "+" : owes ? "-" : ""}
                            {money(Math.abs(bal))}
                          </strong>
                          <span className="text-black/50 text-[10px] font-semibold uppercase">
                            {owed ? "Gets back" : owes ? "Owes" : "Settled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => onOpenParticipantModal(p)}
                              className="p-1.5 rounded-full text-black/60 hover:text-black hover:bg-black/5 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => removeParticipant(p.id)}
                              className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-base">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3.5 bg-[#F4F4F5] border-t border-black/10 flex items-center justify-between text-xs text-black/60">
            <span>
              Showing {filtered.length} of {participants.length} participant
              {participants.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* INVITE */}
        <div id="invite-card">
          <InviteCard />
        </div>
      </div>
    </div>
  );
}