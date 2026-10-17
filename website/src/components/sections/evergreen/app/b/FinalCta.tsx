'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { SampleEvent } from '@/constants'
import { useLiveEvents } from '@/components/ui/LiveEvents'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { ScanCard } from '../ScanCard'
import { SECONDARY } from '../data'
import { MiniCard } from './MiniCard'

const WORDS = ['Tap.', 'Tap.', 'Party.']

/**
 * Chapter 05, the last tap. The three words drop in one by one as you
 * arrive, while real event cards deal themselves out to either side of the
 * badges. Then the badges, the scan card and the two side doors.
 */
export function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const events = useLiveEvents()
  const cards = events.slice(0, 4)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream px-6 pb-24 pt-24 md:px-12 md:pb-28 md:pt-32 lg:px-20">
      <div className="relative mx-auto max-w-[1320px] text-center">
        <Chapter n="05" title="Two taps away" className="justify-center" />
        <div className="mt-8 flex flex-wrap justify-center gap-x-[0.18em] font-display text-[clamp(64px,12vw,210px)] font-extrabold leading-[1] tracking-[-0.065em] text-ink md:leading-[0.88]">
          {WORDS.map((w, i) => <Word key={i} i={i} word={w} p={p} reduce={reduce} />)}
        </div>

        <div className="relative mt-14 flex min-h-[320px] flex-col items-center justify-center">
          {cards.map((e, i) => <Dealt key={e.id} event={e} i={i} p={p} reduce={reduce} />)}
          <div className="relative z-10 flex flex-col items-center gap-5 rounded-[32px] bg-cream/85 px-6 py-8 backdrop-blur-md md:px-10">
            <p className="max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">Get Gorave, find a night near you, and let the QR do the talking at the door.</p>
            <StoreBadges height={56} />
            <ScanCard />
            <div className="flex flex-wrap justify-center gap-2">
              {SECONDARY.map(s => (
                <Link key={s.href} href={s.href} className="rounded-full bg-white/80 px-4 py-2 font-sans text-[13px] font-bold text-ink-2 transition-colors hover:bg-white hover:text-ink">{s.label} →</Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Word({ i, word, p, reduce }: { i: number; word: string; p: MotionValue<number>; reduce: boolean }) {
  const a = 0.1 + i * 0.14
  const y = useTransform(p, [a, a + 0.18], [reduce ? 0 : -90, 0])
  const opacity = useTransform(p, [a, a + 0.12], [reduce ? 1 : 0, 1])
  const last = i === WORDS.length - 1
  return (
    <motion.span style={{ y, opacity }} className={last ? 'inline-block font-serif font-normal italic tracking-[-0.035em] text-brand' : 'inline-block'}>
      {word}
    </motion.span>
  )
}

const SPOTS = [
  { x: -540, y: -10, r: -12 },
  { x: -350, y: 60, r: -5 },
  { x: 350, y: 60, r: 6 },
  { x: 540, y: -10, r: 12 },
]

function Dealt({ event, i, p, reduce }: { event: SampleEvent; i: number; p: MotionValue<number>; reduce: boolean }) {
  const s = SPOTS[i]
  const x = useTransform(p, [0.3, 0.85], [reduce ? s.x : 0, s.x])
  const rotate = useTransform(p, [0.3, 0.85], [0, s.r])
  return (
    <motion.div style={{ x, y: s.y, rotate }} className="absolute left-1/2 top-1/2 hidden lg:block">
      <div className="-translate-x-1/2 -translate-y-1/2 transition-transform duration-500 ease-out-expo hover:-translate-y-[60%]">
        <MiniCard event={event} width={200} />
      </div>
    </motion.div>
  )
}
