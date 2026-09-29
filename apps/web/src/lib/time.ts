import { useEffect, useState } from "react";

export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

const timeFmt = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });
const dayFmt = new Intl.DateTimeFormat(undefined, { weekday: "short", day: "numeric", month: "short" });

const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

/** "14:55", "Tomorrow 14:55" or "Tue 3 Oct 14:55" depending on distance from now. */
export function localWhen(ms: number, now = Date.now()): string {
  const d = new Date(ms);
  const today = new Date(now);
  const tomorrow = new Date(now + 86_400_000);
  if (sameDay(d, today)) return timeFmt.format(d);
  if (sameDay(d, tomorrow)) return `Tomorrow ${timeFmt.format(d)}`;
  return `${dayFmt.format(d)} ${timeFmt.format(d)}`;
}

export function duration(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  const rest = m % 60;
  if (h < 48) return rest ? `${h}h ${rest}m` : `${h}h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d}d ${h % 24}h` : `${d}d`;
}

export function countdown(ms: number): string {
  if (ms <= 0) return "now";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${String(m).padStart(2, "0")}m`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}
