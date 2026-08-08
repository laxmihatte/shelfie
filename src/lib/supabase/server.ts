import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_SETUP_MESSAGE, supabaseEnv } from "./env";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers.
 *
 * Must be created per request — never hoisted to a module-level singleton, or
 * one user's session leaks into another's render.
 *
 * `cookies()` is async in Next 16 with no synchronous fallback.
 */
export async function createClient() {
  // Read cookies before validating config. `cookies()` is what marks the route
  // dynamic — throwing ahead of it leaves the route eligible for static
  // prerendering, which turns a missing env var into a build failure.
  const cookieStore = await cookies();

  const env = supabaseEnv();
  if (!env) throw new Error(SUPABASE_SETUP_MESSAGE);

  return createServerClient(env.url, env.anonKey, {
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
  });
}

/** True when the app has Supabase credentials configured. */
export function isSupabaseConfigured() {
  return supabaseEnv() !== null;
}
