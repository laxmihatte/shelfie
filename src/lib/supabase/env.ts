/**
 * Supabase connection details.
 *
 * Read through `supabaseEnv()` rather than touching process.env directly. A
 * missing variable must never take down public pages: proxy.ts runs on every
 * request, so throwing at module scope would turn one unset var into a
 * site-wide 500 rather than a broken sign-in page.
 */

export type SupabaseEnv = { url: string; anonKey: string };

export function supabaseEnv(): SupabaseEnv | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // The placeholder values in .env.example must not count as configured.
  if (!url || !anonKey) return null;
  if (url.includes("your-project") || anonKey.startsWith("your-")) return null;

  return { url, anonKey };
}

export const SUPABASE_SETUP_MESSAGE =
  "Supabase is not configured. Copy .env.example to .env.local and fill in your project URL and anon key.";
