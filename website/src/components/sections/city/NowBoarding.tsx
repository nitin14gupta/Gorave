'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { type City } from '@/constants'
import { cn } from '@/lib/cn'
import { useClientValue } from '@/hooks/useClientValue'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const EASE = [0.2, 0.8, 0.2, 1] as const

const FALLBACK_DAYS = ['Today', 'Tomorrow', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'].map(label => ({ label, key: '' }))

// The next seven days in IST, cached per calendar day so useSyncExternalStore gets a stable snapshot.
let cache: { key: string; days: { label: string; key: string }[] } | null = null
function weekDays() {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
  if (cache?.key === today) return cache.days
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(Date.now() + i * 86_400_000)
    out.push({
      label: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' }),
      key: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
    })
  }
  cache = { key: today, days: out }
  return out
}

/**
 * Chapter 03, the plan. A departure board for the week: pick a day, rows
 * flip in; hover a row and its flyer follows your cursor.
 */
export function NowBoarding({ city }: { city: City }) {
  const { slots, posters } = useCityKit()
  const days = useClientValue(weekDays, FALLBACK_DAYS)
  const [day, setDay] = useState(0)
  const [row, setRow] = useState<number | null>(null)
  const box = useRef<HTMLDivElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 300, damping: 30 })
  const y = useSpring(my, { stiffness: 300, damping: 30 })

  // Real events for the picked day (IST). Before the client knows today's date,
  // or with no live data, show the first few nights in order.
  const rows = useMemo(() => {
    const key = days[day]?.key
    const live = slots.some(s => s.date)
    const picked = live && key ? slots.filter(s => s.date === key) : slots
    return picked.slice(0, 6).map((s, i) => ({ ...s, area: s.area ?? city.areas[i % city.areas.length] }))
  }, [slots, days, day, city])

  return (
    <section id="tonight" className="scroll-mt-24 bg-paper px-6 py-28 text-ink md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <Chapter n="03" title="The plan" />
            <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">Now boarding.</h2>
          </div>
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-full bg-white p-1.5">
            {days.map((d, i) => (
              <button
                key={d.label}
                type="button"
                onClick={() => setDay(i)}
                className={cn('shrink-0 rounded-full px-4 py-2.5 font-sans text-[13px] font-bold transition-colors', day === i ? 'bg-ink text-cream' : 'text-ink-2 hover:text-ink')}
              >
                {d.label}
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
          <div className="hidden grid-cols-[110px_1.6fr_1fr_1fr_110px_140px] px-6 pb-3 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-2 md:grid">
            <span>Time</span><span>Event</span><span>Area</span><span>Vibe</span><span>Price</span><span className="text-right">Status</span>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={day} initial="hidden" animate="show" exit="hidden" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
              {rows.length === 0 && (
                <motion.div variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="border-t border-ink/12 px-6 py-10 font-sans text-lg text-ink-2">
                  Nothing listed for {days[day]?.label.toLowerCase()} in {city.name} yet. <Link href="/host" className="font-bold text-ink underline-offset-4 hover:underline">Host the first one →</Link>
                </motion.div>
              )}
              {rows.map((r, i) => {
                const on = row === i
                return (
                  <motion.a
                    href={r.href ?? `/${city.slug}`}
                    key={r.href ?? r.title}
                    onMouseEnter={() => setRow(i)}
                    variants={{ hidden: { opacity: 0, rotateX: -70, y: 10 }, show: { opacity: 1, rotateX: 0, y: 0, transition: { duration: 0.45, ease: EASE } } }}
                    style={{ transformOrigin: 'top' }}
                    className={cn(
                      'grid grid-cols-[80px_1fr] items-center gap-y-1 border-t border-ink/12 px-6 py-5 transition-[background-color,color,border-radius] duration-300 md:grid-cols-[110px_1.6fr_1fr_1fr_110px_140px]',
                      on ? 'rounded-[22px] bg-cream text-ink' : 'text-ink',
                    )}
                  >
                    <span className="font-display text-[30px] font-extrabold tabular-nums">{r.clock ?? `${String(r.hour % 24).padStart(2, '0')}:00`}</span>
                    <span className="font-display text-2xl font-extrabold tracking-[-0.03em]">{r.title}</span>
                    <span className="hidden font-sans opacity-70 md:block">{r.area}</span>
                    <span className="hidden md:block"><span className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', on ? 'bg-ink/8' : 'bg-ink/10')}>{r.vibe}</span></span>
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
            {row !== null && rows[row] && <Poster poster={posters[rows[row].poster]} area={rows[row].area} width={200} height={260} className="shadow-pop" />}
          </motion.div>
        </div>
      </div>
    </section>
  )
}
