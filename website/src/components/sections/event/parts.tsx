import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { EVENT_TYPES, PHOTOS, type SampleEvent } from '@/constants'
import { longWhen, parseApiDate, type PublicEventDetail } from '@/lib/api'
import { getCity } from '@/lib/city'
import { slugify } from '@/lib/seo'
import { cn } from '@/lib/cn'
import { Chip } from '@/components/ui/atoms'
import { AvatarImage } from '@/components/ui/AvatarImage'

export type EventViewProps = {
  event: PublicEventDetail
  more: SampleEvent[]
  crumbs: { label: string; href: string }[]
  areaHref?: string
}

const mixLabel = (p: number | null) => (p == null ? null : p >= 100 ? 'Women only' : p <= 0 ? 'Men only' : `${p}:${100 - p} crowd`)
const CHIP = 'bg-tile text-ink'

/** The facts both layouts share, worked out once. */
export function eventFacts(e: PublicEventDetail) {
  const past = parseApiDate(e.date_time).getTime() < Date.now()
  const full = e.spots_left <= 0
  const closed = e.is_cancelled || past
  return {
    type: EVENT_TYPES.find(t => t.key === e.event_type),
    city: e.city ? getCity(slugify(e.city)) : undefined,
    photos: e.cover_photos.length ? e.cover_photos : [PHOTOS[EVENT_TYPES.find(t => t.key === e.event_type)?.photo ?? 'party1']],
    mix: mixLabel(e.women_pct),
    full,
    closed,
    price: e.is_free ? 'Free' : `₹${e.price_inr.toLocaleString('en-IN')}`,
    priceNote: e.is_free ? 'Host approves each guest' : '+ ₹50 platform fee',
    action: e.is_cancelled ? 'This night was cancelled' : past ? 'This night has passed' : full ? 'Join the waitlist in the app' : e.join_mode === 'request' ? 'Request to join in the app' : 'Book your spot in the app',
    // The same rules the server applies when a guest cancels.
    cancelNote: e.is_free
      ? 'Cancel for free up to 2 hours before.'
      : `Cancel 48 hours before and ₹${e.price_inr.toLocaleString('en-IN')} goes back to your wallet. If the host cancels, you get everything back.`,
  }
}

/** "Monday, 2 November · 8 pm to 12 am", with the end time when the host set one. */
export function whenLine(e: PublicEventDetail) {
  if (!e.end_time) return longWhen(e.date_time)
  const end = parseApiDate(e.end_time).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' })
  return `${longWhen(e.date_time)} to ${end}`
}

export function FactChips({ event: e }: { event: PublicEventDetail }) {
  const { type, mix } = eventFacts(e)
  return (
    <div className="flex flex-wrap gap-1.5">
      {type && <Chip className={CHIP}>{type.label}</Chip>}
      {mix && <Chip className={CHIP}>{mix}</Chip>}
      {e.age_restriction > 18 && <Chip className={CHIP}>{e.age_restriction}+</Chip>}
    </div>
  )
}

export function Place({ event: e, areaHref }: { event: PublicEventDetail; areaHref?: string }) {
  const { city } = eventFacts(e)
  return (
    <>
      {areaHref ? <Link href={areaHref} className="underline-offset-4 hover:underline">{e.area}</Link> : e.area}
      {e.area && e.city ? ', ' : ''}
      {city ? <Link href={`/${city.slug}`} className="underline-offset-4 hover:underline">{e.city}</Link> : e.city}
    </>
  )
}

export function ActionButton({ event: e }: { event: PublicEventDetail }) {
  const { action, closed } = eventFacts(e)
  if (closed) return <div className="rounded-2xl bg-tile px-5 py-4 text-center font-sans font-bold text-ink-2">{action}</div>
  return (
    <Link href="/app" className="block rounded-2xl bg-ink px-5 py-4 text-center font-sans font-bold text-cream transition-transform duration-300 ease-out-expo hover:-translate-y-0.5">
      {action}
    </Link>
  )
}

export function CancelledNotice({ event: e }: { event: PublicEventDetail }) {
  if (!e.is_cancelled) return null
  return <div className="rounded-2xl bg-coral/10 px-5 py-4 font-sans font-bold text-coral">The host cancelled this event. Browse other nights below.</div>
}

/** One heading style for every section on the page. */
export function SectionTitle({ children }: { children: ReactNode }) {
  return <h2 className="font-display text-[clamp(30px,3vw,42px)] font-extrabold leading-[1] tracking-[-0.04em] text-ink">{children}</h2>
}

export function TheNight({ event: e }: { event: PublicEventDetail }) {
  return (
    <>
      <p className="whitespace-pre-line font-sans text-lg leading-relaxed text-ink-2">
        {e.description || 'The host hasn’t written a description yet. Open the event in the app to ask them anything.'}
      </p>
      {e.rules && (
        <div className="mt-6 border-t border-line pt-5">
          <div className="font-sans text-[15px] font-bold text-ink">House rules</div>
          <p className="mt-1.5 whitespace-pre-line font-sans text-[15px] leading-relaxed text-ink-2">{e.rules}</p>
        </div>
      )}
    </>
  )
}

