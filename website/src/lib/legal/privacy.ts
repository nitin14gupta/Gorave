import type { LegalDoc } from './entity'
import { LEGAL_ENTITY as E } from './entity'

// Written against what the server and app actually collect (server/queries.sql,
// server/routes/*, server/utils/*, client/app.json, client/src). If a flow
// changes there, change it here too.

export const LEGAL_PRIVACY: LegalDoc = {
  slug: 'privacy',
  title: 'Privacy Policy',
  line: 'What Gorave collects, why, who sees it, and how to get it corrected or deleted.',
  short: [
    'We collect what it takes to run house parties safely: your phone number, profile, the events you host or join, your messages and your payments.',
    'An event’s exact address goes only to its host and confirmed guests. Everyone else sees the area, the city and a rough pin.',
    'We don’t sell your data or show you ads. We share it only with the services that keep Gorave running, such as SMS, payments, storage and notifications.',
    'You can see, fix or delete your data. Deleting your account gives you 30 days to change your mind, then it’s gone for good.',
  ],
  sections: [
    {
      heading: 'Who we are and what this covers',
      paragraphs: [
        `${E.name} (“we”, “us”) runs the Gorave app and gorave.in, where people host house parties and other events at home and adults join them. This policy explains how we handle your personal data when you use the app, the website or contact us.`,
        `For the purposes of India’s Digital Personal Data Protection Act, 2023, ${E.name} is the data fiduciary for the data described here. If you have a question at any point, write to ${E.email}.`,
      ],
    },
    {
      heading: 'What you give us',
      paragraphs: [
        'Most of what we hold, you type, pick or upload yourself.',
      ],
      bullets: [
        'Account: your mobile number and country code, used to sign you in with a one-time code.',
        'Profile: name, username, date of birth (to check you’re 18 or over and to show your age), gender, bio, city, interests, badges, profile photos and an optional voice intro.',
        'Hosting: event details such as title, description, house rules, date and time, price, capacity, crowd mix, cover photos, and the full address (flat or house, building, area, city, pincode and a map pin at the entrance).',
        'Host onboarding: your acceptance of the Host Agreement with a time stamp and the signature you draw, plus payout details (a UPI ID, or bank account holder name, account number, IFSC and bank name).',
        'Joining events: your RSVPs, join requests, waitlist places, tickets and check-ins, events you save, and your acceptance of the community safety agreement.',
        'Social: who you follow, vibe requests you send or receive, and people you block.',
        'Messages: chats with people you’ve connected with, including text, photos, videos, voice notes, GIFs, shared events and profiles, reactions, edits and unsent messages.',
        'Reviews and reports: ratings and written reviews of events, and reports you make about people, events or messages.',
        'Safety Center: the name and phone number of up to 5 emergency contacts you choose.',
        'Payments: saved UPI IDs you choose to keep for checkout, and your wallet balance and history.',
        'Support: feedback and support requests you send us.',
      ],
    },
    {
      heading: 'What we collect as you use Gorave',
      paragraphs: [
        'Some data comes from your device or from how you use the app. You control the device permissions in your phone’s settings, and Gorave still works without most of them.',
      ],
      bullets: [
        'Location: if you allow it, the app reads your location while it’s open to detect your city and show nearby events and how far away they are. We keep your latest location on your account, not a history of where you’ve been.',
        'SOS: if you press SOS, the app sends your current location to our servers once, so we can text it to your emergency contacts.',
        'Contacts: if you allow it, the app reads your address book on your phone only to let you pick emergency contacts. Only the contacts you pick are sent to us.',
        'Camera, photos and microphone: used only when you scan a ticket, choose a photo or record a voice note or intro.',
        'Notifications: a push token for your device and your platform (iOS or Android), plus your notification settings.',
        'Activity: when you were last active in the app, and records of notifications we’ve sent you.',
        'Security: your IP address and phone number are used briefly to limit repeated sign-in attempts and other abuse.',
        'Diagnostics: crash reports and performance data, which can include your device model, operating system, IP address, account ID and a short recording of app screens around an error.',
      ],
    },
    {
      heading: 'Why we use your data',
      paragraphs: [
        'We use your data only for these purposes, on the basis of the consent you give when you sign up and use each feature, or where the law allows or requires it.',
      ],
      bullets: [
        'To create your account, sign you in and keep it secure.',
        'To keep Gorave adults only, by checking your age from your date of birth.',
        'To show you events, hosts and people near you, and to let you host, join, chat and review.',
        'To give hosts what they need to run a night: the guest list, join requests and check-in.',
        'To apply a host’s crowd mix, using the gender on your profile to decide which seats you can take.',
        'To take payments, run your wallet, give refunds and pay hosts.',
        'To send you texts, push notifications and in-app updates you’ve asked for, such as reminders, requests and payouts.',
        'To keep people safe: SOS alerts, reviewing reports, blocking, and acting on breaches of our rules.',
        'To check that your main profile photo shows a face. This automated check runs on our own servers and we don’t keep a face template.',
        'To find and fix bugs, and to understand how Gorave is used so we can improve it.',
        'To meet legal obligations, respond to lawful requests and resolve disputes.',
      ],
    },
    {
      heading: 'What other people can see',
      paragraphs: [
        'Gorave is social, so parts of your profile are visible to other members. Your phone number, date of birth and exact location are not shown on your profile.',
        'Exact event addresses are private. Until someone is a confirmed guest, they see only the area and city and a map pin rounded to about 1 km. The host and confirmed guests see the full address.',
      ],
      bullets: [
        'Other members can see your name, username, photos, age, gender, bio, city, interests, badges, voice intro, follower counts, the events you’re attending or hosting, and your reviews as a host.',
        'Members can see who is going to an event (name, username and photo). Hosts also see the gender and city of their guests and their check-in status.',
        'On gorave.in, anyone can see published events (with the area, city and rounded pin only, never the address), guest numbers as counts, and the public page of anyone who has hosted: their name, username, photo, city, ratings and upcoming events.',
        'Written reviews may appear on gorave.in with the reviewer’s first name and last initial only.',
        'People you message see what you send them. Blocking someone hides you from each other.',
      ],
    },
    {
      heading: 'Who we share it with',
      paragraphs: [
        'We don’t sell your personal data and we don’t share it for advertising. We share it only with the providers below, who process it for us under contract, and only as much as each one needs.',
      ],
      bullets: [
        'Twilio (SMS): your phone number, to send sign-in codes, and your emergency contacts’ numbers with the SOS message and your location link.',
        'Razorpay (payments): your phone number, the amount and order references when you pay. Card, UPI and bank details you enter at checkout are handled by Razorpay, and we don’t store card details.',
        'Cloudflare R2 (file storage): your photos, voice notes, event covers, chat media and Host Agreement signature.',
        'Expo, Apple and Google (push notifications): your device push token and the content of each notification.',
        'Google Maps and your phone’s map and location services: to show maps and turn a location into a city name.',
        'Sentry (crash reporting): the diagnostics data described above.',
        'Cloud hosting and database providers that run our servers.',
        'Hosts and guests: when you join an event, the host sees your profile and booking details; when you host, confirmed guests see your address.',
        'Authorities: where the law requires it, for example a valid order from a court or police, or where it’s needed to protect someone’s safety.',
      ],
    },
    {
      heading: 'Payments and payout details',
      paragraphs: [
        'We keep a record of your orders, payment status, wallet credits and refunds so we can run bookings, refunds and payouts and meet our accounting obligations.',
        'Payout details are protected more strictly. Your UPI ID, account number and account holder name are encrypted before we store them, and the app only ever shows them back to you masked. We also keep a one-way fingerprint of them so the same account can’t be linked to two Gorave accounts.',
      ],
    },
    {
      heading: 'Your choices and consent',
      paragraphs: [
        'You can withdraw consent for an optional feature at any time, and it won’t affect what we did before. Some data, like your phone number and age, is needed to run your account at all, so the way to withdraw that is to delete your account.',
      ],
      bullets: [
        'Turn location, contacts, camera, photos, microphone or notifications off in your phone’s settings.',
        'Choose which kinds of push notifications you get in Settings. Account security notices are always sent.',
        'Edit your profile, remove photos, and add or remove emergency contacts in the app.',
        'Update your payout details, or write to us to remove a saved UPI ID.',
      ],
    },
    {
      heading: 'Your rights',
      paragraphs: [
        `Under Indian law you can ask us for a summary of the personal data we hold about you and how we use it, ask us to correct, complete or update it, ask us to erase it, and nominate someone to exercise these rights if you die or become unable to. Email ${E.email} from the phone number on your account or tell us your username so we can verify it’s you.`,
        'Some things we may need to keep even after a request, for example where the law requires it, to resolve a dispute or to deal with a safety report. If so, we’ll tell you.',
      ],
    },
    {
      heading: 'Deleting your account and how long we keep data',
      paragraphs: [
        'You can delete your account in the app. If you’re hosting an upcoming event, you’ll need to cancel it first so guests get their refunds. Deleting cancels your own bookings, removes your name, bio and voice intro from view, clears pending vibe requests and signs you out everywhere.',
        `You then have 30 days to change your mind by writing to ${E.email}. After that, your account is permanently deleted, including your profile, photos, voice intro, messages, follows, bookings and wallet history. Past events you hosted stay listed under “Deleted user” so guests’ history and reviews still make sense.`,
        'Otherwise we keep your data while your account is active and for as long as needed for the purposes above, or longer where the law requires it. Our payment partner keeps its own transaction records under its legal obligations.',
      ],
    },
    {
      heading: 'Keeping it secure',
      paragraphs: [
        'We use encrypted connections between the app and our servers, sign-in by one-time code, hashed session tokens, encryption of payout details, access controls for our staff, and an audit log of admin actions. Only authorised team members can see account data, and only when they need to, for example to handle a report or a support request.',
        'No system is perfectly secure. If a breach affects your personal data, we’ll tell you and the Data Protection Board of India as the law requires.',
      ],
    },
    {
      heading: 'Where your data is processed',
      paragraphs: [
        'Gorave is built for India, but some of our providers process data outside India, for example our crash reporting provider in the European Union. Where data leaves India, we rely on providers that protect it to a standard consistent with this policy and with Indian law, and we won’t transfer it anywhere the Government of India has restricted.',
      ],
    },
    {
      heading: 'Adults only',
      paragraphs: [
        'Gorave is only for people aged 18 or over. We check your age from your date of birth when you sign up and don’t let anyone younger create a profile. If we learn that someone under 18 has an account, we’ll delete it. If you think that’s happened, please tell us.',
      ],
    },
    {
      heading: 'Changes, contact and grievances',
      paragraphs: [
        'We’ll update this policy when the way Gorave works changes. If a change matters, we’ll tell you in the app before it takes effect. The date at the top shows when it last changed.',
        `For anything about your privacy, write to ${E.email}. If you have a complaint, contact our ${E.grievanceOfficer} at ${E.grievanceEmail}. We’ll acknowledge it within 24 hours and aim to resolve it within 15 days. If you’re not satisfied with our answer, you can complain to the Data Protection Board of India.`,
      ],
    },
  ],
}
