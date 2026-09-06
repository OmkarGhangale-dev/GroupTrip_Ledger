import React from "react";
import { useTrip } from "../../context/TripContext";

export default function ToastContainer() {
  const { toasts, removeToast } = useTrip();

  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast-item toast-${toast.type || "success"}`}
          onClick={() => removeToast(toast.id)}
        >
          <span className="toast-icon">
            {toast.type === "error" ? "!" : toast.type === "info" ? "i" : "✓"}
          </span>
          <span className="toast-text">{toast.message}</span>
          <button
            className="toast-close"
            onClick={(e) => {
              e.stopPropagation();
              removeToast(toast.id);
            }}
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
