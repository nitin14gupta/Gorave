import { HOST_FAQ } from '@/lib/host'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { HeroA } from './a/HeroA'
import { PhoneBuild } from './a/PhoneBuild'
import { Earnings } from './a/Earnings'
import { MixDial } from './a/MixDial'
import { Address } from './a/Address'
import { BadgeLadder } from './a/BadgeLadder'
import { ControlRoom } from './a/ControlRoom'
import { HostCtaA } from './a/HostCtaA'

export const HOST_CRUMBS = [
  { label: 'Home', href: '/' },
  { label: 'Host', href: '/host' },
]

/**
 * Host page, variant A — "Your first party, start to finish". Daylight
 * palette; one event is built, priced, filled and opened over eight chapters.
 */
export function HostPageA() {
  return (
    <>
      <main>
        <HeroA crumbs={HOST_CRUMBS} />
        <PhoneBuild />
        <Earnings />
        <MixDial />
        <Address />
        <BadgeLadder />
        <ControlRoom />
        <Faq chapter="07" title="Hosting, answered" items={HOST_FAQ} />
        <HostCtaA />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
