import type { AppProps } from '../types'
import { LiveEventsProvider } from '@/components/ui/LiveEvents'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { Hero } from './b/Hero'
import { Story } from './a/Story'
import { NightRail } from './b/NightRail'
import { Bento } from './a/Bento'
import { Explore } from './b/Explore'
import { Cities } from './a/Cities'
import { FAQ } from './data'

/**
 * /app, where every "Get the app" button lands: the best of both lab
 * variants. Real event cards gather into a phone, the five-screen story with
 * callouts, Thursday to Sunday, the hover bento, the cursor-follow feature
 * list, live cities, questions and the door.
 *
 * Unused but kept for other pages (see README "Parts bank"): a/Hero (tilting
 * phone cover), b/CitiesStrip (widening city cards), b/FinalCta (word-drop CTA).
 */
export function AppPageView({ events, stats, cities }: AppProps) {
  return (
    <LiveEventsProvider events={events}>
      <main className="bg-cream">
        <Hero stats={stats} />
        <Story />
        <NightRail />
        <Bento events={events} />
        <Explore />
        <Cities cities={cities} events={events} />
        <Faq chapter="06" title="The app, answered" items={FAQ} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </LiveEventsProvider>
  )
}
