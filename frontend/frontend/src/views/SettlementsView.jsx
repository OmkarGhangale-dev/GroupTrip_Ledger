import React from "react";
import { useTrip } from "../context/TripContext";

export default function SettlementsView({ onOpenPaymentModal }) {
  const { settlements, reload } = useTrip();

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="flex flex-col w-full">
      {/* Immersive Hero Header */}
      <div className="relative w-full overflow-hidden -mt-16 pt-24 pb-14 px-6 md:px-12 bg-gradient-to-b from-surface-container-lowest via-surface-container-low to-background">
        <div className="absolute -top-24 right-1/4 w-[520px] h-[340px] bg-gradient-to-br from-primary-container/20 to-tertiary-container/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col gap-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="flex flex-col max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-secondary-container/40 backdrop-blur-md w-fit mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">OPTIMAL DEBT SIMPLIFICATION</span>
                <span className="text-secondary/60 text-xs">•</span>
                <span className="font-label-sm text-label-sm text-secondary">GOA EXPEDITION '24</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none mb-3">
                Smart Settlements
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Our debt minimization algorithm collapses circular debits down to the minimum possible number of direct peer transfers.
              </p>
            </div>
            <button
              className="flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container-high hover:bg-surface-bright text-on-surface font-label-md text-label-md transition-all shadow-md cursor-pointer sm:self-start lg:self-end border border-white/5"
              onClick={() => reload()}
            >
              <span className="material-symbols-outlined text-base text-primary">sync</span>
              <span>Re-calculate</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Interaction Area */}
      <div className="w-full px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-8">
        {settlements.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl bg-surface-container-low/60 backdrop-blur-2xl p-12 text-center flex flex-col items-center justify-center gap-4 shadow-xl border border-white/5">
            <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-4xl shadow-[0_0_32px_rgba(52,211,153,0.3)]">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface font-semibold tracking-tight">All Square!</h2>
            <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
              There are no pending debts or split discrepancies for this trip. Everyone has paid their fair share.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="p-6 rounded-xl bg-surface-container-low/80 backdrop-blur-md shadow-md border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {settlements.length} Transaction{settlements.length === 1 ? "" : "s"} Required to Clear All Debts
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Follow the step-by-step payment instructions below to balance the expedition ledger with minimum friction.
                </p>
              </div>
              <span className="px-3.5 py-1.5 rounded-full bg-secondary-container/50 text-on-secondary-container font-label-sm text-label-sm font-bold uppercase tracking-wider self-start md:self-auto border border-secondary/30">
                Optimized
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {settlements.map((s, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-surface-container-low/70 backdrop-blur-md shadow-xl border border-white/5 flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between">
                    <span className="font-label-sm text-label-sm font-bold tracking-widest text-primary uppercase">
                      STEP {idx + 1} OF {settlements.length}
                    </span>
                    <span className="material-symbols-outlined text-secondary text-base">hub</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 my-2">
                    {/* FROM USER */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 font-bold flex items-center justify-center text-lg mb-2 shadow-[0_0_16px_rgba(248,113,113,0.3)] border border-rose-500/30">
                        {s.from_name.charAt(0).toUpperCase()}
                      </div>
                      <strong className="text-on-surface font-semibold text-sm">{s.from_name}</strong>
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider mt-0.5">Owes</span>
                    </div>

                    {/* TRANSFER GRAPHIC */}
                    <div className="flex flex-col items-center flex-1">
                      <span className="px-3 py-1 rounded-full bg-primary-container text-on-primary-container font-bold text-xs shadow-[0_0_12px_rgba(255,154,77,0.4)]">
                        {money(s.amount)}
                      </span>
                      <span className="material-symbols-outlined text-primary text-xl my-1">east</span>
                      <span className="text-[10px] text-on-surface-variant/70 uppercase tracking-widest">Direct</span>
                    </div>

                    {/* TO USER */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center text-lg mb-2 shadow-[0_0_16px_rgba(52,211,153,0.3)] border border-emerald-500/30">
                        {s.to_name.charAt(0).toUpperCase()}
                      </div>
                      <strong className="text-on-surface font-semibold text-sm">{s.to_name}</strong>
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">Gets Paid</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/5 flex items-center justify-between gap-3">
                    <p className="font-body-sm text-body-sm text-on-surface-variant">
                      Transfer <strong className="text-on-surface">{money(s.amount)}</strong> to <strong className="text-on-surface">{s.to_name}</strong>
                    </p>

                    <button
                      className="px-4 py-2 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md font-bold shadow-[0_0_16px_rgba(255,154,77,0.3)] transition-all cursor-pointer shrink-0"
                      onClick={() =>
                        onOpenPaymentModal({
                          from_participant_id: s.from_participant_id,
                          to_participant_id: s.to_participant_id,
                          amount: s.amount,
                          note: `Settlement payment to ${s.to_name}`,
                        })
                      }
                    >
                      Mark Settled
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
