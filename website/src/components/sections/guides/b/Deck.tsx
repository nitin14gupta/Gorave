'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { guideHref, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'
import { IndexCard } from './IndexCard'

const CW = 280
const GAP = 36
const STEP = CW + GAP
const ARC = 74

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const phase = (p: number, from: number, len: number) => clamp01((p - from) / len)

/**
 * Chapter 01 — the deck. The section pins with all six plays squared up in
 * one pile. Scroll and the pile fans into a hand, the hand is dealt out into
 * a row, and the row slides past so you can read every card.
 * Phones get the row as a swipeable strip.
 */
export function Deck({ guides }: { guides: HostGuide[] }) {
  return (
    <>
      <DeckPinned guides={guides} />
      <DeckStrip guides={guides} />
    </>
  )
}

function DeckPinned({ guides }: { guides: HostGuide[] }) {
  const ref = useRef<HTMLElement>(null)
  const vw = useMotionValue(1440)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.5 })
  const caption = useTransform(p, [0, 0.1, 0.3, 0.45], [1, 1, 1, 0])
  const caption2 = useTransform(p, [0.4, 0.5], [0, 1])
  const bar = useTransform(p, [0.45, 0.97], [0, 1])

  useEffect(() => {
    const set = () => vw.set(window.innerWidth)
    set()
    window.addEventListener('resize', set)
    return () => window.removeEventListener('resize', set)
  }, [vw])

  return (
    <section ref={ref} className="relative hidden h-[420vh] bg-noir-2 text-noir-ink md:block">
      <div className="sticky top-0 flex h-screen flex-col overflow-hidden px-20 pt-28">
        <div className="flex items-end justify-between gap-10">
          <div>
            <Chapter n="01" title="The deck" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5vw,80px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Six plays.<br />
              <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">Deal them out.</span>
            </h2>
          </div>
          <div className="relative h-14 w-[340px] text-right font-sans text-lg text-noir-ink-2">
            <motion.p style={{ opacity: caption }} className="absolute inset-0">Every guide is one card. Keep scrolling and the pile fans out.</motion.p>
            <motion.p style={{ opacity: caption2 }} className="absolute inset-0">Hover a card to lift it. Click to read the play.</motion.p>
          </div>
        </div>

        <div className="relative flex-1">
          <div className="absolute left-1/2 top-[46%] -translate-y-1/2">
            {guides.map((g, i) => (
              <DeckCard key={g.slug} guide={g} i={i} n={guides.length} p={p} vw={vw} />
            ))}
          </div>
        </div>

        <div className="mb-10 h-px bg-noir-ink/15">
          <motion.div style={{ scaleX: bar }} className="h-[2px] origin-left bg-brand" />
        </div>
      </div>
    </section>
  )
}

function DeckCard({ guide, i, n, p, vw }: { guide: HostGuide; i: number; n: number; p: MotionValue<number>; vw: MotionValue<number> }) {
  const k = i - (n - 1) / 2
  // How far the dealt-out row must slide each way so its ends reach the screen edges.
  const x = useTransform([p, vw], ([pv, w]: number[]) => {
    const pan = Math.max(0, ((n - 1) / 2) * STEP + CW / 2 - (w / 2 - 80))
    const t1 = phase(pv, 0.04, 0.24)
    const t2 = phase(pv, 0.3, 0.16)
    const t3 = phase(pv, 0.46, 0.5)
    const stack = k * 5
    const fan = k * ARC
    const row = k * STEP + pan
    return stack + (fan - stack) * t1 + (row - fan) * t2 - 2 * pan * t3 - CW / 2
  })
  const y = useTransform(p, (pv: number) => {
    const t1 = phase(pv, 0.04, 0.24)
    const t2 = phase(pv, 0.3, 0.16)
    const stack = -i * 3
    const fan = k * k * 16
    return stack + (fan - stack) * t1 + (0 - fan) * t2 - 190
  })
  const rotate = useTransform(p, (pv: number) => {
    const t1 = phase(pv, 0.04, 0.24)
    const t2 = phase(pv, 0.3, 0.16)
    const stack = ((i * 37) % 7) - 3
    const fan = k * 7
    return stack + (fan - stack) * t1 + (0 - fan) * t2
  })

  return (
    <motion.div style={{ x, y, rotate, zIndex: i + 1 }} className="absolute left-0 top-0 origin-bottom">
      <Link href={guideHref(guide.slug)} className="group block">
        <div className="transition-transform duration-500 ease-out-expo group-hover:-translate-y-5 group-hover:rotate-[-1.5deg]">
          <IndexCard guide={guide} n={i + 1} className="h-[380px] w-[280px] transition-shadow duration-500 group-hover:shadow-[0_40px_80px_-20px_rgb(255_56_100/0.45)]" />
        </div>
      </Link>
    </motion.div>
  )
}

function DeckStrip({ guides }: { guides: HostGuide[] }) {
  return (
    <section className="bg-noir-2 py-20 text-noir-ink md:hidden">
      <div className="px-6">
        <Chapter n="01" title="The deck" dark />
        <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">
          Six plays.<br />
          <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">Deal them out.</span>
        </h2>
        <p className="mt-3 font-sans text-base text-noir-ink-2">Swipe through the deck.</p>
      </div>
      <div className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-6">
        {guides.map((g, i) => (
          <Link key={g.slug} href={guideHref(g.slug)} className="shrink-0 snap-center" style={{ rotate: `${i % 2 ? 1.5 : -1.5}deg` }}>
            <IndexCard guide={g} n={i + 1} className="h-[360px] w-[260px]" />
          </Link>
        ))}
      </div>
    </section>
  )
}
