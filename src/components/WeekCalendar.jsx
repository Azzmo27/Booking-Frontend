import React from "react";
import { SkeletonCalendar } from "./Skeleton";
import { Badge } from "./ui/Badge";
import { formatPeriod, formatType, shiftTypeClass } from "../utils/format";

function getWeekDays(start) {
  const base = new Date(`${start}T00:00:00`);
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(base);
    date.setDate(base.getDate() + index);
    return date;
  });
}

function toIsoDate(date) {
  return date.toISOString().slice(0, 10);
}

export function WeekCalendar({ shifts, weekStart, loading, onSelectShift }) {
  const days = getWeekDays(weekStart);

  if (loading) return <SkeletonCalendar />;

  return (
    <div className="week-calendar">
      {days.map((day) => {
        const isoDate = toIsoDate(day);
        const dayShifts = shifts.filter((shift) => shift.date === isoDate);

        return (
          <div className="day-column" key={isoDate}>
            <div className="day-heading">
              <span>{day.toLocaleDateString("da-DK", { weekday: "long" })}</span>
              <strong>{day.toLocaleDateString("da-DK", { day: "2-digit", month: "2-digit" })}</strong>
            </div>

            {dayShifts.length ? (
              <div className="calendar-stack">
                {dayShifts.map((shift) => (
                  <article
                    className={`calendar-shift ${shiftTypeClass(shift.type)}`}
                    key={shift.id}
                    onClick={onSelectShift ? () => onSelectShift(shift) : undefined}
                  >
                    <div>
                      <strong>{formatType(shift.type)}</strong>
                      <span>{formatPeriod(shift.type)}</span>
                    </div>
                    <p>{shift.teamName || "Ukendt team"}</p>
                    <Badge status={shift.status} />
                  </article>
                ))}
              </div>
            ) : (
              <div className="calendar-empty">Ingen vagter</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
