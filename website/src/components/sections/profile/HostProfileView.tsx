import type { BRAND, SampleEvent } from '@/constants'
import type { Crumb } from '@/lib/seo'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Stagger } from '@/components/sections/type/Stagger'
import { HostHero, type HostHeroData } from './HostHero'
import { BadgeLadder } from './BadgeLadder'
import { HostPlaces, type PlaceLink } from './HostPlaces'

const TRUST = [
  ['Verified guests only', 'Everyone who requests is phone-verified and 18+. The host sees who’s asking before they accept.'],
  ['Address after you’re in', 'You see the area now. The exact address unlocks once you’re confirmed.'],
  ['A QR at the door', 'Confirmed guests get a ticket; the host scans it when you arrive.'],
] as const

/** Public host profile (/h/username), who they are, what they're hosting next, how far they've climbed. */
export function HostProfileView({ host, events, crumbs, places }: { host: HostHeroData; events: SampleEvent[]; crumbs: Crumb[]; places: { areas: PlaceLink[]; cities: PlaceLink[]; types: PlaceLink[] } }) {
  const first = host.name.split(' ')[0]
  return (
    <>
      <main>
        <HostHero host={host} crumbs={crumbs} />

        <section id="nights" className="scroll-mt-24 bg-cream px-6 pb-24 md:px-20 md:pb-32">
          <div className="mx-auto max-w-[1280px]">
            <Chapter n="01" title="Coming up" />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              {first}’s next nights.
            </h2>
            {events.length ? (
              <Stagger className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {events.map(e => <EventCard key={e.id} event={e} />)}
              </Stagger>
            ) : (
              <div className="mt-12 rounded-[32px] border-[1.5px] border-dashed border-ink/25 px-8 py-14 text-center">
                <div className="font-display text-[clamp(26px,3vw,40px)] font-extrabold tracking-[-0.04em]">Nothing listed right now.</div>
                <p className="mx-auto mt-3 max-w-[440px] font-sans text-lg text-ink-2">Follow {first} in the app and you’ll hear the moment the next one goes up.</p>
              </div>
            )}
          </div>
        </section>

        <HostPlaces first={first} {...places} />

        <BadgeLadder name={first} hosted={host.hosted} />

        <section className="bg-paper px-6 py-24 text-ink md:px-20 md:py-28">
          <div className="mx-auto max-w-[1280px]">
            <Chapter n="04" title="Going to one" />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">How it works.</h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {TRUST.map(([t, d], i) => (
                <div key={t} className="rounded-[28px] bg-white p-7 shadow-soft">
                  <div className="font-serif text-3xl italic text-orange">0{i + 1}</div>
                  <div className="mt-6 font-display text-2xl font-extrabold tracking-[-0.03em]">{t}</div>
                  <p className="mt-2 font-sans text-ink-2">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-cream px-6 py-24 text-center md:px-20 md:py-28">
          <Chapter n="05" title="Your turn" className="justify-center" />
          <h2 className="mx-auto mt-4 max-w-[900px] font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.06em]">
            Throw your own, <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">like {first}.</span>
          </h2>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <Button href="/host" size="lg">Start hosting</Button>
            <StoreBadges height={46} />
          </div>
        </section>
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}

export type BadgeKey = keyof typeof BRAND.badges
