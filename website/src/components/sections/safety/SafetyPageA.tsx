import { SAFETY_FAQ } from '@/lib/safety'
import type { Crumb } from '@/lib/seo'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HeroA } from './a/HeroA'
import { JourneyA } from './a/JourneyA'
import { AddressA } from './a/AddressA'
import { SosA } from './a/SosA'
import { CrowdA } from './a/CrowdA'
import { TipsA } from './a/TipsA'
import { CtaA } from './a/CtaA'

/**
 * /safety, variant A"Your night, protected at every step". Daylight and
 * calm: a shield forms, then the page walks one night out from before to
 * after, with a hands-on demo for the address, SOS and crowd mix.
 */
export function SafetyPageA({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <main>
        <HeroA crumbs={crumbs} />
        <JourneyA />
        <AddressA />
        <SosA />
        <CrowdA />
        <TipsA />
        <Faq chapter="06" title="Safety, answered" items={SAFETY_FAQ} />
        <CtaA chapter="07" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
