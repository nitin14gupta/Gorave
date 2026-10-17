import Image from 'next/image'
import Link from 'next/link'
import { EVENT_TYPES, PHOTOS, type SampleEvent } from '@/constants'
import { longWhen, type PublicEventDetail } from '@/lib/api'
import type { Crumb } from '@/lib/seo'
import { getCity } from '@/lib/city'
import { slugify } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter, Chip, StoreBadges } from '@/components/ui/atoms'
import { EventCard } from '@/components/ui/EventCard'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Stagger } from '@/components/sections/type/Stagger'
import { EventGallery } from './EventGallery'

const mixLabel = (p: number | null) => (p == null ? null : p >= 100 ? 'Women only' : p <= 0 ? 'Men only' : `${p}:${100 - p} crowd`)

/**
 * Event page (/e/id), what a shared link opens. Everything a guest needs to
 * decide, with the request/booking itself handed to the app.
 */
export function EventDetailView({ event: e, more, crumbs }: { event: PublicEventDetail; more: SampleEvent[]; crumbs: Crumb[] }) {
  const type = EVENT_TYPES.find(t => t.key === e.event_type)
  const photos = e.cover_photos.length ? e.cover_photos : [PHOTOS[type?.photo ?? 'party1']]
  const city = e.city ? getCity(slugify(e.city)) : undefined
  const taken = Math.max(0, e.capacity - e.spots_left)
  const full = e.spots_left <= 0
  const action = e.is_cancelled ? 'This night was cancelled' : full ? 'Join the waitlist in the app' : e.join_mode === 'request' ? 'Request to join in the app' : 'Book your spot in the app'
  const mix = mixLabel(e.women_pct)

  return (
    <>
      <main className="bg-cream">
        <div className="px-6 pt-28 md:px-20">
          <Breadcrumbs crumbs={crumbs} />
        </div>

        {e.is_cancelled && (
          <div className="mx-6 mt-6 rounded-2xl bg-coral/10 px-5 py-4 font-sans font-bold text-coral md:mx-20">
            The host cancelled this event. Browse other nights below.
          </div>
        )}

        <div className="mx-auto grid max-w-[1280px] gap-10 px-6 pb-20 pt-8 md:px-20 lg:grid-cols-[1.35fr_1fr] lg:gap-x-14 lg:gap-y-14">
          {/* DOM order is gallery → card → details, so phones see the decision card right after the photos */}
          <div className="lg:col-start-1 lg:row-start-1">
            <EventGallery photos={photos} title={e.title} />
          </div>

          {/* The decision card, sticky on desktop */}
          <aside className="lg:sticky lg:top-24 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
            <div className="rounded-[32px] bg-white p-7 shadow-pop">
              <div className="flex flex-wrap gap-1.5">
                {type && <Chip className="bg-cream text-ink">{type.label}</Chip>}
                {mix && <Chip className="bg-blush text-blush-ink">{mix}</Chip>}
                {e.age_restriction > 18 && <Chip className="bg-sky text-sky-ink">{e.age_restriction}+</Chip>}
              </div>
              <h1 className="mt-4 font-display text-[clamp(34px,3.6vw,52px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{e.title}</h1>
              <div className="mt-5 space-y-1.5 font-sans text-[15px] font-bold text-ink-2">
                <div>{longWhen(e.date_time)}</div>
                <div>{[e.area, e.city].filter(Boolean).join(', ')}</div>
              </div>

              <div className="mt-6 flex items-end justify-between border-t border-line pt-5">
                <div>
                  <div className="font-display text-4xl font-extrabold tracking-[-0.04em]">{e.is_free ? 'Free' : `₹${e.price_inr.toLocaleString('en-IN')}`}</div>
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
                    {e.is_free ? 'host approves each guest' : '+ ₹50 platform fee'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-sans text-sm font-bold">{full ? 'Full' : `${e.spots_left} spots left`}</div>
                  <div className="font-sans text-xs text-ink-3">{e.attendee_count} going</div>
                </div>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(100, (taken / Math.max(1, e.capacity)) * 100)}%` }} />
              </div>

              <div className="mt-6 rounded-2xl bg-ink px-5 py-4 text-center font-sans font-bold text-cream">{action}</div>
              <div className="mt-3 flex justify-center"><StoreBadges height={40} /></div>
            </div>

            {e.host.username && (
              <Link href={`/h/${e.host.username}`} className="group mt-4 flex items-center gap-4 rounded-[24px] bg-white p-4 shadow-soft transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-tile">
                  {e.host.avatar && <Image src={e.host.avatar} alt={e.host.name ?? ''} fill sizes="56px" className="object-cover" />}
                </div>
                <div className="flex-1">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">Hosted by</div>
                  <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{e.host.name ?? e.host.username}</div>
                  <div className="font-sans text-xs text-ink-3">
                    {e.host.badges.at(-1) ? `${e.host.badges.at(-1)} host` : 'Host'}
                    {e.host.review_count > 0 && e.host.avg_rating ? ` · ★ ${e.host.avg_rating} (${e.host.review_count})` : ''}
                  </div>
                </div>
                <span className="font-sans text-sm font-bold transition-transform group-hover:translate-x-1">→</span>
              </Link>
            )}
          </aside>

          <div className="lg:col-start-1 lg:row-start-2">
            <section>
              <Chapter n="01" title="About the night" />
              <p className="mt-5 whitespace-pre-line font-sans text-lg leading-relaxed text-ink-2">
                {e.description || 'The host hasn’t written a description yet, open the event in the app to ask them anything.'}
              </p>
              {e.rules && (
                <div className="mt-8 rounded-[24px] bg-white p-6 shadow-soft">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">House rules</div>
                  <p className="mt-2 whitespace-pre-line font-sans text-ink-2">{e.rules}</p>
                </div>
              )}
            </section>

            <section className="mt-14">
              <Chapter n="02" title="Before you go" />
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Address after you’re in', `You see ${e.area ?? 'the area'} now; the exact address unlocks once you’re confirmed.`],
                  ['Verified guests', 'Everyone is phone-verified and 18+. Hosts see who’s asking.'],
                  ['QR at the door', 'Your ticket lives in the app, the host scans it when you arrive.'],
                ].map(([t, d]) => (
                  <div key={t} className="rounded-[22px] bg-paper p-5">
                    <div className="font-display text-lg font-extrabold tracking-[-0.03em]">{t}</div>
                    <p className="mt-1.5 font-sans text-sm text-ink-2">{d}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

        </div>

        {more.length > 0 && (
          <section className="bg-paper px-6 py-20 md:px-20">
            <div className="mx-auto max-w-[1280px]">
              <Chapter n="03" title="More nights" />
              <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
                  Also in {e.city ?? 'your city'}.
                </h2>
                {city && type && <Link href={`/${city.slug}/${type.slug}`} className="font-sans text-sm font-bold underline-offset-4 hover:underline">All {type.label.toLowerCase()} in {city.name} →</Link>}
              </div>
              <Stagger className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {more.map(m => <EventCard key={m.id} event={m} />)}
              </Stagger>
            </div>
          </section>
        )}
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
