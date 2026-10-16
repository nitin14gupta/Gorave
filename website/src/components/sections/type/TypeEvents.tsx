import type { City, SampleEvent } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { Stagger } from './Stagger'

/** Chapter 01 — the actual listings. Real events from the public API, samples if it's down. */
export function TypeEvents({ city, events }: { city: City; events: SampleEvent[] }) {
  return (
    <section id="events" className="scroll-mt-24 bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="01" title="On the list" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Coming up<br />in {city.name}.
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg text-ink-2">
            Area shown now, address after you&apos;re in. Free ones are request-to-join.
          </p>
        </div>

        {events.length ? (
          <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {events.map(e => <EventCard key={e.id} event={e} />)}
          </Stagger>
        ) : (
          <div className="mt-14 rounded-[32px] border-[1.5px] border-dashed border-ink/25 px-8 py-16 text-center">
            <div className="font-display text-[clamp(28px,3.4vw,44px)] font-extrabold tracking-[-0.04em]">
              Nothing listed in {city.name} yet.
            </div>
            <p className="mx-auto mt-3 max-w-[440px] font-sans text-lg text-ink-2">
              That means the first one is yours. Hosting takes a few minutes and costs nothing to list.
            </p>
            <div className="mt-7 flex justify-center"><Button href="/host" size="lg">Host the first one</Button></div>
          </div>
        )}
      </div>
    </section>
  )
}
