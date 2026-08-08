import { parseDateOnly, type FoodItem } from "@/lib/db-types";
import { URGENCY_STYLES, daysUntil, expiryLabel, urgencyOf } from "@/lib/urgency";
import { deleteItem, resolveItem, restoreItem } from "./actions";

const QUANTITY_FORMAT = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

function describeAmount(item: FoodItem): string | null {
  const parts = [QUANTITY_FORMAT.format(item.quantity), item.unit].filter(
    Boolean,
  );
  const amount = parts.join(" ");
  return amount === "1" ? null : amount;
}

function IconButton({
  action,
  id,
  status,
  label,
  className,
}: {
  action: (formData: FormData) => Promise<void>;
  id: string;
  status?: string;
  label: string;
  className?: string;
}) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      {status ? <input type="hidden" name="status" value={status} /> : null}
      <button
        type="submit"
        className={`rounded-lg border border-border px-2.5 py-1 text-xs font-medium transition-colors hover:bg-surface-muted ${className ?? ""}`}
      >
        {label}
      </button>
    </form>
  );
}

export function ItemList({ items }: { items: FoodItem[] }) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">Nothing tracked yet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-foreground-muted">
          Add what&rsquo;s in your fridge above. Receipt scanning arrives on
          Day 9.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
      {items.map((item) => {
        const days = daysUntil(parseDateOnly(item.expires_at));
        const style = URGENCY_STYLES[urgencyOf(parseDateOnly(item.expires_at))];
        const amount = describeAmount(item);

        return (
          <li
            key={item.id}
            className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-5"
          >
            <span
              className={`size-2 shrink-0 rounded-full ${style.dot}`}
              aria-hidden
            />

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
              {item.status === "active" ? (
                <>
                  <IconButton
                    action={resolveItem}
                    id={item.id}
                    status="used"
                    label="Used"
                  />
                  <IconButton
                    action={resolveItem}
                    id={item.id}
                    status="wasted"
                    label="Wasted"
                  />
                </>
              ) : (
                <IconButton action={restoreItem} id={item.id} label="Undo" />
              )}
              <IconButton
                action={deleteItem}
                id={item.id}
                label="Delete"
                className="text-foreground-muted"
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
