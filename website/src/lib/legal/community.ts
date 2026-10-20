import type { LegalDoc } from './entity'
import { LEGAL_ENTITY as E } from './entity'

// Full versions of the two agreements users accept in the app:
//  - Community Safety Agreement (client/src/components/safety/SafetyAgreementSheet.tsx),
//    agreed with “Agree & Continue” before a user’s first event.
//  - Host Agreement (client/src/components/host-onboarding/HostAgreementStep.tsx),
//    signed with a drawn signature during host setup.
// Every commitment in the in-app text appears here. Product rules match the
// server (routes/events.py, safety.py, users.py, chat.py, admin_users.py)
// and website/src/lib/helpTopics.ts.

export const LEGAL_GUIDELINES: LegalDoc = {
  slug: 'guidelines',
  title: 'Community Guidelines',
  line: `How everyone on ${E.name} is expected to treat each other, at events, in people’s homes and in the app.`,
  short: [
    'Treat hosts, guests and everyone you meet through Gorave with respect. Harassment, discrimination and abuse aren’t tolerated, in person or in the app.',
    'You’re in someone’s home. Follow the house rules, keep the address to yourself and ask before you photograph or post anyone.',
    'Follow the law, including local rules on alcohol. Illegal drugs have no place at a Gorave event.',
    'SOS and emergency contacts are a backup, not a substitute for your own judgement. If anyone is in immediate danger, call 112 first.',
    'Report or block anyone, any time. Confirmed violations can lead to suspension, a permanent ban and, where appropriate, a report to the authorities.',
  ],
  sections: [
    {
      heading: 'About these guidelines',
      paragraphs: [
        `${E.name} is for nights hosted by real people at home. That only works if everyone who opens their door, and everyone who walks through it, can trust the people they meet. These guidelines explain what we expect from every member of the community.`,
        'Before your first event, the app asks you to read and agree to the Community Safety Agreement. These guidelines are the full version of that agreement. They say the same things in more detail, and agreeing to one means agreeing to both.',
        'They apply everywhere you use Gorave: at events you attend or host, on the way there and back, in chats, on profiles, in event listings and in reviews. They sit alongside our Terms of Service, and hosts also agree to the Host Agreement.',
      ],
    },
    {
      heading: 'Respect every person',
      paragraphs: [
        'Treat hosts, guests and everyone you meet through Gorave with respect. Be the kind of guest you’d want in your own home, and the kind of host you’d want to visit.',
        'Harassment, unwanted contact, discrimination or any form of abuse isn’t tolerated, whether it happens in person or through the app.',
      ],
    },
    {
      heading: 'Consent and boundaries',
      paragraphs: [
        'Everyone decides for themselves who they talk to, dance with, touch or spend time with. Consent has to be clear and freely given, and it can be withdrawn at any time. Someone who is very drunk, or otherwise unable to make a clear choice, can’t give it.',
        'If someone says no, moves away or stops replying, respect that and leave them be. Coming to the same event, or matching on a crowd mix, is never an invitation to anything more.',
      ],
      bullets: [
        'Ask before physical contact, and take anything other than a clear yes as a no.',
        'Don’t follow someone, keep messaging them after they’ve stopped replying, or contact them on other platforms when they haven’t invited it.',
        'Don’t pressure anyone to drink, stay later, share their number or leave with you.',
        'Look out for each other. If someone seems uncomfortable or unable to look after themselves, tell the host.',
      ],
    },
    {
      heading: 'Zero tolerance for harassment, hate and threats',
      paragraphs: [
        'Reports of harassment are reviewed by our team. Confirmed violations can result in an account being suspended or permanently banned, and may be reported to local authorities where appropriate.',
        'This covers behaviour at events and in the app, including chats, profiles, event listings and reviews.',
      ],
      bullets: [
        'Sexual harassment, groping, unwanted advances and sexual comments.',
        'Threats, intimidation, stalking or violence of any kind.',
        'Hate speech or discrimination based on religion, caste, race, ethnicity, region, language, gender, sexual orientation, disability or any similar characteristic.',
        'Bullying, humiliation or abuse, including sending explicit content nobody asked for.',
        'Sharing someone’s private information, photos or messages to embarrass, expose or pressure them.',
      ],
    },
    {
      heading: 'Be real and honest',
      paragraphs: [
        'Every Gorave account is phone-verified, and Gorave is for people aged 18 and over. Your account must be yours, and your profile must be accurate.',
      ],
      bullets: [
        'Use your real date of birth. The app uses it to check that you’re 18+ and to apply any 21+ or 25+ age gate a host sets.',
        'Choose your gender honestly. It is set once during onboarding and can’t be changed afterwards, because crowd mixes such as women-only or 50:50 depend on it. If you picked the wrong option by mistake, write to support.',
        'Use photos of yourself and don’t pretend to be someone else.',
        'Hosts: don’t list fake events, events you don’t intend to run, or events that are different from what the listing says.',
        'Don’t use Gorave for spam, scams, selling or recruiting guests for something other than the event listed.',
        'Don’t create a new account to get around a block, a decline or an account action.',
      ],
    },
    {
      heading: 'At someone’s home',
      paragraphs: [
        'Most Gorave nights happen in a host’s home. Treat it with the same care you’d want for yours.',
        'The public listing shows only the area and an approximate spot on the map. The exact address is shared only with confirmed guests, because the host has trusted you with it.',
      ],
      bullets: [
        'Read the house rules before you join, and follow them on the night. If you can’t, don’t go.',
        'Keep the host’s address private. Don’t share it, post it or bring people who aren’t confirmed for the event.',
        'Respect the home, the neighbours and the building. Leave when the event ends, or earlier if the host asks.',
        'Ask before you photograph or film anyone, and ask again before you post it. If someone asks you not to take or share a photo of them, or to delete one, do it.',
        'Don’t photograph or post anything that would reveal the host’s exact address unless they’re happy for you to.',
      ],
    },
    {
      heading: 'Alcohol, substances and the law',
      paragraphs: [
        'You’re responsible for how you behave at every event you attend or host, and for following local laws: age restrictions, venue rules and anything else that applies.',
        'Laws on alcohol differ across India. The legal drinking age varies from state to state, and some states don’t allow alcohol at all. Follow the rules where the event is, and never give alcohol to anyone below the legal age there.',
      ],
      bullets: [
        'Illegal drugs have no place at a Gorave event. Don’t bring, use, sell or share them.',
        'Never spike or tamper with anyone’s drink or food.',
        'Drink responsibly, and don’t drive after drinking. Plan your ride home before you go.',
        'If someone needs medical help, call 112 straight away.',
      ],
    },
    {
      heading: 'Your safety tools are a backup, not a substitute',
      paragraphs: [
        'Emergency contacts and SOS exist to help you stay safe, but they don’t replace your own judgement. Tell someone you trust your plans, and trust your instincts. If you’re meeting someone from Gorave outside an event, meet somewhere public where you can.',
        'SOS sends an SMS with a map link to your current location to the emergency contacts you’ve added (up to 5). It alerts your contacts. It doesn’t call the police and it isn’t an emergency service. In an emergency in India, call 112.',
      ],
      bullets: [
        'Before you go, check the host’s profile, rating and reviews, and read the event details, crowd mix and house rules.',
        'Use Share Event Details on the event page to send the details to someone you trust.',
        'Add emergency contacts in Gorave Safety and keep location on for Gorave, so SOS can say where you are.',
        'If anything feels off, leave, and report it in the app.',
      ],
    },
    {
      heading: 'Report what you see',
      paragraphs: [
        'Use Report or Block in the app for any incident, big or small. If anyone is in immediate danger, contact local emergency services first by calling 112.',
        'You can report a person from their profile at any time, before, during or after an event. You can report an event from its page, and a message from your chat. Reports go to the Gorave team and you get a confirmation in the app.',
        'Blocking someone means neither of you can message the other, and neither of you can request to join the other’s free events. They’re also hidden from your search and suggestions. You can unblock people from Settings.',
        `If something serious happened, report it in the app and also write to ${E.email} with what happened, so we can follow up.`,
      ],
    },
    {
      heading: 'False reports are a violation too',
      paragraphs: [
        'Knowingly filing a false or malicious report against someone else is also a violation of these guidelines and can result in account action. That includes using a report to settle a personal dispute.',
        'Our goal is a safe community for everyone, including the person you report. If you’re unsure whether something counts, report it honestly and tell us what you saw. A genuine report that we can’t confirm is never held against you.',
      ],
    },
    {
      heading: 'What happens when the rules are broken',
      paragraphs: [
        'We review reports and decide what to do based on what happened, how serious it was and whether it has happened before. Depending on the case we may:',
      ],
      bullets: [
        'warn you about your behaviour;',
        'remove content such as a listing, photo, message or review, or cancel an event;',
        'remove your host privileges;',
        'suspend or lock your account, for a period or until we’ve looked into it;',
        'permanently ban you from Gorave;',
        'report the matter to the police or other authorities where appropriate, and cooperate with them where the law requires.',
      ],
    },
    {
      heading: 'Questions and appeals',
      paragraphs: [
        `If we’ve taken action on your account and you think we got it wrong, write to ${E.email} with your registered phone number, explain what happened and include anything that helps us look again. We’ll review it and let you know the outcome.`,
        `For complaints under India’s IT Rules, you can also contact the ${E.grievanceOfficer} at ${E.grievanceEmail}.`,
        'We may update these guidelines as Gorave grows. If we make a significant change, we’ll let you know in the app.',
        `Last updated ${E.updated}.`,
      ],
    },
  ],
}

