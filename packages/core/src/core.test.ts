import assert from "node:assert/strict";
import { test } from "node:test";
import { buildIcs } from "./ics.ts";
import { generateEvents, mayorTerm } from "./events.ts";
import { SKYBLOCK_EPOCH, YEAR_MS, fromSkyDate, toSkyDate } from "./time.ts";

test("epoch is Early Spring 1st, Year 1", () => {
  assert.deepEqual(toSkyDate(SKYBLOCK_EPOCH), { year: 1, month: 1, day: 1, hour: 0, minute: 0 });
});

test("toSkyDate/fromSkyDate round trip", () => {
  const t = fromSkyDate(517, 3, 19, 7);
  assert.deepEqual(toSkyDate(t), { year: 517, month: 3, day: 19, hour: 7, minute: 0 });
  assert.equal(fromSkyDate(2) - fromSkyDate(1), YEAR_MS);
});

test("dark auction lands on :55 and jacob on :15 every hour", () => {
  const from = Date.UTC(2026, 8, 29, 0, 0);
  const events = generateEvents({ from, to: from + 3 * 3600_000, categories: ["dark_auction", "jacob"] });
  for (const e of events) {
    const min = new Date(e.start).getUTCMinutes();
    assert.equal(min, e.category === "dark_auction" ? 55 : 15);
  }
  assert.equal(events.length, 6);
});

test("mayor events are clipped to the term", () => {
  const term = mayorTerm(515);
  const mayor = { mayor: "Marina", minister: null, perks: ["Fishing Festival"], termStart: term.start, termEnd: term.end };
  const events = generateEvents({
    from: term.start - YEAR_MS,
    to: term.end + YEAR_MS,
    categories: ["fishing_festival"],
    mayor,
  });
  assert.ok(events.length >= 12);
  for (const e of events) {
    assert.ok(e.end > term.start && e.start < term.end);
    assert.ok(toSkyDate(e.start).day === 1);
  }
});

test("ics is well formed and folded", () => {
  const from = fromSkyDate(517, 8, 28);
  const events = generateEvents({ from, to: from + 3600_000 * 3, categories: ["spooky"] });
  const ics = buildIcs({ name: "Test", events, prefs: { spooky: { enabled: true, alarm: 5 } }, now: 0 });
  assert.match(ics, /BEGIN:VEVENT[\s\S]*TRIGGER:-PT5M[\s\S]*END:VEVENT/);
  for (const line of ics.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
});

test("mining fiesta runs 4 times for 7 days within Cole's term", () => {
  const term = mayorTerm(516);
  const mayor = { mayor: "Cole", minister: null, perks: ["Mining Fiesta"], termStart: term.start, termEnd: term.end };
  const events = generateEvents({ from: term.start, to: term.end, categories: ["mining_fiesta"], mayor });
  assert.deepEqual(
    events.map((e) => toSkyDate(e.start).month),
    [4, 6, 8, 10],
  );
  for (const e of events) assert.equal(e.end - e.start, 7 * 20 * 60_000);
});

test("grand feast replaces the harvest feast for the whole term", () => {
  const term = mayorTerm(516);
  const mayor = { mayor: "Finnegan", minister: null, perks: ["Grand Feast"], termStart: term.start, termEnd: term.end };
  const events = generateEvents({ from: term.start, to: term.end, categories: ["harvest_feast"], mayor });
  assert.equal(events.length, 1);
  assert.equal(events[0]!.title, "Grand Feast");
});

test("foxy's extra event adds one bonus run on Late Summer 22nd", () => {
  const term = mayorTerm(516);
  const mayor = { mayor: "Foxy", minister: null, perks: ["Extra Event"], termStart: term.start, termEnd: term.end, bonusEvent: "fishing_festival" as const };
  const events = generateEvents({ from: term.start, to: term.end, categories: ["fishing_festival"], mayor });
  assert.equal(events.length, 1);
  assert.deepEqual(toSkyDate(events[0]!.start), { year: 517, month: 6, day: 22, hour: 0, minute: 0 });
});
