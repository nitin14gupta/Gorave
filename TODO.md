# Gorave: to do

Things agreed to do later. Move an item to "Done" in the relevant README
once it ships.

## Before launch
- [ ] Run the SQL files on production, in order:
  - `2026-10-27_deletion_safety.sql`
  - `2026-10-28_message_forwarding.sql`
  - `2026-10-28_chat_production.sql`
  - `2026-10-28_view_once.sql`
  - `2026-10-28_unsent_media_cleanup.sql`
  - `2026-10-29_ticket_money.sql`
  - `2026-10-29_ticket_transfer.sql`

  All are in `server/scripts/sql/`.
- [ ] Production server env: set `R2_CHAT_BUCKET=gorave-chat`.
- [ ] EAS: add `SENTRY_AUTH_TOKEN` as a secret (production environment). Rotate the old token.
- [ ] Turn off the test OTP bypass (`000000`).

## Money
- [ ] Automate host payouts (for example RazorpayX), paid only after the event ends and check-ins look right. Today the admin panel only works out what each host is owed; transfers are done by hand.
- [ ] Refund the card/UPI part of a payment back to the original method, instead of bank refunds by hand ("5 to 10 days" by email today).
- [ ] Decide: credit the ₹50 fee to guests of events cancelled before Oct 29 (they got only the ticket price back under the old rule).
- [ ] Deleting an account cancels its paid tickets with no refund. Decide the rule.

## Trust and safety
- [ ] Government ID check for hosts of paid events (DigiLocker / Aadhaar-based), shown as a "Verified host" tick. Biggest gap in the safety story.
- [ ] Badges promise "more visibility in Discover and Trending", but ranking ignores badge tier. Add it to ranking, or soften the message.
- [ ] View once: tell the sender when someone screenshots (Instagram does this). Today screenshots are only blocked.

## Media
- [ ] Compress chat videos on Android before upload (iOS already exports at 720p).

## Features
- [ ] **Event group chat:** confirmed guests only; opens once they're in and closes the day after. Keeps "who's bringing what / I'm here" inside Gorave instead of WhatsApp.
- [ ] **Book for a +1:** buy 2 tickets and invite the friend into the app.
- [ ] **After-party photo album:** guests drop photos after the night, visible to attendees only.
- [ ] **"Home safe" check-in:** after the event ends, ask "Got home?" and alert emergency contacts if there's no answer.

## Business ideas (not decided)
- [ ] Badge-tier commission once there are real host numbers: Rising 10%, Established 9%, Elite 8%, Legend 7%.
- [ ] "Your own guests" rate: a lower commission on tickets sold through the host's own invite link. Needs link attribution.
- [ ] Commission cap per ticket (for example ₹150) for premium nights.
