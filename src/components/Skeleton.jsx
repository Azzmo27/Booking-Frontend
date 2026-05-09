import React from "react";

export function SkeletonList({ rows = 3 }) {
  return (
    <div className="skeleton-list" aria-label="Henter data">
      {Array.from({ length: rows }, (_, index) => (
        <div className="skeleton-row" key={index}>
          <span />
          <div>
            <strong />
            <small />
          </div>
          <em />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCalendar() {
  return (
    <div className="week-calendar" aria-label="Henter ugekalender">
      {Array.from({ length: 7 }, (_, day) => (
        <div className="day-column" key={day}>
          <div className="day-heading">
            <span className="skeleton-line short" />
            <strong className="skeleton-line tiny" />
          </div>
          <div className="calendar-stack">
            <div className="calendar-shift skeleton-card">
              <span className="skeleton-line" />
              <span className="skeleton-line short" />
            </div>
            <div className="calendar-shift skeleton-card">
              <span className="skeleton-line" />
              <span className="skeleton-line tiny" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
