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
            <div className="flex flex-col items-start gap-2.5 max-w-2xl">
              <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-black font-label-sm text-xs uppercase tracking-widest font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
                <span>OPTIMAL DEBT SIMPLIFICATION</span>
                <span>•</span>
                <span>GOA EXPEDITION '24</span>
              </div>
              <h1 className="font-instrument text-5xl md:text-6xl text-on-surface font-normal tracking-tight leading-none">
                Smart Settlements
              </h1>
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

            <div className={`grid grid-cols-1 ${settlements.length > 1 ? "md:grid-cols-2" : "max-w-2xl"} gap-6`}>
              {settlements.map((s, idx) => (
                <div key={idx} className="p-7 rounded-3xl bg-white border border-black/10 shadow-sm flex flex-col justify-between gap-6">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold tracking-widest text-black/60 uppercase">
                      STEP {idx + 1} OF {settlements.length}
                    </span>
                    <span className="material-symbols-outlined text-black/40 text-lg">hub</span>
                  </div>

                  <div className="flex items-center justify-between gap-4 py-4 px-6 rounded-2xl bg-black/5 border border-black/5">
                    {/* FROM USER */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-rose-50 text-rose-600 font-bold flex items-center justify-center text-xl mb-2 border border-rose-200 shadow-sm">
                        {s.from_name.charAt(0).toUpperCase()}
                      </div>
                      <strong className="text-black font-bold text-sm">{s.from_name}</strong>
                      <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider mt-0.5">Owes</span>
                    </div>

                    {/* TRANSFER GRAPHIC */}
                    <div className="flex flex-col items-center flex-1">
                      <span className="px-3.5 py-1.5 rounded-full bg-black text-white font-bold text-xs shadow-sm">
                        {money(s.amount)}
                      </span>
                      <span className="material-symbols-outlined text-black/40 text-xl my-1">east</span>
                      <span className="text-[10px] text-black/40 font-bold uppercase tracking-widest">Direct</span>
                    </div>

                    {/* TO USER */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 font-bold flex items-center justify-center text-xl mb-2 border border-emerald-200 shadow-sm">
                        {s.to_name.charAt(0).toUpperCase()}
                      </div>
                      <strong className="text-black font-bold text-sm">{s.to_name}</strong>
                      <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider mt-0.5">Gets Paid</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <p className="text-xs text-black/70">
                      Transfer <strong className="text-black font-bold">{money(s.amount)}</strong> to <strong className="text-black font-bold">{s.to_name}</strong>
                    </p>

                    <button
                      className="px-5 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white font-bold text-xs shadow-sm hover:scale-105 transition-all cursor-pointer shrink-0 self-start sm:self-auto"
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
