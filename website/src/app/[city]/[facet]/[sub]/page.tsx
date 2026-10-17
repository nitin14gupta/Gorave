import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { allAreaParams, getArea } from '@/lib/area'
import { fetchHosts } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { HostsView } from '@/components/sections/hosts/HostsView'

// /[city]/[area]/[sub]: today only the neighbourhood's hosts (/mumbai/bandra/hosts).
// Area × type pages (/mumbai/bandra/rooftop-parties) will resolve here later.
export const dynamicParams = false
export const revalidate = 60

export function generateStaticParams() {
  return allAreaParams().map(p => ({ ...p, sub: 'hosts' }))
}

function resolve(city: string, facet: string, sub: string) {
  return sub === 'hosts' ? getArea(city, facet) : undefined
}

export async function generateMetadata({ params }: PageProps<'/[city]/[facet]/[sub]'>): Promise<Metadata> {
  const { city, facet, sub } = await params
  const area = resolve(city, facet, sub)
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

export default async function AreaHostsPage({ params }: PageProps<'/[city]/[facet]/[sub]'>) {
  const { city, facet, sub } = await params
  const area = resolve(city, facet, sub)
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
