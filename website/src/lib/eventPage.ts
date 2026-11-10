import { EVENT_TYPES } from '@/constants'
import { fetchEvents, toCardEvent, type PublicEventDetail } from '@/api/apiService'
import { findArea } from '@/lib/area'
import { getCity } from '@/lib/city'
import { slugify } from '@/lib/seo'

const MORE_NIGHTS = 4

/** What the event page needs around the event: breadcrumbs and a full row of other nights. */
export async function eventPageData(e: PublicEventDetail) {
  const type = EVENT_TYPES.find(t => t.key === e.event_type)
  const city = e.city ? getCity(slugify(e.city)) : undefined
  // Same kind of night first, then anything else in the city, so the row never sits half empty.
  const [sameType, anyType] = e.city
    ? await Promise.all([
        fetchEvents({ city: e.city, type: e.event_type, limit: MORE_NIGHTS + 1 }),
        fetchEvents({ city: e.city, limit: MORE_NIGHTS * 2 }),
      ])
    : [null, null]
  const seen = new Set([e.id])
  const more = [...(sameType?.events ?? []), ...(anyType?.events ?? [])]
    .filter(m => !seen.has(m.id) && seen.add(m.id))
    .slice(0, MORE_NIGHTS)
    .map(toCardEvent)

  const area = findArea(e.city, e.area)
  const crumbs = [
    { label: 'Home', href: '/' },
    ...(city ? [{ label: city.name, href: `/${city.slug}` }] : []),
    ...(city && area ? [{ label: area.name, href: `/${city.slug}/${area.slug}` }] : []),
    ...(city && type ? [{ label: type.label, href: `/${city.slug}/${type.slug}` }] : []),
    { label: e.title, href: `/e/${e.id}` },
  ]
  return { more, crumbs, areaHref: city && area ? `/${city.slug}/${area.slug}` : undefined }
}
