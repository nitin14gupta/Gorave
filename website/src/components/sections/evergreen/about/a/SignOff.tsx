'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { SiteStats } from '@/lib/pagesData'
import { AREA_SCENES } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'
import { Ctas, ProofLink, statItems } from '../shared'

const FAN = [
  { rotate: -14, x: -250, y: 30 },
  { rotate: -5, x: -90, y: -10 },
  { rotate: 5, x: 90, y: -10 },
  { rotate: 14, x: 250, y: 30 },
]

/**
 * Chapter 07, the invitation. Four photos fan out from one stack as the line
 * slides together, then the two ways in: the app, or your own door.
 */
export function SignOff({ stats }: { stats: SiteStats }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const left = useTransform(p, [0.1, 0.75], [reduce ? 0 : -160, 0])
  const right = useTransform(p, [0.1, 0.75], [reduce ? 0 : 160, 0])
  const spread = useTransform(p, [0.15, 0.7], [reduce ? 1 : 0, 1])
  const pics = [AREA_SCENES.rooftop, '/img/crowd/balanced.webp', AREA_SCENES.doorway, '/img/time/weekend.webp']
  const facts = statItems(stats)

  return (
    <section ref={ref} className="overflow-hidden bg-paper px-6 pb-24 pt-28 md:px-12 md:pb-32 md:pt-36 lg:px-20">
      <div className="mx-auto max-w-[1320px] text-center">
        <Chapter n="07" title="The invitation" className="justify-center" />

        <div className="relative mx-auto mt-12 hidden h-[260px] max-w-[760px] sm:block">
          {FAN.map((f, i) => <FanCard key={i} f={f} i={i} src={pics[i]} spread={spread} />)}
        </div>

        <div className="mt-10 font-display font-extrabold leading-[0.88] tracking-[-0.06em] text-ink">
          <motion.div style={{ x: left }} className="text-[clamp(52px,10vw,170px)]">See you at</motion.div>
          <motion.div style={{ x: right }} className="font-serif text-[clamp(44px,8vw,136px)] font-normal italic tracking-[-0.03em] text-brand">
            someone’s place.
          </motion.div>
        </div>

        <p className="mx-auto mt-8 max-w-[520px] font-sans text-lg leading-relaxed text-ink-2">
          Find a night in your city tonight, or open your door and host one. Either way, it starts in the app.
        </p>
        <Ctas className="mt-9 items-center" />

        {facts.length > 0 && (
          <div className="mx-auto mt-14 flex max-w-[760px] flex-wrap justify-center gap-x-10 gap-y-4 border-t border-ink/10 pt-8">
            {facts.map(f => (
              <div key={f.label}>
                <div className="font-display text-4xl font-extrabold tracking-[-0.04em]">{f.value}</div>
                <div className="font-sans text-sm font-bold text-ink-3">{f.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
          <ProofLink href="/tonight">Tonight near you</ProofLink>
          <ProofLink href="/cities">All cities</ProofLink>
          <ProofLink href="/host/guides">Host guides</ProofLink>
        </div>
      </div>
    </section>
  )
}

function FanCard({ f, i, src, spread }: { f: (typeof FAN)[number]; i: number; src: string; spread: MotionValue<number> }) {
  const x = useTransform(spread, [0, 1], [0, f.x])
  const y = useTransform(spread, [0, 1], [0, f.y])
  const rotate = useTransform(spread, [0, 1], [i % 2 ? 3 : -3, f.rotate])
  return (
    <motion.div style={{ x, y, rotate, zIndex: i === 1 || i === 2 ? 2 : 1 }} className="absolute left-1/2 top-0 -ml-[85px] w-[170px]">
      <motion.div
        whileHover={{ y: -18, scale: 1.05, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="bg-white p-2 pb-9 shadow-pop"
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <Image src={src} alt="" fill sizes="170px" className="object-cover" />
        </div>
      </motion.div>
    </motion.div>
  )
}
