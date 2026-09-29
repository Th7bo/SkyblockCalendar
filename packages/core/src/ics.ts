import { CATEGORY_BY_ID, type CategoryId, type SkyEvent } from "./events.ts";
import { formatSkyDate, toSkyDate } from "./time.ts";

/** Minutes before start for the reminder, or null for none. */
export type AlarmMinutes = number | null;

export interface CategoryPref {
  enabled: boolean;
  alarm: AlarmMinutes;
}

export type Prefs = Partial<Record<CategoryId, CategoryPref>>;

export const ALARM_CHOICES: readonly AlarmMinutes[] = [null, 0, 1, 5, 10, 15, 30, 60];

const pad = (n: number) => String(n).padStart(2, "0");

const icsDate = (ms: number) => {
  const d = new Date(ms);
  return (
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}` +
    `T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`
  );
};

const escapeText = (s: string) =>
  s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r?\n/g, "\\n");

/** RFC 5545 §3.1: lines longer than 75 octets are folded with CRLF + space. */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const ch of line) {
    const len = new TextEncoder().encode(ch).length;
    if (size + len > (parts.length ? 74 : 75)) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += ch;
    size += len;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export interface IcsOptions {
  name: string;
  events: SkyEvent[];
  prefs: Prefs;
  now?: number;
}

export function buildIcs({ name, events, prefs, now = Date.now() }: IcsOptions): string {
  const stamp = icsDate(now);
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SkyblockCal//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(name)}`,
    "X-WR-CALDESC:Hypixel SkyBlock events",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const e of events) {
    const cat = CATEGORY_BY_ID[e.category];
    const alarm = prefs[e.category]?.alarm ?? null;
    lines.push(
      "BEGIN:VEVENT",
      `UID:${e.uid}`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${icsDate(e.start)}`,
      `DTEND:${icsDate(e.end)}`,
      `SUMMARY:${escapeText(e.title)}`,
      `DESCRIPTION:${escapeText(`${formatSkyDate(toSkyDate(e.start))}\n${cat.blurb}`)}`,
      `CATEGORIES:${escapeText(cat.name)}`,
      "TRANSP:TRANSPARENT",
    );
    if (alarm !== null) {
      lines.push(
        "BEGIN:VALARM",
        "ACTION:DISPLAY",
        `DESCRIPTION:${escapeText(e.title)}`,
        `TRIGGER:-PT${alarm}M`,
        "END:VALARM",
      );
    }
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.map(fold).join("\r\n") + "\r\n";
}
