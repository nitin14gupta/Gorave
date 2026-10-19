import { CITIES, EVENT_TYPES, PHOTOS, type City, type SampleEvent } from '@/constants'
import { cardEvents, type PublicEventsQuery } from './api'
import { cityStreet, getArea, type Area } from './area'
import { areaSlug } from './city'
import type { Crumb } from './seo'

// Price pages: /free-events and /under-500, India-wide, per city and per
// neighbourhood. "Under ₹500" means paid tickets from ₹99 to ₹500 (free
// nights have their own page). Product facts: free events are
// request-to-join; paid tickets are ₹99 and up plus a flat ₹50 fee, paid in
// the app; hosts keep 90%; paid tickets can't be cancelled in the app.

export type PriceSlug = 'free-events' | 'under-500'

export interface PriceTier {
  slug: PriceSlug
  /** "Free" / "Under ₹500" */
  label: string
  /** Big number on the tag */
  tag: string
  /** "free nights" / "nights under ₹500" */
  noun: string
  heroLine: string
  query: Pick<PublicEventsQuery, 'free' | 'max_price'>
  /** The receipt, line by line */
  receipt: { k: string; v: string; note?: string }[]
  total: { k: string; v: string }
  /** Flip cards: question on the front, answer on the back */
  cards: { q: string; a: string }[]
  faq: { q: string; a: string }[]
}

export const PRICES: PriceTier[] = [
  {
    slug: 'free-events',
    label: 'Free',
    tag: '₹0',
    noun: 'free nights',
    heroLine: 'No ticket, no fee, no cash at the door. Request to join, and if the host says yes, you’re in.',
    query: { free: true },
    receipt: [
      { k: 'Ticket', v: '₹0' },
      { k: 'Platform fee', v: '₹0', note: 'Only paid tickets have one' },
      { k: 'Cash at the door', v: 'None' },
      { k: 'The address', v: 'Unlocks', note: 'Once the host says yes' },
    ],
    total: { k: 'You pay', v: '₹0' },
    cards: [
      { q: 'Why is it free?', a: 'Because the host wants to meet people, not sell tickets. Hosts can run 2 free-entry events a month.' },
      { q: 'So what’s the catch?', a: 'Free nights are request-to-join. The host sees your profile and says yes or no, so the room stays right.' },
      { q: 'Do I bring anything?', a: 'Check the house rules on the listing. Some hosts say BYOB, some just want you on time.' },
    ],
    faq: [
      { q: 'Are free events on Gorave really free?', a: 'Yes. There’s no ticket and no platform fee on free events. You request to join, and if the host accepts, you’re in.' },
      { q: 'How do I get into a free event?', a: 'Send a request from the event page. The host sees your profile and accepts or declines. Once you’re accepted you get the exact address and a QR ticket.' },
      { q: 'What happens if I’m declined?', a: 'A declined request can’t be sent again for that event, but there are plenty of others. You can withdraw a pending request any time.' },
      { q: 'Can I cancel my spot at a free event?', a: 'Yes, you can cancel a free spot from the event page, and it goes back to the host.' },
    ],
  },
  {
    slug: 'under-500',
    label: 'Under ₹500',
    tag: '₹500',
    noun: 'nights under ₹500',
    heroLine: 'Tickets from ₹99 plus a flat ₹50 fee, paid in the app with UPI. Book instantly, nothing to pay at the door.',
    query: { free: false, max_price: 500 },
    receipt: [
      { k: 'Ticket', v: '₹99 to ₹500' },
      { k: 'Platform fee', v: '₹50', note: 'One flat fee per paid ticket' },
      { k: 'Cash at the door', v: 'None' },
      { k: 'The host keeps', v: '90%', note: 'Of the ticket price' },
    ],
    total: { k: 'You pay', v: '₹149 to ₹550' },
    cards: [
      { q: 'What do I actually pay?', a: 'The ticket plus one flat ₹50 platform fee. Paid in the app with UPI or your Gorave Wallet. Nothing at the door.' },
      { q: 'Do I need to be accepted?', a: 'No. Paid nights book instantly, as long as there’s a spot and you fit the age gate and crowd mix.' },
      { q: 'Where does the money go?', a: 'The host keeps 90% of the ticket price. Gorave keeps 10% and the ₹50 fee to run the app.' },
    ],
    faq: [
      { q: 'What does a night under ₹500 cost in total?', a: 'The ticket price, from ₹99 up to ₹500, plus a flat ₹50 platform fee per paid ticket. You see the full amount before you pay.' },
      { q: 'How do I pay?', a: 'In the app, with UPI or your Gorave Wallet. There’s no cash at the door.' },
      { q: 'Can I cancel a paid ticket?', a: 'Paid tickets can’t be cancelled in the app once booked. If the host cancels, the ticket price comes back to your Gorave Wallet automatically.' },
      { q: 'What if the event is full?', a: 'Paid events can have a waitlist. If a spot opens and you’re offered it, you have an hour to confirm.' },
    ],
  },
]

