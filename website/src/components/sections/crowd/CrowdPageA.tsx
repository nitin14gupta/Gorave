import type { CrowdViewProps } from './types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Hero } from './a/Hero'
import { OnTheList } from './a/OnTheList'
import { WhoInRoom } from './a/WhoInRoom'
import { HowItHolds } from './a/HowItHolds'
import { PlaceReveal } from './a/PlaceReveal'
import { WhyChoose } from './a/WhyChoose'
import { HostCall } from './a/HostCall'
import { OtherCrowds } from './a/OtherCrowds'

/**
 * Variant A, "Inside the room". One crowd (women-only, balanced, 21+, 25+)
 * in India or one city, told from inside the party: the photo with its
 * promises called out, the listings, who sits at the table, how the app
 * keeps it that way, where, why, hosting, questions and the other rooms.
 */
export function CrowdPageA({ crowd, place, events, total, places, others, faq, crumbs }: CrowdViewProps) {
  return (
    <>
      <main>
        <Hero crowd={crowd} place={place} total={total} crumbs={crumbs} />
        <OnTheList crowd={crowd} place={place} events={events} total={total} />
        <WhoInRoom crowd={crowd} />
        <HowItHolds crowd={crowd} />
        <PlaceReveal crowd={crowd} place={place} places={places} />
        <WhyChoose crowd={crowd} place={place} />
        <HostCall crowd={crowd} place={place} others={others} />
        <Faq chapter="07" title={`${crowd.label} nights, answered`} items={faq} />
        <OtherCrowds place={place} others={others} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
