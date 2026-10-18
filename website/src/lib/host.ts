import { BRAND } from '@/constants'

// Host page content. Everything here mirrors the app's real rules, fees,
// free-event limit, crowd-mix quotas and badge tiers. Names in the demos are
// illustrative UI, never presented as real hosts or real numbers.

export const HOST_CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Host', href: '/host' },
]

export const HOST_FEES = {
  /** Lowest ticket price on a paid event */
  minTicket: 99,
  /** Highest value on the example calculator (not a product limit) */
  calcMaxTicket: 2000,
  /** Share of the ticket price the host keeps */
  hostShare: 0.9,
  /** Flat fee the guest pays on top of the ticket */
  platformFee: 50,
  /** Free-entry events a host can run per month */
  freePerMonth: 2,
} as const

/** Host's take for an example night, ticket × guests × 90%. */
export const hostEarnings = (ticket: number, guests: number) => Math.round(ticket * guests * HOST_FEES.hostShare)

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/** The app's real invite templates (see templateImage). */
export const HOST_TEMPLATES = ['houseparty', 'retro', 'nightout', 'beack', 'halloween', 'christmas'] as const

export type BadgeKey = keyof typeof BRAND.badges

export const BADGE_TIERS: { key: BadgeKey; name: string; at: number; line: string }[] = [
  { key: 'rising', name: 'Rising', at: 2, line: 'Two events in. Guests can see you mean it.' },
  { key: 'established', name: 'Established', at: 10, line: 'Ten nights hosted. A name people look for.' },
  { key: 'elite', name: 'Elite', at: 25, line: 'Twenty-five events. Your flyers get noticed.' },
  { key: 'legend', name: 'Legend', at: 75, line: 'Seventy-five and counting. The room is yours.' },
]

// ── Crowd mix ────────────────────────────────────────────────────────────
// Split presets reserve 10% of seats as open; single-gender events don't.

export interface Mix {
  key: string
  label: string
  /** Share of seats, in whole percent; always sums to 100 */
  women: number
  men: number
  open: number
}

export const MIX_PRESETS: Mix[] = [
  { key: 'open', label: 'Open', women: 0, men: 0, open: 100 },
  { key: '50-50', label: '50:50', women: 45, men: 45, open: 10 },
  { key: '60-40', label: '60:40', women: 54, men: 36, open: 10 },
  { key: 'women', label: 'Women only', women: 100, men: 0, open: 0 },
  { key: 'men', label: 'Men only', women: 0, men: 100, open: 0 },
]

/** Custom mix in 10% steps of the 90% that isn't open. `womenSteps` is 0–10 (×10%). */
export function customMix(womenSteps: number): Mix {
  const w = Math.max(0, Math.min(10, Math.round(womenSteps)))
  return { key: 'custom', label: `Custom ${w * 10}:${100 - w * 10}`, women: w * 9, men: (10 - w) * 9, open: 10 }
}

/** Seats per group for a capacity, rounding goes to the open pool. */
export function mixSeats(mix: Mix, cap: number) {
  const women = Math.floor((cap * mix.women) / 100)
  const men = Math.floor((cap * mix.men) / 100)
  return { women, men, open: cap - women - men }
}

// ── Story steps ──────────────────────────────────────────────────────────

/** Variant A, the four screens the phone builds as you scroll. */
export const BUILD_STEPS = [
  {
    key: 'create',
    n: '01',
    title: 'Create it',
    body: 'Photos, a name, the date, your area and how many people fit. A few minutes in the app, and listing is free.',
  },
  {
    key: 'invite',
    n: '02',
    title: 'Dress the invite',
    body: 'Pick a template (house party, retro, night out, beach, Halloween, Christmas) and share one link.',
  },
  {
    key: 'requests',
    n: '03',
    title: 'Pick your room',
    body: 'Free events are request-to-join. You see each profile, then accept or decline. Declined guests can’t re-request.',
  },
  {
    key: 'door',
    n: '04',
    title: 'Scan at the door',
    body: 'Confirmed guests get a QR ticket and the exact address. You scan them in when they arrive.',
  },
] as const

export type BuildKey = (typeof BUILD_STEPS)[number]['key']

/** Variant B, run of show, from listing to payout. */
export const RUN_OF_SHOW = [
  { cue: 'T–7', title: 'List the night', body: 'Create the event in the app: photos, a template invite, date, area and capacity. Free to list.' },
  { cue: 'T–6', title: 'Set the door', body: 'Free entry (up to 2 a month) or paid from ₹99. Paid guests book instantly with UPI or wallet.' },
  { cue: 'T–5', title: 'Set the mix', body: 'Open, 50:50, 60:40, women-only, men-only or custom. Add an age gate if the night needs one.' },
  { cue: 'T–3', title: 'Work the list', body: 'Requests come in as pushes. See each profile, accept or decline. When it’s full, there’s a waitlist.' },
  { cue: 'T–1', title: 'Change of plans?', body: 'Edit the event and everyone going or requested is notified. Cancel and everyone hears it.' },
  { cue: 'Doors', title: 'Scan them in', body: 'Only confirmed guests have the address. Each one shows a QR ticket; you scan it at the door.' },
  { cue: 'After', title: 'Lights up', body: 'Guests review the night, your badge count climbs, and paid-event earnings go to your UPI or bank.' },
] as const

