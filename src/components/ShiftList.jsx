import React from "react";
import { SkeletonList } from "./Skeleton";
import { formatPeriod, formatType, shiftTypeClass } from "../utils/format";
import { Badge } from "./ui/Badge";

export function ShiftList({ shifts, loading, emptyText, action, onSelect }) {
  if (loading) return <SkeletonList rows={4} />;
  if (!shifts.length) {
    return (
      <div className="empty-state">
        <strong>Ingen data at vise</strong>
        <span>{emptyText}</span>
      </div>
    );
  }

  return (
    <div className="shift-list">
      {shifts.map((shift) => {
        const date = new Date(`${shift.date}T00:00:00`);
        const userName = shift.userName || shift.requestedUserName || "Ingen bruger";

        return (
          <article
            className={`shift-row ${shiftTypeClass(shift.type)} ${onSelect ? "clickable-row" : ""}`}
            key={shift.id}
            onClick={onSelect ? () => onSelect(shift) : undefined}
          >
            <div className="date-box">
              <span>{date.toLocaleDateString("da-DK", { weekday: "short" })}</span>
              <strong>{date.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</strong>
            </div>

            <div className="shift-main">
              <div className="shift-title-line">
                <h3>{formatType(shift.type)}</h3>
                <span>{formatPeriod(shift.type)}</span>
              </div>
              <p>{shift.teamName || "Ukendt team"}</p>
              <small>{userName} · {shift.hours || 0} timer</small>
              <div className="meta-chip-row">
                {!!shift.waitlistCount && <span>{shift.waitlistCount} på venteliste</span>}
                {shift.requiredSkills && <span>Kræver: {shift.requiredSkills}</span>}
                {shift.generatedFromStandard && <span>Standardvagt</span>}
                {shift.recurrenceGroupId && <span>Gentagende</span>}
                {shift.swapRequested && <span>Bytte ønsket af {shift.swapRequestedByName}</span>}
              </div>
              {shift.exceeds37Hours && (
                <p className="warning-text">
                  Advarsel: {shift.requestedUserWeekHoursIfApproved} timer hvis godkendt.
                </p>
              )}
            </div>

            <Badge status={shift.status} />
            {action?.(shift)}
          </article>
        );
      })}
    </div>
  );
}
