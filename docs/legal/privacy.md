# Privacy Policy

**Gorave Pvt. Ltd.** · Last updated: [date]

> DRAFT, written for India's Digital Personal Data Protection Act 2023 (DPDP) and the IT Act 2000. Built from what the app actually collects. Every **[CHECK]** is a promise the code has to keep before this goes live (see `docs/GO_LIVE.md`, section 5).

## In short
- We collect what's needed to run Gorave: your phone number, profile, the events you join, your chats, and payments.
- Other people see your profile. They don't see your phone number, exact date of birth or exact location.
- We don't sell your data and we don't show third-party ads.
- You can delete your account in the app. It's removed for good after 30 days.
- For anything about your data: grievance@gorave.in.

## 1. Who we are
Gorave Pvt. Ltd. ([Registered address], CIN [CIN]) is the **Data Fiduciary** for your personal data on Gorave: the app and gorave.in.

## 2. What we collect

| What | Why | Who sees it |
|---|---|---|
| **Phone number** | Sign-in by one-time code, account security | Only you and Gorave staff |
| **Name, username, photos, bio, interests, city** | Your profile | Other users |
| **Voice intro** (optional) | Your profile | Other users |
| **Date of birth** | Checking you're 18+, and event age limits | Others see your age, not your date of birth |
| **Gender** | Events with a crowd mix (women only, set ratios) | Hosts and other users |
| **Location** (only while using the app, if you allow it) | Showing events near you. We store an approximate position. | Only Gorave. Others only see your city. |
| **Contacts** (only if you allow it) | Choosing an emergency contact for SOS. We only save the contact you pick, not your address book. | Only you |
| **Events you join, tickets, check-ins, waitlists, requests** | Running bookings | The host, and other guests see who's going |
| **Messages, photos, videos, voice notes** in chats and event group chats | Messaging | The people in that chat |
| **Event album photos, reviews** | Event features | Guests of that event / public on the event page |
| **Follows, vibes, blocks** | Social features and safety | Follows and vibes: the people involved. Blocks: only you. |
| **Reports you make or receive** | Safety | Gorave staff. We don't reveal who reported. |
| **Payments**: amount, status, Razorpay payment ID | Tickets, refunds, wallet | You and Gorave. **Card and UPI details are handled by Razorpay. We never see or store them.** |
| **Hosts: PAN check** | Verifying a host's identity | Gorave staff only. We keep the result, a masked PAN (last digits) and a one-way hash to stop the same PAN being used twice, not your full PAN. **[CHECK: confirm nothing else is stored]** |
| **Hosts: payout details** (UPI ID or bank account) | Paying you | Gorave staff. Stored encrypted. |
| **Hosts: agreement signature** | Proof you accepted the Host Agreement | Gorave staff |
| **Account appeal: message and live selfie** | Checking a locked account belongs to you | Gorave staff only |
| **Device and push token, app version, crash reports** | Notifications, fixing bugs | Gorave |
| **Support and feedback messages** | Helping you | Gorave staff |

We don't knowingly collect data from anyone under 18. If we find an account belongs to someone under 18, we delete it.

## 3. Why we can use it (DPDP)
- **Your consent**, given when you sign up and when you turn on optional features (location, contacts, voice intro). You can withdraw consent at any time in your phone settings or by deleting your account. Withdrawing doesn't affect what was already done.
- **Legitimate uses allowed by law**: for example keeping records the law requires (tax and payment records), responding to lawful requests, and acting in an emergency.

## 4. Who we share it with
We share data only with service providers who process it for us under contract, and only what they need:

| Provider | What for |
|---|---|
| Razorpay | Payments and refunds |
| Twilio (and our DLT-registered SMS route) | Sign-in codes and SMS alerts |
| Expo, Apple Push and Google Firebase Cloud Messaging | Push notifications |
| Cloudflare R2 | Storing photos and media. Chat media is in a private store that only signed, expiring links can open. |
| Surepass | Host PAN verification |
| Sentry | Crash reports |
| [Hosting provider] | Running our servers and database |

We also share data:
- with **hosts**, for the events you join (your profile, gender for crowd mix, check-in status),
- with **your emergency contact**, if you trigger SOS (your name and location),
- with **police or government**, when the law requires it or someone's safety is at risk,
- with a buyer, if Gorave is ever merged or sold (they must keep this policy).

We **don't sell** personal data and don't share it for advertising.

## 5. Where it's stored
Our main servers are in [India / region]. Some providers may process data outside India. When they do, it's under contract and only to countries the Government of India hasn't restricted.

## 6. How long we keep it

| Data | Kept |
|---|---|
| Your account | Until you delete it. After you ask, there's a 30-day window to change your mind, then it's removed for good. |
| View-once photos and videos | Deleted 10 minutes after the last allowed view. Unopened ones after 14 days. |
| Other chat messages | Until you or the other person deletes them, or the account is removed |
| Payment, payout and tax records | As long as tax and payment laws require (usually 8 years), even after you delete your account |
| Host PAN check records | While you're a host, then as tax law requires **[CHECK]** |
| Appeal selfies | 90 days after the appeal is decided **[CHECK: not built yet]** |
| Server and security logs | 180 days (CERT-In requirement) **[CHECK]** |
| Reports and safety records | As long as needed to keep people safe and meet legal duties |

## 7. Your rights
You can:
- **see** what we hold about you and who we shared it with,
- **correct** or update it (most of it directly in the app),
- **delete** it: Settings → Account → Delete account,
- **withdraw consent** for optional features,
- **nominate** someone to act for you if you die or can't act,
- **complain** to our Grievance Officer and then to the Data Protection Board of India.

Email grievance@gorave.in from your registered number's account details. We reply within the time the law sets.

## 8. Security
We use encryption in transit, encrypted storage for payout details, a private store for chat media, hashing for PAN numbers, limited staff access with audit logs, and rate limits on sign-in. No system is perfectly secure. If a breach affects your data, we'll tell you and the Data Protection Board as the law requires.

## 9. Changes
If we change this policy in a way that matters, we'll tell you in the app before it takes effect.

## 10. Contact
Grievance Officer: [Full name], grievance@gorave.in, [Registered address]. See [Grievance and Contact](grievance.md).
