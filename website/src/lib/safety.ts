import { BRAND } from '@/constants'

// Content for /safety. Everything here describes what the app actually does
// no stats, no guarantees. Both page variants read from this one file, and
// it's plain data (no functions) so client sections can take it as props.

export type Stage = 'before' | 'during' | 'after'

export interface SafetyFeature {
  key: string
  stage: Stage
  /** Short label, e.g. "Verified guests" */
  title: string
  /** One line for chips and layer labels */
  short: string
  body: string
}

export const SAFETY_FEATURES: SafetyFeature[] = [
  {
    key: 'verified',
    stage: 'before',
    title: 'Verified guests',
    short: 'Phone-verified, 18+ only',
    body: 'Every account is verified with a phone number, and Gorave is 18+ only. Gender is set once at onboarding and can’t be changed later. That’s what makes a crowd mix mean something.',
  },
  {
    key: 'request',
    stage: 'before',
    title: 'Request to join',
    short: 'Hosts see who’s asking',
    body: 'Free events are request-to-join. The host sees your profile before accepting, and someone who’s declined can’t send the request again.',
  },
  {
    key: 'mix',
    stage: 'before',
    title: 'Crowd mix & age gate',
    short: 'Women-only, 50:50, 21+',
    body: 'Hosts can set the room: women-only, 50:50, 60:40 and more, plus an age gate like 21+ or 25+. Seats fill to the mix the host chose.',
  },
  {
    key: 'address',
    stage: 'before',
    title: 'Private address',
    short: 'Area only, until you’re in',
    body: 'Publicly an event shows only the area and an approximate circle on the map, about 1 km wide. The exact address and flat number unlock once you’re confirmed.',
  },
  {
    key: 'payments',
    stage: 'before',
    title: 'In-app payments',
    short: 'UPI or wallet, no cash at the door',
    body: 'Paid events are booked in the app with UPI or your Gorave wallet, so there’s no cash changing hands at the door. Cancellations and refunds follow the refund policy.',
  },
  {
    key: 'qr',
    stage: 'during',
    title: 'QR check-in',
    short: 'Only confirmed guests get in',
    body: 'Your ticket is a QR code. The host scans it at the door, so the people inside are the people who were confirmed.',
  },
  {
    key: 'sos',
    stage: 'during',
    title: 'One-tap SOS',
    short: 'Live location to 5 contacts',
    body: 'One tap shares your live location with up to 5 emergency contacts you choose, and it keeps sharing even when the app is in the background.',
  },
  {
    key: 'reviews',
    stage: 'after',
    title: 'Reviews & host badges',
    short: 'Rated by real guests',
    body: 'Guests rate every event. Before you go, check the host’s rating and badge: Rising, Established, Elite or Legend.',
  },
  {
    key: 'report',
    stage: 'after',
    title: 'Report or block',
    short: 'From any profile or event',
    body: 'If something feels off, report or block the user or the event in the app. You don’t need to wait until the night is over.',
  },
]

export const STAGES: { key: Stage; label: string; line: string }[] = [
  { key: 'before', label: 'Before', line: 'Who gets in, and what they can see.' },
  { key: 'during', label: 'During', line: 'At the door, and if you need help.' },
  { key: 'after', label: 'After', line: 'What you leave behind for the next guest.' },
]

/** The six layers the noir variant stacks, a curated subset, in order of the night. */
export const TRUST_LAYERS = ['verified', 'request', 'mix', 'address', 'qr', 'sos'].map(
  k => SAFETY_FEATURES.find(f => f.key === k)!,
)

export const HOST_BADGES = [
  { key: 'rising', label: 'Rising', src: BRAND.badges.rising, line: 'New and getting good reviews' },
  { key: 'established', label: 'Established', src: BRAND.badges.established, line: 'A steady track record' },
  { key: 'elite', label: 'Elite', src: BRAND.badges.elite, line: 'Consistently loved nights' },
  { key: 'legend', label: 'Legend', src: BRAND.badges.legend, line: 'The ones people plan around' },
] as const

/** Crowd-mix presets for the demos. Women share 0–1; null means no quota. */
export const CROWD_MIXES: { key: string; label: string; women: number | null; note: string }[] = [
  { key: 'women', label: 'Women only', women: 1, note: 'Only women can request or book.' },
  { key: '5050', label: '50:50', women: 0.5, note: 'Half the seats for women, half for men.' },
  { key: '6040', label: '60:40', women: 0.6, note: 'More seats held for women.' },
  { key: 'open', label: 'Open', women: null, note: 'No quota. The host still approves free requests.' },
]

