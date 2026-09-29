import { useEffect, useRef, useState } from "react";
import { feedUrls } from "../lib/api";

interface Props {
  token: string;
  lastFetchedAt: string | null;
  onClose: () => void;
  onRotate: () => Promise<void>;
}

export function SubscribeDialog({ token, lastFetchedAt, onClose, onRotate }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);
  const [rotating, setRotating] = useState(false);
  const urls = feedUrls(token);

  useEffect(() => {
    ref.current?.showModal();
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(urls.https);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const rotate = async () => {
    if (!confirm("Generate a new link? Calendars using the current link will stop updating.")) return;
    setRotating(true);
    await onRotate().finally(() => setRotating(false));
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && ref.current?.close()}
      className="m-auto w-[min(34rem,calc(100vw-32px))] border border-line-2 bg-panel p-0 text-fg backdrop:bg-black/70 backdrop:backdrop-blur-[2px]"
    >
      <div className="rise p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="mc-text text-xs uppercase tracking-[0.18em] text-gold">Ready</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">Add it to your calendar</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={() => ref.current?.close()}
            className="grid size-8 place-items-center text-muted hover:text-fg"
          >
            <svg viewBox="0 0 16 16" className="size-4" stroke="currentColor" strokeWidth="2">
              <path d="m3 3 10 10M13 3 3 13" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Provider href={urls.webcal} label="Apple" sub="iPhone, Mac" />
          <Provider href={urls.google} label="Google" sub="Android, web" external />
          <Provider href={urls.outlook} label="Outlook" sub="outlook.com" external />
        </div>

        <p className="mt-5 mb-1.5 text-xs text-faint">Or paste this subscription URL anywhere:</p>
        <div className="flex">
          <input
            readOnly
            value={urls.https}
            onFocus={(e) => e.currentTarget.select()}
            className="slot min-w-0 flex-1 px-3 py-2 font-mono text-xs text-muted outline-none"
          />
          <button
            type="button"
            onClick={copy}
            className="w-20 shrink-0 bg-gold px-3 text-sm font-semibold text-ink hover:brightness-110 active:translate-y-px"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>

        <ul className="mt-5 space-y-1.5 text-xs leading-relaxed text-muted">
          <li>
            Changing your toggles later updates this same link, so your calendar follows along. No need to re-add it.
          </li>
          <li>
            Google Calendar refreshes subscriptions slowly (up to a day) and ignores reminders from feeds. Set a default
            notification on the calendar in Google instead.
          </li>
          <li>Keep the link private: anyone with it can see your feed.</li>
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-line pt-4 text-xs">
          <span className="text-faint">
            {lastFetchedAt
              ? `Last synced by a calendar ${new Date(lastFetchedAt).toLocaleString()}`
              : "Not synced by any calendar yet"}
          </span>
          <button type="button" onClick={rotate} disabled={rotating} className="text-muted underline-offset-2 hover:text-fg hover:underline">
            {rotating ? "Resetting…" : "Reset link"}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Provider({ href, label, sub, external }: { href: string; label: string; sub: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="slot block px-3 py-3 hover:brightness-150 active:translate-y-px"
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="block text-xs text-faint">{sub}</span>
    </a>
  );
}
