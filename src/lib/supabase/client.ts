import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_SETUP_MESSAGE, supabaseEnv } from "./env";

/** Supabase client for Client Components. Safe to call repeatedly. */
export function createClient() {
  const env = supabaseEnv();
  if (!env) throw new Error(SUPABASE_SETUP_MESSAGE);

  return createBrowserClient(env.url, env.anonKey);
}