export const AGE_GATES = ['18+', '21+', '25+'] as const

/** Demo contacts for the SOS demos, illustrative names, nothing is sent. */
export const SOS_CONTACTS = [
  { name: 'Maa', rel: 'Mum' },
  { name: 'Aisha', rel: 'Best friend' },
  { name: 'Rohan', rel: 'Brother' },
  { name: 'Neha', rel: 'Flatmate' },
  { name: 'Dev', rel: 'Friend' },
]

/** The sample event both address demos use. */
export const DEMO_EVENT = {
  title: 'Sunset Rooftop Sessions',
  area: 'Bandra West, Mumbai',
  when: 'Sat · 6 PM',
  address: 'Terrace, Sea Breeze Apts',
  flat: 'Flat 1402, 14th floor',
  street: 'Carter Rd, Bandra West',
}

/** Request cards for the host-side demo. Illustrative profiles. */
export const DEMO_REQUESTS = [
  { name: 'Riya', age: 24, gender: 'Woman', note: 'Came to 3 events · rated 4.8 by hosts', mutuals: 3 },
  { name: 'Kabir', age: 27, gender: 'Man', note: 'Came to 6 events · rated 4.9 by hosts', mutuals: 1 },
  { name: 'Meera', age: 22, gender: 'Woman', note: 'First event, new to the city', mutuals: 0 },
  { name: 'Arjun', age: 29, gender: 'Man', note: 'Came to 2 events', mutuals: 2 },
]

export interface Tip {
  title: string
  body: string
}

export const GUEST_TIPS: Tip[] = [
  { title: 'Tell a friend', body: 'Share the event and your plans with someone who isn’t going. Add them as an SOS contact while you’re at it.' },
  { title: 'Check the host first', body: 'Look at their rating, badge and past events before you request. A new host isn’t a red flag. Just read the details.' },
  { title: 'Meet in the area first', body: 'Going with someone new? Meet at a café nearby and walk over together.' },
  { title: 'Keep your own drink', body: 'Pour it yourself, keep it with you, and get a fresh one if you lose track of it.' },
  { title: 'Plan the ride home', body: 'Know how you’re getting back before you go. Keep your phone charged.' },
  { title: 'Leave when you want', body: 'You never owe anyone a reason. If it feels off, leave and report it in the app.' },
]

export const HOST_TIPS: Tip[] = [
  { title: 'Write clear house rules', body: 'BYOB or not, smoking, plus-ones, end time. Guests decide better when they know.' },
  { title: 'Read every request', body: 'Free events are request-to-join for a reason. Accept who fits the room you’re making.' },
  { title: 'Set the mix and age gate', body: 'Women-only, 50:50, 21+: choose what makes your night comfortable.' },
  { title: 'Scan every ticket', body: 'Check guests in with their QR at the door, so everyone inside was confirmed.' },
  { title: 'Have a co-host', body: 'Two people running the door and the room is easier than one.' },
  { title: 'Report problems', body: 'If a guest crosses a line, report or block them in the app.' },
]

export const SAFETY_FAQ = [
  {
    q: 'Who can join Gorave?',
    a: 'Anyone 18 or older with a phone number. Every account is phone-verified when it’s created. Gender is set once during onboarding and can’t be changed later, so crowd-mix settings stay meaningful.',
  },
  {
    q: 'When do I see the exact address?',
    a: 'Once you’re confirmed: when a host accepts your request for a free event, or when you book a paid one. Until then you see the area and an approximate circle on the map, roughly 1 km wide.',
  },
  {
    q: 'How does SOS work?',
    a: 'One tap shares your live location with up to 5 emergency contacts you’ve added. It keeps sharing even if the app is in the background. Add your contacts before your first event so it’s ready.',
  },
  {
    q: 'Can I go to women-only events?',
    a: 'Yes. Hosts can make an event women-only, or set a mix like 50:50 or 60:40, and an age gate like 21+ or 25+. The app fills seats to the mix the host chose.',
  },
  {
    q: 'What happens if a host declines my request?',
    a: 'Nothing awkward. You just won’t get the address. A declined request can’t be sent again for that event, which keeps hosts from being pestered.',
  },
  {
    q: 'How do I report someone?',
    a: 'Report or block any user or event from inside the app. The community guidelines spell out what isn’t okay on Gorave.',
  },
  {
    q: 'Do I pay cash at the door?',
    a: 'No. Paid events are booked in the app with UPI or your Gorave wallet. Cancellations and refunds follow our refund policy.',
  },
]

export const SAFETY_LINKS = { guidelines: '/guidelines', refunds: '/refunds' }
