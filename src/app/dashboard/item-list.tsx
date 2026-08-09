import { parseDateOnly, type FoodItem } from "@/lib/db-types";
import {
  URGENCY_LEVELS,
  URGENCY_STYLES,
  daysUntil,
  expiryLabel,
  urgencyOf,
  type Urgency,
} from "@/lib/urgency";
import { deleteItem, resolveItem } from "./actions";

const QUANTITY_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function describeAmount(item: FoodItem): string | null {
  const amount = [QUANTITY_FORMAT.format(item.quantity), item.unit]
    .filter(Boolean)
    .join(" ");
  return amount === "1" ? null : amount;
}

function ActionButton({
  action,
  id,
  status,
  label,
  muted,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  status?: string;
  label: string;
  muted?: boolean;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {status ? <input type="hidden" name="status" value={status} /> : null}
      <button
        type="submit"
        className={`rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-muted ${
          muted ? "text-foreground-muted" : ""
        }`}
      >
        {label}
      </button>
    </form>
  );
}

function Row({ item }: { item: FoodItem }) {
  const expiresAt = parseDateOnly(item.expires_at);
  const days = daysUntil(expiresAt);
  const style = URGENCY_STYLES[urgencyOf(expiresAt)];
  const amount = describeAmount(item);

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5">
      <span className={`size-2 shrink-0 rounded-full ${style.dot}`} aria-hidden />

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-xs text-foreground-muted">
          {[amount, item.storage].filter(Boolean).join(" · ")}
        </p>
      </div>

      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
      >
        {expiryLabel(days)}
      </span>

      <div className="flex shrink-0 gap-1.5">
        <ActionButton action={resolveItem} id={item.id} status="used" label="Used" />
        <ActionButton
          action={resolveItem}
          id={item.id}
          status="wasted"
          label="Wasted"
        />
        <ActionButton action={deleteItem} id={item.id} label="Delete" muted />
      </div>
    </li>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {children}
    </ul>
  );
}

export function ItemList({
  items,
  grouped,
}: {
  items: FoodItem[];
  /** Section by urgency. Off when a single bucket is already filtered. */
  grouped: boolean;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">Nothing here</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-foreground-muted">
          Items you add will show up here, soonest to expire first.
        </p>
      </div>
    );
  }

  if (!grouped) {
    return (
      <Panel>
        {items.map((item) => (
          <Row key={item.id} item={item} />
        ))}
      </Panel>
    );
  }

  const buckets = new Map<Urgency, FoodItem[]>();
  for (const item of items) {
    const level = urgencyOf(parseDateOnly(item.expires_at));
    const bucket = buckets.get(level);
    if (bucket) bucket.push(item);
    else buckets.set(level, [item]);
  }

  return (
    <div className="space-y-6">
      {URGENCY_LEVELS.filter((level) => buckets.has(level)).map((level) => {
        const bucket = buckets.get(level)!;
        return (
          <section key={level}>
            <h2 className="mb-2 flex items-center gap-2 px-1 text-xs font-medium uppercase tracking-wide text-foreground-muted">
              <span
                className={`size-2 rounded-full ${URGENCY_STYLES[level].dot}`}
                aria-hidden
              />
              {URGENCY_STYLES[level].label}
              <span className="font-normal normal-case">({bucket.length})</span>
            </h2>
            <Panel>
              {bucket.map((item) => (
                <Row key={item.id} item={item} />
              ))}
            </Panel>
          </section>
        );
      })}
    </div>
  );
}
