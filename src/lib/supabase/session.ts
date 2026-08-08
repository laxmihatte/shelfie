import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseEnv } from "./env";

/** Routes that require a signed-in user. */
const PROTECTED_PREFIXES = ["/dashboard"];

/** Routes a signed-in user should not see; they get sent to the dashboard. */
const AUTH_ONLY_PREFIXES = ["/login", "/signup"];

const startsWithAny = (path: string, prefixes: string[]) =>
  prefixes.some((p) => path === p || path.startsWith(`${p}/`));

function redirectTo(request: NextRequest, pathname: string, next?: string) {
  const url = request.nextUrl.clone();
  url.pathname = pathname;
  url.search = "";
  if (next) url.searchParams.set("next", next);
  return NextResponse.redirect(url);
}

/**
 * Refreshes the auth session on every request and gates protected routes.
 *
 * Two things must happen in this exact shape or auth breaks in ways that are
 * painful to debug:
 *
 * 1. The refreshed cookies are written to BOTH the request (so the current
 *    render sees them) and the response (so the browser stores them).
 * 2. `getClaims()` is awaited before any response is returned, so a refresh
 *    that lands mid-request still makes it into `Set-Cookie`.
 */
export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const env = supabaseEnv();

  // Unconfigured deploy: public pages still render, but anything requiring a
  // session fails closed rather than letting requests through unauthenticated.
  if (!env) {
    return startsWithAny(pathname, PROTECTED_PREFIXES)
      ? redirectTo(request, "/login", pathname)
      : NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
        // Auth responses must never be cached by Vercel's CDN, or one user's
        // refreshed token can be served to another.
        for (const [key, headerValue] of Object.entries(headers)) {
          response.headers.set(key, headerValue);
        }
      },
    },
  });

  const { data } = await supabase.auth.getClaims();
  const isSignedIn = Boolean(data?.claims);

  if (!isSignedIn && startsWithAny(pathname, PROTECTED_PREFIXES)) {
    return redirectTo(request, "/login", pathname);
  }

  if (isSignedIn && startsWithAny(pathname, AUTH_ONLY_PREFIXES)) {
    return redirectTo(request, "/dashboard");
  }

  return response;
}
