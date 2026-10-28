# Gorave: Business Brief

> **For the AI reading this.** You are being briefed on Gorave so you can explain the business, answer investor questions and reason about strategy. Everything under "How it works", "How we make money", "Trust and safety" and "Product" is true of the product as built today. Anything marked **[FILL IN]** is information the founder adds; never guess it. Anything marked **(idea, not built)** is a possible future direction, not a current feature. Do not invent user numbers, revenue, market sizes or quotes. If asked for a figure that isn't here, say it isn't available and suggest what would answer it.

---

## 1. One line

**Gorave is a social events app for India: people find and join house parties, rooftop nights, game nights, dinners and music nights in their city, and hosts run those nights with ticketing, guest screening, a door QR scanner and built-in safety.**

## 2. The problem

- **Small social nights in India run on Instagram DMs, WhatsApp groups and word of mouth.** A guest can't easily find them, and has no idea who the host is or who else is coming.
- **Hosts have no proper tools.** They collect money by UPI one person at a time, track names in a notes app, and can't control who walks in. Nothing stops strangers showing up, and nothing balances the crowd.
- **Safety is the biggest worry,** especially for women going to a stranger's home. Today there's no verification, no address privacy and no emergency tool.
- **Big ticketing apps are built for concerts and clubs,** not a 30-person house party.

## 3. The solution

One app that does both sides:

| For guests | For hosts |
|---|---|
| Discover nights by city on a map or list, filter by type | Create an event in 5 steps with a live preview |
| See the host's profile, rating, badge and who's going | Choose instant booking (paid) or request-to-join (free) |
| Book a paid spot instantly, or request a free one | Accept or decline requests, watching the crowd-mix quota bars |
| QR ticket for the door | Scan QR tickets at the door |
| Exact address only unlocked once you're confirmed | Set an age limit and a crowd mix (for example 50:50, women only) |
| SOS that texts your live location to emergency contacts | Get paid for paid tickets (payout details stored encrypted) |
| Chat, voice intros, follows, "Vibes" to connect | Share invite cards to WhatsApp and Instagram |

## 4. How it works (the rules, exactly as built)

- **Sign in** with a phone number and OTP.
- **Joining:**
  - **Paid events** are booked instantly: Razorpay checkout, UPI QR, or the Gorave wallet.
  - **Free events** are request-to-join. The host sees your profile and decides. Each person gets two requests per event (withdrawing uses one), and a decline is final.
  - **Full events** have a waitlist. When a spot opens, the next person gets a time-limited offer.
- **Age limit** on every event (default 18+), checked against date of birth.
- **Crowd mix.** Hosts can set a gender split (50:50, 60:40, women only, men only). 10% of spots stay open to anyone. Gender is set once at onboarding and can't be changed later, so the split can't be gamed.
- **Address privacy.** Until confirmed, guests only see the area (for example "Bandra West, Mumbai") and an approximate circle on the map.
- **Free events are capped at 2 per host per month.** After that, events must be paid, with a minimum ticket price of ₹99. This pushes active hosts toward paid events, which is where Gorave earns.
- **Cancellation:**
  - **Hosts** can cancel up to 48 hours before the start. Every guest gets **everything back**, ticket and fee.
  - **Guests, free events:** cancel from the ticket up to 2 hours before the start. The spot goes to the next person.
  - **Guests, paid events:** cancel up to 48 hours before the start. The ticket price comes back to the wallet; the ₹50 fee is kept. Inside 48 hours a paid ticket can't be cancelled, which gives the host time to fill the spot from the waitlist.
  - **Event moved by more than a week** after you bought: you get 48 hours from the change to cancel for everything back.
- **After the night,** guests rate the event and the host. Ratings show on the host's profile.

## 5. How we make money

Two charges, both on **paid tickets only**. Free events cost nobody anything; they're there to grow the platform.

