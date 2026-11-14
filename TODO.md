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
  - `2026-11-02_event_album.sql`
  - `2026-11-03_chat_pins.sql`
  - `2026-11-03_chat_delete.sql`
  - `2026-11-03_event_chat.sql`
  - `2026-11-03_chat_mutes.sql`
  - `2026-11-07_moderation.sql`
  - `2026-11-07_host_verification.sql`
  - `2026-11-14_pan_verification.sql`

  All are in `server/scripts/sql/`.
- [ ] Production server env: set `R2_CHAT_BUCKET=gorave-chat`.
- [ ] EAS: add `SENTRY_AUTH_TOKEN` as a secret (production environment). Rotate the old token.
- [ ] Turn off the test OTP (`000000`): comment out the last line of `server/utils/twilio_client.py` (`_DEV_OTP_BYPASS = True`).
- [ ] New EAS build (Android): needed for video compression and for the OTP filling itself in from the SMS.
- [ ] OTP autofill on Android: log in once on a real Indian number. If the code fills in by itself, done. If Android shows an "Allow Gorave to read this message?" prompt instead, or nothing happens, set `OTP_APP_HASH=false` on the server and phones switch to the one-tap prompt.
- [ ] Host ID check (PAN through Surepass, approved by an admin). Until this is done, nobody can create an event in production:
  - Run `2026-11-14_pan_verification.sql` on production.
  - Ask Surepass for live access to PAN Comprehensive, then set `SUREPASS_BASE_URL` (the live URL) and `SUREPASS_TOKEN` on the API server, plus a long random `KYC_HASH_SALT` that never changes.
  - Someone checks the Host ID queue in the admin panel (Host ID in the sidebar) at least daily. Hosts wait on it.
- [ ] Sentry: check a replay in the dashboard once the new build is out, to confirm text and photos show as blocks.
- [ ] Load test an event group chat with 300 members.

## Money
- [ ] Automate host payouts (for example RazorpayX), paid only after the event ends and check-ins look right. Today the admin panel only works out what each host is owed; transfers are done by hand.
- [ ] Refund the card/UPI part of a payment back to the original method, instead of bank refunds by hand ("5 to 10 days" by email today).


## Trust and safety
- [ ] Show a "Verified host" tick on event pages and host profiles. The ID check itself is built (every host verifies before hosting), the tick isn't shown anywhere yet.
- [ ] Badges promise "more visibility in Discover and Trending", but ranking ignores badge tier. Add it to ranking, or soften the message.

## Features
- [ ] **Book for a +1:** buy 2 tickets and invite the friend into the app.
- [ ] **"Home safe" check-in:** after the event ends, ask "Got home?" and alert emergency contacts if there's no answer.

## Business ideas (not decided)
- [ ] Badge-tier commission once there are real host numbers: Rising 10%, Established 9%, Elite 8%, Legend 7%.
- [ ] "Your own guests" rate: a lower commission on tickets sold through the host's own invite link. Needs link attribution.
- [ ] Commission cap per ticket (for example ₹150) for premium nights.
