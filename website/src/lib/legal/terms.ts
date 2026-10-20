import type { LegalDoc } from './entity'
import { LEGAL_ENTITY as E } from './entity'

// Every rule below is checked against the server (server/routes/*.py) and
// the app. If a rule changes in code, change it here in the same PR.

export const LEGAL_TERMS: LegalDoc = {
  slug: 'terms',
  title: 'Terms of Service',
  line: `The rules for using ${E.name} to find, join and host events at people’s homes in India.`,
  short: [
    `${E.name} connects hosts and guests. Hosts run their own events; we don’t organise, attend or supervise them.`,
    'You must be 18 or over, live in India and keep one account with accurate details.',
    'Paid tickets show the ticket price plus a ₹50 platform fee before you pay. Refunds follow our Refunds & Cancellations policy.',
    'Treat people well, follow the Community Guidelines, and we may suspend accounts that don’t.',
    'Safety tools like SOS help, but they are not an emergency service. In an emergency, call 112.',
  ],
  sections: [
    {
      heading: 'Who we are and agreeing to these terms',
      paragraphs: [
        `These terms are an agreement between you and ${E.name} (“${E.name}”, “we”, “us”). They cover the ${E.name} app, our website and any related services (together, the “Service”).`,
        'By creating an account or using the Service, you agree to these terms, our Privacy Policy, the Community Guidelines and, if you host, the Host Agreement. If you don’t agree, please don’t use the Service.',
      ],
    },
    {
      heading: 'Who can use Gorave',
      paragraphs: [
        'To use the Service you must:',
      ],
      bullets: [
        'be at least 18 years old. We ask for your date of birth when you set up your profile and won’t create a profile for anyone under 18. Some events set a higher minimum age of 21 or 25;',
        'be in India and use a mobile number you control, which we verify with a one-time code;',
        'have only one account, and not create a new one after we have suspended or removed you;',
        'give accurate information about yourself, including your name, date of birth and gender. Gender is set once when you create your profile and can’t be changed in the app, because some events use it to balance the crowd mix;',
        'be legally able to enter into a binding contract under Indian law.',
      ],
    },
    {
      heading: 'Your account',
      paragraphs: [
        'You sign in with your mobile number and a one-time code. Keep your phone and codes to yourself. You are responsible for what happens on your account, and you should tell us straight away if you think someone else has access to it.',
        'You can edit your profile, with some limits: you can change your display name once every 60 days and your username up to 3 times a month.',
        `You can delete your account in Settings. If you host upcoming events you’ll need to cancel them first. When you delete your account, any places you hold at upcoming events are released, including paid tickets, and those tickets are not refunded. Deleted accounts can be restored if you email ${E.email} within 30 days; after that the account and its data are permanently removed, including any Gorave Wallet balance. Please use or ask about your wallet balance before you delete.`,
      ],
    },
    {
      heading: 'What Gorave is, and what it isn’t',
      paragraphs: [
        `${E.name} is a platform. It lets people list events they host at their own homes or venues, such as house parties, rooftops, game nights, dinners and music nights, and lets other people find and join them.`,
        `Hosts are independent. They are not our employees, agents or partners. Each host decides what their event is, who to accept and how it runs, and is responsible for it, including the venue, safety, food and drink, noise, permissions and following the law. ${E.name} does not organise, run, attend, inspect or supervise events, and we don’t check venues or vet guests in person.`,
        'We may show information that hosts and guests give us, such as profiles, ratings and reviews. We don’t guarantee that it is accurate or that any event, host or guest will be as described.',
      ],
    },
    {
      heading: 'Joining events as a guest',
      paragraphs: [
        'How you join depends on the event:',
      ],
      bullets: [
        'Free events are request to join. The host accepts or declines your request. You can withdraw a pending request and request the same event once more (2 requests per event in total). A decline is final, and any request still pending when the event starts expires.',
        'Paid events book instantly when your payment goes through, as long as a spot that fits the event’s crowd mix is still available.',
        'When a paid event is full, you may be able to join its waitlist. If a spot opens, you get 1 hour to confirm and pay. If you don’t, the offer passes on and you can’t rejoin that waitlist.',
        'The exact address is shared only with the host and confirmed guests. Before that you’ll see the area and an approximate location.',
        'Your ticket in the app is checked in by the host at the door. Check-in opens 3 hours before the start.',
      ],
    },
    {
      heading: 'How guests should behave',
      paragraphs: [
        'When you go to an event you are a guest in someone’s home. Follow the host’s house rules, respect other guests and their property, and leave if you are asked to. You are responsible for your own conduct, belongings, travel and choices, including about alcohol.',
        'Only guests who were checked in can review an event, and only after it has ended. Reviews must be honest and about your own experience.',
      ],
    },
    {
      heading: 'Hosting events',
      paragraphs: [
        'If you host, you also agree to the Host Agreement at /host-agreement and the Community Guidelines at /guidelines. In short:',
      ],
      bullets: [
        'Listing an event is free. You can run up to 2 free-entry events a month; beyond that, events need a ticket price of at least ₹99.',
        'Events must be in India, be posted at least 24 hours before they start, last between 1 hour and 3 days, and have a capacity of 5 to 200.',
        'You can edit most details up to 7 hours before the start. Some details, like the age limit, crowd mix and whether the event is free or paid, are fixed once guests have joined, and you can’t reduce capacity once people have booked.',
        'You can cancel up to 48 hours before the start. After that, cancelling in the app is blocked.',
        'On paid events you keep 90% of the ticket price and we keep a 10% commission. Payouts are made after the event to the UPI ID or bank account you added.',
        'You are responsible for your venue, for the safety of your event, for any permissions or licences it needs and for any taxes on what you earn.',
      ],
    },
    {
      heading: 'Payments, fees and the Gorave Wallet',
      paragraphs: [
        'Paid tickets cost the host’s ticket price plus a flat ₹50 platform fee per ticket, and you see the total before you pay. Free events have no fee. You can pay by UPI through our payment partner, with your Gorave Wallet balance, or with both.',
        'The Gorave Wallet holds credit from refunds. You can’t add money to it yourself. Wallet credit can be spent on tickets on Gorave and carries an expiry date shown in the app.',
        'Cancellations, refunds and the wallet are covered in detail in our Refunds & Cancellations policy at /refunds, which forms part of these terms.',
      ],
    },
    {
      heading: 'Content you post',
      paragraphs: [
        'You own the content you add to Gorave, such as photos, voice intros, bios, event listings, messages and reviews. You are responsible for it and must have the right to post it.',
        `You give ${E.name} a non-exclusive, royalty-free, worldwide licence to host, store, copy, display, adapt (for example resize or crop) and share that content in order to run, improve and promote the Service. This licence ends when you delete the content or your account, except where others have already seen it, it is part of an event or conversation others are in, or we need to keep it for legal reasons.`,
        'We may remove content that breaks these terms or the Community Guidelines, or that we are required to remove by law.',
      ],
    },
    {
      heading: 'Things you must not do',
      paragraphs: [
        'You must not use the Service to:',
      ],
      bullets: [
        'harass, threaten, stalk, discriminate against or harm anyone, or share anyone’s private information without their consent;',
        'post anything illegal, sexually explicit, hateful, violent or misleading, or that infringes someone else’s rights;',
        'list a fake event, misrepresent a venue, or take money for an event you don’t intend to hold;',
        'sell or supply drugs, or anything else illegal, at or through an event;',
        'take payments for a Gorave event outside the app, or resell tickets;',
        'impersonate someone, use someone else’s account, or create accounts to get around a suspension or limits;',
        'spam, scrape, reverse engineer, overload or interfere with the Service, or get around our security or rate limits.',
      ],
    },
    {
      heading: 'Safety features',
      paragraphs: [
        'We build tools to help you stay safe, such as blocking, reporting, sharing event details and SOS. These help, but they are not a guarantee of safety.',
        'SOS sends a text message with your name, the event (if you choose one) and a map link to your current location to the emergency contacts you have added, up to 5 of them. It depends on your phone, your network, your location settings and our text message provider, and it may fail or be delayed. Gorave does not monitor SOS alerts and does not contact the police or emergency services for you.',
        'SOS is not an emergency service. If you or someone else is in danger, call 112 first.',
      ],
    },
    {
      heading: 'Reports, suspension and ending your account',
      paragraphs: [
        'You can report people, events and messages in the app, and block anyone. We review reports and may act on them, but we can’t promise a particular outcome or timeline.',
        'If we reasonably believe you have broken these terms, the Community Guidelines or the law, or you put others at risk, we may remove content, limit features, cancel your events, or lock or remove your account. Where it is safe and lawful to do so, we will tell you why. If we cancel a paid event, guests are refunded as set out in our Refunds & Cancellations policy.',
        `If you think we got it wrong, write to ${E.email}. You can stop using Gorave at any time and delete your account in Settings.`,
      ],
    },
    {
      heading: 'Disclaimers',
      paragraphs: [
        'We work hard to keep Gorave useful and reliable, but we provide the Service “as is” and “as available”. To the extent the law allows, we don’t promise that it will always be available, error-free or secure.',
        'Events are run by hosts, not by us. We are not responsible for what happens at an event, for the conduct of hosts or guests online or offline, or for the condition of any venue. Use your judgement before going to anyone’s home or inviting anyone into yours.',
      ],
    },
    {
      heading: 'Limitation of liability',
      paragraphs: [
        `To the extent permitted by law, ${E.name} is not liable for any indirect, incidental, special or consequential loss, or for loss of profits, data or goodwill, arising from your use of the Service or any event.`,
        `To the extent permitted by law, our total liability to you for any claim about the Service is limited to the amount you paid through ${E.name} for the booking the claim relates to, or, if the claim doesn’t relate to a booking, the platform fees you have paid to ${E.name}.`,
        'Nothing in these terms limits liability that can’t be limited under Indian law, including for fraud, or for death or personal injury caused by our negligence, or your rights under the Consumer Protection Act, 2019.',
      ],
    },
    {
      heading: 'Indemnity',
      paragraphs: [
        `You agree to compensate ${E.name} for reasonable losses, claims and costs (including reasonable legal fees) that arise because you broke these terms or the law, or from content you posted, or, if you host, from your event. This does not apply to the extent the loss was caused by us.`,
      ],
    },
    {
      heading: 'Governing law and disputes',
      paragraphs: [
        `These terms are governed by the laws of India. If you have a problem, please contact us first at ${E.email} so we can try to sort it out.`,
        `If we can’t resolve it, the courts of ${E.jurisdiction} have jurisdiction, without affecting any right you have to bring a complaint before a consumer commission or other forum under Indian law.`,
      ],
    },
    {
      heading: 'Grievance redressal',
      paragraphs: [
        `In line with the Information Technology Act, 2000 and the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, you can raise a complaint about content on Gorave, or about how we have handled your account, with our grievance officer (${E.grievanceOfficer}) at ${E.grievanceEmail}.`,
        'Please include your registered phone number, what the complaint is about and any links or screenshots. We will acknowledge complaints and deal with them within the time limits those Rules set.',
      ],
    },
    {
      heading: 'Changes to the Service and these terms',
      paragraphs: [
        'Gorave will change over time, and we may update these terms. If a change is significant, we will tell you in the app or by other reasonable means before it takes effect. The date at the top of this page shows when the terms were last updated. If you keep using the Service after a change takes effect, the new terms apply.',
      ],
    },
    {
      heading: 'Contact us',
      paragraphs: [
        `Questions about these terms? Write to ${E.email}, or use Support in the app.`,
      ],
    },
  ],
}

