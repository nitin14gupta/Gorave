'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { AreaTypeProps } from '@/lib/areaType'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 03, what makes it work. The section pins and you fly forward
 * through it: each ingredient of the night starts far away in the depth,
 * rushes toward you, and slides past to one side as the next one arrives.
 * Reduced motion gets the same five as a plain list.
 */
export function FlyThrough({ area, story }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const items = story.anatomy
  const n = items.length
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const title = useTransform(p, [0, 0.08], [1, 0])

  if (reduce) {
    return (
      <section className="bg-cream px-6 py-24 md:px-20">
        <div className="mx-auto max-w-[1180px]">
          <Chapter n="03" title="What makes it work" />
          <ol className="mt-10 grid gap-4 md:grid-cols-5">
            {items.map((a, i) => (
              <li key={a.label} className="rounded-[24px] bg-white p-5 shadow-soft">
                <div className="font-serif text-lg italic text-orange">{String(i + 1).padStart(2, '0')}</div>
                <div className="mt-2 font-display text-xl font-extrabold tracking-[-0.03em]">{a.label}</div>
                <div className="mt-1 font-sans text-sm text-ink-2">{a.detail}</div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    )
  }

  return (
    <section ref={ref} className="relative bg-cream" style={{ height: `${(n + 1) * 70}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden" style={{ perspective: 900 }}>
        {/* Depth rings, for a sense of tunnel */}
        <div aria-hidden className="absolute inset-0" style={{ transformStyle: 'preserve-3d' }}>
          {[0, 1, 2, 3, 4].map(k => <Ring key={k} k={k} p={p} />)}
        </div>

        <motion.div style={{ opacity: title }} className="absolute inset-x-0 top-24 z-10 px-6 text-center">
          <Chapter n="03" title="What makes it work" className="justify-center" />
          <h2 className="mx-auto mt-4 max-w-[900px] font-display text-[clamp(40px,5.6vw,88px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Inside a good {story.singular}<span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> in {area.name}.</span>
          </h2>
        </motion.div>

        <div className="absolute inset-0 grid place-items-center" style={{ transformStyle: 'preserve-3d' }}>
          {items.map((a, i) => <Card key={a.label} a={a} i={i} n={n} p={p} />)}
        </div>

        <Progress p={p} n={n} />
      </div>
    </section>
  )
}

function Card({ a, i, n, p }: { a: { label: string; detail: string }; i: number; n: number; p: MotionValue<number> }) {
  const seg = 0.86 / n
  const start = 0.06 + i * seg
  const end = Math.min(1, start + seg * 1.6)
  const side = i % 2 ? 1 : -1
  // Rush in from the depth, hold in front of you, then fly past to one side.
  const arrive = start + seg * 0.7
  const leave = start + seg * 1.15
  const z = useTransform(p, [start, arrive, leave, end], [-2000, 0, 60, 600])
  const x = useTransform(p, [start, arrive, leave, end], [side * 60, 0, side * 20, side * 1000])
  const opacity = useTransform(p, [start, start + seg * 0.3, end - seg * 0.2, end], [0, 1, 1, 0])
  const rotateY = useTransform(p, [leave, end], [0, side * -28])
  return (
    <motion.div style={{ z, x, opacity, rotateY }} className="absolute w-[min(520px,86vw)]">
      <div className="rounded-[32px] bg-white p-8 shadow-pop md:p-10">
        <div className="flex items-baseline justify-between">
          <span className="font-serif text-3xl italic text-orange">{String(i + 1).padStart(2, '0')}</span>
          <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">of {String(n).padStart(2, '0')}</span>
        </div>
        <div className="mt-6 font-display text-[clamp(36px,4.4vw,64px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{a.label}</div>
        <div className="mt-3 font-sans text-lg text-ink-2">{a.detail}</div>
      </div>
    </motion.div>
  )
}

function Ring({ k, p }: { k: number; p: MotionValue<number> }) {
  const z = useTransform(p, [0, 1], [-2400 + k * 500, -2400 + k * 500 + 2600])
  const opacity = useTransform(z, [-2400, -600, 200, 500], [0, 0.5, 0.4, 0])
  return (
    <motion.div
      style={{ z, opacity }}
      className="absolute left-1/2 top-1/2 -ml-[45vw] -mt-[32vh] h-[64vh] w-[90vw] rounded-[48px] border-2 border-orange/30"
    />
  )
}

function Progress({ p, n }: { p: MotionValue<number>; n: number }) {
  const w = useTransform(p, [0.04, 0.96], ['0%', '100%'])
  return (
    <div className="absolute inset-x-0 bottom-10 flex justify-center">
      <div className="h-1 w-[min(320px,60vw)] overflow-hidden rounded-full bg-ink/10" aria-label={`${n} things that make it work`}>
        <motion.div style={{ width: w }} className="h-full rounded-full bg-orange" />
      </div>
    </div>
  )
}
