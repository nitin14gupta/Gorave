import type { SampleEvent } from '@/constants'
import type { PublicEventsQuery } from './api'

// Crowd pages (/women-only, /mumbai/women-only). Each crowd is a real filter on
// the public API, backed by something the app enforces: a women-only quota, an
// age gate, or a balanced quota the host sets. Copy only claims those rules.

export interface CrowdStory {
  slug: string
  /** "Women-only" — used in "Women-only nights in Mumbai" */
  label: string
  /** Short noun for headings: "women-only nights" */
  nights: string
  query: Pick<PublicEventsQuery, 'women_only' | 'min_age'> & { balanced?: boolean }
  image: string
  heroLine: string
  /** Why people choose this crowd */
  why: { title: string; body: string }[]
  /** How the app makes it true, step by step */
  how: { title: string; body: string }[]
  /** One-line promise used on cards */
  promise: string
  /** For hosts: how to set it up */
  hostLine: string
  faq: (place: string) => { q: string; a: string }[]
  /** Offline fallback filter for sample events */
  sample: (e: SampleEvent) => boolean
}

const shared = (place: string) => [
  { q: `When do I get the address in ${place}?`, a: 'Once you’re confirmed. Until then you see the area only; the exact address is never shown publicly.' },
  { q: 'Are these events free?', a: 'Many are. Free events are request-to-join and the host approves each guest. Paid ones book instantly with UPI plus a flat ₹50 platform fee.' },
]

