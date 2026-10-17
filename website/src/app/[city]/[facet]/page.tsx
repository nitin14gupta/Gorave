import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES, EVENT_TYPES } from '@/constants'
import { getCity } from '@/lib/city'
import { getTypeStory } from '@/lib/eventType'
import { allAreaParams, cityStreet, getArea } from '@/lib/area'
import { areaPageData } from '@/lib/areaPage'
import { cardEvents, TYPE_LABEL } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { TypePageView } from '@/components/sections/type/TypePageView'
import { AreaPageView } from '@/components/sections/area/AreaPageView'

// /[city]/[facet] — a facet is an event type (/mumbai/house-parties) or a
// neighbourhood (/mumbai/bandra). Time, price and crowd facets will resolve
// here too; anything else is a 404.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return [...CITIES.flatMap(c => EVENT_TYPES.map(t => ({ city: c.slug, facet: t.slug }))), ...allAreaParams()]
}

function resolve(citySlug: string, facet: string) {
  const city = getCity(citySlug)
  if (!city) return null
  const story = getTypeStory(facet)
  if (story) return { kind: 'type' as const, city, story }
  const area = getArea(citySlug, facet)
  if (area) return { kind: 'area' as const, area }
  return null
}

export async function generateMetadata({ params }: PageProps<'/[city]/[facet]'>): Promise<Metadata> {
  const { city: c, facet } = await params
  const r = resolve(c, facet)
  if (!r) return {}
  const url = absoluteUrl(`/${c}/${facet}`)
  if (r.kind === 'area') {
    const { name, city, profile } = r.area
    const title = `House parties & things to do in ${name}, ${city.name}`
    const description = `${name} — ${profile.line}. Find house parties, rooftops, game nights and dinner parties hosted by people in ${name}. Verified 18+ guests, address after you’re in.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: [cityStreet(city.slug)] } }
  }
  const { city, story } = r
  const title = `${story.plural} in ${city.name} this week`
  const description = `${story.heroLine} Find ${story.plural.toLowerCase()} across ${city.areas.slice(0, 3).join(', ')} and more in ${city.name} — request to join free ones, book paid ones with UPI.`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function CityFacetPage({ params }: PageProps<'/[city]/[facet]'>) {
  const { city: c, facet } = await params
  const r = resolve(c, facet)
  if (!r) notFound()
  if (r.kind === 'area') return <AreaPageView {...await areaPageData(r.area)} />
  const { city, story } = r
  const { events } = await cardEvents(
    { city: city.name, type: story.apiType, limit: 24 },
    e => e.city === city.name && e.type === TYPE_LABEL[story.apiType],
  )
  return <TypePageView city={city} slug={facet} story={story} events={events} />
}
