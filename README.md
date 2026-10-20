# Gorave

Gorave is a social events app for India. People find house parties, rooftop
nights, game nights, dinners and music nights in their city, then request or
book a spot. Hosts create an event in a few steps, choose who gets in and run
the door with QR tickets. Safety is built in.

This repo holds everything:

| Part | Folder | What it is | Stack |
|---|---|---|---|
| **App** | [`client/`](client) | The iOS and Android app | Expo SDK 56, React Native 0.85, Expo Router, Reanimated 4 |
| **API** | [`server/`](server) | Backend for the app, admin and website | FastAPI, PostgreSQL, Redis |
| **Admin** | [`admin/`](admin) | Internal moderation and finance panel | Next.js 16, React Query, Radix |
| **Website** | [`website/`](website) | Marketing and SEO site at gorave.in | Next.js 16, Tailwind 4, Motion, Lenis |

Related docs:
- [SCREENS.md](SCREENS.md): every app and admin screen, with UI-pass status.
- [website/README.md](website/README.md): every website page and its build status.

---

## Features

### For guests
- **Discover by city.** Browse events on a map (each pin shows the event's
  photo) or as a list of poster cards. Filter by type, search, and switch
  city. Home shows what's happening now, your upcoming nights, your waitlists,
  what you recently viewed and what's trending.
- **Join the way the host wants.**
  - **Paid events** book instantly. Pay by Razorpay, UPI QR or wallet.
  - **Free events** are request-to-join: the host sees your profile and
    decides. You get two requests per event in total, so withdrawing once
    leaves you one more chance. A declined request is final.
  - **Full events** have a waitlist. When a spot frees up, the next person in
    line gets an offer.
- **Tickets and check-in.** Every confirmed guest gets a QR ticket. The host
  scans it at the door.
- **Address privacy.** Until you're confirmed you only see the area (for
  example "Bandra West, Mumbai") and an approximate circle on the map. The
  exact address unlocks once you're in.
- **Crowd mix.** Hosts can set a split such as 50:50, 60:40, women only or men
  only. 10% of spots stay open to anyone. The event page shows how many spots
  are left for each.
- **Reviews.** After the night, rate the event and the host. Host ratings show
  on their profile.
- **Hotlist and calendar.** Save events for later and see your nights by date.

### For hosts
- **Create an event in 5 steps:** basics, when (with an age limit and crowd
  mix), where (city, address and an exact pin), pricing, and 4:5 photos with a
  built-in cropper. A live preview shows the event as a card and as a full
  page.
- **Share it.** Once published you get an invite card, a link to copy, and
  one-tap sharing to WhatsApp, Gorave chat or anywhere else.
- **Manage the guest list.** Accept or decline requests while watching the
  quota bars, see who's going with gender counts, edit the event, and cancel
  if needed. Some settings lock once guests have joined (crowd mix, age, free
  or paid).
- **Get paid.** Host onboarding takes you through the host agreement and a
  finger signature. You then add payout details (stored encrypted) and earn
  from paid tickets.

### Social
- **Profiles** with photos, a 30-second voice intro (recorded on an animated
  orb), interests and badges. Profiles can be followed and searched, and each
  has its own QR code.
- **Vibes.** Send someone a vibe to start talking. It waits as pending until
  they reply.
- **Chat.** One-to-one conversations with photos, voice notes, shared event
  cards and link previews. Messages can be edited, unsent, deleted for you or
  reported.
- **Notifications.** Push and in-app, with actions right in the feed (accept a
  request, follow back). Each category can be switched on or off.

### Safety
- **Safety centre** with emergency contacts, picked from your phone or added
  by hand.
- **SOS.** During an event, SOS shares your live location with your emergency
  contacts, even with the app in the background.
- **Blocking and reporting** for people and messages. Gender is set once at
  onboarding and can't be changed later.

### Money
- **Razorpay** checkout, **UPI QR** payments and a **Gorave wallet**.
- **Refunds go to the wallet,** including the automatic refund when a paid
  booking can no longer be honoured.
- **Platform commission** on paid tickets, tracked per event.

### Platform
- **Sign in** by phone number with an OTP (Twilio Verify).
- **Media storage** on Cloudflare R2, covering photos, voice intros and chat
  media.
- **Background jobs** in the API: purging deleted accounts and wrapping up
  events after they end. Redis locks make sure each job runs only once.
- **Maintenance mode** switch with a custom message.
- **Deep links** through `link.gorave.in` (iOS universal links and Android app
  links).
- **Crash reporting** with Sentry.
- **Public read-only API** for the website. It is rate limited per IP;
  requests from the website itself carry a site key and get a higher limit.

### Admin panel
Covers dashboard numbers, users (view and moderate), events (with attendees
and crowd-mix counts), revenue, wallet, safety reports and app feedback. The
API also keeps an audit log of admin actions.

