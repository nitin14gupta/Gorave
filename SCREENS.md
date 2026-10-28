# Gorave screens

Every screen in the app, grouped by flow, plus the admin panel and a pointer to
the website's page list. Use it as the checklist for the UI pass.

**UI pass column:** ✅ redesigned in the current pass · 🧪 in the A/B lab, waiting for a pick · ⬜ not yet.

**How the A/B lab works:** a screen in the lab shows a small **A | B** pill at
the top (dev builds only). Flip it, pick one, and the other layout plus the pill
get deleted. The variants live in `client/src/components/lab/<screen>/`; the
pill is `components/lab/LabSwitch.tsx` and the picks are remembered in
`store/labStore.ts`.

House rules for the pass:
- Real photos and custom SVG where they help.
- Icons from lucide, never emoji. Brand logos (WhatsApp and so on) are custom SVG.
- Neutral glass and surfaces, not tinted "AI" colour blocks.
- Motion runs once and stays calm. No pulsing, no looping, no popping.
- Event photos are always 4:5 (`EVENT_IMAGE_ASPECT` in `client/src/constants/eventImage.ts`).
- Layouts should feel like real big apps (Airbnb, Luma, DICE, Apple Wallet), never "AI" glows or gradient blobs.
- A screen with a photo on top gets parallax: `hooks/useParallaxHero.ts` (photo at half speed, stretch on pull-down, title fades as it leaves).
- A screen without a photo gets an iOS-style large title that folds into the top bar on scroll.

Routes live in `client/src/app/` (Expo Router). `(group)` folders don't show in the URL.

---

## App (Expo, `client/`)

### 1. Sign in

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 1 | Launch / splash | `index.tsx` | Kept as it was (the breathing logo and loader) | ✅ |
| 2 | Welcome | `(auth)/index` | Twelve party posters (free Unsplash photos, 4:5) scattered like invites across the top and off the edges, the brand in a small pill, "Every good night starts with an invite." and the buttons. Posters settle in once | ✅ |
| 3 | Phone number | `(auth)/phone` | Your number in big display digits with a +91 chip; tap anywhere on it to bring the keyboard back | ✅ |
| 4 | OTP | `(auth)/otp` | Six big boxes, shakes once on a wrong code, fills from the SMS; tap the boxes to bring the keyboard back | ✅ |

### 2. Onboarding (new users)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 5 | Age check | `(onboarding)/index` | Confirm you're 18+ | ✅ poster fills the screen, title above the buttons |
| 6 | About you | `(onboarding)/profile` | Name, date of birth, gender (set once) | ✅ big name and date, gender chips, bio in a popup editor |
| 7 | Photos | `(onboarding)/photos` | The same photo grid as Edit photos: main square big, five around it, star to make main | ✅ same screen as Edit photos |
| 8 | Voice intro | `(onboarding)/voice` | Tap the orb, record up to 30s, play back, retake or skip | ✅ unchanged |
| 9 | Interests | `(onboarding)/interests` | Pick what you're into | ✅ poster band, chips |
| 10 | City | `(onboarding)/location` | The same postcard city picker as Change city | ✅ |
| 11 | All set | `(onboarding)/complete` | Finish and enter the app | ✅ your photo with posters fanned behind |

### 3. Main tabs

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 12 | Home | `(tabs)/index` | Create event, Happening now, You're hosting, You're going, Waitlist, Rate your nights, Recently viewed, Trending in your city | ✅ hello, your week strip, host your own night, your nights, big posters lower |
| 13 | Events | `(tabs)/events` | Browse by city: map view with photo pins and a preview strip, or a list of poster cards. Filter chips, search, city picker | ✅ poster grid (agenda tried, not kept). Map glows removed |
| 14 | Chat | `(tabs)/chat` | Conversations, search, unread counts | ✅ vibe banner on top |
| 15 | Profile | `(tabs)/profile` | Your profile as others see it, plus shortcuts | ✅ your photos on top with parallax, up-next ticket, going and hosting rails |

