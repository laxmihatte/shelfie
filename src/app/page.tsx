import Link from "next/link";
import {
  URGENCY_STYLES,
  daysUntil,
  expiryLabel,
  urgencyOf,
} from "@/lib/urgency";

/** Placeholder pantry until the database lands on Day 2. */
const PREVIEW_ITEMS = [
  { name: "Spinach", detail: "1 bag", inDays: -1 },
  { name: "Chicken thighs", detail: "2 lb", inDays: 1 },
  { name: "Whole milk", detail: "1 gal", inDays: 2 },
  { name: "Cheddar", detail: "8 oz", inDays: 5 },
  { name: "Carrots", detail: "1 lb", inDays: 12 },
];

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export default function Home() {
  return (
    <main className="flex-1">
      <section className="mx-auto w-full max-w-5xl px-6 py-16 sm:py-24">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Shelfie
        </p>

        <h1 className="mt-4 max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          Stop throwing out groceries you forgot you bought.
        </h1>

        <p className="mt-5 max-w-xl text-lg text-foreground-muted text-pretty">
          Snap a receipt. Shelfie figures out what you bought, when it goes bad,
          and what to cook before it does.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/signup"
            className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90"
          >
            Get started
          </Link>
          <Link
            href="/login"
            className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-surface-muted"
          >
            Sign in
          </Link>
          <a
            href="https://github.com/laxmihatte/shelfie"
            target="_blank"
            rel="noreferrer"
            className="px-2 py-2.5 text-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
          >
            Source
          </a>
        </div>

        <div className="mt-16 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="flex items-baseline justify-between border-b border-border px-5 py-4">
            <h2 className="text-sm font-medium">Your pantry</h2>
            <span className="font-mono text-xs text-foreground-muted">
              preview
            </span>
          </div>

          <ul className="divide-y divide-border">
            {PREVIEW_ITEMS.map((item) => {
              const expiresAt = daysFromNow(item.inDays);
              const days = daysUntil(expiresAt);
              const style = URGENCY_STYLES[urgencyOf(expiresAt)];

              return (
                <li
                  key={item.name}
                  className="flex items-center gap-4 px-5 py-3.5"
                >
                  <span
                    className={`size-2 shrink-0 rounded-full ${style.dot}`}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {item.name}
                  </span>
                  <span className="hidden shrink-0 text-sm text-foreground-muted sm:inline">
                    {item.detail}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${style.bg} ${style.text}`}
                  >
                    {expiryLabel(days)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <footer className="mx-auto w-full max-w-5xl px-6 pb-12 text-sm text-foreground-muted">
        Built by Laxmi Hatte · Day 1 of 14
      </footer>
    </main>
  );
}