/** Numbers only. Who is going stays in the app, this is a public link. */
export function TheCrowd({ event: e }: { event: PublicEventDetail }) {
  const { mix } = eventFacts(e)
  const seats = e.ratio
    ? [['Women', e.ratio.women_left], ['Men', e.ratio.men_left], ['Open', e.ratio.open_left]].filter(([, n]) => (n as number) > 0) as [string, number][]
    : []
  const rows: [string, number][] = seats.length ? seats : [['Spots', Math.max(0, e.spots_left)]]
  return (
    <>
      <p className="font-sans text-lg leading-relaxed text-ink-2">
        {mix ? `${mix}, ` : 'Open to everyone, '}{e.age_restriction}+ only. Every guest is phone-verified, and the host sees who is asking.
      </p>
      <div className="mt-6 grid grid-cols-3 border-y border-line">
        {rows.map(([label, n], i) => (
          <div key={label} className={i ? 'border-l border-line py-5 pl-5' : 'py-5'}>
            <div className="font-display text-[clamp(36px,4vw,52px)] font-extrabold leading-none tracking-[-0.04em] text-ink">{n}</div>
            <div className="mt-1.5 font-sans text-sm text-ink-2">{label} {n === 1 ? 'spot' : 'spots'} left</div>
          </div>
        ))}
      </div>
    </>
  )
}

/** The area, never the door: the API rounds the pin to about 1 km and the circle covers it. */
export function Where({ event: e }: { event: PublicEventDetail }) {
  const has = e.lat != null && e.lng != null
  const spread = 0.022
  const box = has ? [e.lng! - spread, e.lat! - spread, e.lng! + spread, e.lat! + spread].map(n => n.toFixed(4)).join('%2C') : ''
  return (
    <>
      <p className="font-sans text-lg leading-relaxed text-ink-2">
        {e.area ?? 'The area'} for now. The exact address unlocks in the app once you’re confirmed.
      </p>
      {has && (
        <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-[20px] bg-tile">
          <iframe
            title={`Map of ${e.area ?? e.city ?? 'the area'}`}
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${box}&layer=mapnik`}
            loading="lazy"
            tabIndex={-1}
            className="pointer-events-none absolute inset-0 size-full border-0 [filter:grayscale(1)_sepia(0.18)_contrast(0.92)_brightness(1.03)]"
          />
          <div className="absolute left-1/2 top-1/2 aspect-square w-[32%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/20" />
        </div>
      )}
    </>
  )
}

export function YourHost({ event: e, stacked }: { event: PublicEventDetail; stacked?: boolean }) {
  const h = e.host
  const name = h.name ?? h.username ?? 'Your host'
  const first = name.split(' ')[0]
  const stats = [
    h.badges.at(-1) ? `${h.badges.at(-1)} host` : 'Host',
    h.review_count > 0 && h.avg_rating ? `★ ${h.avg_rating} from ${h.review_count} ${h.review_count === 1 ? 'review' : 'reviews'}` : null,
    e.host_hosted_count ? `${e.host_hosted_count} ${e.host_hosted_count === 1 ? 'night' : 'nights'} hosted` : null,
  ].filter(Boolean)
  const reviews = e.host_reviews ?? []
  return (
    <>
      <div className="flex items-center gap-5">
        <div className="relative size-24 shrink-0 overflow-hidden rounded-[20px] bg-tile md:size-28">
          <AvatarImage src={h.avatar} name={name} sizes="112px" />
        </div>
        <div className="min-w-0">
          <div className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.03em] text-ink">{name}</div>
          <div className="mt-1 font-sans text-[15px] text-ink-2">{stats.join(' · ')}</div>
          {h.username && <Link href={`/h/${h.username}`} className="mt-1.5 inline-block font-sans text-sm font-bold text-ink underline-offset-4 hover:underline">See {first}’s profile →</Link>}
        </div>
      </div>
      {reviews.length > 0 && (
        <div className={cn('mt-7 grid gap-6 border-t border-line pt-6', !stacked && 'sm:grid-cols-3')}>
          {reviews.map(r => (
            <figure key={r.body}>
              <blockquote className="font-display text-xl font-extrabold leading-[1.15] tracking-[-0.025em] text-ink">&ldquo;{r.body}&rdquo;</blockquote>
              <figcaption className="mt-2.5 font-sans text-sm text-ink-2">{r.name}, after {r.event_title}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </>
  )
}

export function MoreNights({ event: e, more }: { event: PublicEventDetail; more: SampleEvent[] }) {
  const { city } = eventFacts(e)
  if (!more.length) return null
  return (
    <section className="bg-paper px-6 py-20 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.95] tracking-[-0.05em] text-ink">Also in {e.city ?? 'your city'}.</h2>
          {city && <Link href={`/${city.slug}`} className="hidden pb-2 font-sans text-[15px] font-bold underline-offset-4 hover:underline md:block">All of {city.name} →</Link>}
        </div>
        <div className="mt-9 grid grid-cols-2 gap-x-5 gap-y-8 lg:grid-cols-4">
          {more.map(m => (
            <Link key={m.id} href={`/e/${m.id}`} className="group block">
              <div className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-tile">
                <Image src={m.image ?? PHOTOS[m.photo]} alt={m.title} fill sizes="(max-width: 1024px) 50vw, 300px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]" />
              </div>
              <div className="mt-3 font-sans text-[12px] font-bold uppercase tracking-[0.08em] text-ink-3">{m.when}</div>
              <div className="mt-1 font-display text-xl font-extrabold leading-tight tracking-[-0.02em] text-ink">{m.title}</div>
              <div className="mt-0.5 font-sans text-sm text-ink-2">{m.area} · {m.price}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
