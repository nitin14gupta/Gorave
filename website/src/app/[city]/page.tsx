import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES, EVENT_TYPES } from '@/constants'
import { cityMetaDescription, getCity } from '@/lib/city'
import { getTypeStory } from '@/lib/eventType'
import { cardEvents, fetchEvents, TYPE_LABEL } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { CityPageView } from '@/components/sections/city/CityPageView'
import { TypeHubView } from '@/components/sections/type/TypeHubView'

// One root segment, two page families: a city (/mumbai) or an India-wide
// event-type hub (/house-parties). Anything else is a 404.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return [...CITIES.map(c => ({ city: c.slug })), ...EVENT_TYPES.map(t => ({ city: t.slug }))]
}

export async function generateMetadata({ params }: PageProps<'/[city]'>): Promise<Metadata> {
  const { city: slug } = await params
  const url = absoluteUrl(`/${slug}`)
  const story = getTypeStory(slug)
  if (story) {
    const title = `${story.plural} near you — hosted by real people across India`
    const description = `${story.heroLine} Find ${story.plural.toLowerCase()} in ${CITIES.slice(0, 4).map(c => c.name).join(', ')} and more. Verified 18+ guests, address after you’re in.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
  }
  const city = getCity(slug)
  if (!city) return {}
  const title = `House parties & things to do in ${city.name} this week`
  const description = cityMetaDescription(city)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function CityOrHubPage({ params }: PageProps<'/[city]'>) {
  const { city: slug } = await params
  const story = getTypeStory(slug)
  if (story) {
    const [{ events }, counts] = await Promise.all([
      cardEvents({ type: story.apiType, limit: 24 }, e => e.type === TYPE_LABEL[story.apiType]),
      Promise.all(CITIES.map(c => fetchEvents({ city: c.name, type: story.apiType, limit: 1 }))),
    ])
    const cities = CITIES.map((city, i) => ({ city, count: counts[i]?.total ?? 0 }))
    return <TypeHubView slug={slug} story={story} events={events} cities={cities} />
  }
  const city = getCity(slug)
  if (!city) notFound()
  return <CityPageView city={city} />
}
