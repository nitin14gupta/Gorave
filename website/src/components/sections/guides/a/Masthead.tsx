'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const WORD = 'Hosting'
const EASE = [0.2, 0.8, 0.2, 1] as const

// A fixed scatter table (not Math.random) so server and client render the same letters.
const SCATTER = [0.62, -0.81, 0.35, -0.27, 0.94, -0.55, 0.12, 0.73, -0.68, 0.41, -0.93, 0.2, -0.38, 0.86, -0.15, 0.57, -0.74, 0.29, 0.66, -0.47, 0.08, -0.89, 0.51]
const rand = (i: number, k: number) => SCATTER[(i * 7 + k * 3) % SCATTER.length]

interface Props {
  crumbs: Crumb[]
  count: number
  minutes: number
}

/**
 * The masthead — the type arrives in pieces. On desktop the section pins and
 * each letter of the nameplate slides into place as you scroll, like a
 * compositor setting a cover. Phones get the same letters dropping in on load.
 */
export function Masthead({ crumbs, count, minutes }: Props) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const p = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 })
  const rule = useTransform(p, [0.45, 0.75], [0, 1])
  const hint = useTransform(p, [0, 0.2], [1, 0])
  const after = useTransform(p, [0.4, 0.7], [0, 1])
  const afterY = useTransform(p, [0.4, 0.7], [30, 0])

  return (
    <section ref={ref} className="relative bg-cream md:h-[210vh]">
      <h1 className="sr-only">Hosting guides</h1>
      <div className="flex min-h-[100svh] flex-col px-6 pb-12 pt-28 md:sticky md:top-0 md:h-screen md:min-h-0 md:px-20">
        <Breadcrumbs crumbs={crumbs} />

        <div className="mt-6 flex items-center justify-between gap-4 border-y-[1.5px] border-ink py-2.5 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-ink-2">
          <span>Gorave for hosts</span>
          <span className="hidden sm:inline">Issue 01 — The hosting guides</span>
          <span>{count} guides · {minutes} min</span>
        </div>

        <div className="relative my-auto py-8">
          {/* Desktop: scroll sets the type */}
          <div aria-hidden className="hidden select-none justify-center md:flex">
            {WORD.split('').map((ch, i) => (
              <ScrollLetter key={i} ch={ch} i={i} progress={p} />
            ))}
          </div>
          {/* Phones: letters drop in once */}
          <div aria-hidden className="flex select-none justify-center md:hidden">
            {WORD.split('').map((ch, i) => (
              <motion.span
                key={i}
                className="inline-block font-display text-[clamp(64px,21vw,140px)] font-extrabold leading-[0.82] tracking-[-0.06em] text-ink"
                initial={{ opacity: 0, y: rand(i, 1) * 120, rotate: rand(i, 2) * 40 }}
                animate={{ opacity: 1, y: 0, rotate: 0 }}
                transition={{ duration: 1, ease: EASE, delay: 0.1 + i * 0.06 }}
              >
                {ch}
              </motion.span>
            ))}
          </div>
          <motion.div style={{ scaleX: rule }} className="mx-auto mt-4 hidden h-[6px] w-[min(1100px,90%)] origin-left rounded-full bg-brand md:block" />

          <motion.div style={{ opacity: hint }} className="pointer-events-none absolute inset-x-0 -bottom-4 hidden text-center font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3 md:block">
            Scroll to set the type
          </motion.div>
        </div>

        <motion.div style={{ opacity: after, y: afterY }} className="hidden items-end justify-between gap-10 md:flex">
          <p className="font-serif text-[clamp(32px,3.4vw,52px)] italic leading-[1.02] tracking-[-0.02em] text-ink">
            guides, for nights<br />people remember.
          </p>
          <p className="max-w-[420px] font-sans text-lg leading-relaxed text-ink-2">
            Plain, practical notes on throwing a party in an Indian flat or rooftop: the room, the crowd, the money, the door and the neighbours.
          </p>
        </motion.div>
        <motion.div
          className="md:hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
        >
          <p className="font-serif text-[34px] italic leading-[1.02] text-ink">guides, for nights people remember.</p>
          <p className="mt-3 font-sans text-base leading-relaxed text-ink-2">
            Plain, practical notes on the room, the crowd, the money, the door and the neighbours.
          </p>
        </motion.div>
      </div>
    </section>
  )
}

function ScrollLetter({ ch, i, progress }: { ch: string; i: number; progress: MotionValue<number> }) {
  // Each letter lands at its own moment, so the word assembles left-to-right-ish.
  const start = 0.02 + Math.abs(rand(i, 5)) * 0.12
  const end = 0.32 + i * 0.03
  const x = useTransform(progress, [start, end], [rand(i, 1) * 260, 0])
  const y = useTransform(progress, [start, end], [rand(i, 2) * 260, 0])
  const rotate = useTransform(progress, [start, end], [rand(i, 3) * 70, 0])
  const scale = useTransform(progress, [start, end], [0.55 + Math.abs(rand(i, 4)) * 0.6, 1])
  const opacity = useTransform(progress, [0, end], [0.35, 1])
  const color = useTransform(progress, [end - 0.04, end], ['#8a8076', '#171310'])
  return (
    <motion.span
      style={{ x, y, rotate, scale, opacity, color }}
      className="inline-block font-display text-[clamp(120px,19vw,330px)] font-extrabold leading-[0.82] tracking-[-0.06em] will-change-transform"
    >
      {ch}
    </motion.span>
  )
}
