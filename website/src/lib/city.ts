import { CITIES, EVENT_TYPES, SAMPLE_EVENTS, type City } from '@/constants'
import { slugify } from './seo'

// City-page data in one place. Copy is templated from facts that are true
// for every city (how Gorave works), so pages stay accurate as cities grow.

export const getCity = (slug: string) => CITIES.find(c => c.slug === slug)

export const cityEvents = (city: City) => SAMPLE_EVENTS.filter(e => e.city === city.name)

export const areaSlug = (area: string) => slugify(area)

export function cityTagline(city: City) {
  return `House parties, rooftops, game nights and supper clubs in ${city.name}, hosted by real people in ${city.areas.slice(0, 3).join(', ')} and beyond.`
}

export function cityMetaDescription(city: City) {
  return `Find house parties, rooftop parties, game nights and supper clubs in ${city.name} this week. Request to join free events or book tickets with UPI. Verified 18+ guests and private addresses.`
}

/** Quick-filter links — each one is its own SEO page under the city. */
export function cityFilters(city: City) {
  return [
    { label: 'Tonight', href: `/${city.slug}/tonight` },
    { label: 'This weekend', href: `/${city.slug}/this-weekend` },
    { label: 'Free', href: `/${city.slug}/free-events` },
    { label: 'Under ₹500', href: `/${city.slug}/under-500` },
    { label: 'Women only', href: `/${city.slug}/women-only` },
    { label: '21+', href: `/${city.slug}/21-plus` },
    ...EVENT_TYPES.filter(t => t.key !== 'other').map(t => ({ label: t.label, href: `/${city.slug}/${t.slug}` })),
  ]
}

export function cityFaq(city: City) {
  return [
    {
      q: `What kind of events are on Gorave in ${city.name}?`,
      a: `House parties, rooftop sessions, game nights, supper clubs and living-room gigs, all hosted by people in ${city.name}. Browse by vibe, date or price, closest to you first.`,
    },
    {
      q: `Are events in ${city.name} free?`,
      a: 'Many are. Free events are request-to-join, so the host approves each guest. Paid events book instantly with UPI, GPay, PhonePe or your Gorave Wallet, plus a flat ₹50 platform fee.',
    },
    {
      q: 'Is it safe to go to a house party with people I don’t know?',
      a: 'Every guest is phone-verified and 18+. The exact address is only shared with confirmed guests, hosts are reviewed after every event, and the app has one-tap SOS that shares your live location with emergency contacts.',
    },
    {
      q: `Where are most events in ${city.name}?`,
      a: `Hosts are spread across the city, with lots happening around ${city.areas.join(', ')}. Pick an area to see what's on near you.`,
    },
    {
      q: `How do I host an event in ${city.name}?`,
      a: 'Download the app, create your event in a few minutes and share the link. Listing is free and you can run 2 free-entry events a month; for paid events (from ₹99) you keep 90% of every ticket, paid out to your UPI or bank after the event.',
    },
  ]
}
