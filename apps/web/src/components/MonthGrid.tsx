import {
  CATEGORIES,
  CATEGORY_BY_ID,
  DAYS_PER_MONTH,
  DAY_MS,
  MONTH_NAMES,
  eventsOnDay,
  monthSeason,
  fromSkyDate,
  ordinal,
  toSkyDate,
  type CategoryId,
  type SkyEvent,
} from "@sbcal/core";
import { useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { duration, localWhen } from "../lib/time";
import { PixelIcon } from "./PixelIcon";

const COLUMNS = 9;
const SLOTS = Math.ceil(DAYS_PER_MONTH / COLUMNS) * COLUMNS;

/** Events that colour the whole slot rather than showing as a pip. */
const FESTIVALS = new Set<CategoryId>(["spooky", "zoo", "jerry", "new_year", "fishing_festival", "mining_fiesta", "election"]);
/** Season-long events drawn as a stripe along the slot's bottom edge. */
const isLong = (e: SkyEvent) => e.end - e.start > 3 * DAY_MS;

const order = new Map(CATEGORIES.map((c, i) => [c.id, i]));

/** Which event gets to be the slot's icon when several share a day. */
const ICON_PRIORITY: CategoryId[] = [
  "new_year", "spooky", "jerry", "zoo", "election", "fishing_festival", "mining_fiesta",
  "cult", "bank", "hoppity", "harvest_feast", "mythological", "dark_auction", "jacob",
];
const iconRank = (c: CategoryId) => ICON_PRIORITY.indexOf(c);

interface Props {
  year: number;
  month: number;
  events: SkyEvent[];
  enabled: Set<CategoryId>;
  now: number;
  interactive?: boolean;
}

export function MonthGrid({ year, month, events, enabled, now, interactive = true }: Props) {
  const today = toSkyDate(now);
  const [hover, setHover] = useState<{ day: number; el: HTMLElement } | null>(null);
  const monthEvents = events.filter(
    (e) => e.start < fromSkyDate(year, month) + DAYS_PER_MONTH * DAY_MS && e.end > fromSkyDate(year, month),
  );

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <div className="grid grid-cols-9 gap-[3px] sm:gap-1">
        {Array.from({ length: SLOTS }, (_, i) => {
          const day = i + 1;
          if (day > DAYS_PER_MONTH) return <div key={i} className="slot-filler aspect-square" />;

          const dayEvents = eventsOnDay(monthEvents, year, month, day);
          const cats = [...new Set(dayEvents.map((e) => e.category))].sort(
            (a, b) => order.get(a)! - order.get(b)!,
          );
          const festival = cats.find((c) => FESTIVALS.has(c) && enabled.has(c)) ?? cats.find((c) => FESTIVALS.has(c));
          const tint = festival && (enabled.has(festival) ? CATEGORY_BY_ID[festival].color : "#5a5663");
          const byRank = [...cats].sort((a, b) => iconRank(a) - iconRank(b));
          const icon = byRank.find((c) => enabled.has(c)) ?? byRank[0];
          const pips = cats.filter(
            (c) => c !== icon && !FESTIVALS.has(c) && !dayEvents.some((e) => e.category === c && isLong(e)),
          );
          const stripes = cats.filter((c) => dayEvents.some((e) => e.category === c && isLong(e)));
          const isToday = today.year === year && today.month === month && today.day === day;
          const isPast = fromSkyDate(year, month, day) + DAY_MS <= now;

          return (
            <button
              key={i}
              type="button"
              tabIndex={interactive ? 0 : -1}
              aria-label={`${MONTH_NAMES[month - 1]} ${ordinal(day)}: ${cats.map((c) => CATEGORY_BY_ID[c].name).join(", ") || "no events"}`}
              onMouseEnter={(e) => interactive && setHover({ day, el: e.currentTarget })}
              onFocus={(e) => interactive && setHover({ day, el: e.currentTarget })}
              onBlur={() => setHover(null)}
              onClick={(e) => interactive && setHover({ day, el: e.currentTarget })}
              className={`slot relative aspect-square overflow-hidden text-left outline-none transition-[filter] focus-visible:ring-2 focus-visible:ring-gold ${
                interactive ? "cursor-default hover:brightness-150" : "pointer-events-none"
              } ${isPast && !isToday ? "opacity-45" : ""}`}
              style={
                tint ? { background: `linear-gradient(160deg, ${tint}38, ${tint}14)` } : undefined
              }
            >
              <span
                className={`mc-text absolute left-1 top-0.5 text-[10px] leading-none sm:left-1.5 sm:top-1 sm:text-sm ${
                  isToday ? "text-gold" : festival && enabled.has(festival) ? "text-fg" : "text-muted"
                }`}
              >
                {day}
              </span>

              <PixelIcon
                name={icon ?? monthSeason(month)}
                muted={icon ? !enabled.has(icon) : false}
                className={`absolute left-1/2 top-[54%] w-[46%] -translate-x-1/2 -translate-y-1/2 ${icon ? "" : "opacity-15"}`}
              />

              {pips.length > 0 && (
                <span className="absolute bottom-1.5 right-1 flex flex-wrap-reverse justify-end gap-[2px] sm:bottom-2 sm:right-1.5 sm:gap-[3px]">
                  {pips.map((c) => (
                    <i
                      key={c}
                      className="block size-[4px] sm:size-[6px]"
                      style={{ background: enabled.has(c) ? CATEGORY_BY_ID[c].color : "#3a3743" }}
                    />
                  ))}
                </span>
              )}

              {stripes.length > 0 && (
                <span className="absolute inset-x-[2px] bottom-[2px] flex flex-col gap-px">
                  {stripes.map((c) => (
                    <i
                      key={c}
                      className="block h-[2px] sm:h-[3px]"
                      style={{ background: enabled.has(c) ? CATEGORY_BY_ID[c].color : "#2e2c35" }}
                    />
                  ))}
                </span>
              )}

              {isToday && <span className="pointer-events-none absolute inset-0 ring-2 ring-inset ring-gold" />}
            </button>
          );
        })}
      </div>

      {hover && (
        <DayTooltip
          anchor={hover.el}
          year={year}
          month={month}
          day={hover.day}
          events={eventsOnDay(monthEvents, year, month, hover.day)}
          enabled={enabled}
          now={now}
        />
      )}
    </div>
  );
}

