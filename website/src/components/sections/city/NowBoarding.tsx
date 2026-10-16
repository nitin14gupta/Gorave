'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { NIGHT_SLOTS, POSTERS, type City } from '@/constants'
import { cn } from '@/lib/cn'
import { useClientValue } from '@/hooks/useClientValue'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'

const EASE = [0.2, 0.8, 0.2, 1] as const

const FALLBACK_DAYS = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7']

// Cached per calendar day so useSyncExternalStore gets a stable snapshot.
let cache: { key: string; days: string[] } | null = null
function weekDays() {
  const key = new Date().toDateString()
  if (cache?.key === key) return cache.days
  const out: string[] = []
  const now = new Date()
  for (let i = 0; i < 7; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    out.push(i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }))
  }
  cache = { key, days: out }
  return out
}

/**
 * Chapter 03 — the plan. A departure board for the week: pick a day, rows
 * flip in; hover a row and its flyer follows your cursor.
 */
export function NowBoarding({ city }: { city: City }) {
  const days = useClientValue(weekDays, FALLBACK_DAYS)
  const [day, setDay] = useState(0)
  const [row, setRow] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 300, damping: 30 })
  const y = useSpring(my, { stiffness: 300, damping: 30 })

  // Sample rotation per day until the public events API lands.
  const rows = useMemo(
    () => NIGHT_SLOTS.slice(0, 6)
      .map((s, i) => ({ ...s, area: city.areas[(i + day) % city.areas.length] }))
      .filter((_, i) => (i + day) % 4 !== 3),
    [city, day],
  )

  return (
    <section id="tonight" className="scroll-mt-24 bg-noir px-6 py-28 text-noir-ink md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Chapter n="03" title="The plan" dark />
            <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">Now boarding.</h2>
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full bg-noir-2 p-1.5">
            {days.map((d, i) => (
              <button
                key={d}
                type="button"
                onClick={() => setDay(i)}
                className={cn('shrink-0 rounded-full px-4 py-2.5 font-sans text-[13px] font-bold transition-colors', day === i ? 'bg-noir-ink text-ink' : 'text-noir-ink-2 hover:text-noir-ink')}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <div
          ref={box}
          className="relative"
          onMouseMove={e => { const r = box.current!.getBoundingClientRect(); mx.set(e.clientX - r.left + 30); my.set(e.clientY - r.top - 150) }}
          onMouseLeave={() => setRow(null)}
        >
          <div className="hidden grid-cols-[110px_1.6fr_1fr_1fr_110px_140px] px-6 pb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-noir-ink-2 md:grid">
            <span>Time</span><span>Event</span><span>Area</span><span>Vibe</span><span>Price</span><span className="text-right">Status</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={day} initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
              {rows.map((r, i) => {
                const on = row === i
                return (
                  <motion.a
                    href={`/${city.slug}/tonight`}
                    key={r.title}
                    onMouseEnter={() => setRow(i)}
                    variants={{ hidden: { opacity: 0, rotateX: -70, y: 10 }, show: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.45, ease: EASE } } }}
                    style={{ transformOrigin: 'top' }}
                    className={cn(
                      'grid grid-cols-[80px_1fr] items-center gap-y-1 border-t border-noir-ink/12 px-6 py-5 transition-[background-color,color,border-radius] duration-300 md:grid-cols-[110px_1.6fr_1fr_1fr_110px_140px]',
                      on ? 'rounded-[22px] bg-cream text-ink' : 'text-noir-ink',
                    )}
                  >
                    <span className="font-display text-[30px] font-extrabold tabular-nums">{String(r.hour % 24).padStart(2, '0')}:00</span>
                    <span className="font-display text-2xl font-extrabold tracking-[-0.03em]">{r.title}</span>
                    <span className="hidden font-sans opacity-70 md:block">{r.area}</span>
                    <span className="hidden md:block"><span className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', on ? 'bg-ink/8' : 'bg-noir-ink/10')}>{r.vibe}</span></span>
                    <span className="hidden font-sans font-bold md:block">{r.price}</span>
                    <span className={cn('hidden text-right font-sans text-sm font-bold md:block', r.status === 'Few left' && 'text-coral')}>{r.status}{on ? ' →' : ''}</span>
                  </motion.a>
                )
              })}
            </motion.div>
          </AnimatePresence>

          <motion.div
            aria-hidden
            className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block"
            style={{ x, y }}
            animate={{ opacity: row === null ? 0 : 1, scale: row === null ? 0.6 : 1, rotate: row === null ? 0 : 6 }}
            transition={{ duration: 0.3 }}
          >
            {row !== null && rows[row] && <Poster poster={POSTERS[rows[row].poster]} area={rows[row].area} width={200} height={260} className="shadow-pop" />}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
