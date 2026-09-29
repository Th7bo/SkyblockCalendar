import {
  DAY_MS,
  DAYS_PER_MONTH,
  HOUR_MS,
  MONTHS_PER_YEAR,
  SKYBLOCK_EPOCH,
  YEAR_MS,
  fromSkyDate,
  toSkyDate,
} from "./time.ts";

export type CategoryId =
  | "dark_auction"
  | "jacob"
  | "cult"
  | "bank"
  | "hoppity"
  | "harvest_feast"
  | "zoo"
  | "spooky"
  | "jerry"
  | "new_year"
  | "election"
  | "fishing_festival"
  | "mining_fiesta"
  | "mythological";

export type CategoryGroup = "recurring" | "seasonal" | "mayor";

export interface Category {
  id: CategoryId;
  name: string;
  /** Minecraft chat colour the game uses for this event. */
  color: string;
  group: CategoryGroup;
  blurb: string;
  /** Mayor/minister perk that must be active for this event to exist. */
  perk?: string;
}

export const CATEGORIES: readonly Category[] = [
  { id: "dark_auction", name: "Dark Auction", color: "#AA00AA", group: "recurring", blurb: "Every hour at :55" },
  { id: "jacob", name: "Jacob's Contest", color: "#FFFF55", group: "recurring", blurb: "Every hour at :15" },
  { id: "cult", name: "Cult of the Fallen Star", color: "#5555FF", group: "recurring", blurb: "7th, 14th, 21st, 28th" },
  { id: "bank", name: "Bank Interest", color: "#FFAA00", group: "recurring", blurb: "Start of every season" },
  { id: "hoppity", name: "Hoppity's Hunt", color: "#FF55FF", group: "seasonal", blurb: "All of spring" },
  { id: "harvest_feast", name: "Harvest Feast", color: "#FFD27F", group: "seasonal", blurb: "All of autumn · all year with Finnegan's Grand Feast" },
  { id: "zoo", name: "Traveling Zoo", color: "#55FF55", group: "seasonal", blurb: "Early Summer & Early Winter 1–3" },
  { id: "spooky", name: "Spooky Festival", color: "#FF5555", group: "seasonal", blurb: "Autumn 29–31" },
  { id: "jerry", name: "Season of Jerry", color: "#55FFFF", group: "seasonal", blurb: "Late Winter 24–26" },
  { id: "new_year", name: "New Year Celebration", color: "#FFFFFF", group: "seasonal", blurb: "Late Winter 29–31" },
  { id: "election", name: "Mayor Election", color: "#00AAAA", group: "seasonal", blurb: "Opens Late Summer 27, closes Late Spring 27" },
  { id: "fishing_festival", name: "Fishing Festival", color: "#3FA9F5", group: "mayor", blurb: "Marina · first 3 days of each month", perk: "Fishing Festival" },
  { id: "mining_fiesta", name: "Mining Fiesta", color: "#E07A3F", group: "mayor", blurb: "Cole · 1st of Early Summer, Late Summer, Autumn, Early Winter", perk: "Mining Fiesta" },
  { id: "mythological", name: "Mythological Ritual", color: "#2BB673", group: "mayor", blurb: "Diana · whole term", perk: "Mythological Ritual" },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;

export interface SkyEvent {
  uid: string;
  category: CategoryId;
  title: string;
  start: number;
  end: number;
}

export interface MayorContext {
  mayor: string;
  minister: string | null;
  /** Perk names of both the mayor and the minister. */
  perks: string[];
  termStart: number;
  termEnd: number;
  /** Event Foxy's "Extra Event" perk adds a bonus run of, if active. */
  bonusEvent?: CategoryId | null;
}

/**
 * A mayor elected in election `year` takes office when that election closes,
 * Late Spring 27th of the following year, and serves one SkyBlock year.
 */
export function mayorTerm(electionYear: number): { start: number; end: number } {
  return {
    start: fromSkyDate(electionYear + 1, 3, 27),
    end: fromSkyDate(electionYear + 2, 3, 27),
  };
}

type Occurrence = { start: number; end: number; title?: string };

/** Span of `days` whole SkyBlock days starting at month/day of `year`. */
const days = (year: number, month: number, day: number, n: number, title?: string): Occurrence => {
  const start = fromSkyDate(year, month, day);
  return { start, end: start + n * DAY_MS, title };
};

/**
 * Cole schedules 5 fiestas of 7 days each, but the Spring one starts before his
 * term does, so in practice only these 4 happen.
 */
const MINING_FIESTA_MONTHS = [4, 6, 8, 10];
const MINING_FIESTA_DAYS = 7;
const FISHING_FESTIVAL_DAYS = 3;

/** Foxy's "Extra Event" perk adds one bonus run starting Late Summer 22nd. */
const BONUS_EVENT_DAYS: Partial<Record<CategoryId, number>> = {
  mining_fiesta: MINING_FIESTA_DAYS,
  fishing_festival: FISHING_FESTIVAL_DAYS,
};
export const BONUS_EVENT_CATEGORIES = Object.keys(BONUS_EVENT_DAYS) as CategoryId[];

/** Occurrences of a category within one SkyBlock year. */
function occurrencesInYear(id: CategoryId, year: number): Occurrence[] {
  const yearStart = fromSkyDate(year);
  const out: Occurrence[] = [];
  switch (id) {
    case "dark_auction":
    case "jacob": {
      // Both run every 3 SkyBlock days (1 real hour); 372 days/year keeps them aligned per year.
      const offset = id === "jacob" ? DAY_MS : 0;
      const length = id === "jacob" ? DAY_MS : 6 * HOUR_MS;
      for (let t = yearStart + offset; t < yearStart + YEAR_MS; t += 3 * DAY_MS) {
        out.push({ start: t, end: t + length });
      }
      return out;
    }
    case "cult":
      for (let m = 1; m <= MONTHS_PER_YEAR; m++) {
        for (const d of [7, 14, 21, 28]) {
          const start = fromSkyDate(year, m, d);
          out.push({ start, end: start + 6 * HOUR_MS });
        }
      }
      return out;
    case "bank":
      for (const m of [1, 4, 7, 10]) {
        const start = fromSkyDate(year, m, 1);
        out.push({ start, end: start + HOUR_MS });
      }
      return out;
    case "hoppity":
      return [days(year, 1, 1, 3 * DAYS_PER_MONTH)];
    case "harvest_feast":
      return [days(year, 7, 1, 3 * DAYS_PER_MONTH)];
    case "zoo":
      return [days(year, 4, 1, 3), days(year, 10, 1, 3)];
    case "spooky":
      return [days(year, 8, 29, 3)];
    case "jerry":
      return [days(year, 12, 24, 3)];
    case "new_year":
      return [days(year, 12, 29, 3, `New Year Celebration · Year ${year + 1}`)];
    case "election":
      return [
        days(year, 3, 27, 1, "Election closes · new mayor"),
        days(year, 6, 27, 1, "Election opens"),
      ];
    case "fishing_festival":
      for (let m = 1; m <= MONTHS_PER_YEAR; m++) out.push(days(year, m, 1, FISHING_FESTIVAL_DAYS));
      return out;
    case "mining_fiesta":
      return MINING_FIESTA_MONTHS.map((m) => days(year, m, 1, MINING_FIESTA_DAYS));
    case "mythological":
      return [];
  }
}

export interface GenerateOptions {
  from: number;
  to: number;
  categories: Iterable<CategoryId>;
  mayor?: MayorContext | null;
}

/** All events overlapping [from, to), sorted by start. */
export function generateEvents({ from, to, categories, mayor }: GenerateOptions): SkyEvent[] {
  const wanted = new Set(categories);
  const perks = new Set(mayor?.perks ?? []);
  const firstYear = Math.max(1, toSkyDate(from).year - 1);
  const lastYear = toSkyDate(to).year;
  const events: SkyEvent[] = [];

  for (const cat of CATEGORIES) {
    if (!wanted.has(cat.id)) continue;

    // Mayor events only exist while the mayor holding the perk is in office.
    let lo = from;
    let hi = to;
    if (cat.perk) {
      if (!mayor || !(perks.has(cat.perk) || mayor.bonusEvent === cat.id)) continue;
      lo = Math.max(from, mayor.termStart);
      hi = Math.min(to, mayor.termEnd);
      if (lo >= hi) continue;
    }

    const push = (o: Occurrence) => {
      if (o.end <= lo || o.start >= hi) return;
      events.push({
        uid: `${cat.id}-${o.start}@skyblockcal`,
        category: cat.id,
        title: o.title ?? cat.name,
        start: o.start,
        end: o.end,
      });
    };

    if (cat.id === "mythological" && mayor) {
      push({ start: mayor.termStart, end: mayor.termEnd, title: `Mythological Ritual · Mayor ${mayor.mayor}` });
      continue;
    }

    // Finnegan's Grand Feast perk stretches the Harvest Feast over his whole term.
    const grandFeast = cat.id === "harvest_feast" && mayor && perks.has("Grand Feast");
    if (grandFeast) push({ start: mayor.termStart, end: mayor.termEnd, title: "Grand Feast" });

    // Foxy's bonus run on its own, when the regular perk holder isn't in office.
    if (mayor?.bonusEvent === cat.id && !perks.has(cat.perk!)) {
      const n = BONUS_EVENT_DAYS[cat.id]!;
      push(days(toSkyDate(mayor.termStart).year, 6, 22, n, `${cat.name} (bonus)`));
      continue;
    }

    for (let y = firstYear; y <= lastYear; y++) {
      for (const o of occurrencesInYear(cat.id, y)) {
        if (grandFeast && o.end > mayor.termStart && o.start < mayor.termEnd) continue;
        push(o);
      }
    }
  }

  return events.sort((a, b) => a.start - b.start || a.category.localeCompare(b.category));
}

/** Events that happen on a given SkyBlock day, used by the calendar grid. */
export function eventsOnDay(events: SkyEvent[], year: number, month: number, day: number): SkyEvent[] {
  const start = fromSkyDate(year, month, day);
  const end = start + DAY_MS;
  return events.filter((e) => e.start < end && e.end > start);
}

export { SKYBLOCK_EPOCH };
