import type { TimeViewProps } from './types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Hero } from './b/Hero'
import { Ledger } from './b/Ledger'
import { DaysRail } from './b/DaysRail'
import { GettingReady } from './c/GettingReady'
import { Stopwatch } from './a/Stopwatch'
import { TearOff } from './a/TearOff'
import { Places } from './a/Places'
import { Why } from './b/Why'
import { Others } from './b/Others'
import { SignOff } from './b/SignOff'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'

/**
 * Time page (/tonight, /mumbai/this-weekend): the sections picked from the
 * three lab variants. The calendar cover, the window at a glance, the real
 * nights day by day, getting ready, the stopwatch, the tear-off reasons,
 * city by city, why it works, the other windows, questions and a sign-off.
 */
export function TimePageView({ time, place, events, total, days, places, others, faq, crumbs }: TimeViewProps) {
  return (
    <>
      <main className="bg-cream">
        <Hero time={time} place={place} total={total} days={days} crumbs={crumbs} />
        <Ledger time={time} place={place} total={total} days={days} places={places} chapter="01" />
        <DaysRail time={time} place={place} events={events} total={total} days={days} others={others} chapter="02" />
        <GettingReady time={time} place={place} events={events} chapter="03" />
        <Stopwatch time={time} />
        <TearOff time={time} place={place} />
        <Places time={time} place={place} places={places} />
        <Why time={time} place={place} chapter="07" />
        <Others place={place} others={others} chapter="08" />
        <ExploreLinks place={place.name} citySlug={place.citySlug} current={time.slug} />
        <Faq chapter="09" title={`${time.label} in ${place.name}, answered`} items={faq} />
        <SignOff time={time} place={place} days={days} chapter="10" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
