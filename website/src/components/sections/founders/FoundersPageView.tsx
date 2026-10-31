import { Team } from '@/components/sections/evergreen/about/Founders'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { FoundersHero } from './FoundersHero'
import { Journey } from './Journey'
import { Why } from './Why'
import { Next } from './Next'

/**
 * /founders, the journey. The empty apartment, the quiet party, the
 * "Baburao" call, the two of them, why, and what's next.
 */
export function FoundersPageView() {
  return (
    <>
      <main className="bg-cream">
        <FoundersHero />
        <Journey />
        <Team n="02" title="The two of us" />
        <Why />
        <Next />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
