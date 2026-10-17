import { CITIES, type City, type SampleEvent } from '@/constants'
import { cardEvents, fetchCities, fetchHosts, fetchReviews, type PublicHostCard } from './api'

// Real numbers and people for the evergreen pages (payouts, badges, app, about).
// Everything here comes from the public API; if it's down, counts are 0 and
// lists are empty, and the pages hide those bits rather than invent them.

export interface SiteStats {
  /** Upcoming published events across our cities */
  upcoming: number
  /** Cities with at least one upcoming event */
  liveCities: number
  avgRating: number | null
  reviewCount: number
}

export async function siteStats(): Promise<SiteStats> {
  const [cities, reviews] = await Promise.all([fetchCities(), fetchReviews(1)])
  const ours = (cities ?? []).filter(c => CITIES.some(x => x.name === c.name))
  return {
    upcoming: ours.reduce((n, c) => n + c.upcoming_events, 0),
    liveCities: ours.filter(c => c.upcoming_events > 0).length,
    avgRating: reviews?.avg_rating ?? null,
    reviewCount: reviews?.review_count ?? 0,
  }
}

export async function cityCounts(): Promise<{ city: City; count: number }[]> {
  const live = await fetchCities()
  return CITIES.map(city => ({ city, count: live?.find(c => c.name === city.name)?.upcoming_events ?? 0 }))
}

export const BADGE_TIERS = [
  { key: 'rising', name: 'Rising', at: 2 },
  { key: 'established', name: 'Established', at: 10 },
  { key: 'elite', name: 'Elite', at: 25 },
  { key: 'legend', name: 'Legend', at: 75 },
] as const

export type BadgeTier = (typeof BADGE_TIERS)[number] & { hosts: PublicHostCard[] }

/** Each badge with real hosts who currently hold it (up to 6 per badge, most active first). */
export async function badgeTiers(): Promise<BadgeTier[]> {
  const lists = await Promise.all(CITIES.map(c => fetchHosts(c.name, undefined, 24)))
  const seen = new Set<string>()
  const all: PublicHostCard[] = []
  for (const l of lists) for (const h of l?.hosts ?? []) if (!seen.has(h.username)) { seen.add(h.username); all.push(h) }
  return BADGE_TIERS.map(t => ({ ...t, hosts: all.filter(h => h.badges.at(-1)?.toLowerCase() === t.key).slice(0, 6) }))
}

/** Real upcoming events with photos, for phone mock-ups. */
export async function featuredEvents(): Promise<SampleEvent[]> {
  const { events } = await cardEvents({ limit: 24 }, () => true)
  return events.filter(e => e.image).slice(0, 12)
}
