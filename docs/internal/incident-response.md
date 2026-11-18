# Incident response (internal, not public)

**Gorave Pvt. Ltd.** · Owner: [name] · Last reviewed: [date]

Who does what when something goes wrong. Keep it short enough to follow at 2 a.m.

## Contacts (fill in)
| Role | Person | Phone |
|---|---|---|
| Incident lead (decides) | [name] | [phone] |
| Tech lead (servers, data) | [name] | [phone] |
| Safety lead (users, hosts, police) | [name] | [phone] |
| Grievance Officer | [name] | [phone] |
| Lawyer | [firm] | [phone] |
| CERT-In | incident@cert-in.org.in | +91-1800-11-4949 |

## Severity
| Level | Examples | Respond within |
|---|---|---|
| **S1 critical** | Someone in physical danger. Data breach or leak. Payment money going wrong at scale. App down for everyone. | 15 minutes, any hour |
| **S2 high** | A harassment or assault report from an event. A fake event that took money. Sign-in broken. Push or SMS not sending. | 2 hours |
| **S3 normal** | Single bug, one wrong refund, a content report | 1 business day |

---

## A. Someone's safety (SOS, assault, harassment, danger at an event)
1. **Danger right now?** Tell them to call **112**. Don't delay this for anything else.
2. Contact the person who raised it. Check they're safe and get the facts: event, people involved, time.
3. If a user is a threat: **lock their account** (admin → Users → Lock). If it's the host: Safety → Events → *Refund and lock host* (or *Cancel and lock host* if the event hasn't happened yet).
4. **Keep the evidence**: don't delete chats, reports or photos. Note them in the report.
5. If police ask, follow section C. If the person wants to file a police complaint, help them with what we can lawfully share.
6. Follow up within 24 hours. Write it in the incident log.

## B. Security incident or data breach
Covers: leaked database or keys, unauthorised access to admin, stolen staff laptop or phone, malware, account takeovers at scale, defacement.

1. **Contain**: rotate exposed keys (DB, R2, Razorpay, Twilio, Surepass, JWT secrets), revoke admin sessions, block the access path. Take a snapshot before changing things where you can.
2. **Report to CERT-In within 6 hours** of noticing it (CERT-In Directions, April 2022), using their incident form, to incident@cert-in.org.in.
3. **Personal data affected?** Under the DPDP Act, inform the **Data Protection Board** and **each affected user** without delay, then send the Board a detailed report (what happened, what data, what we did, how we'll stop it happening again) within **72 hours**.
4. Find out what was taken and from whom. Logs must be kept for **180 days** (CERT-In), so check those first.
5. Fix the cause, then write a short post-incident note: timeline, cause, fix, what changes.

## C. Requests from police or government
1. Requests must be **in writing** from an official (a notice under BNSS section 94, an IT Act section 69 or 79 order, or a court order). Phone calls aren't enough, except in a real emergency where life is at risk.
2. Send it to the incident lead and the lawyer. Check it's genuine (call the station back on its official number).
3. Share **only what's asked for**. Log what was shared, when and with whom.
4. **Takedown orders** under IT Act section 69A or 79(3)(b): act within the time stated, usually 36 hours, or 24 hours for non-consensual intimate images.
5. Don't tell the user about the request if the order says not to.

## D. Money incidents
Wrong refunds, double charges, payouts to the wrong account, Razorpay webhook failures.
1. Stop the bleeding: pause payouts and turn off the failing flow if needed.
2. List every affected payment from the admin wallet and revenue pages and Razorpay.
3. Fix each one, and tell each affected user what happened and when they'll be made whole.
4. Tell the CA if tax records are affected.

## E. App or service outage
1. Confirm it (Sentry, uptime alert, try it yourself).
2. Post a short notice in-app or on social if it lasts more than 30 minutes.
3. Fix it, then check that payments made during the outage weren't lost (Razorpay vs our records).

## F. Content emergencies
Child sexual abuse material, non-consensual intimate images, threats of violence or self-harm.
1. Remove or lock immediately: within 24 hours at most, sooner if possible.
2. **CSAM**: keep the evidence, report it to the police / NCRB cybercrime portal (cybercrime.gov.in). Never share it, even internally beyond what's needed.
3. Self-harm: share helplines (Tele-MANAS **14416**) and contact the person.

## Incident log
For every S1 and S2, write down: date and time noticed, who noticed it, what happened, who was affected, actions with times, reports made (CERT-In, Board, police), and what we changed. Keep these for at least 3 years.
