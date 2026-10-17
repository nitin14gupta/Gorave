import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES, EVENT_TYPES } from '@/constants'
import { getCity } from '@/lib/city'
import { getTypeStory } from '@/lib/eventType'
import { allAreaParams, cityStreet, getArea } from '@/lib/area'
import { areaPageData } from '@/lib/areaPage'
import { cardEvents, fetchEvents, fetchHosts, TYPE_LABEL } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { TypePageView } from '@/components/sections/type/TypePageView'
import { AreaPageView } from '@/components/sections/area/AreaPageView'
import { HostsView } from '@/components/sections/hosts/HostsView'
import { CROWDS, getCrowd } from '@/lib/crowd'
import { crowdPageData } from '@/lib/crowdPage'
import { CrowdPageView } from '@/components/sections/crowd/CrowdPageView'

// /[city]/[facet], a facet is an event type (/mumbai/house-parties), a
// neighbourhood (/mumbai/bandra) or the city's hosts (/mumbai/hosts). Time, price and crowd facets will resolve
// here too; anything else is a 404.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return [
    ...CITIES.flatMap(c => EVENT_TYPES.map(t => ({ city: c.slug, facet: t.slug }))),
    ...allAreaParams(),
    ...CITIES.map(c => ({ city: c.slug, facet: 'hosts' })),
    ...CITIES.flatMap(c => CROWDS.map(cr => ({ city: c.slug, facet: cr.slug }))),
  ]
}

function resolve(citySlug: string, facet: string) {
  const city = getCity(citySlug)
  if (!city) return null
  if (facet === 'hosts') return { kind: 'hosts' as const, city }
  const crowd = getCrowd(facet)
  if (crowd) return { kind: 'crowd' as const, city, crowd }
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
  if (r.kind === 'crowd') {
    const { city, crowd } = r
    const title = `${crowd.label} parties & nights in ${city.name}`
    const description = `${crowd.heroLine} Find ${crowd.nights} across ${city.areas.slice(0, 3).join(', ')} and more in ${city.name}.`
    const live = await fetchEvents({ ...crowd.query, city: city.name, limit: 1 })
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: [crowd.image] }, robots: (live?.total ?? 0) >= 3 ? undefined : { index: false, follow: true } }
  }
  if (r.kind === 'hosts') {
    const title = `Hosts in ${r.city.name}: the people throwing house parties`
    const description = `Meet the people hosting house parties, rooftops, game nights and dinner parties in ${r.city.name}. See their ratings, badges and upcoming nights on Gorave.`
    const list = await fetchHosts(r.city.name, undefined, 1)
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url }, robots: (list?.total ?? 0) >= 2 ? undefined : { index: false, follow: true } }
  }
  if (r.kind === 'area') {
    const { name, city, profile } = r.area
    const title = `House parties & things to do in ${name}, ${city.name}`
    const description = `${name}: ${profile.line}. Find house parties, rooftops, game nights and dinner parties hosted by people in ${name}. Verified 18+ guests, address after you’re in.`
    return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, images: [cityStreet(city.slug)] } }
  }
  const { city, story } = r
  const title = `${story.plural} in ${city.name} this week`
  const description = `${story.heroLine} Find ${story.plural.toLowerCase()} across ${city.areas.slice(0, 3).join(', ')} and more in ${city.name}. Request to join free ones or book paid ones with UPI.`
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function CityFacetPage({ params }: PageProps<'/[city]/[facet]'>) {
  const { city: c, facet } = await params
  const r = resolve(c, facet)
  if (!r) notFound()
  if (r.kind === 'crowd') return <CrowdPageView {...await crowdPageData(r.crowd, r.city)} />
  if (r.kind === 'hosts') {
    const list = await fetchHosts(r.city.name, undefined, 48)
    const crumbs = [
      { label: 'Home', href: '/' },
      { label: r.city.name, href: `/${r.city.slug}` },
      { label: 'Hosts', href: `/${r.city.slug}/hosts` },
    ]
    return <HostsView city={r.city} hosts={list?.hosts ?? []} total={list?.total ?? 0} crumbs={crumbs} />
  }
  if (r.kind === 'area') return <AreaPageView {...await areaPageData(r.area)} />
  const { city, story } = r
  const { events } = await cardEvents(
    { city: city.name, type: story.apiType, limit: 24 },
    e => e.city === city.name && e.type === TYPE_LABEL[story.apiType],
  )
  return <TypePageView city={city} slug={facet} story={story} events={events} />
}