### 5a. ₹50 platform fee, paid by the attendee
- A flat **₹50 per paid ticket**, added on top of the host's price. The attendee sees it at checkout.
- **Why the attendee pays it:**
  1. **It keeps the host's price clean.** A host sets ₹499 and receives the ₹499 price minus commission, not a number reduced further by fees.
  2. **It pays for what protects the guest:** a verified host, the QR ticket, address privacy, SOS texts to emergency contacts, refunds to the wallet if an event is cancelled, and support.
  3. **Attendees already accept it.** A flat convenience fee per ticket is standard on Indian ticketing apps.
  4. **It's flat, not a percentage,** so it's easy to understand and doesn't punish cheaper events as hard.

### 5b. 10% host commission, paid by the host
- **10% of the ticket price,** taken out of what the host is paid. Attendees never see it.
- **Why the host pays it:**
  - Gorave brings the guests (discovery by city, the map, trending and sharing).
  - It handles payments and tickets, and the door scanner.
  - It screens guests: requests, age limits and crowd mix.
  - It takes the safety and refund burden off the host.
- **Hosts only pay when they earn.** There's no subscription or listing fee.

### 5c. Rates are locked per event
Each event saves the fee and commission it was created under. If Gorave changes the rates later, existing events aren't affected, which builds host trust.

### 5d. Worked examples (from the real rules)

| Ticket price set by host | Attendee pays | Host commission (10%) | Host receives | Gorave earns per ticket |
|---|---|---|---|---|
| ₹99 (minimum) | ₹149 | ₹10 | ₹89 | ₹60 |
| ₹299 | ₹349 | ₹30 | ₹269 | ₹80 |
| ₹499 | ₹549 | ₹50 | ₹449 | ₹100 |
| ₹999 | ₹1,049 | ₹100 | ₹899 | ₹150 |
| Free | ₹0 | ₹0 | ₹0 | ₹0 (growth) |

- **Gorave earns** ₹50 plus 10% of the ticket price for every paid ticket.
- **Example night:** 40 guests at ₹499 makes **₹4,000 for Gorave** and **₹17,960 for the host**.
- **Take rate:** on a ₹499 ticket, Gorave keeps ₹100 of the ₹549 paid, about 18%.
- **Main cost per ticket:** the payment gateway charge. Razorpay's standard rate is roughly 2% of the amount charged; check the actual plan. There's no gateway charge when the wallet pays.

### 5e. The wallet
- **Refunds go to the Gorave wallet as credit,** not back to the card. That covers event cancellations, and automatic refunds when a paid booking can't be honoured (for example the last spot went to someone else at the same moment).
- **Wallet credit expires after 6 months.**
- **When a host cancels,** attendees get everything back as credit, ticket and the ₹50 fee. When a guest cancels a paid ticket themselves (48h+ before), the ticket price comes back and the ₹50 is kept.
- **Why a wallet:** money stays in Gorave for the next booking (retention), and refunds are instant.
- **Trade-offs to be ready for:** credit that expires after 6 months can feel unfair to users. Wallet rules should also be checked with a lawyer against RBI guidance for closed wallets.

### 5f. Possible future revenue (ideas, not built)
- **Promoted placement:** hosts pay to appear higher in Discover and Trending for a night.
- **Host Pro:** analytics, co-hosts and recurring events for professional hosts.
- **Guest membership:** pay monthly and the per-ticket fee disappears.
- **Brand-sponsored nights:** drinks, music and lifestyle brands sponsoring events in a city.
- **Venue partnerships:** cafés, rooftops and studios listed as bookable spaces.

## 6. How we verify hosts and build trust

What exists today:
1. **Phone number verified by OTP** for every account.
2. **18+ only,** checked from date of birth at onboarding.
3. **A real face on the profile:** the first profile photo must contain a face (automatic check).
4. **Gender is locked after onboarding,** so crowd mix and women-only events can't be gamed.
5. **Host agreement with a finger signature** in host onboarding, before a host can earn from paid tickets. It's stored privately.
6. **Payout details** (UPI or bank account) collected and stored encrypted. Only masked details are shown, even to the host.
7. **Ratings after every event,** shown on the host's profile.
8. **Badges by track record** (see section 7).
9. **Reports and blocks** for people, events and messages, plus an admin moderation panel. The team can lock accounts and cancel events, and attendees are refunded automatically.

