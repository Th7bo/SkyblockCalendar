import { Link } from "react-router";
import { SkyClock, TopBar } from "../components/Brand";
import { CalendarPanel } from "../components/CalendarPanel";
import { useMayor } from "../lib/hooks";
import { enabledSet, defaultPrefs } from "../lib/prefs";
import { useNow } from "../lib/time";

const demoEnabled = enabledSet(defaultPrefs());

const STEPS = [
  ["Pick", "Toggle the events you care about. Everything else greys out."],
  ["Finish", "You get one private subscription link, made for you."],
  ["Forget", "Your phone's calendar keeps itself up to date, mayors included."],
] as const;

export function Landing({ signedIn }: { signedIn: boolean }) {
  const now = useNow();
  const mayor = useMayor();

  return (
    <div className="min-h-dvh">
      <TopBar
        now={now}
        right={
          signedIn ? (
            <Link to="/app" className="text-sm font-medium text-gold hover:underline">
              Open app →
            </Link>
          ) : (
            <Link to="/login" className="text-sm text-muted hover:text-fg">
              Sign in
            </Link>
          )
        }
      />

      <main className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-12 md:py-20 lg:grid-cols-[1fr_minmax(0,34rem)] lg:gap-16">
        <div className="rise">
          <div className="mb-5 md:hidden">
            <SkyClock now={now} />
          </div>
          <h1 className="text-4xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-5xl">
            The SkyBlock calendar, <span className="mc-text font-normal text-gold">in your pocket.</span>
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
            Spooky Festivals, Traveling Zoos, Dark Auctions and whatever the mayor is up to, sitting right next to the
            rest of your week. No more logging in just to check.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to={signedIn ? "/app" : "/register"}
              className="bg-gold px-5 py-2.5 text-sm font-semibold text-ink shadow-[inset_-3px_-3px_0_#0003,inset_3px_3px_0_#fff5] hover:brightness-110 active:translate-y-px"
            >
              {signedIn ? "Open your calendar" : "Make my calendar"}
            </Link>
            <span className="text-xs text-faint">Free · works with Apple, Google & Outlook</span>
          </div>

          <ol className="mt-12 grid gap-5 border-t border-line pt-6 sm:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <li key={title}>
                <p className="mc-text text-sm text-gold">
                  {i + 1}. {title}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="rise [animation-delay:80ms]">
          <CalendarPanel now={now} enabled={demoEnabled} mayor={mayor} />
          <p className="mt-2 text-right text-xs text-faint">Live · hover a day</p>
        </div>
      </main>

      <footer className="mx-auto max-w-6xl px-4 pb-8 text-xs text-faint">
        Not affiliated with Hypixel or Mojang.
      </footer>
    </div>
  );
}
