import React from "react";
import { useTrip } from "../context/TripContext";

export default function SettlementsView({ onOpenPaymentModal }) {
  const { settlements, reload } = useTrip();

  const money = (val) => `₹${Number(val || 0).toLocaleString("en-IN")}`;

  return (
    <div className="view-content">
      <div className="page-header page-header-settlements">
        <div>
          <span className="page-label">OPTIMAL DEBT SIMPLIFICATION</span>
          <h1>Smart Settlements</h1>
          <p className="page-description">
            The settlement algorithm minimizes the total number of transactions
            required to square up all debts.
          </p>
        </div>

        <button className="btn btn-secondary" onClick={() => reload()}>
          Re-calculate
        </button>
      </div>

      {settlements.length === 0 ? (
        <div className="settled-celebration-card">
          <h2>All Square!</h2>
          <p>
            There are no pending debts or split discrepancies for this trip.
            Everyone has paid their fair share.
          </p>
        </div>
      ) : (
        <div className="settlements-container">
          <div className="settlements-header-banner">
            <div>
              <h3>
                {settlements.length} Transaction
                {settlements.length === 1 ? "" : "s"} Required to Clear All Debts
              </h3>
              <p>
                Follow the payment steps below to settle all outstanding balances
                with minimal transfers.
              </p>
            </div>
          </div>

          <div className="settlements-cards-grid">
            {settlements.map((s, idx) => (
              <div key={idx} className="settlement-full-card">
                <div className="settlement-step-indicator">
                  Step {idx + 1}
                </div>

                <div className="settlement-card-flow">
                  {/* FROM USER */}
                  <div className="flow-user-node debtor">
                    <div className="flow-avatar">
                      {s.from_name.charAt(0).toUpperCase()}
                    </div>
                    <strong>{s.from_name}</strong>
                    <span className="node-role-label">Owes Money</span>
                  </div>

                  {/* TRANSFER GRAPHIC */}
                  <div className="flow-transfer-path">
                    <span className="transfer-amount-pill">
                      {money(s.amount)}
                    </span>
                    <div className="transfer-arrow-line">
                      <span className="arrow-head">→</span>
                    </div>
                    <small>Direct Transfer</small>
                  </div>

                  {/* TO USER */}
                  <div className="flow-user-node creditor">
                    <div className="flow-avatar">
                      {s.to_name.charAt(0).toUpperCase()}
                    </div>
                    <strong>{s.to_name}</strong>
                    <span className="node-role-label">Gets Paid</span>
                  </div>
                </div>

                <div className="settlement-card-bottom">
                  <p>
                    <strong>{s.from_name}</strong> should transfer{" "}
                    <strong>{money(s.amount)}</strong> to{" "}
                    <strong>{s.to_name}</strong> via UPI or cash.
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      onOpenPaymentModal({
                        from_participant_id: s.from_participant_id,
                        to_participant_id: s.to_participant_id,
                        amount: s.amount,
                        note: `Settlement payment to ${s.to_name}`,
                      })
                    }
                  >
                    Mark as Settled
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
