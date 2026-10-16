# Gorave — marketing website

Next.js 16 (App Router, Turbopack) · React 19 · Tailwind 4 · Motion · Lenis.
One brand with the app: Cabinet Grotesk + Satoshi, the orange→coral gradient,
the app's Cream flyer paper by day and its Noir surfaces for "app" moments.

## Run

```bash
npm install
npm run dev        # http://localhost:3001  (admin uses 3000, API 8000)
npm run build      # production build — must pass before merging
```

Design canvas (static mockups, no build): `cd canvas && python -m http.server 8765`
→ http://localhost:8765/index.html

## Structure

```
src/
  app/                    routes (one folder per page template)
  components/
    layout/               SmartNavbar, MegaMenu, FloatingDock, SiteFooter
    motion/               SmoothScroll (Lenis), Reveal/Stagger/SplitWords, Parallax/Float
    ui/                   Button, atoms (Eyebrow, Chip, H2, Lede, StoreBadges…), EventCard,
                          InviteCard, TicketCard, Phone, AppScreens, LockScreen, Chat, Logo
    sections/<page>/      one file per page section (home/Hero.tsx, home/Cities.tsx …)
  constants/              content (event types, cities, sample events, testimonials),
                          media (photos, brand assets), nav (mega menus, footer)
  hooks/                  useScrollDirection (nav hide/show)
  lib/                    cn
public/img/               brand assets, store badges, ticket QR
scripts/                  generate-ticket-qr.mjs (real scannable QR → public/img)
canvas/                   design board used to pick the landing direction
```

Rules: define things once in `constants/` or `components/` and reuse them; no
invented stats, ratings or reviews on public pages (placeholders are marked
`⚠️ PLACEHOLDER` in code); every page respects `prefers-reduced-motion`.

## Status

### ✅ Done
| Screen | Route | Notes |
|---|---|---|
| Home / landing | `/` | 11 sections: Hero · This week · One link · Group chat→guest list (pinned) · Event types (horizontal) · Cities (cursor preview) · More than an invite · Safety · Hosts · Testimonials · Saturday CTA · Footer |
| Global nav + mega menu | all pages | Floating pill, hide-on-scroll, Events/Cities Apple-style mega menu, mobile sheet |
| Floating dock + footer | all pages | Dock appears after hero, hides at footer |
| **City** | `/[city]` → all 8 cities | Told as one night out, 11 chapters: Hero · 01 The reasons (3D poster stack) · 02 The night (pinned 6 PM→3 AM scroll) · 03 The plan (departure board) · 04 The dare (spin your Saturday) · 05 The vibe (expanding panels) · 06 The neighbourhood (area reveal) · 07 The budget (price slider) · 08 The people (cursor-repel crowd) · 09 Your turn (host) · 10 FAQ · 11 See you out there (poster vortex). Same layout for every city — only data changes |
| City lab | `/lab/city?hero=letters\|map\|flap\|deck&city=<slug>` | Compare the 4 heroes; lock the winner with `CITY_HERO` in `components/sections/city/CityPageView.tsx`. noindex |

### ⏳ To build — page templates (each template renders many URLs from data)
| # | Screen | Route(s) | Generates |
|---|---|---|---|
| 2 | City × event type | `/[city]/[type]` e.g. `/mumbai/house-parties` | cities × 6 types |
| 3 | City × time | `/[city]/tonight`, `/this-weekend`, `/new-years-eve`, `/holi`, `/diwali` | cities × occasions |
| 4 | City × price | `/[city]/free-events`, `/under-500` | cities × 2 |
| 5 | City × crowd | `/[city]/women-only`, `/21-plus` | cities × 2 |
| 6 | Neighbourhood | `/[city]/[area]` e.g. `/mumbai/bandra` | ~10–20 per city |
| 7 | Event type hub | `/house-parties`, `/rooftop-parties`, `/game-nights`, `/supper-clubs`, `/gigs`, `/events` | 6 |
| 8 | All cities | `/cities` | 1 |
| 9 | Event detail | `/e/[id]` — link previews, "open in app" | dynamic |
| 10 | Host profile | `/h/[username]` | dynamic |
| 11 | Host landing | `/host` | 1 |
| 12 | Host guides | `/host/guides`, `/host/guides/[slug]` (how to throw a house party, crowd mix…) | 1 + 1 per guide |
| 13 | Payouts | `/host/payouts` | 1 |
| 14 | Badges | `/host/badges` | 1 |
| 15 | Safety | `/safety` | 1 |
| 16 | Download | `/app` | 1 |
| 17 | About | `/about` | 1 |
| 18 | Help centre | `/help`, `/help/[topic]` | ~15 |
| 19 | FAQ per type | `/[type]/faq` | 6 |
| 20 | Legal | `/terms`, `/privacy`, `/guidelines`, `/refunds` | 4 |
| 21 | 404 | `not-found` | 1 |
| 22 | Blog (later) | `/blog`, `/blog/[slug]` | — |

