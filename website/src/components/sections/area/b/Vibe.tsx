'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { Area } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'
import { Deckle, Grain, SCRIBBLE } from './kit'

/** One word that comes into focus as its slice of the scroll passes. */
function Word({ p, from, to, children }: { p: MotionValue<number>; from: number; to: number; children: string }) {
  const opacity = useTransform(p, [from, to], [0.14, 1])
  const blur = useTransform(p, [from, to], [8, 0])
  const filter = useTransform(blur, b => `blur(${b.toFixed(2)}px)`)
  const y = useTransform(p, [from, to], [8, 0])
  return (
    <motion.span style={{ opacity, filter, y }} className="inline-block will-change-[opacity,filter]">
      {children}&nbsp;
    </motion.span>
  )
}

/**
 * Chapter 01, the feeling. The area's own description set as an editorial
 * pull quote; words blur into focus as you read down. Then three mood words
 * get circled by hand, one after another.
 */
export function Vibe({ area }: { area: Area }) {
  const { profile } = area
  const reduce = useReducedMotion()
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 88%', 'end 50%'] })
  const words = profile.vibe.split(' ')
  const n = words.length

  return (
    <section className="relative bg-cream px-6 py-28 md:px-20 md:py-36">
      <Deckle from="paper" seed={5} />
      <Grain />
      <div className="relative mx-auto max-w-[1180px]">
        <Chapter n="01" title="The feeling" />
        <div className="mt-10 grid gap-12 lg:grid-cols-[0.36fr_1fr]">
          <aside className="font-serif text-xl italic leading-snug text-ink-3 lg:pt-4">
            <span className="block h-px w-12 bg-ink/20" />
            <span className="mt-4 block">Written on the back:</span>
            <span className="mt-1 block text-ink-2">{area.name}, {profile.line}.</span>
          </aside>
          <div>
            <div aria-hidden className="-mb-6 font-serif text-[120px] leading-none text-orange/70">&ldquo;</div>
            <p ref={ref} className="font-serif text-[clamp(30px,3.6vw,54px)] leading-[1.14] tracking-[-0.01em] text-ink">
              {reduce
                ? profile.vibe
                : words.map((w, i) => (
                    <Word key={i} p={scrollYProgress} from={(i / n) * 0.85} to={Math.min(1, (i / n) * 0.85 + 0.18)}>{w}</Word>
                  ))}
            </p>

            <div className="mt-16 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">In three words</div>
            <ul className="mt-5 flex flex-wrap items-center gap-x-10 gap-y-6">
              {profile.moods.map((m, i) => (
                <li key={m} className="group relative px-4 py-2">
                  <span className="relative z-10 font-display text-[clamp(30px,3.4vw,48px)] font-extrabold tracking-[-0.045em] text-ink transition-colors duration-500 group-hover:text-orange">{m}</span>
                  <svg viewBox="0 0 200 70" preserveAspectRatio="none" className="pointer-events-none absolute -inset-x-3 -inset-y-2 h-[calc(100%+16px)] w-[calc(100%+24px)] text-orange" fill="none" aria-hidden>
                    <motion.path
                      d={SCRIBBLE}
                      stroke="currentColor"
                      strokeWidth="2.4"
                      strokeLinecap="round"
                      vectorEffect="non-scaling-stroke"
                      initial={reduce ? false : { pathLength: 0, opacity: 0 }}
                      whileInView={{ pathLength: 1, opacity: 1 }}
                      viewport={{ once: true, margin: '0px 0px -20% 0px' }}
                      transition={{ pathLength: { duration: 1.3, ease: [0.45, 0, 0.2, 1], delay: 0.25 + i * 0.45 }, opacity: { duration: 0.2, delay: 0.25 + i * 0.45 } }}
                      style={{ rotate: i % 2 ? 2 : -2 }}
                    />
                  </svg>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
