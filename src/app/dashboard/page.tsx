import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { parseDateOnly, type FoodItem } from "@/lib/db-types";
import type { ShelfLifeEntry } from "@/lib/shelf-life";
import { createClient } from "@/lib/supabase/server";
import { URGENCY_LEVELS, urgencyOf, type Urgency } from "@/lib/urgency";
import { AddItemForm } from "./add-item-form";
import { ItemList } from "./item-list";
import {
  Headline,
  UrgencySummary,
  type UrgencyCounts,
} from "./urgency-summary";

function parseFilter(value: string | string[] | undefined): Urgency | "all" {
  return typeof value === "string" &&
    (URGENCY_LEVELS as readonly string[]).includes(value)
    ? (value as Urgency)
    : "all";
}

export default async function DashboardPage(props: PageProps<"/dashboard">) {
  const filter = parseFilter((await props.searchParams).filter);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this route; this is the defence-in-depth check that
  // guarantees `user` is non-null for everything below.
  if (!user) redirect("/login?next=/dashboard");

  // No .eq('user_id') filter: the RLS policy scopes these to the caller. The
  // index on (user_id, expires_at) where status = 'active' backs the first.
  const [itemsResult, shelfLifeResult] = await Promise.all([
    supabase
      .from("food_items")
      .select("*")
      .eq("status", "active")
      .order("expires_at", { ascending: true }),
    // ~85 rows of shared reference data, small enough to match against in the
    // browser so the expiry date fills in as the user types.
    supabase.from("shelf_life").select("*"),
  ]);

  const { data, error } = itemsResult;
  const allItems = (data ?? []) as FoodItem[];
  const entries = (shelfLifeResult.data ?? []) as ShelfLifeEntry[];

  // Bucketing happens here rather than in SQL because urgency is defined by
  // lib/urgency.ts, and one definition beats a second one in a query.
  const counts = URGENCY_LEVELS.reduce(
    (acc, level) => ({ ...acc, [level]: 0 }),
    {} as UrgencyCounts,
  );
  for (const item of allItems) {
    counts[urgencyOf(parseDateOnly(item.expires_at))] += 1;
  }

  const items =
    filter === "all"
      ? allItems
      : allItems.filter(
          (item) => urgencyOf(parseDateOnly(item.expires_at)) === filter,
        );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Shelfie
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Your pantry
          </h1>
          <p className="mt-1 text-sm text-foreground-muted">{user.email}</p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-surface-muted"
          >
            Sign out
          </button>
        </form>
      </header>

      <div className="mt-6">
        <Headline counts={counts} />
      </div>

      <div className="mt-4">
        <UrgencySummary counts={counts} active={filter} />
      </div>

      <div className="mt-6">
        <AddItemForm entries={entries} />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-expired-bg px-3 py-2 text-sm text-expired"
        >
          Could not load your pantry. Refresh to try again.
        </p>
      ) : (
        <div className="mt-8">
          <ItemList items={items} grouped={filter === "all"} />
        </div>
      )}
    </main>
  );
}
