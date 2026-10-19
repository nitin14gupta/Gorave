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

**Internal links:** every city, neighbourhood, type, crowd and time page ends with an "Explore {place}" block (`components/sections/shared/ExploreLinks.tsx`) linking to all time windows, crowds, kinds of night and hosts for that place; India hubs link to all hubs + cities. Navbar mega menu lists every time window and crowd (Mumbai); footer Explore links the India hubs.

**Parts bank (built, unused, reuse on other pages):** `evergreen/app/a/Hero.tsx` (cursor-tilt phone cover), `evergreen/app/b/CitiesStrip.tsx` (widening city cards), `evergreen/app/b/FinalCta.tsx` (word-drop CTA with dealt cards). Shared hover list: `components/ui/HoverPreviewList.tsx` (homepage cities, badges).

**Palette rule:** pages sit on cream / paper. Black (`bg-noir`) is only for small elements (buttons, pills, phone screens, the app's ticket) and two deliberate night moments: the city page's after-dark sky and the footer. Live sections that were black (home safety + CTA, testimonials, city crowd + departure board, type hero / guest list / night, guides fine print + article, host profile, host address, safety SOS, 404) were converted to cream.

### ✅ Done
| Screen | Route | Notes |
|---|---|---|
| Home / landing | `/` | 11 sections: Hero · This week · One link · Group chat→guest list (pinned) · Event types (horizontal) · Cities (cursor preview) · More than an invite · Safety · Hosts · Testimonials · Saturday CTA · Footer |
| Global nav + mega menu | all pages | Floating pill, hide-on-scroll, Events/Cities Apple-style mega menu, mobile sheet |
| Floating dock + footer | all pages | Dock appears after hero, hides at footer |
| **City** | `/[city]` → all 8 cities | Told as one night out, 11 chapters: Hero · 01 The reasons (3D poster stack) · 02 The night (pinned 6 PM→3 AM scroll) · 03 The plan (departure board) · 04 The dare (spin your Saturday) · 05 The vibe (expanding panels) · 06 The neighbourhood (area reveal) · 07 The budget (price slider) · 08 The people (cursor-repel crowd) · 09 Your turn (host) · 10 FAQ · 11 See you out there (poster vortex). Same layout for every city — only data changes |
| City lab | `/lab/city?hero=letters\|map\|flap\|deck&city=<slug>` | Compare the 4 heroes; lock the winner with `CITY_HERO` in `components/sections/city/CityPageView.tsx`. noindex |
| **City × type** | `/[city]/[facet]` → 8 cities × 6 types = 48 | Ten chapters about one kind of night: Hero (cursor spotlight) · 01 On the list (live events from `/public/events`, sample fallback) · 02 The anatomy (scroll-drawn callouts) · 03 The guest list (seats fill, requests get accepted) · 04 The flyers (poster stack) · 05 The night (pinned horizontal timeline, dusk → midnight) · 06 The neighbourhood · 07 Your turn (live invite builder, 3D tilt) · 08 FAQ · 09 Something else · 10 Vortex. Copy per type in `lib/eventType.ts`; revalidates every 60s |
| **Host landing** | `/host` | Live: A. 2 variants — A "first party, start to finish" (sticky phone build, earnings example, mix dial, badge ladder), B "Backstage" (curtains, run of show, tearing ticket, request swipe, mixing desk, laminates). Lock with `HOST_VARIANT`; compare at `/lab/host?v=a\|b` |
| **Hosting guides** | `/host/guides`, `/host/guides/[slug]` (6 guides) | Live: A. 2 hub variants — A magazine, B dark playbook; one article template (progress bar, sticky TOC, Article JSON-LD). Copy in `lib/hostGuides.ts`. Lock with `GUIDES_VARIANT`; compare at `/lab/guides?v=a\|b` |
| **Safety** | `/safety` | Live: A. 2 variants — A "protected at every step" (journey, address unlock, SOS hold demo, crowd room), B "Layers of trust" (3D layers, torch two-views, map circle, SOS phone, door list). Lock with `SAFETY_VARIANT`; compare at `/lab/safety?v=a\|b` |
| **404** | any unknown URL / `notFound()` | Lights off: cursor torch reveals the 404 and hidden flyers; ticket scanned and stamped "Not on the list" |
| **Neighbourhood** | `/[city]/[facet]` → 33 areas (e.g. `/mumbai/bandra`) | "Postcards": postcard hero, word-reveal feeling, events pinned on a line, lights-on building print, polaroid night with ticking postmark clock, duotone stamp sheet, luggage-tag types, neighbour postcard deck, send-a-postcard share, door-reveal host card, FAQ postcard, flipping sign-off, deckled paper edges. Area copy in `lib/area.ts`; generated images (OpenArt, Nano Banana 2) in `public/img/areas` — 8 city streets + 6 scenes |
| **Area × type** | `/[city]/[facet]/[sub]` → 30 areas × 6 types = 180 (e.g. `/mumbai/bandra/rooftop-parties`) | Told as one night: the window (title parts as a photo window opens to full screen) · 01 lineup (event rows, photo slides open on hover; quiet areas show nearby) · 02 the feeling (scroll-driven word rows with photo pills, area vibe) · 03 fly-through (pinned, anatomy cards rush in from depth through receding rings) · 04 by the clock (pinned, odometer time + round photo + arc) · 05 getting in (pinned invite: request → yes → address scrambles to unlocked, QR drops in) · 06 city grid (every area × type, live counts, crosshair + cursor preview) · hosts · 07 FAQ · explore links · 08 the window closes (full-screen photo shrinks into a ticket). Data in `lib/areaType.ts`; noindex until something is listed. Neighbourhood luggage tags link here |
| **Guides (going out + women)** | `/guides`, `/guides/[slug]` (20), `/guides/women/[slug]` (10) | One page, no listing grid: hero chat (questions are real guides, replies link in) + the night in 5 stops · 01 the night (pinned horizontal walk 4 PM → morning after, light changes, sun crosses a bar; every guide set as the question you'd ask a friend; cursor cover + short answer; "Guides for women" toggle lights the women's ones) · 02 ask anything (type a question, the best guide answers with its 3-line short version) · 03 for women (4 real product rules, each opening its guide) · 04 go out. Articles reuse the hosting-guide reader + a "short version" box. Copy in `lib/guides/*.ts`, questions + stages in `lib/goingOut.ts` |
| **Help centre** | `/help`, `/help/[topic]` (15 topics, 95 answers) | Minimal: hub = "How can we help?" + search that answers in place (press /), topic tiles (hover swaps the line for 3 question links, no layout shift), most asked, contact. Topic page = sticky grouped topic rail (gliding pill), answers accordion with per-question links (#slug opens + scrolls, copy link), prev/next, FAQPage JSON-LD. Answers checked against server code: `lib/helpTopics.ts` |
| **Legal** | `/terms`, `/privacy`, `/guidelines`, `/host-agreement`, `/refunds` | One calm template: doc switcher (gliding pill), the short version first, numbered linkable sections beside a contents rail that follows you, reading progress, contact + grievance cards. Copy in `lib/legal/*.ts`, written from the server code. `LEGAL_ENTITY` in `lib/legal/entity.ts` holds placeholders (entity, address, grievance officer, court city) to confirm before launch. The app opens /terms and /privacy; footer links all five |
| **Contact** | `/contact` | "Say hi. *We read everything.*" + a form that writes the email for you: topic chips (gliding pill) with a quick help answer per topic, floating-label fields, Send opens the email app addressed to support (no backend; the server's /support needs app login), sent state with copy fallback. 112 nudge on safety topics. Footer Contact links here |
| **Founders** | `/founders`, `/founders/nitin-gupta`, `/founders/kaveesha-jeswani` | Journey page: polaroid pair hero (hover one, the other leans away) · 01 how it started (sticky rolling chapter number, line draws down, photos wipe open; "the call" is a missed-calls-from-Baburao phone) · 02 the two of us (About's founders section, reused, with story links) · 03 why (word-lit) · 04 the plan (goal tiles + scroll strip) · 05 come through. Profile pages: tilting polaroid, name drifts apart on scroll, own words, small true things, links (rel=me), the other founder. Person/ProfilePage JSON-LD with sameAs. Data in `lib/founders.ts` (Kaveesha's own details + the real ~25 photos still to come: swap GALLERY/JOURNEY images) |
| **Price** | `/free-events`, `/under-500`, `/[city]/…` (8×2), `/[city]/[area]/…` (30×2) = 78 | Hanging price tag that sways with scroll and swings on hover (₹0 + FREE stamp / ₹500) · hero sentence of hover-pop words · 01 the list (cheapest first, rows pop their photo) · 02 the receipt (prints as you scroll, total stamped) · 03 flip-card questions · 04 places as huge hover-pop names with counts · other budget + any budget · FAQ · explore (now has a Budget group site-wide) · go out. Under ₹500 = paid ₹99 to ₹500 (free has its own page). Data `lib/price.ts`; city/area pages noindex when empty. **Reusable: `components/ui/HoverPop.tsx`** (`HoverPopGroup` + `HoverPop`, portalled, tilts with cursor) |
| **Occasions** | `/halloween`, `/diwali`, `/christmas`, `/new-years-eve`, `/valentines-day`, `/holi` (6) + `/[city]/…` (48) + `/[city]/[area]/…` (180) = 234 | Countdown hero (days to go, rolling digits, photo + emoji stamp) · 01 what it is (sentence of hover-pop words) · 02 the lineup (events matched by date window or name; falls back to what's on now) · 03 the night as a stacking deck of sticky cards · 04 a tickable checklist · 05 host one (the app's real invite template, cursor tilt) · 06 AreaReveal (cities / neighbourhoods / neighbours) · 07 party calendar (tear-off pages, hover pop) · 08 FAQ · explore (now has an Occasions group) · 09 go out. Data `lib/occasion.ts`. **Diwali + Holi dates are a per-year table: confirm** (2026-11-08, 2027-10-29; 2027-03-22, 2028-03-11). City/area pages noindex until an occasion night is listed |
| **SEO + GEO** | `/sitemap.xml`, `/robots.txt`, `/llms.txt`, `/manifest.webmanifest`, `opengraph-image` per route | Sitemap lists only indexable pages, using each page's own robots rule (617 URLs locally incl. events + hosts; falls back to always-indexed pages if the API is down; revalidates hourly). robots allows search + AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended…), blocks /lab and /api. llms.txt is generated from site data (key facts + every guide/help link). Branded OG/Twitter cards generated per page in `lib/og.tsx` (Cabinet + Instrument Serif, title from the route). Manifest + icons (G on brand gradient, maskable) with the Play app as related_applications; `al:android` app links; Safari app banner turns on when `APP_IDS.appStoreId` is set in `constants/nav.ts` |
| **Event-type hubs** | `/[city]` (shared root segment) → `/house-parties`, `/rooftop-parties`, `/game-nights`, `/dinner-parties`, `/music-nights`, `/events` | India-wide: spotlight hero, live events across cities, anatomy, postcard city picker with real per-city counts, hour-by-hour, invite builder, FAQ, other types. Names match the app's types (dinner → Dinner parties, music → Music nights) |
| **All cities** | `/cities` | Postcard grid of the 8 cities (generated street photos, live upcoming counts from `/public/cities`) · full neighbourhood index (all 33 area links) · type hubs · FAQ |
| **Event detail** | `/e/[id]` (any event, on demand) | Simple: photo gallery · sticky decision card (when, area, price + fee, spots bar, crowd mix, age, request/book in app) · host card → profile · about + house rules · before you go · more nights. Event JSON-LD (area-level location only), OG image = cover. Past/cancelled → noindex |
| **Host profile** | `/h/[username]` (any host, on demand) | Polaroid photo + badge stamp, counting stats (nights hosted, coming up, rating or "New") · upcoming nights · badge ladder (Rising→Legend progress) · how it works · host-your-own CTA. ProfilePage JSON-LD; thin profiles noindex; members who never hosted 404 |
| **Hosts in a city / neighbourhood** | `/[city]/hosts` (8), `/[city]/[area]/hosts` (33) | Real hosts who've hosted there, most active first (`/public/hosts`), host cards → profiles, area chips, CTA. Thin pages (<2 hosts) noindex. City and neighbourhood pages get a "Hosts near you" strip linking here; host profiles link back to their areas/cities/types; event pages link to their neighbourhood |
| **Crowd pages** | `/women-only`, `/balanced-crowd`, `/21-plus`, `/25-plus` (India hubs, root segment) + `/[city]/[crowd]` (32) | One cream-palette page built from the best of 3 lab variants (`components/sections/crowd/parts`): editorial cover whose photo opens to full bleed · the promise lit word by word · pinned rail of real events · "Pull up a chair" seat fill · sticky split-screen "why" · pinned "how the app makes it true" steps · huge place names with photos flying out on hover · host one-setting card · FAQ · other crowds · sign-off. Real filters on `/public/events` (`women_only`, `balanced` = 40–60% women, `min_age`), live per-city / per-area counts, generated photos in `public/img/crowd`. Copy in `lib/crowd.ts`. City pages with <3 events noindex. No `/singles` (no such data in the app) |
| **Time pages** | `/tonight`, `/tomorrow`, `/this-weekend`, `/this-week` (India hubs) + `/[city]/[time]` (32) | Mixed from the 3 lab variants: B calendar cover (pages tear to the photo) · B at-a-glance ledger · B day-by-day rail (hour ruler for one night) · C getting ready story · A stopwatch steps · A tear-off reasons · A city-by-city / area-by-area reveal · B why cards · B other windows · FAQ · B calendar sign-off. Real `when` filter (IST; `tomorrow` added), events grouped by day, live counts. Copy in `lib/time.ts`, photos in `public/img/time`. City pages with <3 events noindex |
| **Payouts** | `/host/payouts` | New "90%" hero (event photo inside the digits, example payout card) · one ticket, three stops (coin on a drawn path) · the itemised receipt · price-the-night calculator · free vs paid · tell us where (UPI / bank phone) · the 48-hour line · FAQ · print your first payout |
| **Badges** | `/host/badges` | The climb (pinned mountain, badges stamp on) · four badges, who's wearing them (homepage hover list, `ui/HoverPreviewList`) · level up, everyone sees it (callouts) · pick a number, see your card · who holds which card (max 4 per badge, 1:1 photos) · FAQ · start at the bottom · your shelf is empty |
| **Get the app** | `/app` (every "Get the app" button) | Real cards gather into a phone · five-screen story with callouts · Thursday to Sunday rail · hover bento · cursor-follow features · live cities + browse-first links · FAQ · see you Saturday |
| **About** | `/about` | "Why we exist" manifesto: the line reveals word by word with photos blooming between words · mission lit word by word · pinned beliefs with callouts, each linking to its proof page · cities as huge names with photos flying out + live counts · how it works in 3 steps · 05 Who's building it (Nitin + Kaveesha as polaroids dealt apart on scroll with a serif "&" landing between; hover tilts the card, warms the photo, slides a note over the "&"; data in `about/team.ts`, also feeds the AboutPage/Organization founder JSON-LD) · FAQ (incl. "Who built Gorave?") · sign-off |

### ⏳ To build — page templates (each template renders many URLs from data)
| # | Screen | Route(s) | Generates |
|---|---|---|---|
| 13 | Blog (later) | `/blog`, `/blog/[slug]` | — |

SEO rule: a combination page is only indexed when it has real events or written
content — otherwise `noindex` (no thin pages).

### 🗺️ Page matrix — every programmatic page family

Dimensions: **cities** 8 now (~75 later) · **areas** ~8 per city · **types** 6
(house-parties, rooftop-parties, game-nights, dinner-parties, music-nights, events) ·
**time** tonight, tomorrow, this-weekend, this-week, friday-night,
saturday-night · **occasions** new-years-eve, holi, diwali, navratri, christmas,
halloween, valentines-day, independence-day, eid, ganesh-chaturthi ·
**price** free-events, under-500, under-1000 · **crowd** women-only, 21-plus, 25-plus.

| Family | URL pattern | Example | Count now (8 cities) | Data source |
|---|---|---|---|---|
| City | `/[city]` | `/mumbai` | 8 | ✅ built |
| City × type | `/[city]/[type]` | `/mumbai/house-parties` | 48 | ✅ built (`/[city]/[facet]`) |
| City × time | `/[city]/[time]` | `/mumbai/this-weekend` | 32 | 🧪 lab (3 variants) |
| City × occasion | `/[city]/[occasion]` | `/mumbai/new-years-eve` | 80 | date window |
| City × price | `/[city]/[price]` | `/mumbai/free-events` | 24 | API `free` / `max_price` |
| City × crowd | `/[city]/[crowd]` | `/mumbai/women-only` | 32 | ✅ built (lab variants) |
| Neighbourhood | `/[city]/[area]` | `/mumbai/bandra` | 33 | ✅ built (`/[city]/[facet]`) |
| Area × type | `/[city]/[area]/[type]` | `/mumbai/bandra/rooftop-parties` | 180 | ✅ built (`/[city]/[facet]/[sub]`) |
| City × type × time | `/[city]/[type]/[time]` | `/mumbai/house-parties/this-weekend` | 288 | API |
| City × type × price | `/[city]/[type]/[price]` | `/mumbai/house-parties/free-events` | 144 | API |
| City × type × crowd | `/[city]/[type]/[crowd]` | `/mumbai/house-parties/women-only` | 144 | API |
| Type hub (India) | `/[type]` | `/house-parties` | 6 | ✅ built (`/[city]` root segment) |
| Crowd hub (India) | `/[crowd]` | `/women-only` | 4 | ✅ built (lab variants) |
| Price hub (India) | `/[price]` | `/free-events` | 3 | API |
| Occasion hub (India) | `/[occasion]` | `/new-years-eve` | 10 | API |
| Going-out guides | `/guides`, `/guides/[slug]` | `/guides/first-house-party` | 20 | ✅ built |
| Women's guides | `/guides/women/[slug]` (listed on `/guides`, no separate hub) | `/guides/women/going-out-solo-safely` | 10 | ✅ built |
| City guides | `/[city]/guide` | `/mumbai/guide` | 8 | written + API |
| Hosting guides | `/host/guides/[slug]` | `/host/guides/how-to-throw-a-house-party` | 6 now | ✅ built |
| Event | `/e/[id]` | — | every event | ✅ built |
| Host profile | `/h/[username]` | — | every host | ✅ built |

**≈ 1,300 pages with 8 cities.** At ~75 cities: 75 × 8 areas × 6 types × 6 time/price/crowd
facets ≈ **2–3 lakh** URLs. Rules that keep this from becoming spam:
1. A page is **indexed only if it has ≥ 3 upcoming events or written content**; otherwise `noindex, follow` (still reachable, not in the sitemap).
2. One canonical per combination (e.g. `/mumbai/women-only`, never also `/women-only/mumbai`).
3. Max 3 path segments; deeper facets are filter UI, not new URLs.
4. Every page gets unique copy from templates + live numbers (no duplicated paragraphs across pages).

### ⏳ Platform / backend work the pages depend on
- ✅ Public read-only API (`server/routes/public.py`): `/public/events`, `/public/events/{id}`, `/public/hosts/{username}`, `/public/cities` — area-level location only, rate-limited, cached. Pages fall back to sample data from `constants/content.ts` if the API is down.
- ✅ Website origin in server CORS (`WEBSITE_ORIGINS`).
- ✅ `/public/events?balanced=true` (host-set quota 40–60% women).
- ✅ `/public/hosts?city=&area=` (hosts list) and `places`/`types` on `/public/hosts/{username}` (for backlinks).
- ✅ `/public/reviews` — platform rating + latest written reviews (reviewer as first name + last initial) for the homepage.
- ✅ Live data everywhere: city/type flyers + night timeline from real events (`lib/cityKit.ts`), homepage rails, invite cards and phone mock-ups (`components/ui/LiveEvents.tsx`). No placeholder testimonials/ratings left.
- Dev seed: `server/scripts/seed_website_demo.py` (~90 upcoming events across all 33 neighbourhoods; `--clean` to remove). Review list: `website/AUDIT.md`.
- Real App Store / Play Store URLs (`APP_LINKS` in `constants/nav.ts`).
- Replace placeholder testimonials + rating (`TESTIMONIALS`, `APP_RATING`) with real ones.
- `sitemap.ts`, `robots.ts`, per-page metadata + JSON-LD (Event, Organization, FAQPage, BreadcrumbList).
- Analytics.