export const LEGAL_HOST_AGREEMENT: LegalDoc = {
  slug: 'host-agreement',
  title: 'Host Agreement',
  line: `The extra responsibilities that come with hosting on ${E.name}, which every host signs in the app before their first event.`,
  short: [
    'You set the tone. You’re responsible for the safety and conduct of everyone at your event, not just your own.',
    'Confirmed harassment at your event, by you or by a guest you failed to act on, can cost you your host privileges and your account.',
    'You follow the laws and rules that apply to your event: age, capacity, noise, alcohol and your building or society.',
    'Your listing is accurate, your guests’ details stay private and paid events are paid only in the app, never in cash at the door.',
    'Gorave connects you with guests; it doesn’t supervise your event in person. You’re the one running it.',
  ],
  sections: [
    {
      heading: 'What you’re agreeing to',
      paragraphs: [
        'Before you can create your first event, the app asks you to read the Host Agreement and sign it with a drawn signature. This page is the full version of that agreement. It says the same things in more detail, and by signing in the app you agree to everything here.',
        'This agreement adds to, and doesn’t replace, our Terms of Service (/terms) and Community Guidelines (/guidelines). As a host you’re also a member of the community, so everything in the Community Guidelines applies to you as well. If anything here conflicts with the Terms of Service, the Terms of Service apply.',
      ],
    },
    {
      heading: 'You set the tone for your event',
      paragraphs: [
        'As a host, you’re responsible for the safety and conduct of everyone at your event, not just your own. Screen your guest list where you can, and step in if something feels wrong.',
      ],
      bullets: [
        'Be there, sober enough to look after things, for the whole event.',
        'Make your house rules clear in the listing and stick to them on the night.',
        'If a guest is making someone uncomfortable, act: talk to them, separate them, or ask them to leave.',
        'If anyone is in danger or needs medical help, call 112 first.',
        'Report serious incidents in the app, and write to us about them, as soon as you safely can.',
      ],
    },
    {
      heading: 'Zero tolerance for harassment',
      paragraphs: [
        'Confirmed harassment at an event you host, whether by you or by a guest you failed to act on, can result in your host privileges being revoked and your account suspended.',
        'Harassment has the same meaning as in the Community Guidelines. Serious cases can also lead to a permanent ban and, where appropriate, a report to the authorities.',
      ],
    },
    {
      heading: 'False reports are a violation too',
      paragraphs: [
        'Using a harassment report to settle a personal dispute, or knowingly filing one that’s false, is also a violation and can result in account action. That applies to reports about your guests, other hosts and anyone else on Gorave.',
      ],
    },
    {
      heading: 'Follow local laws',
      paragraphs: [
        'Age restrictions, capacity limits, noise ordinances, alcohol and venue rules: you’re responsible for knowing and following what applies to your event.',
      ],
      bullets: [
        'Age: every Gorave event is 18+. If you serve or allow alcohol, follow the legal drinking age and any other alcohol rules in your state, including any licence or permit they require.',
        'Capacity: don’t invite more people than your home can hold safely, even if the app would let you list more.',
        'Noise: respect local noise rules and the times they apply.',
        'Your building: follow your society, building or landlord rules, and get any permission you need before you host.',
        'Illegal drugs are not allowed at Gorave events.',
        'Anything else that applies to the kind of event you’re running, such as food safety or fire safety.',
      ],
    },
    {
      heading: 'Your listing must be accurate',
      paragraphs: [
        'Guests decide whether to come based on your listing, so it has to be true. Every event must be listed at least 24 hours before it starts, run from 1 hour to 3 days, and have room for 5 to 200 guests.',
      ],
      bullets: [
        'Title, description and type of night describe what will actually happen.',
        'The area and exact address are correct, and the address is where the event will be.',
        'The date, start and end times, capacity and ticket price are right.',
        'The crowd mix and age gate are the ones you intend to apply.',
        'Your house rules are written down in the listing, including anything guests should know before they come.',
        'Photos are yours, or ones you have the right to use, and show the event or space honestly.',
      ],
    },
    {
      heading: 'Choosing your guests',
      paragraphs: [
        'On free events, guests send a request and you accept or decline each one after seeing their profile. A guest can request the same event twice in total (one more chance after withdrawing), a decline is final for that event, and requests still pending when the event starts expire. Paid events book instantly, and when a paid event is full new guests can join a waitlist.',
        'On any event you can set a crowd mix (open to anyone, women-only, men-only, 50:50, 60:40 or another split in 10% steps) and an age gate of 21+ or 25+. On a split mix, 10% of seats stay open to anyone, and guests who chose Non-binary or Prefer not to say can take those open seats.',
        'Use the crowd mix and age gate tools the app gives you to shape your guest list. Beyond those, don’t accept or decline guests in a way that is unlawful or discriminatory, for example because of religion, caste, race, region, disability or sexual orientation.',
      ],
    },
    {
      heading: 'Keep your guests’ details private',
      paragraphs: [
        'You’ll see your guests’ profiles and your guest list. Use them only to run your event.',
      ],
      bullets: [
        'Don’t share your guest list, or anyone’s profile, photos or details, outside Gorave.',
        'Don’t use guests’ details to contact them for anything unrelated to your event, or add them to other lists without their agreement.',
        'Your own exact address is shown only to confirmed guests. Don’t publish it elsewhere in a way that gets around this.',
        'Ask before photographing or filming guests, and before posting anything that shows them.',
      ],
    },
    {
      heading: 'Running the door',
      paragraphs: [
        'Each confirmed guest has a QR ticket in the app. Scan it at the door with the scanner in your event. Check-in opens 3 hours before the event starts and stays open until it ends. If a code won’t scan, you can check the guest in by hand from your guest list.',
        'Only let in people who are confirmed for your event. Only checked-in guests can review your event afterwards, so check everyone in.',
      ],
    },
    {
      heading: 'Money and payouts',
      paragraphs: [
        'Listing on Gorave is free. You can run up to 2 free-entry events a month. Paid events start at ₹99 a ticket.',
        'For paid events, Gorave collects the full ticket price when guests book. You keep 90% of the ticket price and Gorave takes a 10% commission. Guests also pay a flat ₹50 platform fee on top of each paid ticket, so it never comes out of your share. Your share is transferred after the event to the UPI ID or bank account you added during host setup. One UPI ID or bank account can be linked to only one Gorave account.',
      ],
      bullets: [
        'Paid events are booked and paid for only in the app. Don’t ask for cash, extra payments or entry fees at the door, or take payment for a Gorave event outside the app.',
        'Free events must stay free: don’t charge guests for entry in any other way.',
        'You’re responsible for any income tax, GST or other taxes and registrations that apply to your earnings from hosting.',
        `If a payout hasn’t arrived, write to ${E.email} with the event name.`,
      ],
    },
    {
      heading: 'Changes and cancellations',
      paragraphs: [
        'Guests plan their night around your listing, so changes are limited once people have joined.',
      ],
      bullets: [
        'You can edit your event up to 7 hours before it starts, and guests who are going are notified.',
        'Once guests have joined, you can’t lower capacity or change the crowd mix or age gate. You can raise capacity until 2 hours before the start.',
        'You can cancel up to 48 hours before the event starts. Everyone going is notified, and paid guests get the ticket price back in their Gorave Wallet automatically, so there are no ticket earnings to pay out for that event.',
        'Inside 48 hours, cancelling is blocked in the app, so guests can count on the night happening. If an emergency means you truly can’t host, contact us straight away.',
        'If you want to delete your account, you’ll need to cancel your upcoming events first.',
      ],
    },
    {
      heading: 'It’s on you, not just Gorave',
      paragraphs: [
        'Gorave connects you with attendees; it doesn’t supervise your event in person. You’re the one running it.',
        'We provide the tools: listings, requests, crowd mix and age gates, tickets and check-in, reporting, blocking and SOS. We don’t inspect homes, check guests at the door or control what happens on the night.',
        'To keep the community safe, we may remove or change a listing, cancel an event (in which case paid guests are refunded), or revoke your host privileges where we believe this agreement, the Community Guidelines or the Terms of Service have been broken.',
      ],
    },
    {
      heading: 'Ending this agreement',
      paragraphs: [
        'You can stop hosting at any time by not listing new events, or by deleting your account once your upcoming events are cancelled.',
        'We can suspend or end your ability to host, or lock or close your account, if you break this agreement, the Community Guidelines or the Terms of Service, or if we need to for safety or legal reasons. If we lock your account, we’ll tell you why in the app.',
        'The parts of this agreement about events that have already happened, including payouts, taxes, privacy of guest details and reports, keep applying after hosting ends.',
      ],
    },
    {
      heading: 'Questions and appeals',
      paragraphs: [
        `If you have a question about hosting, or think an action on your listing or account was a mistake, write to ${E.email}. For complaints under India’s IT Rules, you can also contact the ${E.grievanceOfficer} at ${E.grievanceEmail}.`,
        'We may update this agreement as Gorave grows. If we make a significant change, we’ll let you know in the app and may ask you to sign again.',
        `Last updated ${E.updated}.`,
      ],
    },
  ],
}
