import { CATEGORIES, type CategoryId, type CategoryPref, type Prefs } from "@sbcal/core";

/** Hourly events are noisy in a phone calendar, so they start off. */
const OFF_BY_DEFAULT = new Set<CategoryId>(["dark_auction", "jacob", "cult", "bank"]);

export function defaultPrefs(): Record<CategoryId, CategoryPref> {
  return Object.fromEntries(
    CATEGORIES.map((c) => [
      c.id,
      { enabled: !OFF_BY_DEFAULT.has(c.id), alarm: OFF_BY_DEFAULT.has(c.id) ? null : 5 },
    ]),
  ) as Record<CategoryId, CategoryPref>;
}

/** Saved prefs may predate newer categories; fill those in with defaults. */
export function withDefaults(saved: Prefs | undefined | null): Record<CategoryId, CategoryPref> {
  return { ...defaultPrefs(), ...saved } as Record<CategoryId, CategoryPref>;
}

export const enabledSet = (prefs: Prefs) =>
  new Set(CATEGORIES.filter((c) => prefs[c.id]?.enabled).map((c) => c.id));

export const samePrefs = (a: Prefs, b: Prefs) =>
  CATEGORIES.every((c) => a[c.id]?.enabled === b[c.id]?.enabled && a[c.id]?.alarm === b[c.id]?.alarm);
