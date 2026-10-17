import { CITIES, type City, type SampleEvent } from '@/constants'
import { cardEvents, fetchEvents } from './api'
import { cityStreet, findArea } from './area'
import { areaSlug } from './city'
import { TIMES, type TimeStory } from './time'
import type { TimeViewProps } from '@/components/sections/time/types'

const dayLabel = (key: string) =>
  new Date(`${key}T12:00:00+05:30`).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' })

/** Server-side data for a time page: India-wide (city undefined) or one city. */
export async function timePageData(time: TimeStory, city?: City): Promise<TimeViewProps> {
  const base = city ? `/${city.slug}` : ''
  const cityQ = city ? { city: city.name } : {}
  const [{ events, total }, otherCounts] = await Promise.all([
    cardEvents({ when: time.when, ...cityQ, limit: 60 }, e => !city || e.city === city.name),
    Promise.all(TIMES.map(t => (t.slug === time.slug ? null : fetchEvents({ when: t.when, ...cityQ, limit: 1 })))),
  ])

  // Group by IST date, keeping the API's soonest-first order.
  const byDay = new Map<string, SampleEvent[]>()
  for (const e of events) {
    const k = e.date ?? 'soon'
    byDay.set(k, [...(byDay.get(k) ?? []), e])
  }
  const days = [...byDay.entries()].map(([key, list]) => ({ key, label: key === 'soon' ? 'Coming up' : dayLabel(key), events: list }))

  let places: TimeViewProps['places']
  if (city) {
    const counts = new Map<string, number>()
    for (const e of events) {
      const a = findArea(city.name, e.area)
      if (a) counts.set(a.slug, (counts.get(a.slug) ?? 0) + 1)
    }
    places = city.areas.map(a => ({ label: a, href: `/${city.slug}/${areaSlug(a)}`, count: counts.get(areaSlug(a)) ?? 0, image: cityStreet(city.slug) }))
  } else {
    const per = await Promise.all(CITIES.map(c => fetchEvents({ when: time.when, city: c.name, limit: 1 })))
    places = CITIES.map((c, i) => ({ label: c.name, href: `/${c.slug}/${time.slug}`, count: per[i]?.total ?? 0, image: cityStreet(c.slug) }))
  }

  const placeName = city?.name ?? 'India'
  const { faq, ...content } = time
  return {
    time: content,
    place: { name: placeName, citySlug: city?.slug ?? null },
    events,
    total,
    days,
    places,
    others: TIMES.flatMap((t, i) => (t.slug === time.slug ? [] : [{ slug: t.slug, label: t.label, href: `${base}/${t.slug}`, promise: t.promise, image: t.image, count: otherCounts[i]?.total ?? 0 }])),
    faq: faq(placeName),
    crumbs: [
      { label: 'Home', href: '/' },
      ...(city ? [{ label: city.name, href: `/${city.slug}` }] : []),
      { label: time.label, href: `${base}/${time.slug}` },
    ],
  }
}
