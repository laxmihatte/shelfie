import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import type { FoodItem } from "@/lib/db-types";
import { createClient } from "@/lib/supabase/server";
import { AddItemForm } from "./add-item-form";
import { ItemList } from "./item-list";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this route; this is the defence-in-depth check that
  // guarantees `user` is non-null for everything below.
  if (!user) redirect("/login?next=/dashboard");

  // No .eq('user_id') filter: the RLS policy scopes this to the caller. The
  // index on (user_id, expires_at) where status = 'active' backs this query.
  const { data, error } = await supabase
    .from("food_items")
    .select("*")
    .eq("status", "active")
    .order("expires_at", { ascending: true });

  const items = (data ?? []) as FoodItem[];

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
          <p className="mt-1 text-sm text-foreground-muted">
            {user.email}
          </p>
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

      <div className="mt-8">
        <AddItemForm />
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded-lg bg-expired-bg px-3 py-2 text-sm text-expired"
        >
          Could not load your pantry. Refresh to try again.
        </p>
      ) : (
        <div className="mt-6">
          <ItemList items={items} />
        </div>
      )}
    </main>
  );
}
