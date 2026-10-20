import type { HelpTopic } from './help'

// Help-centre answers. Every fact here was checked against the server
// (server/routes) and the client app; keep it that way when editing.
export const HELP_TOPICS_DATA: HelpTopic[] = [
  {
    slug: 'getting-started',
    title: 'Getting started',
    line: 'What Gorave is, who it’s for and how to find your first night.',
    group: 'Going out',
    questions: [
      {
        q: 'What is Gorave?',
        a: 'Gorave is an app for nights hosted by real people at home: house parties, rooftops, game nights, dinners and music nights. You find one near you, join it, and the host welcomes you in.',
      },
      {
        q: 'Who can use Gorave?',
        a: 'Anyone 18 or older with a phone number. You sign in with a one-time code sent to your phone, so every account is phone-verified.',
      },
      {
        q: 'How do I sign up?',
        a: 'Download the app, enter your phone number and type in the code we text you. Then add your name, date of birth, gender and a short bio, and you’re ready to look around.',
      },
      {
        q: 'Is it free to use?',
        a: 'Yes, the app is free. Free events cost nothing to join, and paid events show the ticket price plus a flat ₹50 platform fee before you pay.',
      },
      {
        q: 'How do I join my first event?',
        a: 'Open an event and tap to join. Free events are request-to-join, so the host accepts you first. Paid events book instantly once you pay.',
      },
      {
        q: 'Can I host as well as go out?',
        a: 'Yes, the same account does both. The first time you create an event, the app walks you through a short host setup.',
      },
    ],
  },
  {
    slug: 'account-and-verification',
    title: 'Account and verification',
    line: 'Phone verification, your profile, and changing or deleting your account.',
    group: 'Account',
    questions: [
      {
        q: 'How is my account verified?',
        a: 'With your phone number. You sign in with a one-time code sent by SMS, and your phone number is never shown on your profile.',
      },
      {
        q: 'Why do I need to give my date of birth?',
        a: 'Gorave is 18+ only, and some events have an age gate like 21+ or 25+. The app checks your age against each event before it lets you join.',
      },
      {
        q: 'Can I change my gender later?',
        a: 'No. Gender is set once during onboarding and can’t be changed afterwards, because events with a crowd mix (like women-only or 50:50) depend on it. If you picked the wrong option by mistake, write to support@gorave.in.',
      },
      {
        q: 'Can I change my name or username?',
        a: 'Yes, from Edit Profile. Your name can be changed once every 60 days, and your username up to 3 times a month.',
      },
      {
        q: 'Can I be signed in on two phones?',
        a: 'No. Gorave keeps one active session, so signing in on a new phone signs you out everywhere else.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings, then Delete Account, and follow the steps. If you’re hosting any upcoming events you’ll need to cancel them first. Changed your mind? Email support@gorave.in as soon as you can.',
      },
    ],
  },
  {
    slug: 'finding-events',
    title: 'Finding events',
    line: 'Browse the map, filter by night and type, and save the ones you like.',
    group: 'Going out',
    questions: [
      {
        q: 'How do I find events near me?',
        a: 'Open the Events tab. You can browse on a map or switch to a list, and search for an event by name.',
      },
      {
        q: 'Can I filter what I see?',
        a: 'Yes. Quick filters show free events, tonight, or this weekend, or one type of night: house party, rooftop, game night, dinner or music.',
      },
      {
        q: 'Why can’t I see the exact location?',
        a: 'Hosts open their homes, so the public listing shows only the area and an approximate spot on the map, about 1 km out. The exact address unlocks once you’re confirmed for the event.',
      },
      {
        q: 'Can I save an event for later?',
        a: 'Yes. Add it to your hotlist and you’ll find it again in Settings, under Hotlist.',
      },
      {
        q: 'How do I keep up with a host I liked?',
        a: 'Follow them from their profile. When they list a new event, you’ll get a notification.',
      },
      {
        q: 'What should I check before joining?',
        a: 'Read the description and house rules, the date and end time, the crowd mix and any age gate. Then look at the host’s profile, badge and reviews from past guests.',
      },
    ],
  },
  {
    slug: 'request-to-join',
    title: 'Request to join',
    line: 'How free events work, from sending a request to getting the address.',
    group: 'Going out',
    questions: [
      {
        q: 'Why do free events need a request?',
        a: 'So free spots can’t all be grabbed in one go. On free events the host sees your profile and accepts or declines each request.',
      },
      {
        q: 'What happens when the host accepts?',
        a: 'You get a notification, your spot is confirmed and your ticket appears in the app. The exact address unlocks at the same time.',
      },
      {
        q: 'Can I withdraw a request?',
        a: 'Yes, you can withdraw a pending request at any time from the event page. You can request the same event twice in total: your first request, and one more chance if you withdraw.',
      },
      {
        q: 'What if the host declines?',
        a: 'A decline is final for that event, and you can’t send the request again. It doesn’t affect any other event.',
      },
      {
        q: 'What if the host never answers?',
        a: 'Your request stays pending until the event starts. If it’s still unanswered then, it expires and you’ll be told.',
      },
      {
        q: 'The event is full. Can I still request?',
        a: 'Yes. Your request stays in the host’s list, and if a confirmed guest drops out, the host is told a spot has opened so they can review pending requests.',
      },
      {
        q: 'Why was my request blocked?',
        a: 'Usually because the event has a crowd mix or age gate you don’t fit, such as women-only or 25+. You also can’t request an event from someone you’ve blocked, or who has blocked you.',
      },
    ],
  },
  {
    slug: 'booking-and-payments',
    title: 'Booking and payments',
    line: 'Paying for tickets with UPI or your wallet, and what the fee covers.',
    group: 'Money',
    questions: [
      {
        q: 'How do paid events work?',
        a: 'Paid events book instantly. Choose your ticket, pay in the app, and your spot is confirmed straight away, with no host approval needed.',
      },
      {
        q: 'How much do tickets cost?',
        a: 'The host sets the price, and paid tickets start at ₹99. You’ll see the full breakdown before you pay.',
      },
      {
        q: 'What is the ₹50 platform fee?',
        a: 'A flat ₹50 added to each paid ticket at checkout. Free events have no fee.',
      },
      {
        q: 'How can I pay?',
        a: 'With UPI: open a UPI app on your phone, enter your UPI ID, or scan a QR code. You can also use your Gorave Wallet balance, on its own or together with UPI.',
      },
      {
        q: 'Do I pay cash at the door?',
        a: 'No. Paid events are booked and paid for in the app, so nothing changes hands at the door.',
      },
      {
        q: 'What if the last spot goes while I’m paying?',
        a: 'If someone else takes the last spot just before your payment goes through, the amount you paid by UPI is put in your Gorave Wallet. Any wallet balance you chose to use isn’t taken.',
      },
      {
        q: 'My payment failed but money left my account. What now?',
        a: 'Follow the message shown in the app after the failed payment. If the money doesn’t come back, write to support@gorave.in with your registered phone number and the event name.',
      },
    ],
  },
  {
    slug: 'gorave-wallet',
    title: 'Gorave Wallet',
    line: 'Where refunds land, how to spend them and how long they last.',
    group: 'Money',
    questions: [
      {
        q: 'What is the Gorave Wallet?',
        a: 'Your in-app balance. Refunds, for example when a host cancels an event you paid for, go straight into it.',
      },
      {
        q: 'Where do I find it?',
        a: 'In Settings, under Gorave Wallet. It shows your balance and your recent wallet transactions.',
      },
      {
        q: 'How do I use my balance?',
        a: 'When you book a paid event, switch on Gorave Wallet at checkout. If your balance covers the whole amount you pay with the wallet alone, otherwise you pay the rest with UPI.',
      },
      {
        q: 'Does wallet credit expire?',
        a: 'Yes. Credits expire 6 months from the date you got them, and each credit shows its expiry date in your wallet.',
      },
      {
        q: 'Can I move my wallet balance to my bank?',
        a: 'Yes, through support. In the app, go to Support, choose “Wallet refund to bank” and include your registered phone number and the event you were refunded for. These transfers are processed by hand, and the support screen shows how long they usually take.',
      },
      {
        q: 'Can I add money to my wallet?',
        a: 'No. The wallet only holds credit from refunds, and you can’t top it up yourself.',
      },
    ],
  },
  {
    slug: 'tickets-and-check-in',
    title: 'Tickets and check-in',
    line: 'Your QR ticket, getting in at the door and finding your tickets.',
    group: 'Going out',
    questions: [
      {
        q: 'Where is my ticket?',
        a: 'In the app, on the event page once you’re confirmed. That’s straight after you pay for a paid event, or when the host accepts your request for a free one.',
      },
      {
        q: 'How does check-in work?',
        a: 'Your ticket is a QR code. Show it at the door and the host scans it in the app, and you’ll get a notification once you’re checked in.',
      },
      {
        q: 'When does check-in open?',
        a: 'Three hours before the event starts, and it stays open until the event ends.',
      },
      {
        q: 'My QR won’t scan. What can I do?',
        a: 'Turn your screen brightness up and try again. If it still won’t scan, the host can check you in by hand from their guest list.',
      },
      {
        q: 'Why should I get checked in?',
        a: 'Only checked-in guests can review the event afterwards, so your rating counts towards the host’s profile.',
      },
    ],
  },
  {
    slug: 'cancellations-and-refunds',
    title: 'Cancellations and refunds',
    line: 'What happens when plans change, on your side or the host’s.',
    group: 'Money',
    questions: [
      {
        q: 'Can I cancel my spot at a free event?',
        a: 'Yes. Cancel from the event page and your spot goes back to the host, who can fill it from pending requests.',
      },
      {
        q: 'Can I cancel a paid ticket?',
        a: 'Paid tickets can’t be cancelled in the app once booked. If something has gone wrong, write to support@gorave.in with the event name.',
      },
      {
        q: 'What happens if the host cancels?',
        a: 'Everyone going is notified, and anyone who paid gets the ticket price back in their Gorave Wallet automatically. You don’t need to ask for it.',
      },
      {
        q: 'How late can a host cancel?',
        a: 'Up to 48 hours before the event starts. Inside 48 hours, hosts can’t cancel in the app, so guests can count on the night happening.',
      },
      {
        q: 'Where does my refund go?',
        a: 'To your Gorave Wallet, where you can spend it on another event. To move it to your bank, contact support from the app.',
      },
      {
        q: 'What if I’m on the waitlist and the event is cancelled?',
        a: 'You’re told the event was cancelled and taken off the waitlist. Nothing was charged, so there’s nothing to refund.',
      },
    ],
  },
  {
    slug: 'address-and-privacy',
    title: 'Address and privacy',
    line: 'Who sees the exact address, and what others can see about you.',
    group: 'Safety',
    questions: [
      {
        q: 'Who can see the exact address?',
        a: 'Only the host and confirmed guests. Everyone else sees the area and city, and an approximate spot on the map about 1 km out.',
      },
      {
        q: 'When does the address unlock for me?',
        a: 'As soon as you’re confirmed: when you book a paid ticket, or when the host accepts your request for a free event.',
      },
      {
        q: 'I’m on the waitlist. Can I see the address?',
        a: 'Not yet. It unlocks once you’ve confirmed a spot.',
      },
      {
        q: 'Is my phone number shown to anyone?',
        a: 'No. Other people see your profile, photos and interests, but never your phone number.',
      },
      {
        q: 'Can I tell someone where I’ll be?',
        a: 'Yes. On an upcoming event’s page, use Share Event Details in the Your Safety section to send the event’s details to someone you trust.',
      },
      {
        q: 'I’m a host. Who sees my flat number?',
        a: 'Only guests who are confirmed for your event. Your listing shows just the area, and the flat, building and pin code stay hidden until then.',
      },
    ],
  },
  {
    slug: 'crowd-mix-and-age',
    title: 'Crowd mix and age',
    line: 'Women-only, 50:50 and other mixes, and age gates like 21+.',
    group: 'Going out',
    questions: [
      {
        q: 'What is a crowd mix?',
        a: 'A host’s choice about who fills the room: open to anyone, women-only, men-only, 50:50, 60:40 or another split in 10% steps. Seats fill to the mix the host chose.',
      },
      {
        q: 'How do split mixes work?',
        a: 'On a split like 50:50, most seats are shared between women and men by the chosen ratio, and 10% of seats stay open to anyone.',
      },
      {
        q: 'Why does it say spots for my group are full?',
        a: 'Your share of the mix has filled up, even if the event still has other spots. On paid events you can join the waitlist in case one opens.',
      },
      {
        q: 'I chose Non-binary or Prefer not to say. Which spots can I take?',
        a: 'On a split mix you can take one of the open spots. Women-only and men-only events are limited to that group.',
      },
      {
        q: 'What is an age gate?',
        a: 'Hosts can make an event 21+ or 25+. Every event is at least 18+, and the app checks your date of birth before you can join.',
      },
      {
        q: 'Can a host change the mix after I’ve joined?',
        a: 'No. Once guests have joined, the crowd mix and age gate are locked.',
      },
    ],
  },
  {
    slug: 'safety-and-sos',
    title: 'Safety and SOS',
    line: 'Emergency contacts, the SOS alert and what to do if you need help.',
    group: 'Safety',
    questions: [
      {
        q: 'What does SOS do?',
        a: 'It sends an SMS to every emergency contact you’ve added, saying you may need help, with a map link to your current location. Your contacts don’t need the app to get it.',
      },
      {
        q: 'Where is the SOS button?',
        a: 'On the event page, in the Your Safety section, for any event that hasn’t ended yet. While an event you’re going to is on, it also shows on that event’s card on your home screen.',
      },
      {
        q: 'How many emergency contacts can I add?',
        a: 'Up to 5. Add them in Gorave Safety, from your phone’s contacts or by typing in a number. You need at least one before SOS will work.',
      },
      {
        q: 'Does SOS need my location?',
        a: 'Yes. Turn on location for Gorave so the alert can include where you are. If location is off, the app will ask you to turn it on.',
      },
      {
        q: 'Does SOS call the police?',
        a: 'No, it alerts your own contacts. In an emergency in India, call 112.',
      },
      {
        q: 'Can I send SOS more than once?',
        a: 'Yes, a few times. If it was sent several times recently, the app will tell you to call for help directly.',
      },
      {
        q: 'What else can I do to stay safe?',
        a: 'Check the host’s rating and reviews, share the event details with a friend, and plan your ride home. If anything feels off, leave and report it in the app.',
      },
    ],
  },
  {
    slug: 'reporting-and-blocking',
    title: 'Reporting and blocking',
    line: 'How to flag a person or an event, and what blocking does.',
    group: 'Safety',
    questions: [
      {
        q: 'How do I report someone?',
        a: 'Open their profile and choose Report. You can report a person at any time, before, during or after an event.',
      },
      {
        q: 'How do I report an event?',
        a: 'Open the event and choose Report. Pick a reason such as fake or scam, inappropriate content, misleading information, spam or dangerous activity, and add details if you like.',
      },
      {
        q: 'What happens after I report?',
        a: 'The Gorave team gets your report and you get a confirmation in the app. You can report a given event once.',
      },
      {
        q: 'How do I block someone?',
        a: 'Choose Block from their profile, or from your chat with them.',
      },
      {
        q: 'What does blocking do?',
        a: 'Neither of you can message the other, and neither of you can request to join the other’s free events. They’re also hidden from your search and suggestions.',
      },
      {
        q: 'Can I unblock someone?',
        a: 'Yes. Go to Settings, then Blocked, to see everyone you’ve blocked and unblock them.',
      },
      {
        q: 'Something serious happened. What should I do?',
        a: 'If you’re in danger, call 112 first. Then report the person or event in the app, and write to support@gorave.in with what happened.',
      },
    ],
  },
  {
    slug: 'ratings-and-badges',
    title: 'Ratings and badges',
    line: 'Reviewing nights you went to, and what host badges mean.',
    group: 'Account',
    questions: [
      {
        q: 'Who can review an event?',
        a: 'Guests who were checked in at the door. You can leave one review per event after it has started.',
      },
      {
        q: 'What goes in a review?',
        a: 'A rating from 1 to 5 stars and, if you like, a few words about the night.',
      },
      {
        q: 'Where do reviews show up?',
        a: 'On the event and on the host’s profile, which shows their average rating across past events.',
      },
      {
        q: 'What are host badges?',
        a: 'Badges show how many events someone has hosted: Rising at 2, Established at 10, Elite at 25 and Legend at 75.',
      },
      {
        q: 'Do cancelled events count towards a badge?',
        a: 'No. Only events that weren’t cancelled count, and the host is notified when they reach a new badge.',
      },
      {
        q: 'Is a host with no badge a red flag?',
        a: 'Not at all. Everyone starts somewhere. Read the event details and their profile, and decide for yourself.',
      },
    ],
  },
  {
    slug: 'hosting-an-event',
    title: 'Hosting an event',
    line: 'Setting up as a host, listing a night and running the door.',
    group: 'Hosting',
    questions: [
      {
        q: 'How do I start hosting?',
        a: 'Tap to create an event. The first time, a short setup explains how hosting works, asks you to sign the host agreement and add a UPI ID or bank account for payouts.',
      },
      {
        q: 'Does it cost anything to list?',
        a: 'No, listing is free. You can run up to 2 free-entry events a month, and paid events start at ₹99 a ticket.',
      },
      {
        q: 'How far ahead do I need to list?',
        a: 'At least 24 hours before the start. An event can run from 1 hour up to 3 days, for 5 to 200 guests.',
      },
      {
        q: 'How do I choose who comes?',
        a: 'On free events, guests send requests and you accept or decline each one after seeing their profile. Paid events book instantly, and on any event you can set a crowd mix and an age gate.',
      },
      {
        q: 'What happens when my event fills up?',
        a: 'On paid events, new guests can join a waitlist. If a spot opens, the next person in line gets an hour to confirm it, and you can also admit people from the waitlist yourself.',
      },
      {
        q: 'Can I edit my event after it’s live?',
        a: 'Yes, up to 7 hours before the start, and guests who are going are notified. Once guests have joined you can’t lower capacity or change the crowd mix or age gate, and you can raise capacity until 2 hours before.',
      },
      {
        q: 'How do I check guests in?',
        a: 'Open your event and use the scanner to scan each guest’s QR ticket at the door. Check-in opens 3 hours before the start, and you can check someone in by hand if their code won’t scan.',
      },
      {
        q: 'Can I cancel my event?',
        a: 'Yes, up to 48 hours before the start. Everyone is notified and paid guests are refunded to their Gorave Wallet automatically. Inside 48 hours, cancelling is blocked.',
      },
    ],
  },
  {
    slug: 'host-payouts',
    title: 'Host payouts',
    line: 'What you earn on paid events and how it reaches you.',
    group: 'Hosting',
    questions: [
      {
        q: 'How much do I keep?',
        a: 'You keep 90% of the ticket price, and Gorave takes a 10% commission. The ₹50 platform fee is paid by guests on top, so it never comes out of your share.',
      },
      {
        q: 'Where do my payouts go?',
        a: 'To the UPI ID or bank account you added during host setup. You can check which one is saved in Settings, under Payout Details.',
      },
      {
        q: 'When do I get paid?',
        a: 'Gorave collects the full ticket price when guests book and transfers your share after the event. If a payout hasn’t arrived, write to support@gorave.in with the event name.',
      },
      {
        q: 'Can I link the same UPI ID to two accounts?',
        a: 'No. One UPI ID or bank account can be linked to only one Gorave account, and your details are stored encrypted.',
      },
      {
        q: 'Do I earn anything from free events?',
        a: 'No. Free events have no ticket and no fee, and you can run up to 2 of them a month.',
      },
      {
        q: 'What happens to my earnings if I cancel?',
        a: 'Paid guests are refunded to their Gorave Wallet, so there are no ticket earnings to pay out for that event.',
      },
    ],
  },
]
