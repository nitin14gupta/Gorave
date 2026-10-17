import { HOST_CRUMBS, HOST_FAQ } from '@/lib/host'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HeroB } from './b/HeroB'
import { RunOfShow } from './b/RunOfShow'
import { TearTicket } from './b/TearTicket'
import { RequestInbox } from './b/RequestInbox'
import { HouseRules } from './b/HouseRules'
import { MixingDesk } from './b/MixingDesk'
import { Laminates } from './b/Laminates'
import { CurtainCall } from './b/CurtainCall'

/**
 * Host page, variant B"Backstage". Noir throughout: the curtain opens on
 * the room, then the host works through the night like a stage manager
 * cues, the money, the door list, the rules, the desk, the pass.
 */
export function HostPageB() {
  return (
    <>
      <main className="bg-noir">
        <HeroB crumbs={HOST_CRUMBS} />
        <RunOfShow />
        <TearTicket />
        <RequestInbox />
        <HouseRules />
        <MixingDesk />
        <Laminates />
        <Faq chapter="07" title="Before doors" items={HOST_FAQ} />
        <CurtainCall />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
