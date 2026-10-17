import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import type { AreaViewProps } from './types'
import { Hero } from './b/Hero'
import { Vibe } from './b/Vibe'
import { WhatsOn } from './b/WhatsOn'
import { LightsOn } from './b/LightsOn'
import { NightTable } from './b/NightTable'
import { KnownFor } from './b/KnownFor'
import { LuggageTags } from './b/LuggageTags'
import { NeighbourDeck } from './b/NeighbourDeck'
import { SendPostcard } from './b/SendPostcard'
import { HostPostcard } from './b/HostPostcard'
import { FaqPostcard } from './b/FaqPostcard'
import { HostsStrip } from '@/components/sections/hosts/HostsStrip'
import { SignOff } from './b/SignOff'

/**
 * Variant B"Postcards". A warm, paper-and-cream neighbourhood page where
 * every section is a piece of stationery: postcards, polaroids, stamps and
 * luggage tags on layered, deckle-edged sheets, moved by slow springs and
 * the scroll.
 */
export function AreaPageB({ area, events, crumbs, faq, hosts, hostTotal }: AreaViewProps) {
  return (
    <>
      <main className="bg-paper">
        <Hero area={area} crumbs={crumbs} />
        <Vibe area={area} />
        <WhatsOn area={area} events={events} />
        <LightsOn area={area} count={events.length} />
        <NightTable area={area} />
        <KnownFor area={area} />
        <LuggageTags area={area} />
        <NeighbourDeck area={area} />
        <SendPostcard area={area} />
        <HostPostcard area={area} />
        <HostsStrip hosts={hosts} total={hostTotal} place={area.name} href={`/${area.city.slug}/${area.slug}/hosts`} />
        <FaqPostcard area={area}>
          <Faq chapter="10" title={`Good to know in ${area.name}.`} items={faq} />
        </FaqPostcard>
        <SignOff area={area} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
