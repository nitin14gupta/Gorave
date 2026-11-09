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

  All are in `server/scripts/sql/`.
- [ ] Production server env: set `R2_CHAT_BUCKET=gorave-chat`.
- [ ] EAS: add `SENTRY_AUTH_TOKEN` as a secret (production environment). Rotate the old token.
- [ ] New EAS build (Android): needed for video compression and for the OTP filling itself in from the SMS.
- [ ] OTP autofill on Android: log in once on a real Indian number. If the code fills in by itself, done. If Android shows an "Allow Gorave to read this message?" prompt instead, or nothing happens, set `OTP_APP_HASH=false` on the server and phones switch to the one-tap prompt.
- [ ] Host ID check (DigiLocker through Cashfree Secure ID). Until this is done, nobody can create an event in production:
  - Sign up for Cashfree Secure ID and turn on DigiLocker.
  - Set `CASHFREE_KYC_CLIENT_ID`, `CASHFREE_KYC_CLIENT_SECRET`, `CASHFREE_KYC_ENV=production` and a long random `KYC_HASH_SALT` that never changes.
  - Whitelist the server IP in Cashfree if they ask (their API answers 403 `ip_validation_failed` otherwise).
  - Do one real check in sandbox first and confirm the Aadhaar field names (`name`, `dob`, `uid`, `year_of_birth`) match `server/utils/kyc.py`. Their guide and API reference disagree.
  - Never set `KYC_MOCK=true` in production. It turns on the fake DigiLocker page used for local testing.
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
