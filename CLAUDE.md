@AGENTS.md

# Shelfie — project conventions

## Next.js 16 gotchas that will bite

Verified against the bundled docs in `node_modules/next/dist/docs/`:

- **Request APIs are async, with no sync fallback.** `cookies()`, `headers()`,
  `draftMode()`, and `params` / `searchParams` must all be awaited. This matters
  for Supabase server-side auth, which reads cookies.
- **`middleware.ts` is now `proxy.ts`**, and the exported function should be
  named `proxy`. The `edge` runtime is not supported there — `proxy` is always
  Node. Supabase's session-refresh middleware needs this rename.
- **Use the generated prop helpers**: `PageProps<'/route'>`,
  `LayoutProps<'/'>`, `RouteContext<'/api/route'>`. Run `npx next typegen` if
  they go stale.
- Turbopack is the default bundler for both `dev` and `build`.

## Styling

Colors come from CSS custom properties in `src/app/globals.css`, exposed to
Tailwind through `@theme inline`. Do not hardcode hex values or use stock
Tailwind palette colors (`bg-red-500`) in components — add a token instead, so
light and dark stay in sync.

## Urgency

`src/lib/urgency.ts` is the single source of truth for how close an item is to
expiring. Thresholds, labels, and per-bucket styles all live there. The
dashboard, the item list, and the future notification job must all read from it
rather than re-deriving "is this urgent".

Day comparisons are calendar-based, not elapsed-hours based — an item expiring
later today is 0 days out, not -1.
