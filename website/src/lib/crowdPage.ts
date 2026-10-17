import { CITIES, type City } from '@/constants'
import { cardEvents, fetchEvents } from './api'
import { cityStreet, findArea } from './area'
import { areaSlug } from './city'
import { CROWDS, type CrowdStory } from './crowd'
import type { CrowdViewProps } from '@/components/sections/crowd/types'

/** Server-side data for a crowd page: India-wide (city undefined) or one city. */
export async function crowdPageData(crowd: CrowdStory, city?: City): Promise<CrowdViewProps> {
  const query = { ...crowd.query, ...(city ? { city: city.name } : {}) }
  const { events, total } = await cardEvents({ ...query, limit: 48 }, e => crowd.sample(e) && (!city || e.city === city.name))

  let places: CrowdViewProps['places']
  if (city) {
    // Neighbourhoods of this city, with how many of these events each has right now.
    const counts = new Map<string, number>()
    for (const e of events) {
      const a = findArea(city.name, e.area)
      if (a) counts.set(a.slug, (counts.get(a.slug) ?? 0) + 1)
    }
    places = city.areas.map(a => ({ label: a, href: `/${city.slug}/${areaSlug(a)}`, count: counts.get(areaSlug(a)) ?? 0, image: cityStreet(city.slug) }))
  } else {
    const perCity = await Promise.all(CITIES.map(c => fetchEvents({ ...crowd.query, city: c.name, limit: 1 })))
    places = CITIES.map((c, i) => ({ label: c.name, href: `/${c.slug}/${crowd.slug}`, count: perCity[i]?.total ?? 0, image: cityStreet(c.slug) }))
  }

  const base = city ? `/${city.slug}` : ''
  const placeName = city?.name ?? 'India'
  const { faq, sample, ...content } = crowd
  void sample
  return {
    crowd: content,
    place: { name: placeName, citySlug: city?.slug ?? null },
    events,
    total,
    places,
    others: CROWDS.filter(c => c.slug !== crowd.slug).map(c => ({ slug: c.slug, label: c.label, href: `${base}/${c.slug}`, promise: c.promise, image: c.image })),
    faq: faq(placeName),
    crumbs: [
      { label: 'Home', href: '/' },
      ...(city ? [{ label: city.name, href: `/${city.slug}` }] : []),
      { label: crowd.label, href: `${base}/${crowd.slug}` },
    ],
  }
}
