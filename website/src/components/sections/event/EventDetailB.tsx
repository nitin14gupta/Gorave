import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { StoreBadges } from '@/components/ui/atoms'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { EventBar } from './EventBar'
import { EventGallery } from './EventGallery'
import { ActionButton, CancelledNotice, eventFacts, FactChips, MoreNights, Place, SectionTitle, TheCrowd, TheNight, whenLine, Where, YourHost, type EventViewProps } from './parts'

/** B: an event poster. A big title beside the photo, then ruled rows; a bar follows you with the booking. */
export function EventDetailB({ event: e, more, crumbs, areaHref }: EventViewProps) {
  const f = eventFacts(e)
  const sections = [
    ['The night', <TheNight key="night" event={e} />],
    ['The crowd', <TheCrowd key="crowd" event={e} />],
    ['Where', <Where key="where" event={e} />],
    ['Your host', <YourHost key="host" event={e} />],
  ] as const

  return (
    <>
      <main className="bg-cream">
        <div className="mx-auto max-w-[1280px] px-6 pt-28 md:box-content md:px-20">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mt-4"><CancelledNotice event={e} /></div>

          <div className="grid items-center gap-10 pb-16 pt-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,460px)] lg:gap-16">
            <div className="order-2 lg:order-1">
              <FactChips event={e} />
              <h1 className="mt-5 font-display text-[clamp(52px,7vw,104px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">{e.title}</h1>
              <div className="mt-6 space-y-1 font-sans text-lg font-bold text-ink-2">
                <div>{whenLine(e)}</div>
                <div><Place event={e} areaHref={areaHref} /></div>
              </div>

              <div className="mt-7 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-line pt-6">
                <div>
                  <div className="font-display text-4xl font-extrabold tracking-[-0.04em] text-orange">{f.price}</div>
                  <div className="mt-0.5 font-sans text-xs text-ink-3">{f.priceNote}</div>
                </div>
                <div className="font-sans">
                  <div className="text-[15px] font-bold text-ink">{f.full ? 'Full' : `${e.spots_left} spots left`}</div>
                  <div className="text-xs text-ink-3">{e.attendee_count} going</div>
                </div>
              </div>

              <div className="mt-6 max-w-[420px]"><ActionButton event={e} /></div>
              {!f.closed && <p className="mt-3 max-w-[420px] font-sans text-[13px] leading-snug text-ink-3">{f.cancelNote}</p>}
              {!f.closed && <div className="mt-4"><StoreBadges height={40} /></div>}
            </div>
            <div className="order-1 lg:order-2"><EventGallery photos={f.photos} title={e.title} /></div>
          </div>

          <div className="pb-20">
            {sections.map(([title, body]) => (
              <section key={title} className="grid gap-5 border-t border-line py-10 md:grid-cols-[240px_minmax(0,1fr)] md:gap-10">
                <SectionTitle>{title}</SectionTitle>
                <div className="max-w-[820px]">{body}</div>
              </section>
            ))}
          </div>
        </div>
        <MoreNights event={e} more={more} />
      </main>
      <SiteFooter place={e.area ?? e.city ?? undefined} />
      {!f.closed && <EventBar title={e.title} price={f.price} action={f.full ? 'Join waitlist' : 'Get the app'} showAfter={760} />}
    </>
  )
}