export const CROWDS: CrowdStory[] = [
  {
    slug: 'women-only',
    label: 'Women-only',
    nights: 'women-only nights',
    query: { women_only: true },
    image: '/img/crowd/women-only.webp',
    heroLine: 'House parties, dinners and game nights where every guest is a woman. Set by the host, enforced by the app.',
    promise: 'Only women can join',
    why: [
      { title: 'Go solo, comfortably', body: 'Walk into a room of women you haven’t met yet. Most people at these nights came alone too.' },
      { title: 'Enforced, not hoped for', body: 'A women-only event only accepts requests and bookings from guests whose profile says woman. The app checks it, not the host.' },
      { title: 'Hosts see who’s asking', body: 'Free nights are request-to-join, so the host sees each profile before saying yes.' },
      { title: 'The address stays private', body: 'Only confirmed guests get the exact address. Everyone else sees the area.' },
    ],
    how: [
      { title: 'The host picks women-only', body: 'One setting when the event is created. It can’t be switched off once people have joined.' },
      { title: 'Only women can request', body: 'The app checks the gender on your profile before the request goes through.' },
      { title: 'The host approves', body: 'For free nights the host accepts or declines each request.' },
      { title: 'QR at the door', body: 'Confirmed guests get a ticket; the host scans it when you arrive.' },
    ],
    hostLine: 'Hosting a girls’ night? Pick women-only when you create the event and the app does the rest.',
    faq: place => [
      { q: `Are women-only events in ${place} really women-only?`, a: 'Yes. When a host sets an event to women-only, the app only accepts requests and bookings from guests whose profile gender is woman.' },
      { q: 'Can I go alone?', a: 'Most people do. Check the host’s reviews and badges first, and turn on SOS: one tap shares your live location with up to 5 emergency contacts.' },
      ...shared(place),
    ],
    sample: e => e.mix === 'Women only',
  },
  {
    slug: 'balanced-crowd',
    label: 'Balanced crowd',
    nights: 'nights with a balanced crowd',
    query: { balanced: true },
    image: '/img/crowd/balanced.webp',
    heroLine: 'Parties where the host keeps the room even: 50:50, 60:40 or 40:60, held by the app seat by seat.',
    promise: 'A mix the host sets and the app keeps',
    why: [
      { title: 'No more “all guys” parties', body: 'Hosts set a split and the app holds it, so a free event can’t fill up with one crowd in five minutes.' },
      { title: 'Easier to talk to people', body: 'A balanced room is a social room. Fewer cliques, more new friends.' },
      { title: 'A few open seats', body: 'About one in ten seats stays open to anyone, so friends and plus-ones still fit.' },
      { title: 'Waitlist, not a free-for-all', body: 'When one side is full, new requests for it wait for a spot instead of tipping the mix.' },
    ],
    how: [
      { title: 'The host sets the split', body: '50:50, 60:40, 40:60 or a custom split in 10% steps.' },
      { title: 'Seats are held per side', body: 'The app counts women, men and open seats separately as people join.' },
      { title: 'Requests still need a yes', body: 'Free nights stay request-to-join; the host picks who fits.' },
      { title: 'Full side? Waitlist', body: 'You’re offered a spot automatically if one opens on your side.' },
    ],
    hostLine: 'Want the room to stay even? Pick 50:50 when you create the event.',
    faq: place => [
      { q: `How do balanced-crowd parties in ${place} stay balanced?`, a: 'The host sets a split like 50:50 and the app holds separate seats for women and men, with about 10% open to anyone. When one side is full, more requests for it go to the waitlist.' },
      { q: 'Can I bring a friend of the other gender?', a: 'Yes, as long as there’s a seat on their side or an open seat. Each of you requests or books separately.' },
      ...shared(place),
    ],
    sample: e => e.mix === '50:50',
  },
  {
    slug: '21-plus',
    label: '21+',
    nights: '21+ nights',
    query: { min_age: 21 },
    image: '/img/crowd/21-plus.webp',
    heroLine: 'House parties and home bars where everyone is 21 or older. The host sets the age gate; the app checks it.',
    promise: 'Everyone is 21 or older',
    why: [
      { title: 'A grown-up room', body: 'For nights where the conversation and the drinks are a little more grown-up.' },
      { title: 'Checked before you’re in', body: 'The app checks the age on your profile before your request or booking goes through.' },
      { title: 'Still request-to-join', body: 'Free nights stay host-approved, so the crowd fits the night.' },
      { title: 'Private until you’re in', body: 'The exact address is only for confirmed guests.' },
    ],
    how: [
      { title: 'The host sets 21+', body: 'An age gate chosen when the event is created.' },
      { title: 'Your age is checked', body: 'Requests and bookings from under-21 profiles don’t go through.' },
      { title: 'The host approves', body: 'For free nights the host accepts or declines each request.' },
      { title: 'QR at the door', body: 'Confirmed guests get a ticket the host scans on arrival.' },
    ],
    hostLine: 'Planning a cocktail night? Set the age gate to 21+ when you create it.',
    faq: place => [
      { q: `How do 21+ events in ${place} work?`, a: 'The host sets a 21+ age gate. The app checks the age on your profile and only lets 21+ guests request or book.' },
      ...shared(place),
    ],
    sample: () => false,
  },
  {
    slug: '25-plus',
    label: '25+',
    nights: '25+ nights',
    query: { min_age: 25 },
    image: '/img/crowd/25-plus.webp',
    heroLine: 'Dinner parties, rooftops and slower nights for people 25 and up. Age-gated by the host, checked by the app.',
    promise: 'Everyone is 25 or older',
    why: [
      { title: 'Slower, longer nights', body: 'Long dinners, good playlists and conversations that actually go somewhere.' },
      { title: 'Age checked by the app', body: 'Only profiles 25 and up can request or book.' },
      { title: 'Small and host-picked', body: 'Free nights are request-to-join; the host chooses the room.' },
      { title: 'Address after you’re in', body: 'Everyone else only sees the area.' },
    ],
    how: [
      { title: 'The host sets 25+', body: 'An age gate chosen when the event is created.' },
      { title: 'Your age is checked', body: 'Under-25 profiles can’t request or book.' },
      { title: 'The host approves', body: 'For free nights the host accepts or declines each request.' },
      { title: 'QR at the door', body: 'Confirmed guests get a ticket the host scans on arrival.' },
    ],
    hostLine: 'Hosting a long-table dinner? Set the age gate to 25+.',
    faq: place => [
      { q: `How do 25+ events in ${place} work?`, a: 'The host sets a 25+ age gate. The app checks the age on your profile and only lets 25+ guests request or book.' },
      ...shared(place),
    ],
    sample: () => false,
  },
]

export type CrowdContent = Omit<CrowdStory, 'faq' | 'sample'>

export const getCrowd = (slug: string) => CROWDS.find(c => c.slug === slug)