### Website
A cream-paper marketing site in the same brand as the app (Cabinet Grotesk,
Satoshi, the orange to coral gradient). Besides the home page, a few dozen
templates render hundreds of pages from data:
- **Places:** cities, neighbourhoods and city × type combinations.
- **Filters:** crowd (women only, balanced, 21+), time (tonight, this
  weekend), price and occasion (Diwali, New Year's Eve and so on).
- **Live pages:** each event (`/e/[id]`) and each host (`/h/[username]`).
- **Content:** going-out guides, hosting guides, help centre and legal pages.

It also ships a sitemap, robots.txt, llms.txt, a web manifest and Open Graph
images for every route. The design canvas in `website/canvas/` is a static
board used to compare directions before building.

---

## Repo layout

```
Gorave/
├── client/                 Expo app
│   ├── app.json            app config (bundle ids, permissions, deep links, apiUrl)
│   └── src/
│       ├── app/            screens (Expo Router, see SCREENS.md)
│       ├── components/     ui/, events/, event-form/, home/, chat/, profile/,
│       │                   safety/, maps/, settings/, onboarding/ …
│       ├── hooks/          one hook per screen or flow (useEventDetail, useVoice …)
│       ├── store/          zustand stores (auth, onboarding, city filter …)
│       ├── api/            ApiService + endpoint config
│       ├── constants/      colours, fonts, spacing, event types, EVENT_IMAGE_ASPECT
│       └── lib/            dates, haptics, photo crop, caching …
├── server/                 FastAPI API
│   ├── main.py             app, routers, background jobs
│   ├── routes/             auth, users, events, payments, wallet, chat, vibes,
│   │                       safety, notifications, upload, places, public, admin_*
│   ├── alembic/            database migrations
│   ├── queries.sql         schema dump (regenerate with scripts/dump_schema.py)
│   └── scripts/            schema dumps, website demo seed
├── admin/                  Next.js admin panel
├── website/                Next.js marketing site (+ canvas/ design board)
└── docker-compose.yml      Redis + API
```

---

## Running locally

| Service | Port | Command |
|---|---|---|
| Redis + API (Docker) | 6379, 8000 | `docker compose up -d` |
| API without Docker | 8000 | see below |
| Admin | 3000 | `cd admin && npm install && npm run dev` |
| Website | 3001 | `cd website && npm install && npm run dev` |
| App | Metro 8081 | `cd client && npm install && npx expo start` |
| Website canvas | 8765 | `cd website/canvas && python -m http.server 8765` |

### API
PostgreSQL runs on your machine. Put its connection string in
`server/.env` as `DATABASE_URL`.

```bash
cd server
python -m venv venv
venv/Scripts/pip install -r requirements.txt      # macOS/Linux: venv/bin/pip
venv/Scripts/alembic upgrade head
venv/Scripts/uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Swagger docs: http://localhost:8000/docs · health check: `/health`.

On Windows, set `PYTHONUTF8=1` if the console fails on non-ASCII output.

### App
- The app is a dev-client build, not Expo Go, because it uses native modules
  (maps, image cropper, Skia, audio). Build it once with
  `npx expo run:android` or `npx expo run:ios`, then use `npx expo start`.
- Point the app at your API by setting `expo.extra.apiUrl` in
  `client/app.json` to your machine's LAN address (for example
  `http://192.168.x.x:8000`).
- Typecheck with `npx tsc --noEmit -p .` and lint with `npm run lint`.

---

## Environment variables

Real values live only in the git-ignored env files below. Never commit them.
The Firebase admin key (`server/*firebase-adminsdk*.json`) is git-ignored too.

**`server/.env`**

| Group | Variables |
|---|---|
| Core | `DATABASE_URL`, `REDIS_URL`, `API_ALLOWED_HOSTS`, `ADMIN_ORIGINS`, `WEBSITE_ORIGINS` |
| Auth | `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRES`, `JWT_REFRESH_TOKEN_EXPIRES`, `ADMIN_JWT_SECRET_KEY` |
| SMS / OTP | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID` |
| Email | `SMTP_USERNAME`, `SMTP_PASSWORD` |
| Storage (R2) | `R2_ACCESS_KEY`, `R2_SECRET_KEY`, `R2_ACCOUNT_ID`, `R2_BUCKET`, `R2_BASEURL`, `R2_ENDPOINT` |
| Payments | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYOUT_ENCRYPTION_KEY` |
| Ops | `MAINTENANCE_MODE`, `MAINTENANCE_MESSAGE`, `PUBLIC_SITE_KEY` |

**Other env files**

| File | Variables |
|---|---|
| `website/.env.local` | `API_URL`, `PUBLIC_SITE_KEY` (must match the server's) |
| `admin/.env.local` (copy `.env.local.example`) | `NEXT_PUBLIC_API_URL` |
| `client/.env.local` | `SENTRY_AUTH_TOKEN` |

---

## Design rules

These apply across the app and the website:

- **Event photos are 4:5 portrait everywhere,** from the cropper to cards, the
  hero and share images. The app has one constant for this
  (`client/src/constants/eventImage.ts`); the website uses `aspect-[4/5]`.
- **Event cards are posters:** the photo is the card, with the details on it.
  They sit two per row in lists and are 172px wide in home carousels.
- **Icons, not emoji.** Use lucide; brand logos are custom SVG.
- **Neutral surfaces and glass,** not tinted colour blocks.
- **Calm motion.** No pulsing or looping animations, nothing that pops.
  Entrances run once.
- **Website palette.** Website pages sit on cream paper. Black is for small
  elements and the footer only.
- **No made-up content.** No invented stats, names or testimonials anywhere.
- **Writing.** No em dashes in user-facing copy.
- **Reuse before you build.** Use existing components and constants instead
  of hand-rolling new ones.

---

## Deploying

Each part is deployed separately:
- **App:** EAS builds. Set the Apple Team ID in `client/app.json` and add the
  store app IDs and fingerprints for deep links before release.
- **API:** the Docker image in `server/Dockerfile`, with Redis and PostgreSQL
  available.
- **Admin and website:** standard Next.js builds (`npm run build`). Run
  `npm run build` before merging website changes.

Before going to production, turn off the OTP dev bypass and set
`MAINTENANCE_MODE` off.
