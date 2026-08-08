import { redirect } from "next/navigation";
import { signOut } from "@/app/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already gates this route; this is the defence-in-depth check that
  // guarantees `user` is non-null for everything below.
  if (!user) redirect("/login?next=/dashboard");

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <header className="flex items-baseline justify-between gap-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            Shelfie
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">
            Your pantry
          </h1>
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

      <p className="mt-1.5 text-sm text-foreground-muted">
        Signed in as {user.email}
      </p>

      <div className="mt-10 rounded-2xl border border-dashed border-border px-6 py-16 text-center">
        <p className="font-medium">Nothing here yet</p>
        <p className="mx-auto mt-1.5 max-w-xs text-sm text-foreground-muted">
          Adding items lands on Day 3. Receipt scanning lands on Day 9.
        </p>
      </div>
    </main>
  );
}
