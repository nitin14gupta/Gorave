'use client'

import { useEffect, useMemo, useRef } from 'react'
import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import type { TimeViewProps } from '../types'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'
import { EASE, addDays, keyParts, plural } from './kit'
import { useIstToday, useWindowKeys } from './useWindow'

type Props = Pick<TimeViewProps, 'time' | 'place' | 'total' | 'days' | 'places'> & { chapter?: string }

const HEAD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

// Hand-drawn ring around a date (viewBox 100 x 100).
const RING = 'M18 52 C 14 22, 70 8, 88 34 C 100 56, 82 90, 48 90 C 18 90, 6 66, 16 44 C 22 32, 36 24, 52 22'

/**
 * Chapter 01, the window at a glance. Real totals counting up on one side;
 * on the other, the next two weeks as a desk calendar, with this window's
 * days ringed in pen (drawn in on view) and how many nights each one has.
 */
export function Ledger({ time, place, total, days, places, chapter = '01' }: Props) {
  const today = useIstToday()
  const fallback = useMemo(() => days.map(d => d.key).filter(k => keyParts(k)), [days])
  const keys = useWindowKeys(time.slug, fallback)
  const counts = useMemo(() => new Map(days.map(d => [d.key, d.events.length])), [days])
  const liveDays = days.filter(d => d.events.length).length
  const livePlaces = places.filter(p => p.count > 0).length
  const hub = !place.citySlug

  // Two weeks from the Monday of this week (or of the first listed day before the client knows "today").
  const base = today || fallback[0] || ''
  const cells = useMemo(() => {
    const b = keyParts(base)
    if (!b) return Array.from({ length: 14 }, () => null)
    const monday = addDays(base, -((b.dow + 6) % 7))
    return Array.from({ length: 14 }, (_, i) => keyParts(addDays(monday, i)))
  }, [base])
  const inWindow = new Set(keys)
  const first = cells.find(c => c)
  const month = first ? `${first.month} ${first.year}` : time.label

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
        <div>
          <Chapter n={chapter} title="At a glance" />
          <p className="mt-8 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[1] tracking-[-0.05em] text-ink">
            {total > 0 ? (
              <>
                <Count to={total} /> {total === 1 ? 'night' : 'nights'}
                {liveDays > 1 && (
                  <>
                    {' '}over <Count to={liveDays} /> days
                  </>
                )}
                {livePlaces > 0 && (
                  <>
                    , in <Count to={livePlaces} /> {hub ? (livePlaces === 1 ? 'city' : 'cities') : livePlaces === 1 ? 'neighbourhood' : 'neighbourhoods'}
                  </>
                )}
                <span className="text-orange">.</span>
              </>
            ) : (
              <>
                Nothing listed yet<span className="text-orange">.</span>
              </>
            )}
          </p>
          <p className="mt-6 max-w-[460px] font-serif text-[clamp(22px,2vw,28px)] italic leading-snug text-ink-2">{time.heroLine}</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 1.5 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="rounded-[32px] bg-white p-5 shadow-soft md:p-8"
        >
          <div className="flex items-center justify-between px-1 pb-5">
            <span className="font-display text-2xl font-extrabold tracking-[-0.04em]">{month}</span>
            <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{time.promise}</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 md:gap-2">
            {HEAD.map(h => (
              <div key={h} className="pb-2 text-center font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3 md:text-[11px]">{h}</div>
            ))}
            {cells.map((c, i) => {
              const on = !!c && inWindow.has(c.key)
              const past = !!c && !!today && c.key < today
              const n = c ? counts.get(c.key) ?? 0 : 0
              const order = on ? keys.indexOf(c.key) : 0
              return (
                <div
                  key={c?.key ?? i}
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-2xl md:aspect-[1/1.05]',
                    on ? 'bg-blush' : 'bg-paper',
                    past && 'opacity-35',
                  )}
                >
                  {c && c.key === today && (
                    <span className="absolute left-1/2 top-1.5 -translate-x-1/2 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-coral md:top-2 md:text-[9px]">Today</span>
                  )}
                  <span className={cn('font-display text-[clamp(18px,2.4vw,34px)] font-extrabold leading-none tracking-[-0.05em]', on ? 'text-ink' : 'text-ink-2')}>
                    {c ? c.day : '·'}
                  </span>
                  {on && n > 0 && (
                    <span className="mt-1 font-sans text-[9px] font-bold text-ink-2 md:text-[11px]">
                      {n}
                      <span className="hidden md:inline"> {n === 1 ? 'night' : 'nights'}</span>
                    </span>
                  )}
                  {on && <Ring delay={0.4 + order * 0.18} />}
                </div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-3 px-1 font-sans text-sm text-ink-2">
            <span className="size-3.5 rounded-[5px] bg-blush" /> {time.label}
            <span className="ml-auto font-serif italic text-ink-3">{total > 0 ? `${plural(total, 'night')} listed` : 'No nights yet'}</span>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Ring({ delay }: { delay: number }) {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute -inset-1 size-[calc(100%+8px)] overflow-visible" aria-hidden>
      <motion.path
        d={RING}
        fill="none"
        stroke="#FF6B35"
        strokeWidth={3.2}
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
        initial={reduce ? false : { pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, ease: EASE, delay }}
      />
    </svg>
  )
}

/** A number that counts up once when it scrolls into view. */
function Count({ to }: { to: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const reduce = useReducedMotion()
  const mv = useMotionValue(0)
  const text = useTransform(mv, v => String(Math.round(v)))
  useEffect(() => {
    if (!inView) return
    const c = animate(mv, to, { duration: reduce ? 0 : 1.4, ease: EASE })
    return () => c.stop()
  }, [inView, to, mv, reduce])
  return (
    <span ref={ref} className="inline-block tabular-nums text-brand">
      <motion.span>{text}</motion.span>
    </span>
  )
}
