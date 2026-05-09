import React from "react";

export function Notice({ message, error }) {
  if (!message && !error) return null;
  return <section className={error ? "notice error" : "notice"}>{error || message}</section>;
}
