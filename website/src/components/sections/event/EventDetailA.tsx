import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { StoreBadges } from '@/components/ui/atoms'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { EventBar } from './EventBar'
import { EventGallery } from './EventGallery'
import { ActionButton, CancelledNotice, eventFacts, FactChips, MoreNights, Place, SectionTitle, TheCrowd, TheNight, whenLine, Where, YourHost, type EventViewProps } from './parts'

/** A: the booking card stays beside you all the way down, next to one 4:5 photo frame and a reading column. */
export function EventDetailA({ event: e, more, crumbs, areaHref }: EventViewProps) {
  const f = eventFacts(e)
  const sections = [
    ['The night', <TheNight key="night" event={e} />],
    ['The crowd', <TheCrowd key="crowd" event={e} />],
    ['Where', <Where key="where" event={e} />],
    ['Your host', <YourHost key="host" event={e} stacked />],
  ] as const

  return (
    <>
      <main className="bg-cream">
        <div className="mx-auto box-content max-w-[620px] px-6 pt-28 md:px-20 xl:w-fit xl:max-w-none">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-4"><CancelledNotice event={e} /></div>

          <div className="grid gap-10 pb-20 pt-4 xl:grid-cols-[min(calc(70vh*0.8),620px)_400px] xl:gap-x-16 xl:gap-y-14">
            {/* DOM order is photos, card, sections, so phones see the card right after the photos */}
            <div className="min-w-0 xl:col-start-1 xl:row-start-1">
              <EventGallery photos={f.photos} title={e.title} />

            </div>

            <aside className="xl:sticky xl:top-24 xl:col-start-2 xl:row-span-2 xl:row-start-1 xl:self-start">
              <BookingCard event={e} areaHref={areaHref} />
            </aside>

            <div className="min-w-0 xl:col-start-1 xl:row-start-2">
              {sections.map(([title, body], i) => (
                <section key={title} className={i ? 'mt-14' : undefined}>
                  <SectionTitle>{title}</SectionTitle>
                  <div className="mt-5">{body}</div>
                </section>
              ))}
            </div>
          </div>
        </div>
        <MoreNights event={e} more={more} />
      </main>
      <SiteFooter place={e.area ?? e.city ?? undefined} />
      {!f.closed && <EventBar title={e.title} price={f.price} action={f.full ? 'Join waitlist' : 'Get the app'} showAfter={900} className="xl:hidden" />}
    </>
  )
}

function BookingCard({ event: e, areaHref }: Pick<EventViewProps, 'event' | 'areaHref'>) {
  const f = eventFacts(e)
  const taken = Math.max(0, e.capacity - e.spots_left)
  return (
    <div className="rounded-[28px] bg-paper p-6 shadow-[inset_0_0_0_1px_var(--color-line)] md:p-7">
      <FactChips event={e} />
      <h1 className="mt-4 font-display text-[clamp(34px,3.4vw,46px)] font-extrabold leading-[0.98] tracking-[-0.045em] text-ink">{e.title}</h1>
      <div className="mt-4 space-y-1 font-sans text-[15px] font-bold text-ink-2">
        <div>{whenLine(e)}</div>
        <div><Place event={e} areaHref={areaHref} /></div>
      </div>

      <div className="mt-5 flex items-end justify-between border-t border-line pt-5">
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
  )
}
