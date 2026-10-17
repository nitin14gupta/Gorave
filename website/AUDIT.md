# Website audit — what's built, what might be AI slop, what to link

Working list for review. Tick items off (or strike them) as they're fixed.

## 1. What's built

| # | Page | URL | Count |
|---|---|---|---|
| 1 | Homepage | `/` | 1 |
| 2 | City | `/mumbai` | 8 (+ lab `/lab/city`, 4 heroes) |
| 3 | City × type | `/mumbai/house-parties` | 48 |
| 4 | Neighbourhood (Postcards) | `/mumbai/bandra` | 33 |
| 5 | Event-type hubs | `/house-parties` … `/events` | 6 |
| 6 | All cities | `/cities` | 1 |
| 7 | Event page | `/e/[id]` | every event |
| 8 | Host profile | `/h/[username]` | every host |
| 9 | Host landing | `/host` (+ lab, 2 variants) | 1 |
| 10 | Hosting guides | `/host/guides` + 6 articles (+ lab) | 7 |
| 11 | Safety | `/safety` (+ lab) | 1 |
| 12 | 404 | any unknown URL | 1 |
| — | Shared | public API, navbar + mega menu, footer, floating dock, 14 generated images | — |

## 2. Possible AI slop (most serious first)

- [x] **Fake social proof** — placeholders deleted. Homepage now shows real reviews from `/public/reviews` (first name + last initial, platform average + count); the section hides itself when there are none.
- [x] **Made-up listings shown as real** — city + type pages now build their flyers and the night timeline from real API events (`lib/cityKit.ts`): real titles, times, areas, cover photos, links to `/e/[id]`; departure board filters by the real IST date. Home "This week", invite cards and phone mock-ups use live events (`components/ui/LiveEvents.tsx`). Fallback when the API is down: the app's invite templates only (sample events/`NIGHT_SLOTS` remain only as an offline last resort).
- [ ] **Invented names** in demos — Riya / Kabir / Meera request cards (type pages, host, safety). Either label "Example" or use real (public) data.
- [ ] **"Typical night" timelines** (8:30 PM doors…) read as facts — label as typical, or keep but soften.
- [ ] **Same headline formula everywhere** — bold + *italic serif tail* ("Open your door *to Bandra.*") on nearly every section.
- [ ] **Chapter numbers on every section** ("01 — The feeling") — fits the city story, tiring site-wide.
- [ ] **Em-dash-heavy copy** — e.g. 31 in `lib/area.ts`, 13 in `lib/safety.ts`. Classic AI-writing tell.
- [ ] **Neighbourhood profiles** (`lib/area.ts`) — general vibes ("the suburb that never quite goes to bed"), need a local sanity check for all 33.
- [ ] **Gimmick density** — some pages stack trick after trick (torch → stamps → flip → clock). Host variant B is the most extreme.
- [ ] **Image repetition** — 6 generated scenes + stock photos repeat across pages.
- [ ] **Store badges link to `#`** until the app listings are live.
- [ ] **Lab pages** (`/lab/*`) are noindex but publicly reachable — remove before launch.

## Also fixed along the way

- [x] Two hydration mismatches on city pages (unrounded star + crowd positions) and duplicate React keys when two events share a title.
- [x] City-page "After dark" stars no longer twinkle forever (no-pulsing rule).
- [x] Departure-board rows linked to `/[city]/tonight` (not built) — now link to the real event.
- [x] New pages opened at the previous page's scroll position (Lenis overrode Next's scroll-to-top). Now every route change starts at the top; browser Back keeps its position (`components/motion/SmoothScroll.tsx`).

## Dev data

`server/scripts/seed_website_demo.py` seeds ~90 upcoming events over all 33 neighbourhoods + hosts, guests, past events and reviews (local DB only; `--clean` removes everything it made — usernames end `_gx`).

## 3. Backlinks to add

| Page | Should link to | Status |
|---|---|---|
| Host profile | their city + neighbourhood + types they host | ⏳ |
| **Hosts in a city** `/mumbai/hosts` | every host in the city | ⏳ needs API |
| **Hosts in a neighbourhood** `/mumbai/bandra/hosts` | hosts in that area | ⏳ needs API |
| City / neighbourhood pages | "hosts near you" strip → the pages above | ⏳ |
| Event page | neighbourhood page (API "Andheri West" → our "Andheri") | ⏳ (city, type, host ✅) |
| Event cards | `/e/[id]` | ✅ |
