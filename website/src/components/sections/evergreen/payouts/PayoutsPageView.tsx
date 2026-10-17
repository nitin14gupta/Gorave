import type { PayoutsProps } from '../types'
import { Faq } from '@/components/sections/shared/Faq'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { FloatingDock } from '@/components/layout/FloatingDock'
import { cover, PAYOUT_FAQ, proofLine } from './data'
import { HeroNinety } from './HeroNinety'
import { MoneyPath } from './a/MoneyPath'
import { ReceiptPrint } from './b/ReceiptPrint'
import { Calculator } from './a/Calculator'
import { FreeVsPaid } from './b/FreeVsPaid'
import { SetupSplit } from './b/SetupSplit'
import { Rule48 } from './b/Rule48'
import { FinalCtaB } from './b/FinalCtaB'

/**
 * /host/payouts: the picked sections. A new "90%" hero, one ticket's three
 * stops, the same ticket itemised, the calculator, free vs paid, where the
 * money lands, the 48-hour line, questions and "print your first payout".
 */
export function PayoutsPageView({ stats, events }: PayoutsProps) {
  const proof = proofLine(stats)
  const free = events.filter(e => e.price === 'Free')
  const paid = events.filter(e => e.price !== 'Free')
  const pick = (list: typeof events, from: number) => Array.from({ length: 3 }, (_, i) => cover(list, from + i))
  return (
    <>
      <main>
        <HeroNinety proof={proof.length ? proof.join(' · ') : null} image={cover(paid.length ? paid : events, 0)} />
        <MoneyPath cover={cover(events, 0)} />
        <ReceiptPrint />
        <Calculator />
        <FreeVsPaid free={pick(free, 0)} paid={pick(paid, 1)} />
        <SetupSplit cover={cover(paid.length ? paid : events, 0)} />
        <Rule48 />
        <Faq chapter="07" title="Payouts, answered" items={PAYOUT_FAQ} />
        <FinalCtaB />
      </main>
      <SiteFooter />
      <FloatingDock />
    </>
  )
}
