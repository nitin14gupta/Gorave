import type { AboutProps } from '../types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { ABOUT_FAQ } from './shared'
import { Hero } from './a/Hero'
import { Manifesto } from './a/Manifesto'
import { Beliefs } from './a/Beliefs'
import { Cities } from './a/Cities'
import { HowItWorks } from './a/HowItWorks'
import { SignOff } from './a/SignOff'
import { Team } from './Founders'

/**
 * About, variant A: "Why we exist." A manifesto. The line blooms open and
 * zooms into a living room, the why is read word by word, the five beliefs
 * get a pinned chapter each with callouts drawn on the photo, then the
 * cities, the three steps, the two founders, the questions and the invitation.
 */
export function AboutPageA({ stats, cities, events }: AboutProps) {
  return (
    <>
      <main className="bg-cream">
        <Hero stats={stats} />
        <Manifesto />
        <Beliefs />
        <Cities cities={cities} events={events} />
        <HowItWorks events={events} />
        <Team />
        <Faq chapter="06" title="About Gorave, answered" items={ABOUT_FAQ} />
        <SignOff stats={stats} />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
