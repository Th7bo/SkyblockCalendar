import { formatSkyDate, toSkyDate } from "@sbcal/core";
import type { ReactNode } from "react";
import { Link } from "react-router";

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <img src="/favicon.svg" alt="" className="size-6 [image-rendering:pixelated]" />
      <span className="text-[15px] font-semibold tracking-tight">
        Skyblock<span className="text-gold">Cal</span>
      </span>
    </Link>
  );
}

export function SkyClock({ now }: { now: number }) {
  return (
    <span className="mc-text text-xs text-muted sm:text-sm" aria-live="off">
      {formatSkyDate(toSkyDate(now), true)}
    </span>
  );
}

export function TopBar({ now, right }: { now: number; right?: ReactNode }) {
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Logo />
        <div className="hidden md:block">
          <SkyClock now={now} />
        </div>
        <div className="flex items-center gap-3">{right}</div>
      </div>
    </header>
  );
}
