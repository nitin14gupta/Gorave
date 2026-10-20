# Gorave screens

Every screen in the app, grouped by flow, plus the admin panel and a pointer to
the website's page list. Use it as the checklist for the UI pass.

**UI pass column:** ✅ redesigned in the current pass · ⬜ not yet.

House rules for the pass:
- Real photos and custom SVG where they help.
- Icons from lucide, never emoji. Brand logos (WhatsApp and so on) are custom SVG.
- Neutral glass and surfaces, not tinted "AI" colour blocks.
- Motion runs once and stays calm. No pulsing, no looping, no popping.
- Event photos are always 4:5 (`EVENT_IMAGE_ASPECT` in `client/src/constants/eventImage.ts`).

Routes live in `client/src/app/` (Expo Router). `(group)` folders don't show in the URL.

---

## App (Expo, `client/`)

### 1. Sign in

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 1 | Launch redirect | `index.tsx` | Sends you to sign in, onboarding or home depending on your session | ⬜ |
| 2 | Welcome | `(auth)/index` | "Find your vibe": Get started / I already have an account | ⬜ |
| 3 | Phone number | `(auth)/phone` | Enter your mobile number | ⬜ |
| 4 | OTP | `(auth)/otp` | Enter the code sent by SMS | ⬜ |

### 2. Onboarding (new users)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 5 | Age check | `(onboarding)/index` | Confirm you're 18+ | ⬜ |
| 6 | About you | `(onboarding)/profile` | Name, date of birth, gender (set once) | ⬜ |
| 7 | Photos | `(onboarding)/photos` | Add profile photos | ⬜ |
| 8 | Voice intro | `(onboarding)/voice` | Tap the orb, record up to 30s, play back, retake or skip | ✅ |
| 9 | Interests | `(onboarding)/interests` | Pick what you're into | ⬜ |
| 10 | City | `(onboarding)/location` | Choose your city | ⬜ |
| 11 | All set | `(onboarding)/complete` | Finish and enter the app | ⬜ |

### 3. Main tabs

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 12 | Home | `(tabs)/index` | Create event, Happening now, You're hosting, You're going, Waitlist, Rate your nights, Recently viewed, Trending in your city | ✅ cards |
| 13 | Events | `(tabs)/events` | Browse by city: map view with photo pins and a preview strip, or a list of poster cards. Filter chips, search, city picker | ✅ cards |
| 14 | Chat | `(tabs)/chat` | Conversations, search, unread counts | ⬜ |
| 15 | Profile | `(tabs)/profile` | Your profile as others see it, plus shortcuts | ⬜ |

