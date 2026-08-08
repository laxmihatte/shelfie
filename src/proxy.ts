import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/session";

// Renamed from `middleware.ts` in Next 16. The runtime is always Node here.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Everything except static assets and image files. Auth cookies refresh on
     * page navigations, not on every chunk request.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico)$).*)",
  ],
};
