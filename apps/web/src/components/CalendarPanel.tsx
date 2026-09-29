import {
  CATEGORIES,
  MONTH_NAMES,
  MONTHS_PER_YEAR,
  fromSkyDate,
  generateEvents,
  monthSeason,
  toSkyDate,
  type CategoryId,
  type MayorContext,
} from "@sbcal/core";
import { useMemo, useState } from "react";
import { MonthGrid } from "./MonthGrid";

const SEASON_COLOR = { spring: "#55FF55", summer: "#FFFF55", autumn: "#FFAA00", winter: "#55FFFF" };

interface Props {
  now: number;
  enabled: Set<CategoryId>;
  mayor: MayorContext | null;
  interactive?: boolean;
}

export function CalendarPanel({ now, enabled, mayor, interactive = true }: Props) {
  const today = toSkyDate(now);
  const [view, setView] = useState({ year: today.year, month: today.month });

  const events = useMemo(
    () =>
      generateEvents({
        from: fromSkyDate(view.year),
        to: fromSkyDate(view.year + 1),
        categories: CATEGORIES.map((c) => c.id),
        mayor,
      }),
    [view.year, mayor],
  );

  const step = (delta: number) =>
    setView(({ year, month }) => {
      const idx = (year - 1) * MONTHS_PER_YEAR + (month - 1) + delta;
      return { year: Math.floor(idx / MONTHS_PER_YEAR) + 1, month: (idx % MONTHS_PER_YEAR) + 1 };
    });

  const season = monthSeason(view.month);
  const isCurrent = view.year === today.year && view.month === today.month;

  return (
    <section className="rounded-sm border border-line bg-panel p-3 sm:p-5">
      <header className="mb-4 flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="mc-text text-xs uppercase tracking-[0.18em] text-faint">Calendar and Events</p>
          <h2 className="mt-1 flex items-baseline gap-2 truncate text-xl font-semibold tracking-tight sm:text-2xl">
            <span className="mc-text" style={{ color: SEASON_COLOR[season] }}>
              {MONTH_NAMES[view.month - 1]}
            </span>
            <span className="font-mono text-sm font-normal text-muted">Year {view.year}</span>
          </h2>
        </div>
        {interactive && (
          <div className="flex shrink-0 items-center gap-1">
            {!isCurrent && (
              <button
                type="button"
                onClick={() => setView({ year: today.year, month: today.month })}
                className="mr-1 h-8 px-2.5 text-xs font-medium text-muted hover:text-fg"
              >
                Today
              </button>
            )}
            <NavButton label="Previous month" onClick={() => step(-1)} d="M10 3 5 8l5 5" />
            <NavButton label="Next month" onClick={() => step(1)} d="m6 3 5 5-5 5" />
          </div>
        )}
      </header>

      <MonthGrid
        year={view.year}
        month={view.month}
        events={events}
        enabled={enabled}
        now={now}
        interactive={interactive}
      />

      {interactive && (
        <div className="mt-3 flex gap-1" aria-hidden>
          {MONTH_NAMES.map((name, i) => (
            <button
              key={name}
              type="button"
              tabIndex={-1}
              title={name}
              onClick={() => setView((v) => ({ ...v, month: i + 1 }))}
              className="h-1.5 flex-1 transition-opacity"
              style={{
                background: SEASON_COLOR[monthSeason(i + 1)],
                opacity: i + 1 === view.month ? 0.9 : 0.15,
              }}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function NavButton({ label, onClick, d }: { label: string; onClick: () => void; d: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="slot grid size-8 place-items-center text-muted hover:text-fg active:translate-y-px"
    >
      <svg viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d={d} strokeLinecap="square" />
      </svg>
    </button>
  );
}
