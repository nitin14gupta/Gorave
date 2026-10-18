import { EVENT_TYPES, PHOTOS, type EventType, type SampleEvent } from '@/constants'
import { cardEvents, fetchHosts, TYPE_LABEL, type PublicHostCard } from './api'
import { allAreaParams, areaFaq, cityStreet, getArea, type Area } from './area'
import { areaSlug } from './city'
import { getTypeStory, type TypeContent } from './eventType'
import type { Crumb } from './seo'

// Area × type pages (/mumbai/bandra/house-parties): one kind of night in one
// neighbourhood. Sparse by nature (most pairs have 0–3 events), so every page
// also carries the same night nearby and the other nights in the area.

export interface AreaTypeCount {
  name: string
  slug: string
  href: string
  count: number
  image: string
}

/** One neighbourhood row of the city grid: a count per kind of night. */
export interface GridRow {
  name: string
  slug: string
  cells: { type: string; label: string; href: string; count: number; image: string }[]
}

export interface AreaTypeProps {
  area: Area
  type: EventType
  story: TypeContent
  /** Events of this type in this area */
  events: SampleEvent[]
  /** Same type elsewhere in the city, for when this area is quiet */
  nearby: SampleEvent[]
  /** The same type in the area's neighbours */
  neighbours: AreaTypeCount[]
  /** The other types in this area */
  others: AreaTypeCount[]
  /** Every neighbourhood × every kind of night in the city */
  grid: GridRow[]
  hosts: PublicHostCard[]
  hostTotal: number
  crumbs: Crumb[]
  faq: { q: string; a: string }[]
}

export function getAreaType(citySlug: string, areaSlugStr: string, typeSlug: string) {
  const area = getArea(citySlug, areaSlugStr)
  const type = EVENT_TYPES.find(t => t.slug === typeSlug)
  const story = getTypeStory(typeSlug)
  return area && type && story ? { area, type, story } : undefined
}

export const allAreaTypeParams = () => allAreaParams().flatMap(p => EVENT_TYPES.map(t => ({ ...p, sub: t.slug })))

const inArea = (e: SampleEvent, name: string) => e.area.toLowerCase().startsWith(name.toLowerCase())
const ofType = (e: SampleEvent, t: EventType) => e.type === (TYPE_LABEL[t.key] ?? 'Event')

export function areaTypeFaq(area: Area, story: TypeContent) {
  const { name } = area
  const noun = story.plural.toLowerCase()
  const [, address, , alone] = areaFaq(area)
  return [
    {
      q: `Where can I find ${noun} in ${name}?`,
      a: `On Gorave. People who live in and around ${name} list ${noun} in the app, and this page shows what’s on right now. Free ones are request-to-join; paid ones book instantly with UPI.`,
    },
    address,
    {
      q: `Can I host a ${story.singular} in ${name}?`,
      a: 'Yes. Listing is free and takes a few minutes in the app. You can run 2 free-entry events a month; on paid events (from ₹99) you keep 90% of every ticket.',
    },
    alone,
  ]
}

/** Server-side data for /[city]/[area]/[type]. Two event calls shared across pages (area, city). */
export async function areaTypePageData(citySlug: string, areaSlugStr: string, typeSlug: string): Promise<AreaTypeProps | undefined> {
  const found = getAreaType(citySlug, areaSlugStr, typeSlug)
  if (!found) return undefined
  const { area, type, story } = found
  const { city } = area
  const [{ events: areaAll }, { events: cityAll }, hostList] = await Promise.all([
    cardEvents({ city: city.name, area: area.name, limit: 100 }, e => e.city === city.name && inArea(e, area.name)),
    cardEvents({ city: city.name, limit: 100 }, e => e.city === city.name),
    fetchHosts(city.name, area.name, 8),
  ])

  const events = areaAll.filter(e => ofType(e, type))
  const sameType = cityAll.filter(e => ofType(e, type))
  const nearby = sameType.filter(e => !inArea(e, area.name)).slice(0, 6)
  const firstImage = (list: SampleEvent[]) => list.find(e => e.image)?.image

  const neighbours = area.neighbours.map(n => {
    const list = sameType.filter(e => inArea(e, n))
    return {
      name: n,
      slug: areaSlug(n),
      href: `/${city.slug}/${areaSlug(n)}/${type.slug}`,
      count: list.length,
      image: firstImage(list) ?? cityStreet(city.slug),
    }
  })

  const others = EVENT_TYPES.filter(t => t.slug !== type.slug).map(t => {
    const list = areaAll.filter(e => ofType(e, t))
    return {
      name: t.label,
      slug: t.slug,
      href: `/${city.slug}/${area.slug}/${t.slug}`,
      count: list.length,
      image: firstImage(list) ?? PHOTOS[t.photo],
    }
  })

  const grid: GridRow[] = city.areas.map(a => ({
    name: a,
    slug: areaSlug(a),
    cells: EVENT_TYPES.map(t => {
      const list = cityAll.filter(e => ofType(e, t) && inArea(e, a))
      return { type: t.slug, label: t.label, href: `/${city.slug}/${areaSlug(a)}/${t.slug}`, count: list.length, image: firstImage(list) ?? PHOTOS[t.photo] }
    }),
  }))

  const { faq: _faq, ...content } = story
  void _faq
  const crumbs: Crumb[] = [
    { label: 'Home', href: '/' },
    { label: city.name, href: `/${city.slug}` },
    { label: area.name, href: `/${city.slug}/${area.slug}` },
    { label: story.plural, href: `/${city.slug}/${area.slug}/${type.slug}` },
  ]
  return {
    area, type, story: content, events, nearby, neighbours, others, grid,
    hosts: hostList?.hosts ?? [], hostTotal: hostList?.total ?? 0,
    crumbs, faq: areaTypeFaq(area, content),
  }
}
