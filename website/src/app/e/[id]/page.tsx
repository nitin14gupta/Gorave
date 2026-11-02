import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { cache } from 'react'
import { fetchEvent, longWhen, parseApiDate } from '@/lib/api'
import { eventPageData } from '@/lib/eventPage'
import { absoluteUrl } from '@/lib/seo'
import { JsonLd } from '@/components/ui/JsonLd'
import { EventDetailView } from '@/components/sections/event/EventDetailView'

// Event pages are what shared links open, rendered on demand for any id.
export const revalidate = 60

// Compare designs at /lab/event?id=<id>&v=a|b, then lock the pick here.
const EVENT_VARIANT = 'a'

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
      <EventDetailView variant={EVENT_VARIANT} event={e} {...await eventPageData(e)} />
    </>
  )
}