function DayTooltip({
  anchor,
  year,
  month,
  day,
  events,
  enabled,
  now,
}: {
  anchor: HTMLElement;
  year: number;
  month: number;
  day: number;
  events: SkyEvent[];
  enabled: Set<CategoryId>;
  now: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const a = anchor.getBoundingClientRect();
    const t = el.getBoundingClientRect();
    const margin = 8;
    let left = a.right + margin;
    if (left + t.width > window.innerWidth - margin) left = a.left - t.width - margin;
    left = Math.max(margin, Math.min(left, window.innerWidth - t.width - margin));
    let top = a.top;
    if (top + t.height > window.innerHeight - margin) top = window.innerHeight - t.height - margin;
    setPos({ left, top: Math.max(margin, top) });
  }, [anchor, day, events.length]);

  const dayStart = fromSkyDate(year, month, day);

  // Portalled so no transformed/filtered ancestor can hijack `position: fixed`.
  return createPortal(
    <div
      ref={ref}
      role="tooltip"
      className="mc-tooltip pointer-events-none fixed z-50 w-max max-w-[min(20rem,calc(100vw-16px))] px-3 py-2.5"
      style={pos ?? { left: -9999, top: 0 }}
    >
      <p className="mc-text text-[15px] leading-tight text-white">
        {MONTH_NAMES[month - 1]} {ordinal(day)}
      </p>
      <p className="mc-text mb-2 text-xs text-[#aaaaaa]">
        Year {year} · starts {localWhen(dayStart, now)}
      </p>
      {events.length === 0 && <p className="mc-text text-sm text-[#555555]">No events</p>}
      <ul className="space-y-1">
        {events.map((e) => {
          const cat = CATEGORY_BY_ID[e.category];
          const on = enabled.has(e.category);
          return (
            <li key={e.uid} className="mc-text flex items-center gap-2 text-sm leading-snug">
              <PixelIcon name={e.category} muted={!on} className="size-3.5 shrink-0" />
              <span style={{ color: on ? cat.color : "#555555" }} className={on ? "" : "line-through"}>
                {e.title}
              </span>
              <span className="ml-auto whitespace-nowrap pl-3 text-xs text-[#aaaaaa]">
                {isLong(e) ? `until ${localWhen(e.end, now)}` : `${localWhen(e.start, now)} · ${duration(e.end - e.start)}`}
              </span>
            </li>
          );
        })}
      </ul>
    </div>,
    document.body,
  );
}
