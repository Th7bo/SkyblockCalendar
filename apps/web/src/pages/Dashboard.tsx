import type { CategoryId, CategoryPref } from "@sbcal/core";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { TopBar } from "../components/Brand";
import { CalendarPanel } from "../components/CalendarPanel";
import { CategoryTray } from "../components/CategoryTray";
import { MayorCard, UpNext } from "../components/Sidebar";
import { SubscribeDialog } from "../components/SubscribeDialog";
import { api, ApiError, type Me } from "../lib/api";
import { useMayor } from "../lib/hooks";
import { enabledSet, samePrefs, withDefaults } from "../lib/prefs";
import { useNow } from "../lib/time";

export function Dashboard({ me, refresh }: { me: Me; refresh: () => Promise<void> }) {
  const now = useNow();
  const mayor = useMayor();
  const navigate = useNavigate();

  const saved = useMemo(() => withDefaults(me.feed?.prefs), [me.feed?.prefs]);
  const [prefs, setPrefs] = useState(saved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLink, setShowLink] = useState(false);

  const enabled = useMemo(() => enabledSet(prefs), [prefs]);
  const dirty = !me.feed || !samePrefs(prefs, saved);

  const update = (id: CategoryId, pref: CategoryPref) => setPrefs((p) => ({ ...p, [id]: pref }));

  const finish = async () => {
    setError(null);
    if (dirty) {
      setBusy(true);
      try {
        await api.saveFeed(prefs);
        await refresh();
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "Couldn't save, try again");
        return;
      } finally {
        setBusy(false);
      }
    }
    setShowLink(true);
  };

  const logout = async () => {
    await api.logout();
    await refresh();
    navigate("/");
  };

  return (
    <div className="min-h-dvh pb-28">
      <TopBar
        now={now}
        right={
          <>
            <span className="hidden max-w-48 truncate text-xs text-faint sm:block">{me.email}</span>
            <button type="button" onClick={logout} className="text-sm text-muted hover:text-fg">
              Sign out
            </button>
          </>
        }
      />

      <main className="mx-auto max-w-6xl px-4 pt-8">
        <div className="rise mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">Your SkyBlock calendar</h1>
          <p className="mt-1 text-sm text-muted">
            Toggle what you want below. Anything switched off greys out here and stays out of your phone.
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <CalendarPanel now={now} enabled={enabled} mayor={mayor} />
          <aside className="grid content-start gap-4">
            <UpNext now={now} enabled={enabled} mayor={mayor} />
            <MayorCard mayor={mayor} now={now} />
          </aside>
        </div>

        <div className="mt-8 border border-line bg-panel p-4 sm:p-5">
          <CategoryTray prefs={prefs} onChange={update} mayor={mayor} />
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ink/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <p className="min-w-0 truncate text-xs text-muted sm:text-sm">
            {error ? (
              <span className="text-[#ff8a8a]">{error}</span>
            ) : (
              <>
                <span className="font-mono text-fg">{enabled.size}</span> of {Object.keys(prefs).length} categories
                {me.feed && dirty && <span className="text-gold"> · unsaved changes</span>}
              </>
            )}
          </p>
          <div className="flex shrink-0 items-center gap-3">
            {me.feed && dirty && (
              <button type="button" onClick={() => setPrefs(saved)} className="text-sm text-muted hover:text-fg">
                Discard
              </button>
            )}
            <button
              type="button"
              onClick={finish}
              disabled={busy || enabled.size === 0}
              className="bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[inset_-3px_-3px_0_#0003,inset_3px_3px_0_#fff5] hover:brightness-110 active:translate-y-px disabled:opacity-50"
            >
              {busy ? "Saving…" : !me.feed ? "Finish" : dirty ? "Save changes" : "Get my link"}
            </button>
          </div>
        </div>
      </div>

      {showLink && me.feed && (
        <SubscribeDialog
          token={me.feed.token}
          lastFetchedAt={me.feed.lastFetchedAt}
          onClose={() => setShowLink(false)}
          onRotate={async () => {
            await api.rotateFeed();
            await refresh();
          }}
        />
      )}
    </div>
  );
}
