# Gorave: what stops us going live

Showstoppers first, in the order they unblock each other. Tick them off here.
Legal and tax points are for a CA or lawyer to confirm; this list is so nothing is missed.

Legend: 🔴 showstopper (can't launch without it) · 🟠 needed at launch, not blocking setup · 🟡 soon after launch

---

## 1. Company (everything else waits for this)

| | Item | Depends on | Notes |
|---|---|---|---|
| 🔴 | Incorporate **Gorave Pvt. Ltd.** | Nothing | Get CIN, PAN, TAN. |
| 🔴 | Current bank account in the company name | Incorporation | Needed by Razorpay and for payouts. |
| 🔴 | **D-U-N-S number** | Incorporation | Apple and Google both require it for an organisation developer account. Free, 1 to 3 weeks. Apply the same day. |
| 🔴 | Apple Developer (organisation) and Google Play Console (organisation) | D-U-N-S | An organisation Play account skips the "12 testers for 14 days" rule that new personal accounts have. |
| 🔴 | **Razorpay live KYC** | Company + bank | Razorpay checks the website for: Terms, Privacy, Refunds and Cancellation, Contact Us, and a Delivery line ("tickets are delivered in the app instantly"). |
| 🔴 | **DLT registration (TRAI)** for SMS | Company | Register the entity, then the sender header (e.g. GORAVE), then every template: OTP, account unlocked, SOS alert. No DLT means no SMS reaches Indian numbers. |
| 🔴 | **GST registration** | Company | The ₹50 platform fee and the 10% host commission are a taxable service. |
| 🟠 | TCS (GST) and TDS 194-O on host payouts | GST | As a marketplace collecting money for hosts we likely have to deduct these from payouts. CA to confirm rates and filing. |
| 🟠 | Razorpay Route (or RazorpayX) for host payouts | Razorpay live | Payouts are by hand until then. When built, skip events with `payout_held_at` set. |
| 🟠 | Trademark "Gorave" (classes 9, 41, 42) | Company | Cheap, file early. |
| 🟠 | All live keys in production | Company accounts | Razorpay live, Twilio + DLT, Surepass live, `KYC_HASH_SALT`, `R2_CHAT_BUCKET`, Sentry. Rotate the DB password and Surepass token that were shared in chat. |

## 2. Money decisions (decide before Razorpay live)

| | Item | Notes |
|---|---|---|
| ✅ | **Wallet model** | Built (18 Nov): refunds land in the wallet, never expire, and the card/UPI part can be sent back from the Refund screen. |
| ✅ | Refund credit never expires | Done, old refunds cleared by `2026-11-18_refund_choice.sql`. |
| 🟠 | Payout timing | Write down when hosts are paid (e.g. within 7 business days after the event, if there are no open reports). It goes in the Host agreement. |
| 🟠 | GST invoice for the platform fee | Guests paying the ₹50 fee should be able to get an invoice. |

### Wallet: recommendation

What you heard is mostly right. The rule of thumb is: **money that belongs to the customer (a refund) must be returnable to them, not trapped as expiring store credit.**

- **A gift card is different.** Flipkart sells it as a product, and you choose to buy it knowing it expires. A refund for a cancelled event is the guest's own money coming back. Making it expire looks like keeping their money, which is a consumer-protection risk.
- **A closed wallet needs no RBI licence.** Balance that can only be spent on Gorave and can't be withdrawn as cash is outside RBI's wallet rules. Once people can move wallet balance to any bank account, it starts to look like a regulated wallet.
- **The 6 months you heard is probably the gateway limit.** Razorpay and the card networks only let you refund a payment to the original card/UPI for a limited time (around 180 days). That's a limit on refunding to source, not a rule that wallet money must expire.

**Suggested model (the one Swiggy and BookMyShow use):**
1. On any refund, the guest picks: **Gorave Wallet, instant** or **original payment method, 5 to 7 business days** (Razorpay refund API on the original payment).
2. Refund money in the wallet **never expires**. Only promo credit we give for free (if we ever do) can expire, and that's stated when it's given.
3. Wallet balance that came from a refund can still be sent back to the original payment method on request, while the gateway allows it. After that, by bank transfer through Support, with ID checks.
4. No other cash-out. Nothing else goes from the wallet to a bank.

Code changes this needs: a refund choice in the cancel flows, a Razorpay refund call, no expiry on refund credits, and Support's "Refund to my bank" changed to "Send my refund back to my payment method".

## 3. Legal pages (drafts in `docs/legal/`, move to the website when final)

| | Page | Status |
|---|---|---|
| 🔴 | Terms of Service | Draft: `docs/legal/terms.md` |
| 🔴 | Privacy Policy (DPDP Act 2023) | Draft: `docs/legal/privacy.md` |
| 🔴 | Refunds and Cancellation | Draft: `docs/legal/refunds-cancellation.md` |
| 🔴 | Community Guidelines | Draft: `docs/legal/community-guidelines.md`. **Required**: we host user content (profiles, photos, voice, chats, group chats, reviews, event albums). The IT Rules 2021 require published content rules, and Apple 1.2 / Google UGC policy reject apps without rules plus report plus block. |
| 🔴 | Host Agreement | Draft: `docs/legal/host-agreement.md` |
| 🔴 | Guest Agreement (new) | Draft: `docs/legal/guest-agreement.md` |
| 🔴 | Grievance Officer and Contact | Draft: `docs/legal/grievance.md`. Needs a **real named person**, address, and email. Acknowledge in 24 hours, resolve in 15 days. |
| 🔴 | Fill the placeholders | `[CIN]`, `[Registered address]`, `[Grievance Officer name]`, `[Hosting provider]` in every draft, and `website/src/lib/legal/entity.ts`. |
| 🟠 | Internal incident process | Draft: `docs/internal/incident-response.md` (not public). |
| 🟠 | Lawyer review of all of the above | Before going live. |

## 4. App Store and Play Store

| | Item | Notes |
|---|---|---|
| 🔴 | App Review login | Apple needs a working test login. Add **one fixed reviewer number** with a fixed OTP in production. Never ship `_DEV_OTP_BYPASS = True` (`server/utils/twilio_client.py`, last line). |
| 🔴 | Apple privacy labels, Play Data safety form | Use the data list in `docs/legal/privacy.md`. |
| 🔴 | Age rating 18+ | Users meet strangers in person. |
| 🔴 | Screenshots | iPhone 6.9" 1320×2868, 6 to 8 images. Play: at least 1080×1920, plus a 1024×500 feature graphic. Order below. |
| 🔴 | Listing copy | Events and making friends, not dating. Avoid words that read as a hookup app. |
| 🟠 | App preview video | 15 to 30 seconds, only footage from the app. Being made in claude.ai. |
| 🟠 | Support URL, privacy URL, account deletion URL | Apple and Google both ask. In-app deletion already exists. |
| 🟠 | Payments | Real event tickets can use Razorpay (no Apple in-app purchase). Anything purely digital, like paid badges, would need Apple/Google billing. |
| 🟠 | Store icon from the final logo | Logo is done. |
| 🔴 | New EAS production build | After all keys are in. |

**Screenshot order**
1. Discover: what's on tonight near you
2. An event page: 4:5 poster, crowd mix, price
3. Safety: verified host tick, women-only events, crowd ratio
4. The event group chat
5. Vibes: meeting people from the night
6. Your ticket and QR check-in
7. Hosting: create an event and get paid
8. Safety tools: SOS, block, report

## 5. Things the code promises but doesn't do yet (found while writing the drafts)

| | Item | Where |
|---|---|---|
| ✅ | Refund credit expires in 6 months | Fixed 18 Nov |
| 🟠 | Appeal selfies are never deleted | `routes/account_appeal.py` stores to `appeals/{user_id}/`. The privacy draft promises deletion 90 days after the decision: add a cleanup job. |
| 🟠 | Host agreement signature images and PAN check records: retention not set | Decide (suggest: keep while the person is a host plus 8 years for tax, then delete). |
| 🟠 | Server logs kept 180 days | CERT-In requires it. Check the hosting provider's log retention. |
| 🟡 | Data export ("give me my data") | DPDP rights. Can be by email to start. |

## 6. Operations

| | Item |
|---|---|
| 🔴 | Run the SQL files on production (you're doing it), including `2026-11-18_refund_choice.sql` |
| 🔴 | Switch local `server/.env` to **Razorpay test keys** (`rzp_test_...`). It has live keys today, so a test booking or refund moves real money. |
| 🔴 | Remove the demo seed: `python scripts/seed_website_demo.py --production --clean` |
| 🔴 | Production database backups, tested with a restore once |
| 🔴 | Inboxes that someone reads: support@gorave.in, grievance@gorave.in, safety@gorave.in |
| 🟠 | Who answers SOS alerts and safety reports, and in what hours (see the incident doc) |
| 🟠 | Uptime alert for the API, Sentry alerts going to a phone |
| 🟡 | A first set of hosts and events in the launch city so Discover isn't empty on day one |
