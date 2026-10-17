'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { BRAND } from '@/constants'
import { BADGE_TIERS } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Scroll progress → events hosted. Piecewise so each tier gets its own stretch of scroll.
const STOPS = [0.05, 0.22, 0.45, 0.68, 0.9]
const COUNTS = [0, BADGE_TIERS[0].at, BADGE_TIERS[1].at, BADGE_TIERS[2].at, BADGE_TIERS[3].at]

/**
 * Chapter 05, the climb. A counter of events hosted ticks up as you scroll
 * and the ladder lights rung by rung; each real badge stamps itself in when
 * the count reaches its tier.
 */
export function BadgeLadder() {
  return (
    <>
      <LadderPinned />
      <LadderList />
    </>
  )
}

function LadderPinned() {
  const ref = useRef<HTMLElement>(null)
  const [count, setCount] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const events = useTransform(scrollYProgress, STOPS, COUNTS)
  useMotionValueEvent(events, 'change', v => setCount(Math.round(v)))
  const climb = useTransform(scrollYProgress, [STOPS[0], STOPS[4]], ['0%', '100%'])

  return (
    <section ref={ref} className="relative hidden h-[340vh] bg-sage text-sage-ink md:block">
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-20">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_1.2fr] items-center gap-16">
          <div>
            <Chapter n="05" title="The climb" className="!text-sage-ink/70" />
            <h2 className="mt-4 font-display text-[clamp(48px,5.4vw,84px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Every night<br />counts.
            </h2>
            <p className="mt-4 max-w-[420px] font-sans text-lg leading-relaxed text-sage-ink/80">
              Guests review every event. Keep hosting and your badge levels up, guests see it on your profile and your invites.
            </p>
            <div className="mt-10">
              <div className="font-display text-[clamp(96px,11vw,180px)] font-extrabold leading-[0.8] tracking-[-0.07em] tabular-nums">
                {count}
                {count >= COUNTS[4] && <span className="text-[0.5em]">+</span>}
              </div>
              <div className="mt-3 font-sans text-sm font-bold uppercase tracking-[0.16em] text-sage-ink/70">events hosted · scroll to keep going</div>
            </div>
          </div>

          <div className="relative flex h-[78vh] flex-col-reverse justify-between py-4 pl-16">
            <div className="absolute bottom-4 left-5 top-4 w-2 overflow-hidden rounded-full bg-sage-ink/10">
              <motion.div className="absolute inset-x-0 bottom-0 bg-brand" style={{ height: climb }} />
            </div>
            {BADGE_TIERS.map(b => (
              <Rung key={b.key} tier={b} lit={count >= b.at} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Rung({ tier, lit }: { tier: (typeof BADGE_TIERS)[number]; lit: boolean }) {
  return (
    <div className="relative flex items-center gap-6">
      <span className={cn('absolute -left-[50px] size-5 rounded-full border-4 border-sage transition-colors duration-500', lit ? 'bg-coral' : 'bg-sage-ink/20')} />
      <motion.div
        initial={false}
        animate={lit ? { scale: 1, rotate: 0, opacity: 1, filter: 'grayscale(0)' } : { scale: 0.7, rotate: -18, opacity: 0.35, filter: 'grayscale(1)' }}
        transition={{ type: 'spring', stiffness: 340, damping: 14 }}
        className="shrink-0"
      >
        <Image src={BRAND.badges[tier.key]} alt={`${tier.name} host badge`} width={120} height={120} className="size-[clamp(84px,11vh,120px)] object-contain" />
      </motion.div>
      <div className={cn('transition-opacity duration-500', lit ? 'opacity-100' : 'opacity-40')}>
        <div className="font-serif text-lg italic text-orange">{tier.at}+ events</div>
        <div className="font-display text-[clamp(28px,3vw,40px)] font-extrabold leading-none tracking-[-0.04em]">{tier.name}</div>
        <div className="mt-1 max-w-[300px] font-sans text-[15px] text-sage-ink/75">{tier.line}</div>
      </div>
    </div>
  )
}

function LadderList() {
  return (
    <section className="bg-sage px-6 py-20 text-sage-ink md:hidden">
      <Chapter n="05" title="The climb" className="!text-sage-ink/70" />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">Every night<br />counts.</h2>
      <p className="mt-3 font-sans text-base text-sage-ink/80">Guests review every event. Keep hosting and your badge levels up.</p>
      <div className="mt-8 grid grid-cols-2 gap-3">
        {BADGE_TIERS.map((b, i) => (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, scale: 0.7, rotate: -10 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: 'spring', stiffness: 300, damping: 16, delay: i * 0.08 }}
            className="rounded-[24px] bg-white/55 p-4 text-center"
          >
            <Image src={BRAND.badges[b.key]} alt={`${b.name} host badge`} width={96} height={96} className="mx-auto size-24 object-contain" />
            <div className="font-display text-xl font-extrabold">{b.name}</div>
            <div className="font-sans text-xs text-sage-ink/70">{b.at}+ events hosted</div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
