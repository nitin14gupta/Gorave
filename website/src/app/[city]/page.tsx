import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES, EVENT_TYPES } from '@/constants'
import { cityMetaDescription, getCity } from '@/lib/city'
import { getTypeStory } from '@/lib/eventType'
import { cardEvents, fetchEvents, fetchHosts, TYPE_LABEL } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { CityPageView } from '@/components/sections/city/CityPageView'
import { TypeHubView } from '@/components/sections/type/TypeHubView'
import { CROWDS, getCrowd } from '@/lib/crowd'
import { crowdPageData } from '@/lib/crowdPage'
import { CrowdPageView } from '@/components/sections/crowd/CrowdPageView'
import { TIMES, getTime } from '@/lib/time'
import { timePageData } from '@/lib/timePage'
import { TimePageView } from '@/components/sections/time/TimePageView'
import { PRICES, getPrice, pricePageData } from '@/lib/price'
import { OCCASIONS, getOccasion, occasionPageData } from '@/lib/occasion'
import { OccasionPageView } from '@/components/sections/occasion/OccasionPageView'
import { PricePageView } from '@/components/sections/price/PricePageView'

// One root segment, two page families: a city (/mumbai) or an India-wide
// event-type hub (/house-parties). Anything else is a 404.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return [...CITIES.map(c => ({ city: c.slug })), ...EVENT_TYPES.map(t => ({ city: t.slug })), ...CROWDS.map(c => ({ city: c.slug })), ...TIMES.map(t => ({ city: t.slug })), ...PRICES.map(p => ({ city: p.slug })), ...OCCASIONS.map(o => ({ city: o.slug }))]
}

export async function generateMetadata({ params }: PageProps<'/[city]'>): Promise<Metadata> {
  const { city: slug } = await params
  const url = absoluteUrl(`/${slug}`)
  const occ = getOccasion(slug)
  if (occ) {
    const title = `${occ.name} parties across India: house parties & events`
    const description = `${occ.heroLine} Find ${occ.name} house parties in ${CITIES.slice(0, 4).map(c => c.name).join(', ')} and more on Gorave.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
  }
  const price = getPrice(slug)
  if (price) {
    const title = price.slug === 'free-events' ? 'Free events & house parties across India' : 'Events under ₹500: cheap house parties & nights out in India'
    const description = `${price.heroLine} Live listings in ${CITIES.slice(0, 4).map(c => c.name).join(', ')} and more on Gorave.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
  }
  const time = getTime(slug)
  if (time) {
    const title = `${time.label}: house parties & things to do across India`
    const description = `${time.heroLine} Live listings in ${CITIES.slice(0, 4).map(c => c.name).join(', ')} and more on Gorave.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: [time.image] } }
  }
  const crowd = getCrowd(slug)
  if (crowd) {
    const title = `${crowd.label} parties & nights across India`
    const description = `${crowd.heroLine} Find ${crowd.nights} in ${CITIES.slice(0, 4).map(c => c.name).join(', ')} and more on Gorave.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: [crowd.image] } }
  }
  const story = getTypeStory(slug)
  if (story) {
    const title = `${story.plural} near you · hosted by real people across India`
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
  const occ = getOccasion(slug)
  if (occ) return <OccasionPageView {...await occasionPageData(occ)} />
  const price = getPrice(slug)
  if (price) return <PricePageView {...await pricePageData(price)} />
  const time = getTime(slug)
  if (time) return <TimePageView {...await timePageData(time)} />
  const crowd = getCrowd(slug)
  if (crowd) return <CrowdPageView {...await crowdPageData(crowd)} />
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
  const [{ events }, hostList] = await Promise.all([
    cardEvents({ city: city.name, limit: 24 }, e => e.city === city.name),
    fetchHosts(city.name, undefined, 6),
  ])
  return <CityPageView city={city} events={events} hosts={hostList?.hosts ?? []} hostTotal={hostList?.total ?? 0} />
}
