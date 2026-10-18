import { PHOTOS, type SampleEvent } from '@/constants'
import { AREA_SCENES } from '@/lib/area'
import { BADGE_TIERS, HOST_FEES } from '@/lib/host'
import type { Crumb } from '@/lib/seo'
import type { SiteStats } from '@/lib/pagesData'
import type { AccordionItem } from '@/components/ui/Accordion'
import { Button } from '@/components/ui/Button'
import { StoreBadges } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Shared content for both About variants. Everything here is a manifesto
// line or a real product rule: no dates, no invented numbers.

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** Rounding for anything that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100
export const pad = (n: number) => String(n).padStart(2, '0')

export const ABOUT_CRUMBS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/about' },
]

const share = Math.round(HOST_FEES.hostShare * 100)
const fee = HOST_FEES.platformFee
const rising = BADGE_TIERS[0]
const legend = BADGE_TIERS[BADGE_TIERS.length - 1]

export interface Belief {
  key: string
  title: string
  serif: string
  body: string
  /** Three real rules, used as callouts / chips */
  rules: { label: string; detail: string }[]
  href: string
  cta: string
  image: string
  alt: string
}

export const BELIEFS: Belief[] = [
  {
    key: 'real',
    title: 'Real people,',
    serif: 'only.',
    body: 'A night in someone’s home only works if everyone in it is who they say they are. So every account is phone-verified, and Gorave is 18+.',
    rules: [
      { label: 'Phone-verified', detail: 'Every account, before anything else.' },
      { label: '18+ only', detail: 'No exceptions, on every event.' },
      { label: 'QR at the door', detail: 'Only confirmed guests get scanned in.' },
    ],
    href: '/safety',
    cta: 'How safety works',
    image: AREA_SCENES.doorway,
    alt: 'A host opening her front door to two guests',
  },
  {
    key: 'room',
    title: 'The host',
    serif: 'chooses the room.',
    body: 'It’s their home. Free events are request-to-join, and hosts can set the crowd mix and an age gate, so the room feels like theirs.',
    rules: [
      { label: 'Request to join', detail: 'Hosts see who’s asking before saying yes.' },
      { label: 'Crowd mix', detail: 'Women-only, 50:50, 60:40 and more.' },
      { label: 'Age gate', detail: '21+ or 25+, if the host wants it.' },
    ],
    href: '/women-only',
    cta: 'See women-only nights',
    image: '/img/crowd/women-only.webp',
    alt: 'A group of women laughing on a sofa at a painting night',
  },
  {
    key: 'safe',
    title: 'Safe,',
    serif: 'door to door.',
    body: 'The public listing shows the area, never the flat. The exact address goes to confirmed guests only, and SOS is one tap away all night.',
    rules: [
      { label: 'Area only, publicly', detail: 'An approximate circle on the map.' },
      { label: 'Address for guests', detail: 'The flat unlocks once you’re confirmed.' },
      { label: 'One-tap SOS', detail: 'Live location to up to 5 contacts.' },
    ],
    href: '/safety',
    cta: 'Read the safety rules',
    image: AREA_SCENES.building,
    alt: 'An apartment block at night with a few windows lit up for a party',
  },
  {
    key: 'money',
    title: 'Fair money,',
    serif: 'out loud.',
    body: `Listing is free. On a paid night the host keeps ${share}% of every ticket, and the guest pays one flat ₹${fee} fee. No surprises at checkout.`,
    rules: [
      { label: 'Free to list', detail: 'No subscription, no listing fee.' },
      { label: `Hosts keep ${share}%`, detail: 'Of every ticket, paid out in the app.' },
      { label: `Flat ₹${fee} fee`, detail: 'Paid by the guest, on paid tickets.' },
    ],
    href: '/host/payouts',
    cta: 'How payouts work',
    image: AREA_SCENES.rooftop,
    alt: 'Friends dancing on a rooftop under string lights at dusk',
  },
  {
    key: 'trust',
    title: 'Trust is earned',
    serif: 'night by night.',
    body: `Guests rate every event, and hosts earn badges as they go: ${rising.name} after ${rising.at} nights, all the way to ${legend.name} at ${legend.at}.`,
    rules: [
      { label: 'Rated by guests', detail: 'Every event, by the people who went.' },
      { label: `${rising.name} at ${rising.at}`, detail: 'The first badge a host earns.' },
      { label: `${legend.name} at ${legend.at}`, detail: 'The hosts people plan around.' },
    ],
    href: '/host/badges',
    cta: 'See the host badges',
    image: '/img/crowd/balanced.webp',
    alt: 'Friends playing cards around a coffee table at a game night',
  },
]

export const ABOUT_FAQ: AccordionItem[] = [
  {
    q: 'What is Gorave?',
    a: 'Gorave is where real people host house parties, rooftops, game nights, dinner parties and music nights in their homes, and where you find them. One link handles the invite, the guest list, the money and the door.',
  },
  {
    q: 'Who can join a Gorave event?',
    a: 'Anyone 18 or over with a phone-verified account. Free events are request-to-join, so the host accepts you first, and hosts can also set a crowd mix or an age gate like 21+.',
  },
  {
    q: 'Is the host’s address public?',
    a: 'No. A listing shows the area and an approximate circle on the map. The exact address and flat number unlock only once you’re a confirmed guest.',
  },
  {
    q: 'How much does it cost?',
    a: `Listing an event is free. On a paid event the host keeps ${share}% of the ticket price and the guest pays a flat ₹${fee} fee on top. Free events stay free.`,
  },
  {
    q: 'Who built Gorave?',
    a: 'Gorave is built by Nitin Gupta, founder, who builds the product and the app, and Kaveesha Jeswani, co-founder and head of marketing, who runs the brand and everything creative.',
  },
  {
    q: 'Which cities is Gorave in?',
    a: 'Mumbai, Bangalore, Delhi, Pune, Hyderabad, Goa, Chennai and Kolkata, with more on the way.',
  },
]

/** The real numbers worth showing; anything at 0 (or missing) is left out. */
export function statItems(stats: SiteStats): { value: string; label: string }[] {
  const out: { value: string; label: string }[] = []
  if (stats.upcoming > 0) out.push({ value: stats.upcoming.toLocaleString('en-IN'), label: stats.upcoming === 1 ? 'night coming up' : 'nights coming up' })
  if (stats.liveCities > 0) out.push({ value: String(stats.liveCities), label: stats.liveCities === 1 ? 'city live now' : 'cities live now' })
  if (stats.avgRating && stats.reviewCount > 0) out.push({ value: stats.avgRating.toFixed(1), label: `avg rating, ${stats.reviewCount.toLocaleString('en-IN')} reviews` })
  return out
}

export const eventImage = (e: SampleEvent) => e.image ?? PHOTOS[e.photo]

/** "Get the app" + "Host your own", the two ways out of every section that sells. */
export function Ctas({ className, badges = true, size = 'lg' }: { className?: string; badges?: boolean; size?: 'md' | 'lg' }) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex flex-wrap gap-2.5">
        <Button href="/app" size={size}>Get the app</Button>
        <Button href="/host" kind="ghost" size={size}>Host your own</Button>
      </div>
      {badges && <StoreBadges height={44} />}
    </div>
  )
}

/** Underlined link with an arrow, for the "proof" links (shared: components/ui/ProofLink). */
export { ProofLink } from '@/components/ui/ProofLink'
