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
    <div className="view-content">
      <div className="page-header">
        <div>
          <span className="page-label">FINANCIAL LEDGER</span>
          <h1>Payments & Balances</h1>
          <p className="page-description">
            Live net balances and history of peer-to-peer payments and debt
            settlements.
          </p>
        </div>

        <div className="header-actions">
          <div className="summary-pill">
            <small>Total Transferred:</small>
            <strong>{money(totalPaymentsAmount)}</strong>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => onOpenPaymentModal()}
            disabled={participants.length < 2}
          >
            + Record Payment
          </button>
        </div>
      </div>

      {/* NET BALANCES GRID */}
      <div className="section-title-wrap">
        <h2>Live Net Balances</h2>
        <p>Calculated from expenses paid, splits owed, and transfers sent/received.</p>
      </div>

      {balances.length === 0 ? (
        <div className="empty-card-state" style={{ background: "white", borderRadius: "14px", padding: "30px", marginBottom: "30px" }}>
          <p>No balances to display yet. Add expenses to calculate standing.</p>
        </div>
      ) : (
        <div className="balances-card-grid">
          {balances.map((b) => {
            const isPositive = b.net_balance > 0.01;
            const isNegative = b.net_balance < -0.01;

            return (
              <div
                key={b.participant_id}
                className={`balance-metric-card ${
                  isPositive
                    ? "card-positive"
                    : isNegative
                    ? "card-negative"
                    : "card-neutral"
                }`}
              >
                <div className="card-top-row">
                  <div className="member-avatar">
                    {b.participant_name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`balance-status-badge ${
                      isPositive
                        ? "badge-pos"
                        : isNegative
                        ? "badge-neg"
                        : "badge-neu"
                    }`}
                  >
                    {isPositive
                      ? "Gets Back"
                      : isNegative
                      ? "Owes"
                      : "Settled"}
                  </span>
                </div>

                <h3>{b.participant_name}</h3>

                <div className="metric-amount">
                  {isPositive ? `+${money(b.net_balance)}` : money(b.net_balance)}
                </div>

                <p className="balance-explainer">
                  {isPositive
                    ? `Should receive ${money(b.net_balance)} from the group`
                    : isNegative
                    ? `Needs to pay ${money(Math.abs(b.net_balance))} to group`
                    : "Fully squared up with everyone"}
                </p>

                {isNegative && (
                  <button
                    className="btn btn-primary btn-sm btn-full"
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

      {/* PAYMENT HISTORY TABLE */}
      <div className="section-title-wrap" style={{ marginTop: "40px" }}>
        <h2>Payment History</h2>
        <p>Log of all settled transfers between participants.</p>
      </div>

      {payments.length === 0 ? (
        <div className="empty-state-large">
          <span className="empty-icon-lg">💳</span>
          <h3>No Payments Recorded Yet</h3>
          <p>
            When someone settles up via cash or UPI, record the transaction here
            to update balances.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => onOpenPaymentModal()}
            disabled={participants.length < 2}
          >
            + Record First Payment
          </button>
        </div>
      ) : (
        <div className="table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Payer (From)</th>
                <th>Payee (To)</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th>Note</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const fromName = getParticipantName(p.from_participant_id);
                const toName = getParticipantName(p.to_participant_id);

                return (
                  <tr key={p.id}>
                    <td>
                      <div className="user-icon-cell">
                        <span className="user-dot">👤</span>
                        <strong>{fromName}</strong>
                      </div>
                    </td>
                    <td>
                      <div className="user-icon-cell">
                        <span className="user-dot">👤</span>
                        <strong>{toName}</strong>
                      </div>
                    </td>
                    <td>
                      <strong className="amount-highlight">
                        {money(p.amount)}
                      </strong>
                    </td>
                    <td>
                      <span className={`status-pill status-${p.status}`}>
                        {p.status}
                      </span>
                    </td>
                    <td>
                      {p.payment_date
                        ? new Date(p.payment_date).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                        : "Recently"}
                    </td>
                    <td>
                      <span className="table-subtext">
                        {p.note || "Settlement"}
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-icon-action btn-danger"
                        onClick={() => handleDelete(p)}
                        title="Delete Payment Record"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
