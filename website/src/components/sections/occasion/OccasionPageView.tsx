import type { OccasionProps } from '@/lib/occasion'
import { buildCityKit } from '@/lib/cityKit'
import { CityKitProvider } from '@/components/sections/city/CityKit'
import { AreaReveal } from '@/components/sections/city/AreaReveal'
import { Faq } from '@/components/sections/shared/Faq'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { OccasionHero } from './OccasionHero'
import { WhatItIs } from './WhatItIs'
import { Lineup } from './Lineup'
import { StackedNight } from './StackedNight'
import { Checklist } from './Checklist'
import { HostIt } from './HostIt'
import { Calendar } from './Calendar'

/**
 * /diwali, /mumbai/diwali, /mumbai/bandra/diwali (and the other occasions).
 * Countdown hero, what it is (hover words), the lineup, the night as a
 * stacking deck, a tickable checklist, host one, the place reveal, the
 * party calendar, questions and the way out.
 */
export function OccasionPageView(props: OccasionProps) {
  const { occasion: o, place, places, events } = props
  const kit = buildCityKit(events)
  return (
    <CityKitProvider kit={kit}>
      <main className="bg-cream">
        <OccasionHero {...props} />
        <WhatItIs {...props} />
        <Lineup {...props} />
        <StackedNight {...props} />
        <Checklist {...props} />
        <HostIt {...props} />
        <AreaReveal
          chapter="06"
          kicker={place.kind === 'india' ? 'The cities' : place.kind === 'city' ? 'The neighbourhood' : 'Next door'}
          title={place.kind === 'india' ? `${o.name}, city by city.` : place.kind === 'city' ? `${o.name}, street by street.` : `${o.name} next door.`}
          subtitle="Hover one to see what’s on, tap to go."
          items={places.map(x => ({ label: x.name, href: x.href }))}
        />
        <Calendar {...props} />
        <Faq chapter="08" title={`${o.name}, answered`} items={o.faq} />
        <ExploreLinks place={place.city?.name ?? 'India'} citySlug={place.city?.slug ?? null} current={o.slug} />
      </main>
      <SiteFooter place={place.name} />
      <FloatingDock />
    </CityKitProvider>
  )
}
