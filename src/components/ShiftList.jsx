import React from "react";
import { SkeletonList } from "./Skeleton";
import { formatType } from "../utils/format";
import { Badge } from "./ui/Badge";

export function ShiftList({ shifts, loading, emptyText, action, onSelect }) {
  if (loading) return <SkeletonList rows={4} />;
  if (!shifts.length) return <div className="empty-state">{emptyText}</div>;

  return (
    <div className="shift-list">
      {shifts.map((shift) => (
        <article
          className={`shift-row ${onSelect ? "clickable-row" : ""}`}
          key={shift.id}
          onClick={onSelect ? () => onSelect(shift) : undefined}
        >
          <div className="date-box">
            <span>{new Date(shift.date).toLocaleDateString("da-DK", { weekday: "short" })}</span>
            <strong>{new Date(shift.date).toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</strong>
          </div>
          <div className="shift-main">
            <h3>{formatType(shift.type)} <span>{shift.hours}t</span></h3>
            <p>
              {shift.teamName || "Ukendt team"} - {shift.userName || shift.requestedUserName || "Ingen bruger"}
            </p>
            {shift.exceeds37Hours && (
              <p className="warning-text">
                Warning: {shift.requestedUserWeekHoursIfApproved} timer hvis godkendt.
              </p>
            )}
          </div>
          <Badge status={shift.status} />
          {action?.(shift)}
        </article>
      ))}
    </div>
  );
}
