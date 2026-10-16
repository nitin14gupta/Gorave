import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CITIES } from '@/constants'
import { cityMetaDescription, getCity } from '@/lib/city'
import { absoluteUrl } from '@/lib/seo'
import { CityPageView } from '@/components/sections/city/CityPageView'

// Only the cities we operate in get a page; anything else is a 404.
export const dynamicParams = false

export function generateStaticParams() {
  return CITIES.map(c => ({ city: c.slug }))
}

export async function generateMetadata({ params }: PageProps<'/[city]'>): Promise<Metadata> {
  const { city: slug } = await params
  const city = getCity(slug)
  if (!city) return {}
  const title = `House parties & things to do in ${city.name} this week`
  const description = cityMetaDescription(city)
  const url = absoluteUrl(`/${city.slug}`)
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url } }
}

export default async function CityPage({ params }: PageProps<'/[city]'>) {
  const { city: slug } = await params
  const city = getCity(slug)
  if (!city) notFound()
  return <CityPageView city={city} />
}
