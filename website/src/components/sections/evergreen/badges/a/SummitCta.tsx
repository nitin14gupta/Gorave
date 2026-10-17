'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { BadgeTier } from '@/lib/pagesData'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { BadgeArt } from '../kit'

/**
 * The last page. The four badges rise into a staircase as you arrive, then
 * the line and the way in.
 */
export function SummitCta({ tiers }: { tiers: BadgeTier[] }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })

  return (
    <section ref={ref} className="overflow-hidden bg-paper px-6 pb-24 pt-24 md:px-12 md:pb-32 md:pt-32">
      <div className="mx-auto max-w-[1180px] text-center">
        <div className="mx-auto flex h-[150px] max-w-[560px] items-end justify-center gap-[3%] md:h-[220px]">
          {tiers.map((t, i) => (
            <Step key={t.key} tier={t} i={i} p={p} reduce={reduce} />
          ))}
        </div>
        <Chapter n="06" title="Your turn" className="mt-12 justify-center" />
        <h2 className="mx-auto mt-5 max-w-[980px] font-display text-[clamp(52px,8vw,128px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
          Start at the bottom.
          <br />
          <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Climb from there.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-[500px] font-sans text-lg text-ink-2">Host two events and you&apos;re Rising. Every one after that counts towards the next badge.</p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
          <Button href="/host" size="lg">Start hosting</Button>
          <StoreBadges height={48} />
        </div>
      </div>
    </section>
  )
}

function Step({ tier, i, p, reduce }: { tier: BadgeTier; i: number; p: MotionValue<number>; reduce: boolean }) {
  const y = useTransform(p, [0.05 + i * 0.08, 0.45 + i * 0.08], [reduce ? 0 : 120, 0])
  const o = useTransform(p, [0.05 + i * 0.08, 0.35 + i * 0.08], [0, 1])
  return (
    <motion.div style={{ y, opacity: o, marginBottom: `calc(${i} * clamp(10px,2.4vw,30px))` }} className="w-[22%]">
      <BadgeArt tier={tier.key} size={120} className="!h-auto !w-full drop-shadow-[0_16px_20px_rgb(23_19_16/0.2)]" />
    </motion.div>
  )
}
