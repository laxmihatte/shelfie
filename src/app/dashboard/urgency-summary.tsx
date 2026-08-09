import Link from "next/link";
import { URGENCY_LEVELS, URGENCY_STYLES, type Urgency } from "@/lib/urgency";

export type UrgencyCounts = Record<Urgency, number>;

const DESCRIPTIONS: Record<Urgency, string> = {
  expired: "Past date",
  urgent: "Within 2 days",
  soon: "Within 5 days",
  fresh: "More than 5 days",
};

/**
 * Filter tiles, one per urgency bucket.
 *
 * These are status colours, so each tile states its condition in words as well
 * — the count and label carry the meaning if the colour cannot.
 */
export function UrgencySummary({
  counts,
  active,
}: {
  counts: UrgencyCounts;
  active: Urgency | "all";
}) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {URGENCY_LEVELS.map((level) => {
        const style = URGENCY_STYLES[level];
        const isActive = active === level;
        const count = counts[level];

        return (
          <Link
            key={level}
            href={isActive ? "/dashboard" : `/dashboard?filter=${level}`}
            aria-pressed={isActive}
            className={`rounded-xl border px-3 py-2.5 transition-colors ${
              isActive
                ? "border-foreground-muted bg-surface-muted"
                : "border-border bg-surface hover:bg-surface-muted"
            } ${count === 0 ? "opacity-55" : ""}`}
          >
            <span className="flex items-center gap-1.5">
              <span
                className={`size-2 shrink-0 rounded-full ${style.dot}`}
                aria-hidden
              />
              <span className="truncate text-xs font-medium">
                {style.label}
              </span>
            </span>
            <span className="mt-1 block text-2xl font-semibold">{count}</span>
            <span className="block text-xs text-foreground-muted">
              {DESCRIPTIONS[level]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/** The one headline the dashboard leads with. */
export function Headline({ counts }: { counts: UrgencyCounts }) {
  const needsEating = counts.expired + counts.urgent;
  const total = URGENCY_LEVELS.reduce((sum, l) => sum + counts[l], 0);

  if (total === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Nothing tracked yet — add what&rsquo;s in your kitchen below.
      </p>
    );
  }

  if (needsEating === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        Nothing urgent. {total} {total === 1 ? "item" : "items"} tracked.
      </p>
    );
  }

  return (
    <p className="text-sm">
      <span className="font-semibold text-urgent">
        {needsEating} {needsEating === 1 ? "item needs" : "items need"} eating
      </span>
      <span className="text-foreground-muted"> · {total} tracked</span>
    </p>
  );
}