export const getPrice = (slug: string) => PRICES.find(p => p.slug === slug)

export interface PricePlace {
  name: string
  href: string
  count: number
  image: string
}

export interface PriceProps {
  tier: PriceTier
  /** Where this page is about */
  place: { kind: 'india' | 'city' | 'area'; name: string; city?: City; area?: Area }
  events: SampleEvent[]
  /** True when `events` came from a wider area because this one is quiet */
  wider: boolean
  /** Cities (India page), neighbourhoods (city page) or neighbours (area page) */
  places: PricePlace[]
  other: PriceTier
  crumbs: Crumb[]
  typeImages: { label: string; image: string }[]
}

const inArea = (e: SampleEvent, name: string) => e.area.toLowerCase().startsWith(name.toLowerCase())
const matches = (tier: PriceTier) => (e: SampleEvent) =>
  tier.slug === 'free-events' ? e.price === 'Free' : e.price !== 'Free' && Number(e.price.replace(/[^\d]/g, '')) <= 500
const firstImage = (list: SampleEvent[]) => list.find(e => e.image)?.image

/** Server data for any price page. One events call per scope (shared by both tiers' sibling links). */
export async function pricePageData(tier: PriceTier, city?: City, area?: Area): Promise<PriceProps> {
  const scopeCity = area?.city ?? city
  const { events: pool } = await cardEvents(
    { ...tier.query, ...(scopeCity ? { city: scopeCity.name } : {}), limit: 100 },
    e => matches(tier)(e) && (!scopeCity || e.city === scopeCity.name),
  )
  const here = area ? pool.filter(e => inArea(e, area.name)) : pool
  let events = here
  let wider = false
  if (!here.length && area) {
    events = pool
    wider = true
  }

  let places: PricePlace[]
  if (!scopeCity) {
    places = CITIES.map(c => {
      const list = pool.filter(e => e.city === c.name)
      return { name: c.name, href: `/${c.slug}/${tier.slug}`, count: list.length, image: firstImage(list) ?? cityStreet(c.slug) }
    })
  } else {
    const names = area ? area.neighbours : scopeCity.areas
    places = names.map(n => {
      const list = pool.filter(e => inArea(e, n))
      return { name: n, href: `/${scopeCity.slug}/${areaSlug(n)}/${tier.slug}`, count: list.length, image: firstImage(list) ?? cityStreet(scopeCity.slug) }
    })
  }

  const crumbs: Crumb[] = [{ label: 'Home', href: '/' }]
  if (scopeCity) crumbs.push({ label: scopeCity.name, href: `/${scopeCity.slug}` })
  if (area) crumbs.push({ label: area.name, href: `/${scopeCity!.slug}/${area.slug}` })
  crumbs.push({ label: tier.label, href: [scopeCity && `/${scopeCity.slug}`, area && `/${area.slug}`, `/${tier.slug}`].filter(Boolean).join('') })

  return {
    tier,
    place: area ? { kind: 'area', name: area.name, city: scopeCity, area } : scopeCity ? { kind: 'city', name: scopeCity.name, city: scopeCity } : { kind: 'india', name: 'India' },
    events: events.sort((a, b) => Number(a.price.replace(/[^\d]/g, '') || 0) - Number(b.price.replace(/[^\d]/g, '') || 0)).slice(0, 12),
    wider,
    places,
    other: PRICES.find(p => p.slug !== tier.slug)!,
    crumbs,
    typeImages: EVENT_TYPES.slice(0, 4).map(t => ({ label: t.label.toLowerCase(), image: firstImage(pool.filter(e => e.photo === t.photo)) ?? PHOTOS[t.photo] })),
  }
}

export const priceHref = (p: Pick<PriceProps, 'place'>, slug: PriceSlug) =>
  p.place.kind === 'area' ? `/${p.place.city!.slug}/${p.place.area!.slug}/${slug}` : p.place.kind === 'city' ? `/${p.place.city!.slug}/${slug}` : `/${slug}`

export const priceParamsCity = () => CITIES.flatMap(c => PRICES.map(p => ({ city: c.slug, facet: p.slug })))
export const priceArea = (citySlug: string, areaSlugStr: string) => getArea(citySlug, areaSlugStr)
