import type { AccordionItem } from '@/components/ui/Accordion'
import type { Crumb } from '@/lib/seo'
import type { SiteStats } from '@/lib/pagesData'

// Copy and links for the /app download page, shared by both variants.
// Every claim here is a real feature; no counts unless they come from props.

export const EASE = [0.2, 0.8, 0.2, 1] as const

export const CRUMBS: Crumb[] = [
  { label: 'Home', href: '/' },
  { label: 'Get the app', href: '/app' },
]

/** "Browse on the web first" row. */
export const BROWSE: { href: string; label: string; note: string }[] = [
  { href: '/tonight', label: 'Tonight', note: 'What starts in a few hours' },
  { href: '/this-weekend', label: 'This weekend', note: 'Friday to Sunday' },
  { href: '/cities', label: 'All cities', note: 'Pick yours' },
  { href: '/women-only', label: 'Women-only', note: 'Crowds set by the host' },
  { href: '/house-parties', label: 'House parties', note: 'The classic' },
]

export const SECONDARY = [
  { href: '/safety', label: 'How we keep it safe' },
  { href: '/host', label: 'Host your own' },
]

export const FAQ: AccordionItem[] = [
  {
    q: 'Is Gorave on iPhone and Android?',
    a: 'Yes, both. Tap the App Store or Google Play badge on this page, or scan the code with your phone camera if you are on a computer.',
  },
  {
    q: 'How do I get into a free event?',
    a: 'Free events are request-to-join. Tap Request to join, the host sees your profile and approves. Once you are confirmed you get a QR ticket and the exact address.',
  },
  {
    q: 'How do I pay for a paid event?',
    a: 'Paid events book instantly with UPI or your Gorave Wallet. You pay the ticket price plus a flat ₹50 platform fee, and your QR ticket arrives straight away.',
  },
  {
    q: 'When do I see the exact address?',
    a: 'Before you are in, you see the area. The exact address unlocks once you are confirmed, next to your QR ticket for the door.',
  },
  {
    q: 'How does Gorave keep guests safe?',
    a: 'Every guest is phone-verified and 18+. Hosts can set a crowd mix, like women-only or 50:50, and an age gate. SOS texts your location to up to 5 emergency contacts.',
  },
  {
    q: 'Can I host my own event?',
    a: 'Yes. Listing is free and you get 2 free-entry events a month. Paid tickets start at ₹99 and hosts keep 90%.',
  },
]

/** Real numbers only: each piece shows up only when it is above zero. */
export function statPieces(stats: SiteStats) {
  const out: { big: string; small: string }[] = []
  if (stats.upcoming > 0) out.push({ big: String(stats.upcoming), small: stats.upcoming === 1 ? 'event coming up' : 'events coming up' })
  if (stats.liveCities > 0) out.push({ big: String(stats.liveCities), small: stats.liveCities === 1 ? 'city live' : 'cities live' })
  if (stats.avgRating && stats.avgRating > 0 && stats.reviewCount > 0) {
    out.push({ big: `${stats.avgRating.toFixed(1)}★`, small: `from ${stats.reviewCount} ${stats.reviewCount === 1 ? 'review' : 'reviews'}` })
  }
  return out
}
