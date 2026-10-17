'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 03, how it works. A numbered ledger: as each step scrolls up, its
 * rule draws across the page, its numeral rolls up from 0 like an odometer
 * and the words slide in after it.
 */
export function HowSteps({ crowd, chapter = '03' }: { crowd: CrowdContent; chapter?: string }) {
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-36 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
          <div>
            <Chapter n={chapter} title="How it works" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              How the app <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">keeps it true</span>.
            </h2>
          </div>
          <p className="max-w-[420px] font-sans text-lg leading-relaxed text-ink-2 md:justify-self-end">{crowd.heroLine}</p>
        </div>
        <ol className="mt-16 md:mt-24">
          {crowd.how.map((s, i) => (
            <Step key={s.title} n={i + 1} title={s.title} body={s.body} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  const ref = useRef<HTMLLIElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 92%', 'start 45%'] })
  const line = useTransform(p, [0, 0.7], [0, 1])
  const digit = useTransform(p, v => Math.min(n, Math.max(0, Math.floor(((v - 0.1) / 0.6) * (n + 1)))))
  const smooth = useSpring(digit, { stiffness: 140, damping: 22 })
  const roll = useTransform(smooth, v => `${-Math.round(v * 1000) / 1000}em`)
  const o = useTransform(p, [0.3, 0.8], [0, 1])
  const tx = useTransform(p, [0.3, 0.8], [reduce ? 0 : 36, 0])

  return (
    <li ref={ref} className="relative grid gap-3 py-9 md:grid-cols-[minmax(160px,0.8fr)_1.3fr_1fr] md:items-baseline md:gap-10 md:py-14">
      <motion.span aria-hidden style={{ scaleX: line }} className="absolute inset-x-0 top-0 h-[1.5px] origin-left bg-ink" />
      <div className="flex items-baseline font-display text-[clamp(72px,9vw,148px)] font-extrabold leading-none tracking-[-0.06em] text-ink" aria-label={`Step ${n}`}>
        <span>0</span>
        <span className="relative inline-block h-[1em] overflow-hidden">
          <motion.span style={{ y: roll }} className="block">
            {Array.from({ length: n + 1 }, (_, k) => (
              <span key={k} className="block h-[1em]">{k}</span>
            ))}
          </motion.span>
        </span>
      </div>
      <motion.h3 style={{ opacity: o, x: tx }} className="font-display text-[clamp(28px,3vw,46px)] font-extrabold leading-[0.98] tracking-[-0.045em]">
        {title}
      </motion.h3>
      <motion.p style={{ opacity: o }} className="max-w-[420px] font-sans text-lg leading-relaxed text-ink-2">
        {body}
      </motion.p>
    </li>
  )
}
