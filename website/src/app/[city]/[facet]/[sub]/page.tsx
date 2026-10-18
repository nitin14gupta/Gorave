import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allAreaParams, getArea } from '@/lib/area'
import { allAreaTypeParams, areaTypePageData, getAreaType } from '@/lib/areaType'
import { fetchHosts } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { HostsView } from '@/components/sections/hosts/HostsView'
import { AreaTypePageView } from '@/components/sections/areaType/AreaTypePageView'

// /[city]/[area]/[sub]: the neighbourhood's hosts (/mumbai/bandra/hosts) or
// one kind of night in it (/mumbai/bandra/house-parties).
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return [...allAreaParams().map(p => ({ ...p, sub: 'hosts' })), ...allAreaTypeParams()]
}

export async function generateMetadata({ params }: PageProps<'/[city]/[facet]/[sub]'>): Promise<Metadata> {
  const { city, facet, sub } = await params
  if (sub === 'hosts') {
    const area = getArea(city, facet)
    if (!area) return {}
    const title = `Hosts in ${area.name}, ${area.city.name}`
    const description = `Meet the people hosting house parties, rooftops, game nights and dinner parties in ${area.name}, ${area.city.name}. Ratings, badges and upcoming nights on Gorave.`
    const url = absoluteUrl(`/${city}/${facet}/hosts`)
    const list = await fetchHosts(area.city.name, area.name, 1)
    return {
      title, description,
      alternates: { canonical: url },
      openGraph: { title, description, url },
      robots: (list?.total ?? 0) >= 2 ? undefined : { index: false, follow: true },
    }
  }
  const found = getAreaType(city, facet, sub)
  if (!found) return {}
  const { area, story } = found
  const data = await areaTypePageData(city, facet, sub)
  const title = `${story.plural} in ${area.name}, ${area.city.name}`
  const description = `Find ${story.plural.toLowerCase()} in ${area.name}, ${area.city.name}, hosted by people who live there. Request to join free ones or book with UPI. Verified 18+ guests, address shared only once you're in.`
  const url = absoluteUrl(`/${city}/${facet}/${sub}`)
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    // Thin until something is actually listed here.
    robots: (data?.events.length ?? 0) > 0 ? undefined : { index: false, follow: true },
  }
}

export default async function AreaSubPage({ params }: PageProps<'/[city]/[facet]/[sub]'>) {
  const { city, facet, sub } = await params
  if (sub !== 'hosts') {
    const data = await areaTypePageData(city, facet, sub)
    if (!data) notFound()
    return <AreaTypePageView {...data} />
  }
  const area = getArea(city, facet)
  if (!area) notFound()
  const list = await fetchHosts(area.city.name, area.name, 48)
  const crumbs = [
    { label: 'Home', href: '/' },
    { label: area.city.name, href: `/${area.city.slug}` },
    { label: area.name, href: `/${area.city.slug}/${area.slug}` },
    { label: 'Hosts', href: `/${area.city.slug}/${area.slug}/hosts` },
  ]
  return <HostsView city={area.city} area={area.name} hosts={list?.hosts ?? []} total={list?.total ?? 0} crumbs={crumbs} />
}
