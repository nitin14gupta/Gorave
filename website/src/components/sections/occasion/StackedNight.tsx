'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { OccasionProps } from '@/lib/occasion'
import { Head } from '@/components/sections/areaType/kit'

/**
 * Chapter 03, the night. Each part of the evening is a big card that pins
 * as you scroll; the next slides up over it while the one underneath
 * shrinks back and dims, so the night stacks up like a deck.
 */
export function StackedNight({ occasion: o }: OccasionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const n = o.stops.length
  return (
    <section className="bg-paper px-6 pt-24 md:px-12 md:pt-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head n="03" label="The night" title={`A ${o.night},`} serif="stop by stop." aside="How it usually goes. Keep scrolling." />
        <div ref={ref} className="relative mt-12 pb-24 md:pb-32">
          {o.stops.map((s, i) => (
            <Card key={s.time} s={s} i={i} n={n} p={p} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Card({ s, i, n, p }: { s: { time: string; title: string; detail: string; image: string }; i: number; n: number; p: MotionValue<number> }) {
  const reduce = !!useReducedMotion()
  const start = i / n
  const scale = useTransform(p, [start, 1], [1, reduce ? 1 : 1 - (n - 1 - i) * 0.05])
  const dim = useTransform(p, [start + 1 / n, 1], [0, reduce ? 0 : (n - 1 - i) * 0.12])
  return (
    <div className="sticky h-[78vh] min-h-[440px]" style={{ top: `${96 + i * 22}px` }}>
      <motion.div style={{ scale, transformOrigin: '50% 0%' }} className="relative grid h-[66vh] min-h-[400px] overflow-hidden rounded-[36px] bg-white shadow-pop md:grid-cols-[1fr_1.1fr]">
        <div className="flex flex-col justify-between p-8 md:p-12">
          <div className="font-serif text-xl italic text-orange">{String(i + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}</div>
          <div>
            <div className="font-display text-[clamp(64px,8vw,128px)] font-extrabold leading-[0.85] tracking-[-0.07em]">{s.time}</div>
            <div className="mt-5 font-display text-[clamp(28px,3vw,44px)] font-extrabold leading-tight tracking-[-0.045em]">{s.title}</div>
            <p className="mt-2 font-sans text-lg text-ink-2">{s.detail}</p>
          </div>
        </div>
        <div className="relative hidden md:block">
          <Image src={s.image} alt="" fill sizes="600px" className="object-cover" />
        </div>
        <motion.div aria-hidden style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-ink" />
      </motion.div>
    </div>
  )
}