SEO rule: a combination page is only indexed when it has real events or written
content — otherwise `noindex` (no thin pages).

### 🗺️ Page matrix — every programmatic page family

Dimensions: **cities** 8 now (~75 later) · **areas** ~8 per city · **types** 6
(house-parties, rooftop-parties, game-nights, supper-clubs, gigs, events) ·
**time** tonight, tomorrow, this-weekend, this-week, friday-night,
saturday-night · **occasions** new-years-eve, holi, diwali, navratri, christmas,
halloween, valentines-day, independence-day, eid, ganesh-chaturthi ·
**price** free-events, under-500, under-1000 · **crowd** women-only, 21-plus, 25-plus.

| Family | URL pattern | Example | Count now (8 cities) | Data source |
|---|---|---|---|---|
| City | `/[city]` | `/mumbai` | 8 | ✅ built |
| City × type | `/[city]/[type]` | `/mumbai/house-parties` | 48 | API `type` |
| City × time | `/[city]/[time]` | `/mumbai/this-weekend` | 48 | API `when` |
| City × occasion | `/[city]/[occasion]` | `/mumbai/new-years-eve` | 80 | date window |
| City × price | `/[city]/[price]` | `/mumbai/free-events` | 24 | API `free` / `max_price` |
| City × crowd | `/[city]/[crowd]` | `/mumbai/women-only` | 24 | API `women_only` / `min_age` |
| Neighbourhood | `/[city]/[area]` | `/mumbai/bandra` | ~64 | API `area` |
| Area × type | `/[city]/[area]/[type]` | `/mumbai/bandra/rooftop-parties` | ~384 | API `area`+`type` |
| City × type × time | `/[city]/[type]/[time]` | `/mumbai/house-parties/this-weekend` | 288 | API |
| City × type × price | `/[city]/[type]/[price]` | `/mumbai/house-parties/free-events` | 144 | API |
| City × type × crowd | `/[city]/[type]/[crowd]` | `/mumbai/house-parties/women-only` | 144 | API |
| Type hub (India) | `/[type]` | `/house-parties` | 6 | API |
| Crowd hub (India) | `/[crowd]` | `/women-only` | 3 | API |
| Price hub (India) | `/[price]` | `/free-events` | 3 | API |
| Occasion hub (India) | `/[occasion]` | `/new-years-eve` | 10 | API |
| Going-out guides | `/guides`, `/guides/[slug]` | `/guides/first-house-party` | ~20 | written |
| Women's guides | `/guides/women`, `/guides/women/[slug]` | `/guides/women/going-out-solo-safely` | ~10 | written |
| City guides | `/[city]/guide` | `/mumbai/guide` | 8 | written + API |
| Hosting guides | `/host/guides/[slug]` | `/host/guides/how-to-throw-a-house-party` | ~15 | written |
| Event | `/e/[id]` | — | every event | API |
| Host profile | `/h/[username]` | — | every host | API |

**≈ 1,300 pages with 8 cities.** At ~75 cities: 75 × 8 areas × 6 types × 6 time/price/crowd
facets ≈ **2–3 lakh** URLs. Rules that keep this from becoming spam:
1. A page is **indexed only if it has ≥ 3 upcoming events or written content**; otherwise `noindex, follow` (still reachable, not in the sitemap).
2. One canonical per combination (e.g. `/mumbai/women-only`, never also `/women-only/mumbai`).
3. Max 3 path segments; deeper facets are filter UI, not new URLs.
4. Every page gets unique copy from templates + live numbers (no duplicated paragraphs across pages).

### ⏳ Platform / backend work the pages depend on
- Public read-only API (no login): `/public/events?city=&type=&when=&price=`, `/public/events/{id}`, `/public/hosts/{username}`, `/public/cities` — until then pages use sample data from `constants/content.ts`.
- Add the website origin to server CORS.
- Real App Store / Play Store URLs (`APP_LINKS` in `constants/nav.ts`).
- Replace placeholder testimonials + rating (`TESTIMONIALS`, `APP_RATING`) with real ones.
- `sitemap.ts`, `robots.ts`, per-page metadata + JSON-LD (Event, Organization, FAQPage, BreadcrumbList).
- Analytics.
