import type { BadgesProps } from '../types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ClimbHero } from './a/ClimbHero'
import { WhoWears } from './WhoWears'
import { LevelUp } from './a/LevelUp'
import { Progress } from './b/Progress'
import { HostWall } from './b/HostWall'
import { BADGE_FAQ } from './faq'

/**
 * /host/badges: the picked sections. The climb, the four badges and who wears
 * them, what changes when you level up, pick-a-number, the wall of holders,
 * questions, and the two sign-offs.
 */
export function BadgesPageView({ tiers }: BadgesProps) {
  return (
    <>
      <main>
        <ClimbHero tiers={tiers} />
        <WhoWears tiers={tiers} />
        <LevelUp tiers={tiers} />
        <Progress tiers={tiers} />
        <div id="who-holds" className="scroll-mt-20"><HostWall tiers={tiers} /></div>
        <Faq chapter="05" title="Badges, answered" items={BADGE_FAQ} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
