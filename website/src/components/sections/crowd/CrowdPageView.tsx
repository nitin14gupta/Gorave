import type { CrowdViewProps } from './types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Hero } from './parts/Hero'
import { Statement } from './parts/Statement'
import { EventsRail } from './parts/EventsRail'
import { WhoInRoom } from './parts/WhoInRoom'
import { WhyStory } from './parts/WhyStory'
import { HowItHolds } from './parts/HowItHolds'
import { PlaceReveal } from './parts/PlaceReveal'
import { HostCall } from './parts/HostCall'
import { OtherCrowds } from './parts/OtherCrowds'
import { SignOff } from './parts/SignOff'
import { ExploreLinks } from '@/components/sections/shared/ExploreLinks'

/**
 * Crowd page (/women-only, /mumbai/women-only): the best sections of the three
 * lab variants, all on the cream palette. A cover whose photo opens to full
 * bleed, the promise read word by word, the real listings on a rail, who sits
 * at the table, why people pick it, how the app holds it, where, hosting,
 * questions, the other crowds and a sign-off.
 */
export function CrowdPageView({ crowd, place, events, total, places, others, faq, crumbs }: CrowdViewProps) {
  return (
    <>
      <main className="bg-paper">
        <Hero crowd={crowd} place={place} total={total} crumbs={crumbs} />
        <Statement line={crowd.heroLine} label={crowd.label} chapter="01" />
        <EventsRail crowd={crowd} place={place} events={events} total={total} chapter="02" />
        <WhoInRoom crowd={crowd} />
        <WhyStory crowd={crowd} chapter="04" />
        <HowItHolds crowd={crowd} />
        <PlaceReveal crowd={crowd} place={place} places={places} />
        <HostCall crowd={crowd} place={place} others={others} />
        <ExploreLinks place={place.name} citySlug={place.citySlug} current={crowd.slug} />
        <Faq chapter="08" title={`${crowd.label} nights, answered`} items={faq} />
        <OtherCrowds place={place} others={others} />
        <SignOff crowd={crowd} place={place} chapter="10" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
