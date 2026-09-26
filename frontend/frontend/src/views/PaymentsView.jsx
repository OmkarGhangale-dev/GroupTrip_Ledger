import React from "react";
import { useTrip } from "../context/TripContext";

export default function PaymentsView({ onOpenPaymentModal }) {
  const { payments, balances, participants, removePayment, totalPaymentsAmount } =
    useTrip();

  const getParticipantName = (id) => {
    const p = participants.find((item) => item.id === id);
    return p ? p.name : "Member";
  };

  const handleDelete = async (payment) => {
    if (
      window.confirm(
        `Are you sure you want to delete this payment record of ₹${payment.amount}?`
      )
    ) {
      await removePayment(payment.id);
    }
  };

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
                <span className="font-label-sm text-label-sm uppercase tracking-widest text-primary font-bold">FINANCIAL LEDGER</span>
                <span className="text-secondary/60 text-xs">•</span>
                <span className="font-label-sm text-label-sm text-secondary">GOA EXPEDITION '24</span>
              </div>
              <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight leading-none mb-3">
                Payments &amp; Balances
              </h1>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-xl">
                Live net balances and history of peer-to-peer payments and debt settlements under the twilight ledger.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 sm:self-start lg:self-end">
              <div className="flex items-center gap-3.5 px-5 py-3 rounded-xl bg-surface-container/60 backdrop-blur-xl shadow-lg border border-white/5">
                <div className="w-10 h-10 rounded-lg bg-surface-container-highest flex items-center justify-center text-primary shadow-[0_0_16px_rgba(255,154,77,0.2)]">
                  <span className="material-symbols-outlined text-2xl">swap_horiz</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">TOTAL TRANSFERRED</span>
                  <span className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">{money(totalPaymentsAmount)}</span>
                </div>
              </div>
              <button
                className="group flex items-center gap-3 px-6 py-3.5 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md text-label-md transition-all duration-300 shadow-[0_0_24px_rgba(255,154,77,0.32)] hover:shadow-[0_0_32px_rgba(255,154,77,0.48)] cursor-pointer disabled:opacity-50"
                onClick={() => onOpenPaymentModal()}
                disabled={participants.length < 2}
              >
                <span className="font-bold tracking-wide">+ Record Payment</span>
                <div className="w-6 h-6 rounded-lg bg-on-primary-container/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <span className="material-symbols-outlined text-base">arrow_forward</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="w-full px-6 md:px-12 py-8 max-w-7xl mx-auto flex flex-col gap-10">
        {/* Net Balances Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Live Net Balances</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Calculated from expenses paid, splits owed, and transfers sent/received.</p>
          </div>

          {balances.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low/60 backdrop-blur-xl p-8 text-center text-on-surface-variant border border-white/5">
              <span className="material-symbols-outlined text-4xl text-secondary mb-2">account_balance</span>
              <p>No balances to display yet. Add expenses to calculate standing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {balances.map((b) => {
                const isPositive = b.net_balance > 0.01;
                const isNegative = b.net_balance < -0.01;

                return (
                  <div key={b.participant_id} className="p-5 rounded-xl bg-surface-container-low/70 backdrop-blur-md shadow-md border border-white/5 flex flex-col justify-between gap-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-secondary-container text-on-surface font-bold flex items-center justify-center text-sm shadow-[0_0_12px_rgba(85,45,170,0.3)]">
                          {b.participant_name.charAt(0).toUpperCase()}
                        </div>
                        <strong className="text-on-surface font-semibold">{b.participant_name}</strong>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                        isPositive
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : isNegative
                          ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                          : "bg-surface-container text-on-surface-variant"
                      }`}>
                        {isPositive ? "Gets Back" : isNegative ? "Owes" : "Settled"}
                      </span>
                    </div>

                    <div>
                      <div className={`font-headline-lg text-headline-lg font-bold ${
                        isPositive ? "text-emerald-400" : isNegative ? "text-rose-400" : "text-on-surface"
                      }`}>
                        {isPositive ? `+${money(b.net_balance)}` : money(b.net_balance)}
                      </div>
                      <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                        {isPositive
                          ? `Should receive ${money(b.net_balance)} from group`
                          : isNegative
                          ? `Needs to pay ${money(Math.abs(b.net_balance))} to group`
                          : "Fully squared up with everyone"}
                      </p>
                    </div>

                    {isNegative && (
                      <button
                        className="w-full py-2 px-3 rounded-xl bg-secondary-container hover:bg-secondary-container/80 text-on-surface font-label-md text-label-md font-semibold transition-all shadow-[0_0_12px_rgba(85,45,170,0.3)] cursor-pointer"
                        onClick={() =>
                          onOpenPaymentModal({
                            from_participant_id: b.participant_id,
                            amount: Math.abs(b.net_balance),
                          })
                        }
                      >
                        Pay Debt
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History Section */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col">
            <h2 className="font-headline-sm text-headline-sm text-on-surface font-semibold">Payment History</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Log of all settled transfers between participants.</p>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-xl bg-surface-container-low/60 backdrop-blur-xl p-12 text-center flex flex-col items-center justify-center gap-3 border border-white/5">
              <div className="w-16 h-16 rounded-full bg-secondary-container/40 flex items-center justify-center text-primary shadow-[0_0_24px_rgba(255,154,77,0.2)]">
                <span className="material-symbols-outlined text-3xl">history_edu</span>
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">No Payments Recorded Yet</h3>
              <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                When someone settles up via cash or UPI, record the transaction here to update balances.
              </p>
              <button
                className="mt-2 px-6 py-3 rounded-xl bg-secondary-container text-on-surface font-label-md text-label-md font-bold shadow-[0_0_18px_rgba(85,45,170,0.4)] hover:bg-secondary-container/80 transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onOpenPaymentModal()}
                disabled={participants.length < 2}
              >
                + Record First Payment
              </button>
            </div>
          ) : (
            <div className="rounded-xl bg-surface-container-low/60 backdrop-blur-xl shadow-md border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-surface-container-lowest/50 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                      <th className="py-4 px-6">Payer (From)</th>
                      <th className="py-4 px-6">Payee (To)</th>
                      <th className="py-4 px-6">Amount</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Note</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-body-md text-body-md text-on-surface">
                    {payments.map((p) => {
                      const fromName = getParticipantName(p.from_participant_id);
                      const toName = getParticipantName(p.to_participant_id);

                      return (
                        <tr key={p.id} className="hover:bg-surface-container/30 transition-colors">
                          <td className="py-4 px-6 font-semibold text-on-surface">{fromName}</td>
                          <td className="py-4 px-6 font-semibold text-on-surface">{toName}</td>
                          <td className="py-4 px-6 font-bold text-primary">{money(p.amount)}</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase border border-emerald-500/30">
                              {p.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-on-surface-variant">
                            {p.payment_date
                              ? new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "Recently"}
                          </td>
                          <td className="py-4 px-6 text-xs text-on-surface-variant">{p.note || "Settlement"}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-error/80 hover:text-error hover:bg-error-container/20 transition-colors cursor-pointer text-xs font-semibold"
                              onClick={() => handleDelete(p)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
