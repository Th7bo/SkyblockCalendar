import { generateEvents, type CategoryId, type SkyEvent } from "@sbcal/core";
import { useMemo } from "react";
import type { MayorInfo } from "../lib/api";
import { countdown, localWhen } from "../lib/time";
import { PixelIcon } from "./PixelIcon";

const WEEK = 7 * 86_400_000;

/** Next occurrence of every enabled category, soonest first. */
export function UpNext({ now, enabled, mayor }: { now: number; enabled: Set<CategoryId>; mayor: MayorInfo | null }) {
  // Recompute once a minute; the countdowns tick from `now` separately.
  const minute = Math.floor(now / 60_000);
  const next = useMemo(() => {
    const events = generateEvents({ from: minute * 60_000, to: minute * 60_000 + WEEK, categories: enabled, mayor });
    const seen = new Map<CategoryId, SkyEvent>();
    for (const e of events) if (!seen.has(e.category)) seen.set(e.category, e);
    return [...seen.values()].sort((a, b) => a.start - b.start);
  }, [minute, enabled, mayor]);

  return (
    <section className="rounded-sm border border-line bg-panel p-4 sm:p-5">
      <h2 className="mb-3 text-sm font-semibold">Up next</h2>
      {next.length === 0 ? (
        <p className="text-sm text-faint">Nothing enabled in the next week.</p>
      ) : (
        <ol className="space-y-2.5">
          {next.map((e) => {
            const live = e.start <= now && e.end > now;
            return (
              <li key={e.uid} className="flex items-center gap-3">
                <PixelIcon name={e.category} className="size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{e.title}</p>
                  <p className="text-xs text-faint">{live ? `ends ${localWhen(e.end, now)}` : localWhen(e.start, now)}</p>
                </div>
                {live ? (
                  <span className="mc-text bg-[#55FF55]/10 px-1.5 py-0.5 text-xs text-[#55FF55]">LIVE</span>
                ) : (
                  <span className="font-mono text-xs tabular-nums text-muted">{countdown(e.start - now)}</span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

export function MayorCard({ mayor, now }: { mayor: MayorInfo | null; now: number }) {
  if (!mayor) {
    return (
      <section className="rounded-sm border border-line bg-panel p-4 text-sm text-faint sm:p-5">
        Couldn't reach Hypixel for mayor data.
      </section>
    );
  }
  const total = mayor.election?.candidates.reduce((s, c) => s + c.votes, 0) ?? 0;

  return (
    <section className="rounded-sm border border-line bg-panel p-4 sm:p-5">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Mayor</h2>
        <span className="text-xs text-faint">term ends in {countdown(mayor.termEnd - now)}</span>
      </div>
      <p className="mc-text text-lg text-[#FFFF55]">{mayor.mayor}</p>
      <p className="mb-3 text-xs text-muted">{mayor.mayorPerks.join(" · ")}</p>
      {mayor.minister && (
        <>
          <p className="mc-text text-[#55FFFF]">Minister {mayor.minister}</p>
          <p className="text-xs text-muted">{mayor.ministerPerk}</p>
        </>
      )}

      {mayor.election && total > 0 && (
        <div className="mt-4 border-t border-line pt-3">
          <p className="mb-2 text-xs text-faint">Year {mayor.election.year} election</p>
          <ul className="space-y-1.5">
            {mayor.election.candidates.map((c) => (
              <li key={c.name} className="grid grid-cols-[5rem_1fr_2.5rem] items-center gap-2 text-xs">
                <span className="truncate text-muted">{c.name}</span>
                <span className="slot h-2">
                  <span
                    className="block h-full"
                    style={{
                      width: `${(c.votes / total) * 100}%`,
                      background: c.name === mayor.election!.leader ? "#FFAA00" : "#4a4753",
                    }}
                  />
                </span>
                <span className="text-right font-mono tabular-nums text-faint">{Math.round((c.votes / total) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
