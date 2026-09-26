import React, { useState } from "react";
import { useTrip } from "../context/TripContext";
import InviteCard from "../components/InviteCard";

export default function ParticipantsView({ onOpenParticipantModal }) {
  const { participants, removeParticipant } = useTrip();
  const [search, setSearch] = useState("");

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  const filtered = participants.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.email && p.email.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="w-full min-h-screen px-6 lg:px-12 py-8">
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-container-high/70 text-primary font-label-sm text-label-sm uppercase tracking-widest">
              • Trip Members • Goa Expedition '24
            </span>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <h1 className="font-display-hero text-display-hero text-on-surface tracking-tight leading-none">
                Participants <em className="font-editorial text-primary font-normal">({participants.length})</em>
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Manage everyone travelling in this trip, their expedition roles, and automated settlement balances across the journey.
              </p>
            </div>

            <button
              onClick={() =>
                document
                  .getElementById("invite-card")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
              className="px-4 py-2.5 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-surface font-label-md text-label-md font-semibold transition-all shadow-md"
            >
              Invite Members
            </button>
          </div>
        </div>

        {/* METRIC SUMMARY DECK */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl p-5 bg-surface-container/60 backdrop-blur-xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/30 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">Party Roster</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">{participants.length} Confirmed</span>
            </div>
          </div>

          <div className="rounded-xl p-5 bg-surface-container/60 backdrop-blur-xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-2xl">account_balance</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">Net Outstanding</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">₹0.00</span>
            </div>
          </div>

          <div className="rounded-xl p-5 bg-surface-container/60 backdrop-blur-xl border border-white/5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-secondary-container/40 flex items-center justify-center text-secondary">
              <span className="material-symbols-outlined text-2xl">shield</span>
            </div>
            <div>
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-on-surface-variant block">Leadership</span>
              <span className="font-headline-sm text-headline-sm text-on-surface font-semibold">1 Organizer</span>
            </div>
          </div>
        </div>

        {/* SEARCH & FILTER BAR */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-80 relative">
            <input
              type="text"
              placeholder="Search by name, email, or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-surface-container/80 border border-white/10 text-on-surface font-body-sm text-body-sm focus:border-primary outline-none"
            />
            <span className="material-symbols-outlined text-on-surface-variant text-lg absolute left-3 top-3">search</span>
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high/60 text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-base">filter_list</span>
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-surface-container-high/60 text-on-surface font-label-md text-label-md hover:bg-surface-container-high transition-colors">
              <span className="material-symbols-outlined text-base">download</span>
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* PARTICIPANTS TABLE */}
        <div className="rounded-2xl bg-surface-container/60 backdrop-blur-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">MEMBER</th>
                  <th className="px-6 py-4">EMAIL</th>
                  <th className="px-6 py-4">ROLE</th>
                  <th className="px-6 py-4">STATUS</th>
                  <th className="px-6 py-4">NET BALANCE</th>
                  <th className="px-6 py-4 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-on-surface-variant">
                      No travelers found in roster.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, idx) => (
                    <tr key={p.id || idx} className="hover:bg-surface-container/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container font-bold flex items-center justify-center">
                            {p.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <strong className="font-title-md text-title-md text-on-surface">{p.name}</strong>
                              {idx === 0 && (
                                <span className="px-1.5 py-0.5 rounded bg-primary-container text-on-primary-container text-[10px] font-bold">YOU</span>
                              )}
                            </div>
                            <span className="text-on-surface-variant text-xs block">Expedition Pioneer</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-on-surface block">{p.email || "mhatreshreya111@gmail.com"}</span>
                        <span className="text-on-surface-variant text-xs flex items-center gap-1">
                          <span className="material-symbols-outlined text-xs">calendar_today</span>
                          Joined 26/9/2026
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full bg-secondary-container/40 text-on-secondary-container font-label-sm text-label-sm font-bold flex items-center gap-1 w-fit">
                          <span className="material-symbols-outlined text-sm">shield</span>
                          ORGANIZER
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-1.5 text-secondary font-semibold text-xs">
                          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                          ACTIVE
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <strong className="text-on-surface font-title-md text-title-md block">₹0</strong>
                        <span className="text-on-surface-variant text-xs font-semibold uppercase">SETTLED</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onOpenParticipantModal(p)}
                            className="p-1.5 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => removeParticipant(p.id)}
                            className="p-1.5 rounded-lg text-error hover:bg-error-container/20 transition-colors"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 bg-surface-container-low flex items-center justify-between font-body-sm text-body-sm text-on-surface-variant">
            <span>Showing {filtered.length} of {participants.length} participant{participants.length === 1 ? "" : "s"}</span>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1 rounded-lg bg-surface-container/40 text-on-surface-variant/40 text-xs">Previous</button>
              <button className="px-3 py-1 rounded-lg bg-secondary-container text-on-surface text-xs font-bold">1</button>
              <button disabled className="px-3 py-1 rounded-lg bg-surface-container/40 text-on-surface-variant/40 text-xs">Next</button>
            </div>
          </div>
        </div>

                {/* BOTTOM INVITE BANNER */}
        <div id="invite-card">
          <InviteCard />
        </div>
      </div>
    </div>
  );
}
