import type { Metadata } from 'next'
import { CITIES } from '@/constants'
import { fetchCities } from '@/lib/api'
import { absoluteUrl } from '@/lib/seo'
import { CitiesView } from '@/components/sections/cities/CitiesView'

export const revalidate = 60

const title = 'Cities — house parties & things to do across India'
const description = `Find house parties, rooftops, game nights and dinner parties hosted by real people in ${CITIES.map(c => c.name).join(', ')}.`

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: absoluteUrl('/cities') },
  openGraph: { title, description, url: absoluteUrl('/cities') },
}

export default async function CitiesPage() {
  const live = await fetchCities()
  const cities = CITIES.map(city => ({ city, count: live?.find(c => c.name === city.name)?.upcoming_events ?? 0 }))
  const crumbs = [{ label: 'Home', href: '/' }, { label: 'Cities', href: '/cities' }]
  return <CitiesView cities={cities} crumbs={crumbs} />
}
