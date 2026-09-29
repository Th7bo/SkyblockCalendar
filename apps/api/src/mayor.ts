import { BONUS_EVENT_CATEGORIES, CATEGORY_BY_ID, mayorTerm, type CategoryId, type MayorContext } from "@sbcal/core";

const ELECTION_URL = "https://api.hypixel.net/v2/resources/skyblock/election";
const TTL = 5 * 60_000;

interface Perk {
  name: string;
  description: string;
}

interface ElectionResponse {
  success: boolean;
  mayor: {
    key: string;
    name: string;
    perks: Perk[];
    minister?: { key: string; name: string; perk: Perk };
    election: { year: number };
  };
  current?: { year: number; candidates: { key: string; name: string; votes: number }[] };
}

export interface MayorInfo extends MayorContext {
  ministerPerk: string | null;
  mayorPerks: string[];
  /** Ongoing election, if one is open. */
  election: { year: number; leader: string | null; candidates: { name: string; votes: number }[] } | null;
}

let cache: { at: number; value: MayorInfo } | null = null;
let inflight: Promise<MayorInfo | null> | null = null;

/** Foxy's "Extra Event" names its event only in the description, e.g. "Schedules an extra §6Mining Fiesta §7event". */
function bonusEventOf(perks: Perk[]): CategoryId | null {
  const extra = perks.find((p) => p.name === "Extra Event");
  if (!extra) return null;
  const text = extra.description.replace(/§./g, "");
  return BONUS_EVENT_CATEGORIES.find((id) => text.includes(CATEGORY_BY_ID[id].name)) ?? null;
}

async function fetchMayor(): Promise<MayorInfo> {
  const res = await fetch(ELECTION_URL, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`election api ${res.status}`);
  const data = (await res.json()) as ElectionResponse;
  if (!data.success) throw new Error("election api returned success=false");

  const { mayor } = data;
  const term = mayorTerm(mayor.election.year);
  const candidates = (data.current?.candidates ?? [])
    .map((c) => ({ name: c.name, votes: c.votes }))
    .sort((a, b) => b.votes - a.votes);

  return {
    mayor: mayor.name,
    minister: mayor.minister?.name ?? null,
    mayorPerks: mayor.perks.map((p) => p.name),
    ministerPerk: mayor.minister?.perk.name ?? null,
    perks: [...mayor.perks.map((p) => p.name), ...(mayor.minister ? [mayor.minister.perk.name] : [])],
    termStart: term.start,
    termEnd: term.end,
    bonusEvent: bonusEventOf(mayor.perks),
    election: data.current
      ? { year: data.current.year, leader: candidates[0]?.name ?? null, candidates }
      : null,
  };
}

/** Current mayor, cached; falls back to the last good value if Hypixel is down. */
export async function getMayor(): Promise<MayorInfo | null> {
  if (cache && Date.now() - cache.at < TTL) return cache.value;
  inflight ??= fetchMayor()
    .then((value) => {
      cache = { at: Date.now(), value };
      return value;
    })
    .catch((err) => {
      console.error("mayor fetch failed:", err);
      return cache?.value ?? null;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}
