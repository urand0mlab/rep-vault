"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

type DateCalendarNavProps = {
  selectedDate: string; // YYYY-MM-DD
  activityByDate: Record<string, "planned" | "rest">;
};

type CalendarCell = {
  date: Date;
  inCurrentMonth: boolean;
};

function parseUtcDate(dateString: string): Date {
  const parsed = new Date(`${dateString}T00:00:00.000Z`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function formatDateKey(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function getMonthLabel(date: Date): string {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric", timeZone: "UTC" });
}

function buildMonthGrid(monthCursor: Date): CalendarCell[] {
  const monthStart = new Date(Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth(), 1));
  const monthEnd = new Date(Date.UTC(monthCursor.getUTCFullYear(), monthCursor.getUTCMonth() + 1, 0));

  const startOffset = monthStart.getUTCDay(); // Sunday-based index
  const gridStart = new Date(monthStart);
  gridStart.setUTCDate(monthStart.getUTCDate() - startOffset);

  const endOffset = 6 - monthEnd.getUTCDay();
  const gridEnd = new Date(monthEnd);
  gridEnd.setUTCDate(monthEnd.getUTCDate() + endOffset);

  const cells: CalendarCell[] = [];
  for (
    let cursor = new Date(gridStart);
    cursor.getTime() <= gridEnd.getTime();
    cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate() + 1))
  ) {
    cells.push({
      date: cursor,
      inCurrentMonth: cursor.getUTCMonth() === monthCursor.getUTCMonth(),
    });
  }

  return cells;
}

export function DateCalendarNav({ selectedDate, activityByDate }: DateCalendarNavProps) {
  const selected = parseUtcDate(selectedDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const [monthCursor, setMonthCursor] = useState(
    () => new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1))
  );

  const cells = useMemo(() => buildMonthGrid(monthCursor), [monthCursor]);

  return (
    <aside className="rounded-xl border bg-card p-4 text-card-foreground shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() =>
            setMonthCursor((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)))
          }
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-semibold tracking-tight">{getMonthLabel(monthCursor)}</h2>
        <button
          type="button"
          onClick={() =>
            setMonthCursor((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)))
          }
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-[11px] font-medium uppercase text-muted-foreground">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell) => {
          const dateKey = formatDateKey(cell.date);
          const isSelected = dateKey === selectedDate;
          const isToday = dateKey === formatDateKey(today);
          const dayActivity = activityByDate[dateKey];

          return (
            <Link
              key={dateKey}
              href={`/?date=${dateKey}`}
              className={[
                "relative flex h-9 items-center justify-center rounded-md text-sm transition-colors",
                cell.inCurrentMonth ? "text-foreground" : "text-muted-foreground/50",
                isSelected ? "bg-primary text-primary-foreground hover:bg-primary/90" : "hover:bg-muted",
                isToday && !isSelected ? "border border-primary/40" : "",
              ].join(" ")}
              aria-label={`Go to ${dateKey}`}
            >
              {cell.date.getUTCDate()}
              {dayActivity && (
                <span
                  className={[
                    "absolute bottom-1 h-1.5 w-1.5 rounded-full",
                    dayActivity === "planned" ? "bg-blue-500" : "bg-emerald-500",
                  ].join(" ")}
                />
              )}
            </Link>
          );
        })}
      </div>
    </aside>
  );
}
