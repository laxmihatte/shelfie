import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Must be created per request — never hoisted to a module-level singleton, or
 * one user's session leaks into another's render.
 *
 * `cookies()` is async in Next 16 with no synchronous fallback.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Server Components cannot set cookies. This is safe to ignore
            // because src/proxy.ts refreshes the session on every request and
            // writes the refreshed cookies to the response there.
          }
        },
      },
    },
  );
}
