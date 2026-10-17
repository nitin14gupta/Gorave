import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import type { CrowdViewProps } from './types'
import { Hero } from './b/Hero'
import { WhyStory } from './b/WhyStory'
import { EventsRail } from './b/EventsRail'
import { HowSteps } from './b/HowSteps'
import { PlacesIndex } from './b/PlacesIndex'
import { HostCta } from './b/HostCta'
import { OtherCrowds } from './b/OtherCrowds'
import { SignOff } from './b/SignOff'

/**
 * Variant B, "Editorial scrollytelling". An airy, magazine-like page: a cover
 * whose photo opens from a window to full bleed, a pinned split-screen story,
 * a sideways rail of real events, a numbered ledger, a contents-page index
 * with a cursor-following photo, a pull quote for hosts and wide photo panels.
 */
export function CrowdPageB({ crowd, place, events, total, places, others, faq, crumbs }: CrowdViewProps) {
  return (
    <>
      <main className="bg-paper">
        <Hero crowd={crowd} place={place} total={total} crumbs={crumbs} />
        <WhyStory crowd={crowd} chapter="01" />
        <EventsRail crowd={crowd} place={place} events={events} total={total} chapter="02" />
        <HowSteps crowd={crowd} chapter="03" />
        <PlacesIndex crowd={crowd} place={place} places={places} chapter="04" />
        <HostCta crowd={crowd} place={place} chapter="05" />
        <Faq chapter="06" title={`About ${crowd.nights}.`} items={faq} />
        <OtherCrowds others={others} place={place} chapter="07" />
        <SignOff crowd={crowd} place={place} chapter="08" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
