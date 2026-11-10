import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { cn } from '@/lib/cn'
import { fetchEvent, fetchEvents } from '@/api/apiService'
import { eventPageData } from '@/lib/eventPage'
import { EventDetailView } from '@/components/sections/event/EventDetailView'

export const metadata: Metadata = { title: 'Event page lab', robots: { index: false, follow: false } }

const VARIANTS = [
  { k: 'a', label: 'A · Bento' },
  { k: 'b', label: 'B · Poster' },
] as const

// Internal: compare event-page designs before locking EVENT_VARIANT in /e/[id].
export default async function EventLab({ searchParams }: PageProps<'/lab/event'>) {
  const sp = await searchParams
  const v = sp.v === 'b' ? 'b' : 'a'
  const id = typeof sp.id === 'string' ? sp.id : (await fetchEvents({ limit: 1 }))?.events[0]?.id
  const e = id ? await fetchEvent(id) : null
  if (!e) notFound()
  // Preview any host's choice: ?photos=1 to 5 repeats or trims the covers.
  const n = Number(sp.photos)
  if (n >= 1 && n <= 5) e.cover_photos = Array.from({ length: n }, (_, i) => `${e.cover_photos[i % e.cover_photos.length]}&v=${i}`)

  return (
    <>
      <EventDetailView variant={v} event={e} {...await eventPageData(e)} />
      <div className="fixed bottom-5 left-5 z-[60] flex flex-col gap-2 rounded-[22px] bg-ink/90 p-2.5 text-cream shadow-pop backdrop-blur">
        <div className="px-2 pt-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Variant</div>
        <div className="flex gap-1">
          {VARIANTS.map(x => (
            <Link
              key={x.k}
              href={`/lab/event?id=${e.id}&v=${x.k}`}
              scroll={false}
              className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', x.k === v ? 'bg-cream text-ink' : 'text-noir-ink-2 hover:text-cream')}
            >
              {x.label}
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
