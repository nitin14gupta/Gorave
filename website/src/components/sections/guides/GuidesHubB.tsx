import { GUIDES_CRUMBS, GUIDES_FAQ, HOST_GUIDES, guideHref } from '@/lib/hostGuides'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { PlaybookHero } from './b/PlaybookHero'
import { Deck } from './b/Deck'
import { TitleList } from './b/TitleList'
import { Checklist } from './b/Checklist'
import { RuleCards } from './b/RuleCards'
import { HostCtaB } from './b/HostCtaB'

/**
 * Hosting guides, variant B"the playbook". Noir, every guide an index
 * card: dealt on the table, fanned from a pinned deck, listed by name with a
 * trailing photo, a checklist that ticks itself, the rules as flip cards.
 */
export function GuidesHubB() {
  return (
    <>
      <main className="bg-noir">
        <PlaybookHero crumbs={GUIDES_CRUMBS} guides={HOST_GUIDES} />
        <Deck guides={HOST_GUIDES} />
        <TitleList guides={HOST_GUIDES} />
        <Checklist guides={HOST_GUIDES} />
        <RuleCards />
        <Faq chapter="05" title="Before you deal" items={GUIDES_FAQ} />
        <HostCtaB firstGuide={guideHref(HOST_GUIDES[0].slug)} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
