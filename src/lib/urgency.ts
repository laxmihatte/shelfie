/**
 * Urgency buckets.
 *
 * Every food item lands in exactly one bucket based on days until it expires.
 * Thresholds live here so the dashboard, the item list, and (later) the
 * notification job all agree on what "urgent" means.
 */

export const URGENCY_LEVELS = ["expired", "urgent", "soon", "fresh"] as const;

export type Urgency = (typeof URGENCY_LEVELS)[number];

/** Upper bound (inclusive) in days for each bucket, checked in order. */
const THRESHOLDS: ReadonlyArray<{ level: Urgency; maxDays: number }> = [
  { level: "expired", maxDays: -1 },
  { level: "urgent", maxDays: 2 },
  { level: "soon", maxDays: 5 },
];

/** Number of whole days from `from` until `expiresAt`. Negative once expired. */
export function daysUntil(expiresAt: Date, from: Date = new Date()): number {
  // Compare calendar days, not elapsed hours: an item expiring later today is
  // 0 days out, not -1 because the clock has passed its timestamp.
  const startOfDay = (d: Date) =>
    Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const MS_PER_DAY = 86_400_000;
  return Math.round((startOfDay(expiresAt) - startOfDay(from)) / MS_PER_DAY);
}

export function urgencyFromDays(days: number): Urgency {
  return THRESHOLDS.find((t) => days <= t.maxDays)?.level ?? "fresh";
}

export function urgencyOf(expiresAt: Date, from: Date = new Date()): Urgency {
  return urgencyFromDays(daysUntil(expiresAt, from));
}

/** Short human label, e.g. "2 days left" / "Expired 3 days ago" / "Today". */
export function expiryLabel(days: number): string {
  if (days === 0) return "Expires today";
  if (days === 1) return "1 day left";
  if (days > 1) return `${days} days left`;
  if (days === -1) return "Expired yesterday";
  return `Expired ${Math.abs(days)} days ago`;
}

/** Tailwind classes per bucket, driven by the tokens in globals.css. */
export const URGENCY_STYLES: Record<
  Urgency,
  { text: string; bg: string; dot: string; label: string }
> = {
  expired: {
    text: "text-expired",
    bg: "bg-expired-bg",
    dot: "bg-expired",
    label: "Expired",
  },
  urgent: {
    text: "text-urgent",
    bg: "bg-urgent-bg",
    dot: "bg-urgent",
    label: "Eat now",
  },
  soon: {
    text: "text-soon",
    bg: "bg-soon-bg",
    dot: "bg-soon",
    label: "Use soon",
  },
  fresh: {
    text: "text-fresh",
    bg: "bg-fresh-bg",
    dot: "bg-fresh",
    label: "Fresh",
  },
};
