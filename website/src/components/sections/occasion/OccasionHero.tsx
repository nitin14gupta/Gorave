'use client'

import Image from 'next/image'
import { useRef, useSyncExternalStore } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { daysBetween, todayIST, type OccasionProps } from '@/lib/occasion'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const EASE = [0.2, 0.8, 0.2, 1] as const
const noop = () => () => {}

export const prettyDate = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' })

/**
 * Hero. The occasion set huge with the place under it, a countdown that
 * rolls in digit by digit, and the occasion's photo in a tall frame that
 * drifts as you scroll, with its emoji stamped on the corner.
 */
export function OccasionHero({ occasion: o, date, place, events, fallback, crumbs }: OccasionProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(p, [0, 1], ['0%', reduce ? '0%' : '18%'])
  // Days to go, worked out in the browser so it's always today's count.
  const days = useSyncExternalStore(noop, () => (date ? daysBetween(todayIST(), date) : null), () => null)
  const where = place.kind === 'india' ? 'across India' : `in ${place.name}`
  const live = fallback ? 0 : events.length

  return (
    <section ref={ref} className="overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Breadcrumbs crumbs={crumbs} />
        <div className="mt-10 grid items-center gap-14 lg:grid-cols-[1.2fr_1fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <div className="flex flex-wrap items-center gap-2">
              {date && <span className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-soft">{o.emoji} {prettyDate(date)}</span>}
              {live > 0 && <span className="rounded-full bg-brand px-4 py-2 font-sans text-sm font-bold text-white shadow-soft">{live} listed {where}</span>}
            </div>
            <h1 className="mt-6 font-display text-[clamp(56px,9vw,152px)] font-extrabold leading-[0.84] tracking-[-0.07em]">
              {o.name}
              <span className="block font-serif font-normal italic tracking-[-0.03em] text-orange">{where}.</span>
            </h1>
            <p className="mt-7 max-w-[500px] font-sans text-xl leading-relaxed text-ink-2">{o.heroLine}</p>

            {/* Countdown */}
            <div className="mt-10 flex items-end gap-4">
              <div className="flex overflow-hidden font-display text-[clamp(72px,8vw,120px)] font-extrabold leading-[0.85] tracking-[-0.07em] tabular-nums">
                {days === null ? (
                  <span className="text-ink-3">··</span>
                ) : (
                  String(Math.max(0, days)).split('').map((d, i) => (
                    <motion.span key={`${d}-${i}`} initial={reduce ? false : { y: '100%' }} animate={{ y: 0 }} transition={{ duration: 0.7, ease: EASE, delay: 0.3 + i * 0.08 }} className="inline-block">
                      {d}
                    </motion.span>
                  ))
                )}
              </div>
              <div className="pb-2 font-serif text-2xl italic leading-tight text-ink-2">
                {days === 0 ? <>it’s<br />today</> : days !== null && days < 0 ? <>happening<br />now</> : <>days<br />to go</>}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.94, rotate: 2 }}
            animate={{ opacity: 1, scale: 1, rotate: 2 }}
            transition={{ duration: 1, ease: EASE }}
            className="relative mx-auto aspect-[4/5] w-full max-w-[440px] overflow-hidden rounded-[40px] bg-tile shadow-pop"
          >
            <motion.div style={{ y: imgY }} className="absolute -inset-y-[10%] inset-x-0">
              <Image src={o.image} alt={`${o.name} at someone’s place`} fill priority sizes="440px" className="object-cover" />
            </motion.div>
            <motion.span
              initial={reduce ? false : { scale: 0, rotate: -40 }}
              animate={{ scale: 1, rotate: -12 }}
              transition={{ type: 'spring', stiffness: 260, damping: 14, delay: 0.6 }}
              className="absolute right-5 top-5 grid size-20 place-items-center rounded-full bg-white text-4xl shadow-pop"
            >
              {o.emoji}
            </motion.span>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
