# App audit, before launch (25 Nov 2026)

Every screen in `client/` has had its UI pass (see SCREENS.md). This is what the
code still needs: things that break, lose data, mislead people, or block launch.
Tick items off as they're fixed. Paths are under `client/src/` unless noted.

Health today: type check clean, lint 0 errors (156 warnings: 72 hook deps,
37 unused vars, 42 import order). No TODO/FIXME left. No A/B labs left in any
screen (the lab tooling itself can be deleted).

## 1. Launch blockers

Round 1 (money and SOS) is done, 25 Nov. Also added on the server: a catch-up
job every 3 minutes that turns payments Razorpay captured but the app never
confirmed (app closed, offline, QR screen left early) into tickets.

Round 2 (privacy, data, ticket, chat) is done, 25 Nov. Logout also forgets the
push token, so the next account on the phone gets its own pushes. A one-time
SQL fix moves anyone already saved at 0,0 to their city's centre.

### Release config
- [ ] Production API URL: `app.json` `extra.apiUrl` is `http://192.168.0.105:8000` (a laptop on Wi-Fi) and nothing switches it per build. Add `app.config.ts` that picks the URL from `APP_ENV` (HTTPS in production). WebSockets follow it.
- [ ] Remove `usesCleartextTraffic: true` (plain HTTP) once the URL is HTTPS.
- [ ] `ios.appleTeamId` is still `PUT_APPLE_ID`.
- [ ] Saving to Photos on iOS: add the `expo-media-library` plugin and `NSPhotoLibraryAddUsageDescription` (ticket, recap, QR, share card save). Without it iOS crashes or Apple rejects.
- [ ] `eas.json` `submit.production` is empty (App Store and Play details).

### Money
- [x] Payment: if Razorpay takes the money but the confirm call drops or times out, the screen says "Payment failed" and Retry starts a new order (`app/(events)/[id]/payment.tsx`, `finalise` inside the same try). Keep the payment id, retry the confirm, show "Confirming your payment", never "failed".
- [x] Payment errors show "Payment failed" instead of the real reason (sold out, cancelled, bad code): the catch reads `err.description/detail`, ours throw `err.message`.
- [x] Pay can be double-tapped before the screen updates (state-only guard): use a ref lock. Same for Publish on Create event.
- [x] Book screen: if the price quote fails, it falls back to a price worked out on the phone (ignores early bird) and Pay stays enabled. Block Pay until the server quote is there.

### Safety (SOS)
- [x] SOS says "sent" when no SMS went out: the server counts SMS as sent while no sender number is set up (`server/utils/twilio_client.py` `send_sms` returns True), and the app says "SOS sent" even when 0 contacts were alerted (`hooks/useSos.ts`). Return the real count; never show success for 0.
- [x] SOS uses the location from when the 5-second hold started: a GPS fix that arrives during the hold is ignored and it fails with "Turn on location" (`SosHoldSheet.tsx` / `useSos.ts`). Read the location at send time.
- [x] Location off = no SOS at all, no way to turn it on, and permission granted later isn't noticed until restart (`useSos.ts`, `store/locationStore.ts`). Send without the map link, offer Open Settings, and offer calling 112.
- [x] If emergency contacts fail to load, SOS says "Add an emergency contact first" to someone who has them (`useEmergencyContacts.ts`, `SosButton.tsx`). Cache contacts on the phone; only show setup when the load succeeded.
- [x] No fallback when SOS can't reach the server (offline): offer a device SMS or a 112 call.

### Data and privacy
- [x] Logout leaves the last user's data on the phone: notifications list (`notifications_cache_v1`), search history, chat search history, recently viewed, city filter, calendar filters and more survive into the next account (`store/auth.ts` clears only the main cache).
- [x] Edit profile writes your location as 0,0 on every save (`hooks/useEditProfile.ts`: `setLocation(city, lat ?? 0, lng ?? 0)`). Only send the city when it changed, with real coordinates.
- [x] Ticket doesn't open offline after the app restarts: it only checks memory, not the copy saved on the phone (`app/(events)/[id]/ticket.tsx` uses `peekCached`). Use `peekEntry`. The saved ticket also expires at the event's start; keep it until the end.

### Chat
- [x] 1:1 chat: messages that arrive while the connection drops or the app is in the background never show up until you leave and come back (`hooks/useChat.ts`: no refetch on reconnect). Group chat already does this.
- [x] Group chat: a load error shows a blank screen with no input, no message and no retry (`useEventChat.ts` sets `error`, the screen never shows it).

## 2. Should fix before launch

