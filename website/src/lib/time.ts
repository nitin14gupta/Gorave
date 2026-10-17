import type { PublicEventsQuery } from './api'

// Time pages (/tonight, /mumbai/this-weekend). Each one is a real `when`
// filter on the public API (IST calendar), so the listings are always live.

export interface TimeStory {
  slug: string
  /** "Tonight", "This weekend" */
  label: string
  when: NonNullable<PublicEventsQuery['when']>
  image: string
  /** Hero line under the headline */
  heroLine: string
  /** One-liner used on cards that link here */
  promise: string
  /** How to make it happen in time, in the order you'd do it */
  steps: { title: string; body: string }[]
  /** Short reasons this window is a good one to go out in */
  why: { title: string; body: string }[]
  faq: (place: string) => { q: string; a: string }[]
}

const shared = (place: string) => [
  { q: `When do I get the address in ${place}?`, a: 'As soon as you’re confirmed. Until then you see the area only; the exact address is never shown publicly.' },
  { q: 'Are these free?', a: 'Many are. Free nights are request-to-join and the host approves each guest. Paid ones book instantly with UPI plus a flat ₹50 platform fee.' },
]

const steps = (soon: string): TimeStory['steps'] => [
  { title: 'Pick a night', body: `Everything here starts ${soon}. Filter by vibe, price or crowd.` },
  { title: 'Book or request', body: 'Paid nights book instantly with UPI. Free ones are a request the host says yes or no to.' },
  { title: 'Get the address', body: 'Once you’re confirmed, the exact address and your QR ticket appear in the app.' },
  { title: 'Show up', body: 'The host scans your QR at the door. That’s it.' },
]

export const TIMES: TimeStory[] = [
  {
    slug: 'tonight',
    label: 'Tonight',
    when: 'tonight',
    image: '/img/time/tonight.webp',
    heroLine: 'No plans yet? These house parties, rooftops and dinners start later today.',
    promise: 'Starting later today',
    steps: steps('today'),
    why: [
      { title: 'Last-minute is normal', body: 'Plenty of nights fill up on the day. Paid spots book in a tap.' },
      { title: 'Know before you go', body: 'Every listing shows the area, the price, the crowd mix and how many are going.' },
      { title: 'Go solo, safely', body: 'Every guest is phone-verified and 18+, and hosts see who’s asking.' },
      { title: 'Address only when confirmed', body: 'Nobody sees the exact address until the host has said yes.' },
    ],
    faq: place => [
      { q: `Is it too late to find something tonight in ${place}?`, a: 'Not if it’s listed here. Paid nights with spots left book instantly; free ones need the host to accept your request.' },
      ...shared(place),
    ],
  },
  {
    slug: 'tomorrow',
    label: 'Tomorrow',
    when: 'tomorrow',
    image: '/img/time/week.webp',
    heroLine: 'Plan one day ahead. House parties, game nights and dinners happening tomorrow.',
    promise: 'Happening tomorrow',
    steps: steps('tomorrow'),
    why: [
      { title: 'Time to get a yes', body: 'Free nights are request-to-join. Asking a day early gives the host time to reply.' },
      { title: 'Bring a friend', body: 'Share the link tonight and decide together.' },
      { title: 'See the crowd first', body: 'Crowd mix, age gate and host reviews are on every listing.' },
      { title: 'Private until you’re in', body: 'The exact address unlocks after you’re confirmed.' },
    ],
    faq: place => [
      { q: `What’s on tomorrow in ${place}?`, a: 'Everything listed on this page, updated live. Pick one and book or request in the app.' },
      ...shared(place),
    ],
  },
  {
    slug: 'this-weekend',
    label: 'This weekend',
    when: 'weekend',
    image: '/img/time/weekend.webp',
    heroLine: 'Friday to Sunday: house parties, rooftop sunsets, game nights and long lunches.',
    promise: 'Friday, Saturday and Sunday',
    steps: steps('this Friday, Saturday or Sunday'),
    why: [
      { title: 'Three nights, one plan', body: 'Friday kick-off, a Saturday party, a slow Sunday. Mix and match.' },
      { title: 'The busiest nights', body: 'Most hosts throw their nights on the weekend, so there’s more to pick from.' },
      { title: 'Request early', body: 'Free weekend nights fill up. Requesting a few days ahead gives you the best shot.' },
      { title: 'Verified guests only', body: 'Phone-verified, 18+, approved by the host.' },
    ],
    faq: place => [
      { q: `What counts as this weekend in ${place}?`, a: 'Friday, Saturday and Sunday in the next seven days, in India time.' },
      ...shared(place),
    ],
  },
  {
    slug: 'this-week',
    label: 'This week',
    when: 'week',
    image: '/img/time/week.webp',
    heroLine: 'Seven days of house parties, rooftops, game nights and dinners. Plan the whole week.',
    promise: 'The next seven days',
    steps: steps('in the next seven days'),
    why: [
      { title: 'Weeknights count too', body: 'Game nights, gigs and dinners after work, not just Saturdays.' },
      { title: 'Plan around your week', body: 'Every night is listed with its date, time and area.' },
      { title: 'Small and hosted', body: 'Real people’s homes, rooftops and tables, not clubs.' },
      { title: 'Private by default', body: 'The exact address is for confirmed guests only.' },
    ],
    faq: place => [
      { q: `How far ahead does this week go in ${place}?`, a: 'The next seven days from today, in India time.' },
      ...shared(place),
    ],
  },
]

export type TimeContent = Omit<TimeStory, 'faq'>

export const getTime = (slug: string) => TIMES.find(t => t.slug === slug)
