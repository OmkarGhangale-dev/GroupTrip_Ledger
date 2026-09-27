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
    <div className="flex flex-col w-full font-inter text-black px-6 md:px-12 py-8">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-8">
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 border-b border-black/10 pb-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="flex flex-col items-start gap-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-black/5 border border-black/10 text-black font-label-sm text-xs uppercase tracking-widest font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping"></span>
              <span>FINANCIAL TRANSFERS</span>
              <span>•</span>
              <span>EXPEDITION LEDGER</span>
            </div>
            <h1 className="font-instrument text-5xl md:text-6xl text-black font-normal tracking-tight leading-none">
              Payments &amp; <em className="italic text-black/60">Balances</em>
            </h1>
          </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white border border-black/10 shadow-sm">
                <span className="material-symbols-outlined text-black/60 text-lg">swap_horiz</span>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-black/50">TOTAL TRANSFERRED</span>
                  <span className="font-bold text-sm text-black">{money(totalPaymentsAmount)}</span>
                </div>
              </div>
              <button
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onOpenPaymentModal()}
                disabled={participants.length < 2}
              >
                <span className="material-symbols-outlined text-base">add</span>
                <span>+ Record Payment</span>
              </button>
            </div>
          </div>
        </div>

        {/* Live Net Balances Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-instrument text-3xl text-black font-normal">Live Net Balances</h2>
            <p className="text-xs text-black/60">Calculated from expenses paid, splits owed, and transfers sent/received.</p>
          </div>

          {balances.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/10 p-8 text-center text-black/60 shadow-sm">
              <span className="material-symbols-outlined text-4xl text-black/40 mb-2">account_balance</span>
              <p className="text-sm">No balances to display yet. Add expenses to calculate standing.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {balances.map((b) => {
                const isPositive = b.net_balance > 0.01;
                const isNegative = b.net_balance < -0.01;

                return (
                  <div key={b.participant_id} className="p-5 rounded-2xl bg-white border border-black/10 shadow-sm flex flex-col justify-between h-[210px]">
                    {/* Header Slot */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-black/10 text-black font-bold flex items-center justify-center text-xs">
                          {b.participant_name.charAt(0).toUpperCase()}
                        </div>
                        <strong className="text-black font-bold text-sm">{b.participant_name}</strong>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        isPositive
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isNegative
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-black/5 text-black/60"
                      }`}>
                        {isPositive ? "Gets Back" : isNegative ? "Owes" : "Settled"}
                      </span>
                    </div>

                    {/* Middle Body Slot */}
                    <div className="my-auto">
                      <div className={`font-instrument text-3xl font-bold ${
                        isPositive ? "text-emerald-700" : isNegative ? "text-rose-600" : "text-black"
                      }`}>
                        {isPositive ? `+${money(b.net_balance)}` : money(b.net_balance)}
                      </div>
                      <p className="text-xs text-black/60 mt-1">
                        {isPositive
                          ? `Should receive ${money(b.net_balance)} from group`
                          : isNegative
                          ? `Needs to pay ${money(Math.abs(b.net_balance))} to group`
                          : "Fully squared up with everyone"}
                      </p>
                    </div>

                    {/* Bottom Action Slot */}
                    <div className="h-9 flex items-center">
                      {isNegative ? (
                        <button
                          className="w-full py-2 px-3 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
                          onClick={() =>
                            onOpenPaymentModal({
                              from_participant_id: b.participant_id,
                              amount: Math.abs(b.net_balance),
                            })
                          }
                        >
                          Pay Debt
                        </button>
                      ) : (
                        <div className="w-full h-full"></div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment History Section */}
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="font-instrument text-3xl text-black font-normal">Payment History</h2>
            <p className="text-xs text-black/60">Log of all settled transfers between participants.</p>
          </div>

          {payments.length === 0 ? (
            <div className="rounded-3xl bg-white border border-black/10 p-12 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-black/5 flex items-center justify-center text-black">
                <span className="material-symbols-outlined text-3xl">history_edu</span>
              </div>
              <h3 className="font-instrument text-2xl text-black font-normal">No Payments Recorded Yet</h3>
              <p className="text-xs text-black/60 max-w-md">
                When someone settles up via cash or UPI, record the transaction here to update balances.
              </p>
              <button
                className="mt-2 px-6 py-2.5 rounded-full bg-black hover:bg-slate-800 text-white text-xs font-bold shadow-md hover:scale-105 transition-all cursor-pointer disabled:opacity-50"
                onClick={() => onOpenPaymentModal()}
                disabled={participants.length < 2}
              >
                + Record First Payment
              </button>
            </div>
          ) : (
            <div className="rounded-3xl bg-white border border-black/10 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-inter text-xs border-collapse">
                  <thead className="bg-[#F4F4F5]">
                    <tr className="bg-[#F4F4F5] text-black font-semibold text-[10px] uppercase tracking-wider border-b border-black/10">
                      <th className="py-4 px-6 text-black font-bold">PAYER (FROM)</th>
                      <th className="py-4 px-6 text-black font-bold">PAYEE (TO)</th>
                      <th className="py-4 px-6 text-black font-bold">AMOUNT</th>
                      <th className="py-4 px-6 text-black font-bold">STATUS</th>
                      <th className="py-4 px-6 text-black font-bold">DATE</th>
                      <th className="py-4 px-6 text-black font-bold">NOTE</th>
                      <th className="py-4 px-6 text-right text-black font-bold">ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5">
                    {payments.map((p) => {
                      const fromName = getParticipantName(p.from_participant_id);
                      const toName = getParticipantName(p.to_participant_id);

                      return (
                        <tr key={p.id} className="hover:bg-black/5 transition-colors">
                          <td className="py-4 px-6 font-bold text-black">{fromName}</td>
                          <td className="py-4 px-6 font-bold text-black">{toName}</td>
                          <td className="py-4 px-6 font-bold text-black font-instrument text-base">{money(p.amount)}</td>
                          <td className="py-4 px-6">
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase border border-emerald-300">
                              {p.status || "COMPLETED"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-xs text-black/60">
                            {p.payment_date
                              ? new Date(p.payment_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
                              : "Recently"}
                          </td>
                          <td className="py-4 px-6 text-xs text-black/60">{p.note || "Settlement"}</td>
                          <td className="py-4 px-6 text-right">
                            <button
                              type="button"
                              className="p-1.5 rounded-full text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer text-xs font-semibold"
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
