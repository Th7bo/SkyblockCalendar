import {
  ALARM_CHOICES,
  CATEGORIES,
  type Category,
  type CategoryGroup,
  type CategoryId,
  type CategoryPref,
} from "@sbcal/core";
import type { MayorInfo } from "../lib/api";
import { PixelIcon } from "./PixelIcon";

const GROUPS: { id: CategoryGroup; title: string; note: string }[] = [
  { id: "seasonal", title: "Festivals & seasons", note: "A few times per SkyBlock year" },
  { id: "mayor", title: "Mayor events", note: "Only while the mayor or minister has the perk" },
  { id: "recurring", title: "Recurring", note: "Hourly-ish, can get busy" },
];

interface Props {
  prefs: Record<CategoryId, CategoryPref>;
  onChange: (id: CategoryId, pref: CategoryPref) => void;
  mayor: MayorInfo | null;
}

export function CategoryTray({ prefs, onChange, mayor }: Props) {
  return (
    <section aria-label="Event categories" className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {GROUPS.map((g) => (
        <div key={g.id} className="min-w-0">
          <div className="mb-2 flex items-baseline justify-between gap-2 border-b border-line pb-2">
            <h3 className="shrink-0 text-sm font-semibold">{g.title}</h3>
            <span className="truncate text-xs text-faint">{g.note}</span>
          </div>
          <ul className="divide-y divide-line/60">
            {CATEGORIES.filter((c) => c.group === g.id).map((c) => (
              <CategoryRow key={c.id} cat={c} pref={prefs[c.id]} onChange={(p) => onChange(c.id, p)} mayor={mayor} />
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

function mayorStatus(cat: Category, mayor: MayorInfo | null): string | null {
  if (!cat.perk) return null;
  if (!mayor) return "Mayor data unavailable";
  if (mayor.mayorPerks.includes(cat.perk)) return `Active · Mayor ${mayor.mayor}`;
  if (mayor.ministerPerk === cat.perk) return `Active · Minister ${mayor.minister}`;
  if (mayor.bonusEvent === cat.id) return `One bonus run · Mayor ${mayor.mayor}`;
  return "Not active this term";
}

function CategoryRow({
  cat,
  pref,
  onChange,
  mayor,
}: {
  cat: Category;
  pref: CategoryPref;
  onChange: (p: CategoryPref) => void;
  mayor: MayorInfo | null;
}) {
  const status = mayorStatus(cat, mayor);
  const active = status?.startsWith("Active");
  const id = `cat-${cat.id}`;

  return (
    <li className="flex items-center gap-3 py-2.5">
      <span aria-hidden className="slot grid size-9 shrink-0 place-items-center">
        <PixelIcon name={cat.id} muted={!pref.enabled} className="size-5 transition-[filter]" />
      </span>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span className={`block truncate text-sm font-medium ${pref.enabled ? "text-fg" : "text-faint"}`}>
          {cat.name}
        </span>
        <span className="block truncate text-xs text-faint">
          {status ? <span className={active ? "text-[#55FF55]/80" : ""}>{status}</span> : cat.blurb}
        </span>
      </label>

      <select
        aria-label={`${cat.name} reminder`}
        disabled={!pref.enabled}
        value={pref.alarm ?? ""}
        onChange={(e) => onChange({ ...pref, alarm: e.target.value === "" ? null : Number(e.target.value) })}
        className="h-7 w-[5.5rem] shrink-0 cursor-pointer appearance-none border border-line bg-panel-2 px-2 font-mono text-xs text-muted outline-none hover:border-line-2 focus-visible:border-gold disabled:cursor-not-allowed disabled:opacity-30"
      >
        {ALARM_CHOICES.map((m) => (
          <option key={m ?? "none"} value={m ?? ""}>
            {m === null ? "No alert" : m === 0 ? "At start" : m >= 60 ? `${m / 60}h before` : `${m}m before`}
          </option>
        ))}
      </select>

      <Switch id={id} checked={pref.enabled} color={cat.color} onChange={(enabled) => onChange({ ...pref, enabled })} />
    </li>
  );
}

function Switch({
  id,
  checked,
  color,
  onChange,
}: {
  id: string;
  checked: boolean;
  color: string;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="slot relative h-6 w-11 shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <span
        className="absolute top-1 size-4 transition-[left,background-color] duration-150"
        style={{
          left: checked ? "calc(100% - 1.25rem)" : "0.25rem",
          background: checked ? color : "#4a4753",
          boxShadow: "inset -2px -2px 0 #0004, inset 2px 2px 0 #fff3",
        }}
      />
    </button>
  );
}
