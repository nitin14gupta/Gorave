import type { ReactNode } from 'react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { StoreBadges } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { EventBar } from './EventBar'
import { EventBento } from './EventBento'
import { ActionButton, CancelledNotice, eventFacts, FactChips, MoreNights, Place, SectionTitle, TheCrowd, TheNight, whenLine, Where, YourHost, type EventViewProps } from './parts'

const TILE = 'rounded-[24px] bg-paper p-6 shadow-[inset_0_0_0_1px_var(--color-line)] md:p-7'

function Tile({ title, className, children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={cn(TILE, className)}>
      <SectionTitle>{title}</SectionTitle>
      <div className="mt-4">{children}</div>
    </section>
  )
}

/** A: the whole page as a bento. Photos and booking on top, then a tile for each part of the night. */
export function EventDetailA({ event: e, more, crumbs, areaHref }: EventViewProps) {
  const f = eventFacts(e)
  const onePhoto = f.photos.length === 1
  const night = <Tile title="The night" className={onePhoto ? 'h-full' : 'lg:col-span-7'}><TheNight event={e} /></Tile>

  return (
    <>
      <main className="bg-cream">
        <div className="mx-auto max-w-[1280px] px-6 pb-20 pt-28 md:box-content md:px-20">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-4"><CancelledNotice event={e} /></div>

          <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_400px]">
            <EventBento photos={f.photos} title={e.title} solo={night} />
            <BookingCard event={e} areaHref={areaHref} />
          </div>

          <div className="mt-3 grid gap-3 lg:grid-cols-12">
            {!onePhoto && night}
            <Tile title="The crowd" className="lg:col-span-5"><TheCrowd event={e} /></Tile>
            <Tile title="Where" className={onePhoto ? 'lg:col-span-7' : 'lg:col-span-5'}><Where event={e} /></Tile>
            <Tile title="Your host" className={onePhoto ? 'lg:col-span-12' : 'lg:col-span-7'}><YourHost event={e} /></Tile>
          </div>
        </div>
        <MoreNights event={e} more={more} />
      </main>
      <SiteFooter place={e.area ?? e.city ?? undefined} />
      {!f.closed && <EventBar title={e.title} price={f.price} action={f.full ? 'Join waitlist' : 'Get the app'} showAfter={760} />}
    </>
  )
}

function BookingCard({ event: e, areaHref }: Pick<EventViewProps, 'event' | 'areaHref'>) {
  const f = eventFacts(e)
  const taken = Math.max(0, e.capacity - e.spots_left)
  return (
    <div className={cn(TILE, 'flex flex-col')}>
      <FactChips event={e} />
      <h1 className="mt-4 font-display text-[clamp(34px,3.2vw,44px)] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink">{e.title}</h1>
      <div className="mt-4 space-y-1 font-sans text-[15px] font-bold text-ink-2">
        <div>{whenLine(e)}</div>
        <div><Place event={e} areaHref={areaHref} /></div>
      </div>

      <div className="mt-auto pt-6">
        <div className="flex items-end justify-between border-t border-line pt-5">
          <div>
            <div className="font-display text-4xl font-extrabold tracking-[-0.04em] text-orange">{f.price}</div>
            <div className="mt-0.5 font-sans text-xs text-ink-3">{f.priceNote}</div>
          </div>
          <div className="text-right font-sans">
            <div className="text-sm font-bold text-ink">{f.full ? 'Full' : `${e.spots_left} spots left`}</div>
            <div className="text-xs text-ink-3">{e.attendee_count} going</div>
          </div>
        </div>
        <div className="mt-3 h-1 overflow-hidden rounded-full bg-ink/10">
          <div className="h-full rounded-full bg-ink" style={{ width: `${Math.min(100, (taken / Math.max(1, e.capacity)) * 100)}%` }} />
        </div>

        <div className="mt-5"><ActionButton event={e} /></div>
        {!f.closed && <p className="mt-3 text-center font-sans text-[13px] leading-snug text-ink-3">{f.cancelNote}</p>}
        {!f.closed && <div className="mt-4 flex justify-center"><StoreBadges height={38} /></div>}
      </div>
    </div>
  )
}
