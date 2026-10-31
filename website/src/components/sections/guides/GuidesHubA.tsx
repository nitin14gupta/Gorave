import { GUIDES_CRUMBS, GUIDES_FAQ, HOST_GUIDES } from '@/lib/hostGuides'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Masthead } from './a/Masthead'
import { Featured } from './a/Featured'
import { GuideIndex } from './a/GuideIndex'
import { ReadingPath } from './a/ReadingPath'
import { FinePrint } from './a/FinePrint'

/**
 * Hosting guides, variant A"the magazine". Cream paper, a nameplate that
 * sets itself, a cover story, a contents page you can filter, a reading
 * route, the fine print on a dark spread, then your turn.
 */
export function GuidesHubA() {
  const minutes = HOST_GUIDES.reduce((s, g) => s + g.readMinutes, 0)
  return (
    <>
      <main>
        <Masthead crumbs={GUIDES_CRUMBS} count={HOST_GUIDES.length} minutes={minutes} />
        <Featured guide={HOST_GUIDES[0]} />
        <GuideIndex guides={HOST_GUIDES} />
        <ReadingPath guides={HOST_GUIDES} />
        <FinePrint />
        <Faq chapter="05" title="Before you host" items={GUIDES_FAQ} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