/** Illustrative join requests for the inbox / phone demos (not real people). */
export const SAMPLE_REQUESTS = [
  { name: 'Riya', age: 24, meta: '3 mutuals · reviewed 6 events', note: 'Bringing my own playlist suggestions.', avatar: 0 },
  { name: 'Kabir', age: 27, meta: 'Rated 4.9 by hosts', note: 'Board-game nerd, will teach Catan.', avatar: 1 },
  { name: 'Meera', age: 22, meta: 'First party on Gorave', note: 'New to the city, keen to meet people.', avatar: 2 },
  { name: 'Arjun', age: 29, meta: '2 mutuals · phone-verified', note: 'Can bring a speaker.', avatar: 3 },
  { name: 'Sana', age: 25, meta: 'Reviewed 11 events', note: 'Coming with one friend who also requested.', avatar: 4 },
  { name: 'Dev', age: 31, meta: 'Phone-verified', note: 'Saw the flyer, love the theme.', avatar: 5 },
] as const

/** Variant B, house rules the app enforces, written as poster copy. */
export const HOUSE_RULES = [
  { title: 'address|after', bg: '#FF3864', ink: '#FFF1E6', rule: 'Exact address goes to confirmed guests only. Everyone else sees the area.' },
  { title: '18+|verified', bg: '#FFB830', ink: '#2B1418', rule: 'Every guest is phone-verified and 18 or over before they can ask to join.' },
  { title: 'your|mix', bg: '#DCE6F2', ink: '#131E2A', rule: 'Open, 50:50, 60:40, women-only, men-only or custom in 10% steps.' },
  { title: 'age|gate', bg: '#C8F25C', ink: '#171310', rule: 'Need an older crowd? Switch on the age gate for the event.' },
  { title: 'no means|no', bg: '#171310', ink: '#FF6B35', rule: 'Decline a request and that guest can’t re-request the same event.' },
  { title: 'QR at|the door', bg: '#F4D9DF', ink: '#2B1418', rule: 'Each confirmed guest gets a QR ticket. You scan it in at the door.' },
  { title: 'full?|waitlist', bg: '#FF6B35', ink: '#171310', rule: 'When seats run out, new guests join a waitlist instead of a dead end.' },
  { title: 'every|night rated', bg: '#DCE8D6', ink: '#16231a', rule: 'Guests review events. Good nights earn you badges, Rising to Legend.' },
] as const

/** Host-side pushes for the lock-screen demo. */
export const HOST_NOTICES = [
  { title: 'Riya wants to join', body: 'Rooftop Sundowner · tap to see her profile', time: 'now' },
  { title: 'Event updated', body: 'Start moved to 7 PM. Everyone going and requested was notified.', time: '1h ago' },
  { title: 'Kabir booked a ticket', body: 'Paid with UPI. 1 seat left before the waitlist.', time: '3h ago' },
]

// ── FAQ ──────────────────────────────────────────────────────────────────

export const HOST_FAQ = [
  {
    q: 'How much does it cost to host on Gorave?',
    a: 'Nothing to list. You can run up to 2 free-entry events a month. On paid events Gorave takes a 10% commission, so you keep 90% of every ticket.',
  },
  {
    q: 'What is the minimum ticket price?',
    a: 'Paid events start at ₹99 a ticket. Guests pay a flat ₹50 platform fee on top, so the fee never comes out of your share.',
  },
  {
    q: 'How do I get paid?',
    a: 'Add your UPI ID or bank account in the app. Your 90% of ticket sales is paid out there.',
  },
  {
    q: 'Can I choose who comes?',
    a: 'Yes. Free events are request-to-join: you see each requester’s profile and accept or decline. A declined guest can’t re-request. Paid events book instantly, and you can still set a crowd mix and an age gate.',
  },
  {
    q: 'What crowd mixes can I set?',
    a: 'Open, 50:50, 60:40, women-only, men-only, or a custom split in 10% steps. On split mixes 10% of seats stay open.',
  },
  {
    q: 'Who sees my address?',
    a: 'Only confirmed guests. Everyone else sees the area. Guests arrive with a QR ticket and you scan them in at the door.',
  },
  {
    q: 'What if I need to change or cancel the event?',
    a: 'You can edit it up to 7 hours before it starts, and guests who are going or have requested are notified. If you cancel, everyone is notified.',
  },
  {
    q: 'Who can join my event?',
    a: 'Every guest is phone-verified and 18+. After the night, guests review the event, and hosts earn badges: Rising at 2+ events, Established at 10+, Elite at 25+ and Legend at 75+.',
  },
]
