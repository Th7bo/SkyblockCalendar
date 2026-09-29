/**
 * SkyBlock time.
 *
 * Year 1, Early Spring 1st 00:00 began at the epoch below. From there the
 * clock is perfectly regular:
 *   1 SkyBlock hour  = 50 real seconds
 *   1 SkyBlock day   = 20 real minutes
 *   1 SkyBlock month = 31 days  = 10h 20m
 *   1 SkyBlock year  = 12 months = 124h (5d 4h)
 */
export const SKYBLOCK_EPOCH = 1_560_275_700_000;

export const HOUR_MS = 50_000;
export const DAY_MS = 24 * HOUR_MS;
export const DAYS_PER_MONTH = 31;
export const MONTH_MS = DAYS_PER_MONTH * DAY_MS;
export const MONTHS_PER_YEAR = 12;
export const YEAR_MS = MONTHS_PER_YEAR * MONTH_MS;

export const MONTH_NAMES = [
  "Early Spring",
  "Spring",
  "Late Spring",
  "Early Summer",
  "Summer",
  "Late Summer",
  "Early Autumn",
  "Autumn",
  "Late Autumn",
  "Early Winter",
  "Winter",
  "Late Winter",
] as const;

export type Season = "spring" | "summer" | "autumn" | "winter";

export const monthSeason = (month: number): Season =>
  (["spring", "summer", "autumn", "winter"] as const)[Math.floor((month - 1) / 3)]!;

/** 1-indexed year, month and day, matching how the game displays dates. */
export interface SkyDate {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

export function toSkyDate(ms: number): SkyDate {
  const t = ms - SKYBLOCK_EPOCH;
  const year = Math.floor(t / YEAR_MS);
  const inYear = t - year * YEAR_MS;
  const month = Math.floor(inYear / MONTH_MS);
  const inMonth = inYear - month * MONTH_MS;
  const day = Math.floor(inMonth / DAY_MS);
  const inDay = inMonth - day * DAY_MS;
  const hour = Math.floor(inDay / HOUR_MS);
  const minute = Math.floor(((inDay - hour * HOUR_MS) / HOUR_MS) * 60);
  return { year: year + 1, month: month + 1, day: day + 1, hour, minute };
}

/** Real timestamp at which the given SkyBlock moment starts. */
export function fromSkyDate(year: number, month = 1, day = 1, hour = 0): number {
  return (
    SKYBLOCK_EPOCH +
    (year - 1) * YEAR_MS +
    (month - 1) * MONTH_MS +
    (day - 1) * DAY_MS +
    hour * HOUR_MS
  );
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]!);
}

export function formatSkyDate(d: SkyDate, withTime = false): string {
  const base = `${MONTH_NAMES[d.month - 1]} ${ordinal(d.day)}, Year ${d.year}`;
  if (!withTime) return base;
  const h12 = d.hour % 12 === 0 ? 12 : d.hour % 12;
  const ampm = d.hour < 12 ? "am" : "pm";
  // The in-game clock only ticks in 10 minute steps.
  const mm = String(Math.floor(d.minute / 10) * 10).padStart(2, "0");
  return `${base} · ${h12}:${mm}${ampm}`;
}