### Errors that look like something else
Each of these shows an empty or wrong state on a network error, with no retry:
- [ ] Home: every section hides its error, so offline Home is just the top bar and promos, and the empty state can never show (also when you have no city).
- [ ] Wallet: shows ₹0 and "No transactions yet" (`useWallet.ts`).
- [ ] Refund screen: shows "No refund here" (`(settings)/refund/[eventId].tsx`).
- [ ] Event page: "Event not found" (`useEventDetail.ts`). Someone's profile: "Profile not available".
- [ ] Hotlist, blocked, my events, joined events, host reviews: show their empty state.
- [ ] Notification settings: shows all switches on (made-up defaults), then saves against them.
- [ ] Emergency contacts and the Safety hub: "No emergency contacts yet".
- [ ] Host ID check: "ID checks aren't switched on yet". Payout step: "We couldn't find that UPI ID" when the Razorpay key failed to load.
- [ ] Edit profile / Edit photos / Edit event: an empty editable form. Edit photos then uploads on top of your existing photos.
- [ ] Deals screen: loader forever. Ticket transfer link: "This link isn't valid". People from last night: no retry.

### Saving that silently fails
- [ ] Onboarding: interests and city failing to save still move you on (Home then has nothing for your city).
- [ ] Onboarding: going back to About you and tapping Next creates the profile again.
- [ ] Onboarding photos: going back and reordering or removing doesn't reach the server.
- [ ] Edit profile: under 3 interests are silently not saved but "Profile updated!" shows; save opens the profile on top of the stack instead of going back.
- [ ] Edit photos: a partial failure still closes the screen and loses your picks.
- [ ] Chat: unsend, delete for me and bulk delete aren't undone when they fail. Message reports show "done" when they failed. Group chat mute switch can stick in the wrong state.
- [ ] People from last night: shows "Vibe sent" after a failed send.
- [ ] Delete account: if the "you have upcoming events" check fails, it's skipped. The OTP step only gates the screen; the server delete doesn't require it.

### Taps that do nothing or are missing
- [ ] Report a user from a 1:1 chat is unreachable (the sheet exists, nothing opens it).
- [ ] Block in a chat opened from a push (older than your top 20 chats) does nothing.
- [ ] Account: the "Phone number" row looks tappable and does nothing.
- [ ] OTP: "Send a new code" can be tapped repeatedly while sending (several SMS).
- [ ] Payout details: no way to change them once added.

### Host onboarding
- [ ] No resume: leave after signing and you sign and upload again. Android back exits the wizard mid-way.

### Performance
- [ ] The chat list refetches everything (3 requests) on every message ping in any chat: debounce it.
- [ ] Group chat can open a second connection when the app comes back to the front.
- [ ] Wallet, payout details, notification settings and the Profile tab's going list refetch with a loader on every visit. Cache them like Home.

### App-wide
- [ ] No error screen: a crash shows a white screen. Add an error boundary with "Something went wrong, reload".
- [ ] Sentry: set the environment, keep dev errors out of production, add `SENTRY_AUTH_TOKEN` as an EAS secret.
- [ ] Android background location and foreground-service permissions in `app.json` need Play Console declarations, or remove them if unused.
- [ ] The Google Maps key in `app.json`: make sure it's restricted to the app.
- [ ] Search people: going back from a result clears your search; a slow old response can replace newer results.
- [ ] About shows the build number as "(1)": read it from `expo-application`.

## 3. Copy and polish

- [ ] Em dashes in user-facing copy (rule: none): `(settings)/notifications.tsx:221`, `WalletTransactionRow.tsx:16`, `(events)/[id]/edit.tsx:118,190`, `payment.tsx` and `qr-payment.tsx` (the "spot was just taken" line), `EventPreviewOverlay.tsx:250`, `Step3Where.tsx:110`, `Step4Pricing.tsx:97`, `SosButton.tsx:38`, `PromoCarousel.tsx:122`, `SafetyAgreementSheet.tsx:16,32,92`, `BioInput.tsx:38`, `constants/eventTemplates.ts` (11), `useEventPhotos.ts:74`, `useInterests.ts:49`, `useLocation.ts:121,124`, `useMediaPicker.ts:54`, `useVoice.ts:361,434`, and the `'—'` placeholders in the profile stat rows.
- [ ] Wallet says "Refunds never expire" but rows can show "Expires {date}": check against the server.
- [ ] Endless animations (rule: none): the Welcome screen poster drift and the Rate-the-night drift are decorative, so stop them. Loaders, typing dots and the voice waveform only run while needed, so they're fine to keep.
- [ ] Accessibility: icon buttons have no labels for screen readers. One fix in `HeaderIconBtn` (`components/ui/AppHeader.tsx`) and the ParallaxScreen back button covers most of it; then the chat input bar (9), Home's search and bell, event hero icons.
- [ ] Clean-up: delete the lab tooling (`components/lab/`, `store/labStore.ts`), the dead calendar search code, the `console.log('Crop cancelled')`, dead Home styles; Support also opens the mail app after sending (can arrive twice).

## Server items found on the way
- [x] `send_sms` returns success with no sender set up (see SOS above).
- [x] A Twilio error on one SOS contact fails the whole SOS request: send to the others.
- [ ] Delete account doesn't require the fresh OTP.
- [ ] Host ID tries: the app's fallback says 3, the server allows 2.
