import React from "react";

export function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`toast ${toast.type === "error" ? "toast-error" : ""}`}>
      <span>{toast.message}</span>
      <button type="button" aria-label="Luk besked" onClick={onClose}>x</button>
    </div>
  );
}