What does **not** exist yet (be honest if asked):
- **Government ID verification,** such as DigiLocker or Aadhaar-based KYC.
- **A liveness selfie check.**
- **Physical venue checks** for large events.

**Recommended next step:** ID verification for anyone hosting paid events, shown as a "Verified host" tick. That's the single biggest trust upgrade.

## 7. Host badges

Badges come automatically from the number of events a host has run (not counting cancelled ones):

| Badge | Events hosted |
|---|---|
| Rising | 2+ |
| Established | 10+ |
| Elite | 25+ |
| Legend | 75+ |

- **Why badges matter:** a guest deciding whether to go to a stranger's house trusts a "Legend" with 75 nights behind them. Badges turn a host's history into trust at a glance. They also give hosts a ladder to climb, which keeps them hosting.
- **Honest note:** the app tells hosts that higher tiers get "more visibility in Discover and Trending". Today, ranking is based on relationship signals (hosts you follow, hosts whose events you've been to), then distance, then date. **Badge tier isn't a ranking factor yet;** adding it is on the to-do list.

## 8. Safety (the main reason a guest picks Gorave over a DM)

- **SOS:** during an event, one tap texts your live location to your emergency contacts. It keeps working with the app in the background.
- **Emergency contacts** picked from your phone or added by hand.
- **Address privacy** until you're confirmed.
- **Crowd mix and women-only events,** enforced by the server.
- **View once and view twice photos and videos in chat,** with screenshots and screen recording blocked.
- **Chat starts with a "Vibe"** that the other person accepts, so nobody can be spammed.
- **Blocking and reporting everywhere;** blocked people can't message you.
- **Account deletion with a 30-day recovery window.** Financial and safety records are kept as the law requires.

## 9. Product, as built

- **Mobile app** for iOS and Android: discovery, events, tickets, chat, profiles, safety and wallet.
- **Real-time chat:**
  - photos, voice notes, shared event and profile cards, and link previews
  - forwarding, view once and view twice, and Sent / Delivered / Seen status
  - edit and unsend
  - built to run on many servers
- **Admin panel** for moderation, events, users, reports, revenue, host payout ledger and audit log.
- **Marketing website** at gorave.in, with city and event-type pages for search traffic.
- **Payments:** Razorpay, UPI QR, wallet.
- **Private storage** for chat media: links expire, and view-once files are deleted after viewing.

## 10. Who it's for

- **Guests:** roughly 18 to 35, in Indian cities. Students and young professionals who want to meet people offline, and people new to a city.
- **Hosts:**
  - people who already throw house parties, and want to cover costs or earn
  - small organisers who run game, dinner, music or comedy nights
  - creators with a following who want to meet them in person
- **Cities:** the app supports 75 Indian cities, from metros such as Mumbai, Delhi, Bangalore, Hyderabad, Chennai, Kolkata and Pune to tier-2 cities. The launch city order is **[FILL IN]**.

## 11. Competition and why Gorave is different

| Alternative | What it's good at | Where Gorave wins |
|---|---|---|
| Instagram / WhatsApp groups | Where these nights live today | Discovery, payments, guest control, safety, a host track record |
| Big ticketing apps (concert and club ticketing) | Large ticketed events | Built for small social nights, request-to-join, crowd mix, social layer |
| Global invite tools (Partiful, Luma) | Pretty invites | India-first: UPI, wallet, safety, discovery of strangers' events by city |
| Meetup-style apps | Interest groups | Nightlife and social energy, not just meetups; trust through ratings and badges |

**Moat as it grows:**
- **Network effects:** more hosts bring more guests, which brings more hosts.
- **A trust layer:** ratings, badges and verification history that a new app can't copy overnight.
- **A social graph:** follows, vibes, chats, and who went to which night.
- **City-level knowledge** of what kind of night works where.

## 12. Go-to-market

- **Supply first:** recruit hosts who already throw parties in one city. Free events (2 a month) let them try Gorave at no cost.
- **Every event markets itself:** the invite card and link shared to WhatsApp and Instagram bring new guests.
- **The badge ladder** rewards hosts for staying.
- **Search:** city and event-type pages on gorave.in (for example house parties in Mumbai).
- **Then expand city by city.** Win one city's hosts before spreading thin.
- **Current channels and CAC: [FILL IN]**

## 13. Traction: [FILL IN]

Fill in with real numbers only:
- Users signed up, monthly active users
- Hosts onboarded, events created, events completed
- Paid tickets sold, GMV (total ticket money), Gorave revenue
- Repeat rate (guests who come back, hosts who host again)
- Average ticket price, average guests per event
- Ratings average, safety incidents

## 14. Team: [FILL IN]

Founders, roles and relevant experience.

## 15. The ask: [FILL IN]

Amount raised, equity offered, valuation, and use of funds (for example city launches, host acquisition, ID verification, team).

## 16. Risks and how we handle them

| Risk | What we do today / plan |
|---|---|
| A safety incident at a private home | SOS, address privacy, verified accounts, crowd mix, ratings, reporting, account locks. **Plan:** ID-verified hosts, event insurance partner (idea). |
| Fake events or a host taking money and disappearing | Signed host agreement, encrypted payout details, ratings. Attendees are refunded automatically on cancellation. **Plan:** pay hosts only after the event ends and check-ins look right. |
| Legal (alcohol, noise, permissions at house parties) | The host agreement puts responsibility on the host. **Plan:** clear host guidelines per city; legal review. |
| Cold start in a new city | Recruit hosts before guests, free events to seed, social sharing. |
| Gender imbalance at events | Crowd-mix quotas enforced by the server, women-only events. |
| Refund and wallet complaints | Instant wallet refunds; a full refund (fee included) whenever the host cancels or moves the event. Guests can cancel paid tickets up to 48h before. **Review:** the 6-month credit expiry. |
| Big players copying us | Speed, the trust and social layer, and focus on small nights. |

## 17. Tough questions and suggested answers

- **Why would a host pay 10% instead of collecting UPI directly?**
  Because Gorave brings guests they don't already know, screens them, handles payments and refunds, and runs the door. The host only pays when they earn.
- **Why should guests pay ₹50 on top?**
  For a verified host, a guaranteed spot, address privacy, SOS and wallet refunds. A WhatsApp invite gives you none of that.
- **What stops someone meeting on Gorave once and then going around it?**
  Hosts get repeat guests, ratings and badges only through Gorave, and guests get safety and refunds only through Gorave. The more a host's reputation lives on Gorave, the less they want to leave.
- **Is it safe?**
  Every account is phone-verified and 18+ with a real face photo. Gender is locked, addresses stay hidden until you're confirmed, SOS texts live location, and every host has public ratings. ID verification is the next step.
- **What if a guest can't make it?**
  Free: cancel up to 2 hours before. Paid: up to 48 hours before, the ticket price comes back to the wallet and the ₹50 is kept (it covers the payment cost). Inside 48 hours the ticket stands, so hosts aren't left with empty spots at the last minute.
- **Why is the take rate around 18% on a ₹499 ticket?**
  It's split between the guest (₹50 flat) and the host (10%), so neither side feels the whole cost. On bigger tickets the share drops (about 14% at ₹999).
- **How do free events make money?**
  They don't directly. They bring in new guests and hosts. Hosts get 2 free events a month, then must charge at least ₹99.

## 18. Glossary

- **Vibe:** a request to connect and chat with someone. It stays pending until they reply.
- **Hotlist:** events a guest saved for later.
- **Crowd mix:** the gender split a host sets for an event.
- **Request-to-join:** a free event where the host approves each guest.
- **Wallet:** Gorave credit used for bookings. Refunds land here.
- **Badge:** Rising, Established, Elite or Legend, based on events hosted.
