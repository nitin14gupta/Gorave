'use client'

import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { LINKS } from '../data'
import { ArrowLink, EASE, Head, r2 } from '../kit'

// A week before the night in 12-hour ticks; the last four are the 48 hours.
const TICKS = 15
const LOCKED_FROM = TICKS - 5

const CARDS = [
  {
    key: 'open',
    when: 'Up to 48 hours before',
    title: 'Cancel, and everyone is refunded.',
    body: 'Attendees get their ticket price back in their Gorave Wallet, automatically. You don\'t have to message anyone or move any money yourself.',
    tone: 'bg-sage text-sage-ink',
  },
  {
    key: 'locked',
    when: 'Inside 48 hours',
    title: 'Cancelling is blocked.',
    body: 'Guests have planned their night around yours, so it stays on. This is what makes a booked ticket worth something.',
    tone: 'bg-blush text-blush-ink',
  },
] as const

/**
 * Chapter 04, the one rule. A week-long ruler draws in tick by tick; hover
 * either card and its stretch of the ruler lights up.
 */
export function Rule48() {
  const [on, setOn] = useState<0 | 1 | null>(null)
  const reduce = useReducedMotion()

  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head n="06" label="The one rule" title="Plans change." serif="Here's the line." />

        <div className="mt-14 grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="relative">
            <div className="font-display text-[clamp(150px,22vw,320px)] font-extrabold leading-[0.8] tracking-[-0.08em] text-brand">48</div>
            <div className="mt-2 font-serif text-3xl italic text-ink-2">hours before the night</div>
          </div>

          <div>
            {/* The ruler */}
            <div className="flex h-24 items-end gap-[3px] sm:gap-1.5" aria-hidden>
              {Array.from({ length: TICKS }, (_, i) => {
                const locked = i >= LOCKED_FROM
                const lit = on === null ? true : on === 1 ? locked : !locked
                const tall = i % 2 === 0
                return (
                  <motion.span
                    key={i}
                    initial={reduce ? false : { scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.04 }}
                    className={cn(
                      'flex-1 origin-bottom rounded-full transition-[background-color,opacity] duration-500',
                      tall ? 'h-full' : 'h-2/3',
                      locked ? 'bg-coral' : 'bg-[#8DBF8A]',
                      lit ? 'opacity-100' : 'opacity-20',
                    )}
                  />
                )
              })}
            </div>
            <div className="relative mt-3 flex justify-between font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
              <span>A week out</span>
              <span className="absolute -translate-x-1/2 text-coral" style={{ left: `${r2((LOCKED_FROM / (TICKS - 1)) * 100)}%` }}>48h</span>
              <span>The night</span>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2" onMouseLeave={() => setOn(null)}>
              {CARDS.map((c, i) => (
                <div
                  key={c.key}
                  tabIndex={0}
                  onMouseEnter={() => setOn(i as 0 | 1)}
                  onFocus={() => setOn(i as 0 | 1)}
                  onBlur={() => setOn(null)}
                  className={cn(
                    'rounded-[28px] p-6 outline-none transition-transform duration-500 ease-out-expo hover:-translate-y-1.5 focus-visible:ring-2 focus-visible:ring-ink',
                    c.tone,
                    on === i && (i ? 'rotate-[1deg]' : '-rotate-[1deg]'),
                  )}
                >
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] opacity-70">{c.when}</div>
                  <div className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em]">{c.title}</div>
                  <p className="mt-2 font-sans text-[15px] leading-relaxed opacity-85">{c.body}</p>
                </div>
              ))}
            </div>
            <ArrowLink href={LINKS.safety} className="mt-8">How Gorave keeps nights safe</ArrowLink>
          </div>
        </div>
      </div>
    </section>
  )
}
