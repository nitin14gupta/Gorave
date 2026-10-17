import type { CrowdViewProps } from './types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Hero } from './c/Hero'
import { Statement } from './c/Statement'
import { Deck } from './c/Deck'
import { Why } from './c/Why'
import { How } from './c/How'
import { Places } from './c/Places'
import { HostCta } from './c/HostCta'
import { Others } from './c/Others'

/**
 * Variant C, "Cinematic". Image-first with a dark-to-light rhythm: the crowd
 * label opens as a window onto the photo, the promise lights up word by word,
 * real events shuffle as a deck, the reasons open as photo panels, a phone
 * walks through the rules, places fill with their streets, then hosts, FAQ
 * and the other crowds.
 */
export function CrowdPageC({ crowd, place, events, total, places, others, faq, crumbs }: CrowdViewProps) {
  const sampleTitle = events[0]?.title ?? `${crowd.label} night`
  return (
    <>
      <main>
        <Hero crowd={crowd} place={place} total={total} crumbs={crumbs} />
        <Statement line={crowd.heroLine} label={crowd.label} chapter="01" />
        <Deck crowd={crowd} place={place} events={events} total={total} chapter="02" />
        <Why crowd={crowd} chapter="03" />
        <How crowd={crowd} title={sampleTitle} chapter="04" />
        <Places crowd={crowd} place={place} places={places} chapter="05" />
        <HostCta crowd={crowd} chapter="06" />
        <Faq chapter="07" title={`${crowd.label}, answered`} items={faq} />
        <Others others={others} place={place} chapter="08" />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
