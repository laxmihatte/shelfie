# Shelfie

**[Live demo →](https://shelfie-laxmihattes-projects.vercel.app)**

Stop throwing out groceries you forgot you bought.

Snap a photo of a grocery receipt. Shelfie extracts what you bought, works out
when each item goes bad, and suggests recipes that use up whatever is closest to
expiring.

> **Status:** in development. Day 1 of a 14-day build.

## Why

Roughly a third of the food bought by households gets thrown away, and the
usual reason is not carelessness — it's that nobody can remember what is in the
back of the fridge or when they bought it. Shelfie makes that inventory visible
and then does something about it.

## How it works

The interesting part is turning a receipt line like `GV MLK 2% GAL` into a real
expiry date. That happens in two separate steps rather than one:

```
receipt photo
  │
  ├─ 1. vision model → { raw_name: "GV MLK 2% GAL", qty: 1, price: 3.49 }
  │
  ├─ 2. mapping      → canonical_food_id: "milk_whole"        (+ confidence)
  │
  ├─ 3. shelf-life   → 7 days, refrigerated                   (curated table)
  │
  └─ expires_at = purchased_at + 7 days
```

The model never invents a date. It only maps a messy string onto a curated
shelf-life table, so expiry dates are consistent and auditable rather than
hallucinated. When mapping confidence is low, Shelfie asks once and caches the
answer against that exact receipt string — so the same store's milk maps
automatically from then on.

## Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database / auth | Supabase (Postgres + Row Level Security) |
| Extraction | Multimodal LLM with structured JSON output |
| Hosting | Vercel |

## Running locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Roadmap

- [x] **Day 1** — Scaffold, design tokens, urgency model, deploy
- [ ] **Day 2** — Supabase schema + auth, RLS on every table
- [ ] **Day 3** — Manual item entry and list view
- [ ] **Day 4** — Shelf-life table, auto-filled expiry dates
- [ ] **Day 5** — Expiry dashboard, mark used / mark wasted
- [ ] **Day 6** — Waste stats ("you threw away $34 this month")
- [ ] **Day 8** — Receipt upload and storage
- [ ] **Day 9** — Vision extraction to structured JSON
- [ ] **Day 10** — Canonical food mapping with confidence fallback
- [ ] **Day 11** — Parser tests against real receipt fixtures
- [ ] **Day 12** — Recipe generation from soonest-expiring items
- [ ] **Day 13** — Demo account with seeded data
- [ ] **Day 14** — Docs and screen recording

## Acknowledgements

The concept was inspired by [SaveRe](https://github.com/RibaDiba/SaveRe). This
is an independent implementation — different stack, different architecture, no
shared code.

## License

MIT — see [LICENSE](LICENSE).
