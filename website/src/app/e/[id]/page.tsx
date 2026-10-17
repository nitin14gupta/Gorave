import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { EVENT_TYPES } from '@/constants'
import { fetchEvent, fetchEvents, longWhen, parseApiDate, toCardEvent } from '@/lib/api'
import { getCity } from '@/lib/city'
import { absoluteUrl, slugify } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { EventDetailView } from '@/components/sections/event/EventDetailView'

// Event pages are what shared links open, rendered on demand for any id.
export const revalidate = 60

const getEvent = cache((id: string) => fetchEvent(id))

export async function generateMetadata({ params }: PageProps<'/e/[id]'>): Promise<Metadata> {
  const { id } = await params
  const e = await getEvent(id)
  if (!e) return { title: 'Event not found', robots: { index: false } }
  const place = [e.area, e.city].filter(Boolean).join(', ')
  const title = `${e.title} · ${place}`
  const description = `${longWhen(e.date_time)} in ${place}. ${e.is_free ? 'Free · request to join' : `₹${e.price_inr}`} · hosted by ${e.host.name ?? e.host.username} on Gorave.`
  const url = absoluteUrl(`/e/${e.id}`)
  // Past or cancelled events stay reachable for people who have the link, but not in search.
  const stale = e.is_cancelled || parseApiDate(e.date_time).getTime() < Date.now()
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, images: e.cover_photos[0] ? [e.cover_photos[0]] : undefined },
    twitter: { card: 'summary_large_image', title, description },
    robots: stale ? { index: false, follow: true } : undefined,
  }
}

export default async function EventPage({ params }: PageProps<'/e/[id]'>) {
  const { id } = await params
  const e = await getEvent(id)
  if (!e) notFound()

  const type = EVENT_TYPES.find(t => t.key === e.event_type)
  const city = e.city ? getCity(slugify(e.city)) : undefined
  const related = e.city ? await fetchEvents({ city: e.city, type: e.event_type, limit: 4 }) : null
  const more = (related?.events ?? []).filter(m => m.id !== e.id).slice(0, 3).map(toCardEvent)

  const crumbs = [
    { label: 'Home', href: '/' },
    ...(city ? [{ label: city.name, href: `/${city.slug}` }] : []),
    ...(city && type ? [{ label: type.label, href: `/${city.slug}/${type.slug}` }] : []),
    { label: e.title, href: `/e/${e.id}` },
  ]

  return (
    <>
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'Event',
          name: e.title,
          description: e.description ?? undefined,
          startDate: parseApiDate(e.date_time).toISOString(),
          endDate: e.end_time ? parseApiDate(e.end_time).toISOString() : undefined,
          eventStatus: e.is_cancelled ? 'https://schema.org/EventCancelled' : 'https://schema.org/EventScheduled',
          eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
          image: e.cover_photos,
          // Area-level location only, the exact address is never public.
          location: { '@type': 'Place', name: [e.area, e.city].filter(Boolean).join(', '), address: { '@type': 'PostalAddress', addressLocality: e.area ?? e.city ?? undefined, addressRegion: e.city ?? undefined, addressCountry: 'IN' } },
          offers: { '@type': 'Offer', price: e.price_inr, priceCurrency: 'INR', availability: e.spots_left > 0 ? 'https://schema.org/InStock' : 'https://schema.org/SoldOut', url: absoluteUrl(`/e/${e.id}`) },
          organizer: { '@type': 'Person', name: e.host.name ?? e.host.username, url: e.host.username ? absoluteUrl(`/h/${e.host.username}`) : undefined },
        }}
      />
      <EventDetailView event={e} more={more} crumbs={crumbs} />
    </>
  )
}
