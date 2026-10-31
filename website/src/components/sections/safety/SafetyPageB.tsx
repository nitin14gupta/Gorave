import { SAFETY_FAQ } from '@/lib/safety'
import type { Crumb } from '@/lib/seo'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HeroB } from './b/HeroB'
import { LayersB } from './b/LayersB'
import { TorchB } from './b/TorchB'
import { MapB } from './b/MapB'
import { SosPhoneB } from './b/SosPhoneB'
import { RequestsB } from './b/RequestsB'
import { HabitsB } from './b/HabitsB'

/**
 * /safety, variant B"Layers of trust". Noir, like the app at night: a
 * crowd thins to a guest list, six glass layers stack up, a torch shows what
 * strangers vs guests see, a circle closes onto a door, SOS plays on a phone,
 * and you play host with the request stack.
 */
export function SafetyPageB({ crumbs }: { crumbs: Crumb[] }) {
  return (
    <>
      <main className="bg-noir">
        <HeroB crumbs={crumbs} />
        <LayersB />
        <TorchB />
        <MapB />
        <SosPhoneB />
        <RequestsB />
        <HabitsB />
        <Faq chapter="07" title="Safety, answered" items={SAFETY_FAQ} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
