import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES, EVENT_TYPES } from '@/constants'
import { getCity } from '@/lib/city'
import { getTypeStory } from '@/lib/eventType'
import { cardEvents, TYPE_LABEL } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { TypePageView } from '@/components/sections/type/TypePageView'

// /[city]/[facet] — today facets are the six event types (/mumbai/house-parties).
// Time, price, crowd and area facets will resolve here too; anything else is a 404.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return CITIES.flatMap(c => EVENT_TYPES.map(t => ({ city: c.slug, facet: t.slug })))
}

function resolve(citySlug: string, facet: string) {
  const city = getCity(citySlug)
  const story = getTypeStory(facet)
  return city && story ? { city, story } : null
}

export async function generateMetadata({ params }: PageProps<'/[city]/[facet]'>): Promise<Metadata> {
  const { city: c, facet } = await params
  const r = resolve(c, facet)
  if (!r) return {}
  const { city, story } = r
  const title = `${story.plural} in ${city.name} this week`
  const description = `${story.heroLine} Find ${story.plural.toLowerCase()} across ${city.areas.slice(0, 3).join(', ')} and more in ${city.name} — request to join free ones, book paid ones with UPI.`
  const url = absoluteUrl(`/${city.slug}/${facet}`)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function CityTypePage({ params }: PageProps<'/[city]/[facet]'>) {
  const { city: c, facet } = await params
  const r = resolve(c, facet)
  if (!r) notFound()
  const { city, story } = r
  const { events } = await cardEvents(
    { city: city.name, type: story.apiType, limit: 24 },
    e => e.city === city.name && e.type === TYPE_LABEL[story.apiType],
  )
  return <TypePageView city={city} slug={facet} story={story} events={events} />
}