### 4. Events (as a guest)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 16 | Event page | `(events)/[id]/index` | 4:5 hero with parallax, details, masked address card, crowd split bars, people, RSVP bar (Join / Request / Waitlist / Ticket) | ✅ |
| 17 | Event map | `(events)/[id]/map` | Where it is (approximate until you're in) and nearby events | ✅ |
| 18 | Book | `(events)/[id]/book` | Pick tickets and pay method (Razorpay, UPI QR or wallet) | ⬜ |
| 19 | Payment | `(events)/[id]/payment` | Razorpay checkout | ⬜ |
| 20 | UPI QR payment | `(events)/[id]/qr-payment` | Pay by UPI QR, then confirmation | ⬜ |
| 21 | Request sent | `(events)/[id]/requested` | After "Request to join" on a free event: what happens next, requests left, withdraw | ✅ |
| 22 | Waitlist | `(events)/[id]/waitlist` | Join the waitlist when it's full | ⬜ |
| 23 | On the waitlist | `(events)/[id]/waitlist-joined` | Your place, leave the waitlist | ⬜ |
| 24 | Ticket | `(events)/[id]/ticket` | QR ticket, full address, event info | ⬜ |
| 25 | Rate the night | `(events)/[id]/review` | Review the event and host after it ends | ⬜ |
| 26 | Reviews | `(events)/[id]/reviews` | All reviews for an event | ⬜ |

### 5. Events (as a host)

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 27 | Create event | `(events)/create` | 5 steps: Basics → When (age, crowd mix) → Where (city, address, pin) → Pricing → Photos (4:5 cropper), with a live preview | ✅ crowd mix, photos |
| 28 | Event is live | `(events)/published` | Your invite card, copy link, share to WhatsApp, Gorave chat or more | ✅ |
| 29 | Edit event | `(events)/[id]/edit` | Change details (ratio and age lock once guests join) | ⬜ |
| 30 | Join requests | `(events)/[id]/requests` | Accept or decline requests, with quota bars | ⬜ |
| 31 | Guest list | `(events)/[id]/attendees` | Who's going, gender counts, manage | ⬜ |
| 32 | Check-in scanner | `(events)/[id]/scanner` | Scan guests' QR tickets at the door | ⬜ |

### 6. Host onboarding

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 33 | Become a host | `(host-onboarding)/index` | Steps to start hosting, ends on "You're all set" | ⬜ |
| 34 | Host agreement | `(host-onboarding)/agreement` | Read and accept the host agreement | ⬜ |
| 35 | Signature | `(host-onboarding)/signature-sheet` | Sign with your finger | ⬜ |

### 7. People and profiles

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 36 | Someone's profile | `(profile)/[id]` | Photos, voice intro, interests, hosted events, send a vibe, follow | ⬜ |
| 37 | Edit profile | `(profile)/edit` | Name, bio, interests, badges, voice intro card | ✅ voice |
| 38 | Record new intro | `(profile)/voice` | Same orb recorder as onboarding, saves and goes back | ✅ |
| 39 | Edit photos | `(profile)/edit-photos` | Reorder, add and remove photos | ⬜ |
| 40 | Change city | `(profile)/location` | Move to another city | ⬜ |
| 41 | Followers / following | `(profile)/follows` | Lists with follow back | ⬜ |
| 42 | Host reviews | `(profile)/host-reviews` | Every review a host has received | ⬜ |
| 43 | My QR | `(profile)/qr` | Your profile QR to share or scan | ⬜ |
| 44 | Search people | `(profile)/search` | Find people by name or handle | ⬜ |

### 8. Chat

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 45 | Conversation | `(chat)/[id]` | Messages, photos, voice notes, event cards, edit, unsend, report | ⬜ |
| 46 | Pending vibe | `(chat)/pending` | The vibe you sent, waiting for them to reply | ⬜ |

### 9. Safety

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 47 | Safety centre | `(safety)/index` | SOS, emergency contacts, safety tips | ⬜ |
| 48 | Emergency contacts | `(safety)/contacts` | Your list of trusted contacts | ⬜ |
| 49 | Choose from contacts | `(safety)/contacts-choose` | Pick from your phone's contacts | ⬜ |
| 50 | New contact | `(safety)/contacts-new` | Add a contact by hand | ⬜ |

### 10. Settings and account

| # | Screen | Route | What it does | UI pass |
|---|---|---|---|---|
| 51 | Settings | `(settings)/index` | Account, events, money, safety, help, legal | ⬜ |
| 52 | My events | `(settings)/my-events` | Events you host: upcoming and past, cards or list | ✅ cards |
| 53 | Joined events | `(settings)/joined-events` | Events you're going to, with tickets | ✅ cards |
| 54 | Hotlist | `(settings)/hotlist` | Saved events | ✅ cards |
| 55 | Calendar | `(settings)/calendar` | Your nights by date | ⬜ |
| 56 | Notifications | `(settings)/notifications` | Activity feed with inline actions (accept, follow back) | ⬜ |
| 57 | Notification settings | `(settings)/notification-settings` | Push categories on or off | ⬜ |
| 58 | Wallet | `(settings)/wallet` | Balance, refunds and history | ⬜ |
| 59 | Payout details | `(settings)/payout-details` | Bank or UPI for host payouts | ⬜ |
| 60 | Blocked users | `(settings)/blocked` | Unblock people | ⬜ |
| 61 | Background | `(settings)/background` | App background choice | ⬜ |
| 62 | Help & FAQ | `(settings)/help` | Answers by topic | ⬜ |
| 63 | Contact support | `(settings)/support` | Write to the team | ⬜ |
| 64 | Send feedback | `(settings)/feedback` | Tell us what to fix | ⬜ |
| 65 | About | `(settings)/about` | Version and links | ⬜ |
| 66 | Terms | `(settings)/terms` | Terms of service | ⬜ |
| 67 | Privacy | `(settings)/privacy` | Privacy policy | ⬜ |
| 68 | Delete account | `(settings)/delete-account` | Confirm and schedule deletion | ⬜ |

### Sheets and overlays (not routes, still worth a pass)

| Sheet | Where | UI pass |
|---|---|---|
| Event quick peek | Long-press any event card | ⬜ |
| Confirm sheets (withdraw, last chance, leave waitlist, unblock) | `components/ui/ConfirmSheet.tsx` | ✅ |
| City picker | Events tab, create flow | ⬜ |
| Event preview (as a card / full page) | Create flow | ✅ |
| Share to chat | Event page, published screen | ⬜ |
| Media preview | Chat, photo pickers | ⬜ |
| Permission sheet | Mic, camera, location, contacts | ⬜ |
| Empty states | Every list (`components/ui/EmptyState.tsx`, still icons) | ✅ |

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