export const LEGAL_REFUNDS: LegalDoc = {
  slug: 'refunds',
  title: 'Refunds & Cancellations',
  line: `What happens to your money on ${E.name} when plans change, a host cancels or a payment goes wrong.`,
  short: [
    'You can cancel your spot at a free event any time in the app.',
    `Paid tickets can’t be cancelled in the app once booked. If something has gone wrong, contact ${E.email}.`,
    'If a host or Gorave cancels an event, everyone who paid gets the ticket price back in their Gorave Wallet automatically. The ₹50 platform fee isn’t included.',
    'Waitlists are free to join. You only pay if you’re offered a spot and confirm it.',
    'Wallet credit can be spent on tickets, carries an expiry date, and can be moved to your bank by asking support.',
  ],
  sections: [
    {
      heading: 'What you pay',
      paragraphs: [
        'Free events cost nothing to join and have no fee.',
        'A paid ticket costs the host’s ticket price (at least ₹99) plus a flat ₹50 platform fee. You see the total before you pay. You can pay by UPI through our payment partner, with your Gorave Wallet balance, or with both. Your spot is confirmed only once the payment has gone through and the app shows your ticket.',
        'This policy is part of our Terms of Service at /terms.',
      ],
    },
    {
      heading: 'If you cancel',
      paragraphs: [
        'Free events: you can cancel your spot at any time before the event from the event page, and you can withdraw a pending request at any time. Your spot goes back to the host.',
        `Paid tickets: once a paid ticket is booked, it can’t be cancelled in the app, and we don’t give automatic refunds if you change your mind or can’t go. If something has gone wrong, for example the event wasn’t as listed or you couldn’t get in, write to ${E.email} with the event name and your registered phone number and we’ll look into it. Nothing in this policy affects your rights under Indian consumer law.`,
      ],
    },
    {
      heading: 'If the host cancels',
      paragraphs: [
        'Hosts can cancel an event in the app up to 48 hours before it starts. After that, cancelling in the app is blocked, so guests can count on the night happening.',
        'When a host cancels:',
      ],
      bullets: [
        'everyone going, waitlisted or waiting on a request is told the event is cancelled;',
        'every guest with a paid ticket automatically gets the ticket price back as Gorave Wallet credit. You don’t need to ask for it;',
        `the ₹50 platform fee is not part of the automatic refund. If you’d like to ask about it, contact ${E.email};`,
        'pending requests and waitlist places end, and as nothing was charged for them there is nothing to refund.',
      ],
    },
    {
      heading: 'If Gorave cancels an event',
      paragraphs: [
        'We may cancel an event at any time, including within 48 hours of the start, for example if it breaks our terms or guidelines or we have safety concerns. When we do, guests are told, and paid guests get the ticket price back as Gorave Wallet credit in the same way as a host cancellation.',
        'Hosts don’t receive a payout for cancelled events.',
      ],
    },
    {
      heading: 'If the event changes',
      paragraphs: [
        'Hosts can edit most event details up to 7 hours before the start, and can add more spots until 2 hours before. Guests are told when an event they are going to is edited. Some things can’t change once guests have joined: the age limit, the crowd mix, and whether the event is free or paid.',
        `If an event changes in a way that matters to you and you no longer want to go, write to ${E.email} with the event name and we’ll look into it.`,
      ],
    },
    {
      heading: 'Failed, interrupted or duplicate payments',
      paragraphs: [
        'If a payment fails or you leave checkout before it goes through, no ticket is booked. UPI QR codes expire after a set time, and an expired code can’t be paid.',
        'If someone takes the last spot just before your payment completes, you won’t get a ticket. The amount you paid by UPI is put in your Gorave Wallet, and any wallet balance you chose to use is not taken.',
        `If money has left your account but you have no ticket or wallet credit, or you think you were charged twice, write to ${E.email} with the event name, the amount, the date and your UPI reference. We will check with our payment partner and correct any confirmed error. Money that is debited but never received by us is usually reversed by your bank or UPI app under their own rules.`,
      ],
    },
    {
      heading: 'Waitlists',
      paragraphs: [
        'Joining a waitlist is free, and waitlists are only used on paid events. If a spot opens up, you get 1 hour to confirm and pay. If you don’t, the offer moves to the next person and you can’t rejoin that waitlist. Waitlists close 2 hours before the event starts.',
        'If a waitlisted event is cancelled, you are told and taken off the waitlist. Nothing was charged, so there is nothing to refund.',
      ],
    },
    {
      heading: 'The Gorave Wallet',
      paragraphs: [
        'The Gorave Wallet is where refunds land. It only holds credit from refunds; you can’t add money to it, and it doesn’t earn interest.',
      ],
      bullets: [
        'You can use wallet credit at checkout for a paid ticket, on its own or together with UPI.',
        'Each credit shows an expiry date in the app. Credits currently expire 6 months from the date you receive them.',
        'To move your wallet balance to your bank, go to Support in the app and choose “Wallet refund to bank”, with your registered phone number and the event you were refunded for. These requests are handled by our team, so we can’t promise a fixed time.',
        'If you delete your account, any wallet balance is permanently lost once the account is removed 30 days later. Paid tickets for upcoming events are also released without a refund when you delete. Please ask about your balance first.',
      ],
    },
    {
      heading: 'Questions and disputes',
      paragraphs: [
        `For anything about a payment, refund or cancellation, write to ${E.email} or use Support in the app. Please include the event name, your registered phone number and any payment reference.`,
        `If you’re not happy with our answer, you can escalate it to our grievance officer (${E.grievanceOfficer}) at ${E.grievanceEmail}. You also keep any rights you have under the Consumer Protection Act, 2019 and other Indian law.`,
      ],
    },
  ],
}
