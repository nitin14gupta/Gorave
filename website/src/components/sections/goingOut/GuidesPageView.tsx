import { ALL_OUT_GUIDES, WOMEN } from '@/lib/goingOut'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { GuidesHero } from './GuidesHero'
import { Night } from './Night'
import { AskAnything } from './AskAnything'
import { ForWomen } from './ForWomen'

/**
 * /guides. Every going-out and women's guide as the question you'd ask a
 * friend, placed on the night it belongs to: a chat to start, the night as
 * a pinned walk from 4 PM to the morning after, an ask box that answers in
 * one line, the rules women can count on, then out the door.
 */
export function GuidesPageView() {
  const chat = ['going-to-a-party-alone', 'what-to-wear-to-a-house-party', 'leaving-a-party-early']
    .map(s => ALL_OUT_GUIDES.find(g => g.slug === s))
    .filter((g): g is (typeof ALL_OUT_GUIDES)[number] => !!g)
  return (
    <>
      <main className="bg-cream">
        <GuidesHero chat={chat} total={ALL_OUT_GUIDES.length} />
        <Night />
        <AskAnything all={ALL_OUT_GUIDES} />
        <ForWomen women={WOMEN} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