### 4. Events (as a guest)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 16 | Event page | `(events)/[id]/index` | 4:5 hero with parallax, details, masked address card, crowd split bars, people, RSVP bar (Join / Request / Waitlist / Ticket) | ✅ |
| 17 | Event map | `(events)/[id]/map` | Where it is (approximate until you're in) and nearby events | ✅ |
| 18 | Book | `(events)/[id]/book` | Poster with parallax, then the maroon ticket you're buying (date, price, unpunched), the bill as a receipt, wallet toggle, fixed pay bar | ✅ |
| 19 | Payment | `(events)/[id]/payment` | The amount on the maroon ticket with the bill folding inside it, the app you used last as one big row with a Pay pill, every UPI app as an icon grid, then QR and UPI ID | ✅ |
| 20 | UPI QR payment | `(events)/[id]/qr-payment` | A counter standee on the maroon ticket: brand, amount, the QR on cream, UPI at the foot, a big countdown, send to a friend to pay | ✅ |
| 21 | Request sent | `(events)/[id]/requested` | After "Request to join" on a free event: what happens next, requests left, withdraw | ✅ |
| 22 | Manage waitlist (host) | `(events)/[id]/waitlist` | Large title that folds into the top bar, waiting / offered / spots-left counts, the crowd-mix bar, the numbered queue, and "Add a spot for the next person". Opened from the "N on the waitlist" chip on the host's event page | ✅ |
| 23 | On the waitlist | `(events)/[id]/waitlist-joined` | Poster with parallax, your place set huge with the queue drawn as seats, what happens next, leave | ✅ |
| 24 | Ticket | `(events)/[id]/ticket` | Poster on top with parallax, then the website's maroon ticket stub: date set big, cream QR with the logo, directions, save, share | ✅ |
| 25 | Rate the night | `(events)/[id]/review` | Event photo with parallax, five big stars with a word for each, an optional note | ✅ |
| 26 | Reviews | `(events)/[id]/reviews` | Event photo with parallax and the score set huge over it, 5-to-1 bars, star filter chips, a clean list with hairline dividers. Opened from My Events, Past, Reviews | ✅ |

### 5. Events (as a host)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 27 | Create event | `(events)/create` | 5 steps: Basics → When (age, crowd mix) → Where (city, address, pin) → Pricing → Photos (4:5 cropper), with a live preview | ✅ crowd mix, photos |
| 28 | Event is live | `(events)/published` | Your invite card, copy link, share to WhatsApp, Gorave chat or more | ✅ |
| 29 | Edit event | `(events)/[id]/edit` | Opened from the ⋯ on your own event. A listing editor: the cover with parallax, one row per part (Basics, When and who, Where, Price, Photos) showing what's set, each opening on its own page, save bar that says when there are unsaved changes | ✅ |
| 30 | Join requests | `(events)/[id]/requests` | A guest list: folding large title, the room drawn seat by seat in the crowd-mix colours, filters (All, Women, Men, Been before), rows you swipe right to let in or left to decline, "Let in all who fit" | ✅ |
| 31 | Guest list | `(events)/[id]/attendees` | The door list: event photo with parallax, in / to come / waiting counts with an arrival bar and the crowd mix, filters, everyone still to come first then everyone in with their time, the waitlist, and the scanner button | ✅ |
| 32 | Check-in scanner | `(events)/[id]/scanner` | Full-screen camera with a rounded scan window cut into the shade, live in-count, torch button (turns off when you leave), a big result card with the guest's photo (green in, yellow already in, red not valid), guest list slides up for checking in by hand | ✅ |

### 6. Host onboarding

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 33 | Become a host | `(host-onboarding)/index` | Story segments across the top; welcome, how it works and badges each open on one of the website's own party photos (`client/assets/images/host/`), then the agreement and payouts | ✅ |
| 34 | Host agreement | `(host-onboarding)/agreement` | Clause cards you tick as you read, a progress bar, Sign unlocks at 5 of 5, then your signature with your name. Same view is step 4 of onboarding | ✅ |
| 35 | Signature | `(host-onboarding)/signature-sheet` | White ink on the dark pad above a signature line with your name, Undo, Clear, Use this signature. Only the ink is saved | ✅ |

### 7. People and profiles

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 36 | Someone's profile | `(profile)/[id]` | Photos, voice intro, interests, hosted events, send a vibe, follow | ✅ cover photo, feed cards, going-to and hosting rails, guest reviews |
| 37 | Edit profile | `(profile)/edit` | Name, bio, interests, badges, voice intro card | ✅ cover + cards |
| 38 | Record new intro | `(profile)/voice` | Same orb recorder as onboarding, saves and goes back | ✅ |
| 39 | Edit photos | `(profile)/edit-photos` | Hinge-style grid of squares (profile photos are 1:1): the main one big, five around it, star to make main, cross to remove. Onboarding's photo step uses the same grid | ✅ |
| 40 | Change city | `(profile)/location` | Wide postcard banners for the cities with photos, search with Near me, the rest as a list. Onboarding's city step uses the same view | ✅ |
| 41 | Followers / following | `(profile)/follows` | Clean Instagram rows: face, name, handle and city, a Follows you tag, one clear button, more behind the dots | ✅ |
| 42 | Host reviews | `(profile)/host-reviews` | Host photo with parallax and the score huge, 5-to-1 bars, event and star chips, each review says which night it was for | ✅ |
| 43 | My QR | `(profile)/qr` | Pick a style like Instagram: the maroon pass, or any of your photos behind a white card with your face on its edge. Save and Share send what's showing | ✅ |
| 44 | Search people | `(profile)/search` | Instagram search: recent people as a row of faces, suggestions and results as rows | ✅ |

### 8. Chat

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 45 | Conversation | `(chat)/[id]` | Messages, photos, voice notes, event cards, edit, unsend, report | ✅ grey bubbles |
| 46 | Pending vibe | `(chat)/pending` | The vibe you sent, waiting for them to reply | ✅ what happens next |

### 9. Safety

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 47 | Safety centre | `(safety)/index` | SOS, emergency contacts, safety tips | ✅ tonight + circle |
| 48 | Emergency contacts | `(safety)/contacts` | Your list of trusted contacts | ✅ SMS preview |
| 49 | Choose from contacts | `(safety)/contacts-choose` | Pick from your phone's contacts | ✅ unchanged |
| 50 | New contact | `(safety)/contacts-new` | Add a contact by hand | ✅ big-type, same as sign in |

### 10. Settings and account

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 51 | Settings | `(settings)/index` | Account, events, money, safety, help, legal | ✅ your photo on top (parallax), quick tiles, delete moved to Account |
| 52 | My events | `(settings)/my-events` | Events you host: upcoming and past, cards or list | ✅ cards |
| 53 | Joined events | `(settings)/joined-events` | Events you're going to, with tickets | ✅ cards |
| 54 | Hotlist | `(settings)/hotlist` | Saved events | ✅ cards |
| 55 | Calendar | `(settings)/calendar` | Your nights by date | ✅ neutral colours, poster empty state |
| 56 | Notifications | `(settings)/notifications` | Activity feed with inline actions (accept, follow back) | ✅ big day headers, settings gear, neutral icons |
| 57 | Notification settings | `(settings)/notification-settings` | Push categories on or off | ✅ big title, neutral switches |
| 58 | Wallet | `(settings)/wallet` | Balance, refunds and history | ✅ poster header, balance on photo |
| 59 | Payout details | `(settings)/payout-details` | Bank or UPI for host payouts | ✅ maroon card |
| 60 | Blocked users | `(settings)/blocked` | Unblock people | ✅ copy |
| 60b | Account | `(settings)/account` | Phone number, blocked, legal, delete account at the bottom | ✅ new |
| 62 | Help & FAQ | `(settings)/help` | Answers by topic | ✅ poster header, topics, accordion |
| 63 | Contact support | `(settings)/support` | Write to the team | ✅ big type, topic tiles |
| 64 | Send feedback | `(settings)/feedback` | Tell us what to fix | ✅ mood picker |
| 65 | About | `(settings)/about` | Version and links | ✅ poster header |
| 66 | Terms | `(settings)/terms` | Terms of service | ✅ website page, unchanged |
| 67 | Privacy | `(settings)/privacy` | Privacy policy | ✅ website page, unchanged |
| 68 | Delete account | `(settings)/delete-account` | Confirm and schedule deletion | ✅ number and code use the sign-in screens |

### Conditional states ("not right now" screens)

| State | How to see it | UI pass |
|---|---|---|
| Check-in not open yet | Your event, more than 3h away → Scanner | ✅ poster top, live countdown, timeline, guest list button |
| Editing closed | Your event, under 2h away → ⋯ → Edit | ✅ timeline of when things lock, support note |
| Too late to cancel | Your event, under 48h away → ⋯ → Cancel | ✅ edit instead / email support |
| Women only / men only | An event set for the other crowd | ✅ find another night |
| Age limit | An event above your age | ✅ find another night |
| Event cancelled | Any cancelled event | ✅ refund card, wallet / another night |
| Edit screen locked banner | Edit an event under 7h away | ✅ neutral card, accurate copy |
| Scanner from guest list | Guest list → Scanner, too early or after | ✅ pill says the exact opening time |
| Chat: blocked / they blocked / deleted account | Open that chat | ✅ card with title, reason, Unblock / Delete chat |
| Can't delete account while hosting | Settings → Account → Delete account | ✅ "Your guests come first" |

### Sheets and overlays (not routes, still worth a pass)

| Sheet | Where | UI pass |
|---|---|---|
| Event quick peek | Long-press any event card | ✅ big poster, host, Open / Share / Host |
| Confirm sheets (withdraw, last chance, leave waitlist, unblock) | `components/ui/ConfirmSheet.tsx` | ✅ |
| City picker | Events tab, create flow | ✅ photo postcards for popular cities, then the list |
| Event preview (as a card / full page) | Create flow | ✅ |
| Share to chat | Event page, published screen | ✅ square faces, ring when picked, Send pinned |
| Media preview | Chat, photo pickers | ✅ framed photo, Crop pill, neutral |
| Permission sheet | Mic, camera, location, contacts | ✅ icon for what is needed, 3 steps to turn it on |
| Empty states | Every list (`components/ui/EmptyState.tsx`, still icons) | ✅ |
| Requested section | Home | ✅ new: events you asked to join, "Waiting for the host" |
| Send vibe | Someone's profile | ✅ full screen, their photo, ideas from their interests, 4 lines max |
| Vibe accept | Chat, profile | ✅ full screen "It's a vibe", both faces, their message, ideas |
| Vibe inbox | Chat flame / banner | ✅ big photo cards, message bubble, Pass / Vibe back |
| UPI ID | Payment | ✅ full screen, big ID, handle chips, verified card, remember tick |
| Review text | Rate your night | ✅ opens the full-screen editor |
| Event options, share event, share details, guest list, report event | Event page | ✅ big titles, solid red for destructive, square faces, report details in full-screen editor |
| Profile menu, block, report, deleted account | Profiles, chat | ✅ photo + name on menu, block explains what it does, solid red actions |
| Media picker, media viewer, chat search, emoji picker, report message | Chat | ✅ big tiles, black viewer with glass buttons, neutral menus, solid red report |
| Event search, sort, date/time picker, payment overlays, pill/toast, locked, maintenance | Various | ✅ search sections, tick rows, maroon payment moments, full-screen locked and maintenance |

---

## Parallax and scroll

| Screen | Status |
|---|---|
| Home (12) | Skipped: enough motion already (tunnel fade, This week cards) |
| Events list (13) | Skipped: no featured event to put on top yet |
| Someone's profile (36) and your Profile (15) | ✅ photo parallax, name over it, top bar with name fades in (`ProfileFoldBar`) |
| Chat conversation (45) | ✅ Instagram-style intro at the start; header name and photo fade in once it scrolls away, and show instantly from the inbox cache |
| Settings and lists | ✅ big titles fold into the top bar (`ui/LargeTitle`): notifications, blocked, account, payout, notification settings, my events, joined, hotlist, emergency contacts |
| Calendar (55) | ✅ pinned month folds to the selected week and stays folded across day changes; filter sheet rebuilt in the new sheet style |

---

## Admin panel (Next.js, `admin/`)

| Screen | Route | What it does |
|---|---|---|
| Sign in | `/login` | Admin login |
| Dashboard | `/` | Key numbers and recent activity |
| Users | `/users`, `/users/[id]` | Search, view and moderate users |
| Events | `/events`, `/events/[id]` | Every event, attendees, ratio and gender counts |
| Revenue | `/revenue` | Ticket revenue and commission |
| Wallet | `/wallet` | Wallet balances and adjustments |
| Safety | `/safety` | Reports and SOS activity |
| Feedback | `/feedback` | Feedback from the app |

---

## Website (Next.js, `website/`)

The website renders hundreds of pages from a few dozen templates (city,
neighbourhood, type, crowd, time, price, occasion, guides, help, legal, event,
host). The full page list with status is in [website/README.md](website/README.md).
