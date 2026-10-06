import React from "react";

export function ToastContainer({ toasts, onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.type || "info"}`}>
          <div className="toast-indicator"></div>
          <div className="toast-body">
            {toast.title && <div className="toast-title">{toast.title}</div>}
            <div className="toast-message">{toast.message}</div>
          </div>
          <button className="toast-close" onClick={() => onDismiss(toast.id)}>
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
