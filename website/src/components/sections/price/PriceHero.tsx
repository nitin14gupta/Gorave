'use client'

import { useRef, useState } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { PriceProps } from '@/lib/price'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Hero. The headline with the kinds of night as hover words (each pops
 * its photo), and a big price tag hanging on a string that sways as you
 * scroll and swings when you flick it with the cursor.
 */
export function PriceHero({ tier, place, events, crumbs, typeImages }: PriceProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const sway = useSpring(useTransform(p, [0, 1], [0, reduce ? 0 : 18]), { stiffness: 60, damping: 8 })
  const [flick, setFlick] = useState(0)
  const where = place.kind === 'india' ? 'across India' : `in ${place.name}`
  const free = tier.slug === 'free-events'

  return (
    <section ref={ref} className="overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Breadcrumbs crumbs={crumbs} />
        <div className="mt-10 grid items-center gap-14 lg:grid-cols-[1.25fr_1fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <h1 className="font-display text-[clamp(52px,8vw,136px)] font-extrabold leading-[0.86] tracking-[-0.07em]">
              {free ? 'Free nights' : 'Nights under ₹500'}
              <span className="block font-serif font-normal italic tracking-[-0.03em] text-orange">{where}.</span>
            </h1>
            <HoverPopGroup size="md">
              <p className="mt-8 max-w-[560px] font-display text-[clamp(22px,2.2vw,30px)] font-extrabold leading-snug tracking-[-0.03em] text-ink-2">
                {free ? 'Free ' : 'Cheap '}
                {typeImages.map((t, i) => (
                  <span key={t.label}>
                    <HoverPop image={t.image} className="cursor-default text-ink underline decoration-orange/40 decoration-[3px] underline-offset-[6px] transition-colors hover:text-orange hover:decoration-orange">
                      {t.label}
                    </HoverPop>
                    {i < typeImages.length - 2 ? ', ' : i === typeImages.length - 2 ? ' and ' : ''}
                  </span>
                ))}
                , hosted by real people.
              </p>
            </HoverPopGroup>
            <p className="mt-5 max-w-[500px] font-sans text-lg leading-relaxed text-ink-2">{tier.heroLine}</p>
          </motion.div>

          {/* The hanging price tag */}
          <div className="relative mx-auto h-[420px] w-full max-w-[380px]">
            <div aria-hidden className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 rounded-full bg-ink/60" />
            <motion.div
              style={{ rotate: sway, transformOrigin: '50% 0%' }}
              className="absolute left-1/2 top-1.5 -ml-[130px] w-[260px]"
            >
              <motion.div
                onMouseEnter={e => {
                  const r = e.currentTarget.getBoundingClientRect()
                  setFlick(f => f + 1)
                  void r
                }}
                animate={reduce ? undefined : { rotate: flick ? [0, 14, -9, 5, -2, 0] : 0 }}
                transition={{ duration: 1.6, ease: 'easeOut' }}
                key={flick}
                style={{ transformOrigin: '50% 0%' }}
              >
                <svg viewBox="0 0 40 70" className="mx-auto h-[70px] w-10 text-ink/50" fill="none" aria-hidden>
                  <path d="M20 0 C 12 25, 28 45, 20 70" stroke="currentColor" strokeWidth="1.4" />
                </svg>
                <div
                  className="relative -mt-1 rounded-[28px] bg-brand px-7 pb-8 pt-12 text-white shadow-pop"
                  style={{ clipPath: 'polygon(50% 0, 100% 16%, 100% 100%, 0 100%, 0 16%)' }}
                >
                  <span aria-hidden className="absolute left-1/2 top-[22px] size-5 -translate-x-1/2 rounded-full bg-cream shadow-[inset_0_2px_4px_rgb(0_0_0/.25)]" />
                  <div className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white/80">{free ? 'Price' : 'Under'}</div>
                  <div className="mt-1 font-display text-[96px] font-extrabold leading-[0.9] tracking-[-0.07em]">{tier.tag}</div>
                  <div className="mt-4 border-t border-dashed border-white/40 pt-4 font-sans text-sm font-bold">
                    {events.length ? `${events.length} on ${place.kind === 'india' ? 'right now' : `in ${place.name}`}` : 'New nights every week'}
                  </div>
                  {free && (
                    <motion.div
                      initial={reduce ? false : { scale: 2.4, opacity: 0, rotate: -30 }}
                      animate={{ scale: 1, opacity: 1, rotate: -12 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.7 }}
                      className="absolute -right-2 bottom-20 rounded-xl border-[3px] border-white px-3 py-1 font-display text-2xl font-extrabold tracking-[-0.03em]"
                    >
                      FREE
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
