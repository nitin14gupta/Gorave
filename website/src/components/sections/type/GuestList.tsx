'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import type { City } from '@/constants'
import type { TypeContent } from '@/lib/eventType'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

type Seat = 'w' | 'm' | 'o'
const FILL = 0.87

const REQUESTS = [
  { name: 'Riya', meta: '24 · 3 mutuals', at: 0.18 },
  { name: 'Kabir', meta: '27 · rated 4.9', at: 0.42 },
  { name: 'Meera', meta: '22 · first party', at: 0.66 },
]

const LEGEND: [Seat, string][] = [['w', 'Women'], ['m', 'Men'], ['o', 'Open']]
const COLOR: Record<Seat, string> = { w: 'bg-coral', m: 'bg-orange', o: 'bg-gold' }

/** 50:50 with 10% open — the same quota maths the app uses. Seats fill in an interleaved order. */
function seatPlan(cap: number): Seat[] {
  const open = Math.round(cap * 0.1)
  const women = Math.round((cap - open) / 2)
  let w = women
  let m = cap - open - women
  let o = open
  const pool: Seat[] = []
  for (let i = 0; pool.length < cap; i++) {
    let pick: Seat
    if (i % 5 === 4 && o) pick = 'o'
    else if (i % 2 === 0) pick = w ? 'w' : m ? 'm' : 'o'
    else pick = m ? 'm' : w ? 'w' : 'o'
    pool.push(pick)
    if (pick === 'w') w--
    else if (pick === 'm') m--
    else o--
  }
  return pool
}

/**
 * Chapter 03 — the guest list. Scroll and the room fills seat by seat while
 * requests come in and get accepted; the crowd mix holds the whole way.
 */
export function GuestList({ city, story }: { city: City; story: TypeContent }) {
  const ref = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => setP(Math.round(v * 100) / 100))

  const cap = story.capacity
  const seats = seatPlan(cap)
  const filled = Math.round(Math.min(1, p / 0.9) * cap * FILL)
  const taken = seats.slice(0, filled)
  const count = (s: Seat) => taken.filter(t => t === s).length
  const total = (s: Seat) => seats.filter(t => t === s).length
  const cols = cap <= 16 ? 4 : cap <= 30 ? 6 : 10

  return (
    <section ref={ref} className="relative bg-noir text-noir-ink md:h-[260vh]">
      <div className="grid items-center gap-14 px-6 py-24 md:sticky md:top-0 md:h-screen md:grid-cols-[1fr_1.1fr] md:px-20 md:py-0">
        <div>
          <Chapter n="03" title="The guest list" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            The host picks<br />the room.
          </h2>
          <p className="mt-4 max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Free {story.plural.toLowerCase()} in {city.name} are request-to-join. Hosts see who&apos;s asking, accept who fits, and can hold a crowd mix like 50:50.
          </p>

          <div className="mt-8 grid max-w-[440px] gap-2.5">
            {REQUESTS.map(r => {
              const ok = p >= r.at
              return (
                <div key={r.name} className="flex items-center gap-3 rounded-2xl bg-noir-3 px-4 py-3" style={{ opacity: p >= r.at - 0.12 ? 1 : 0.25, transition: 'opacity .4s' }}>
                  <span className="grid size-9 place-items-center rounded-full bg-noir-2 font-display text-sm font-extrabold">{r.name[0]}</span>
                  <div className="flex-1">
                    <div className="font-sans text-[15px] font-bold">{r.name} wants to join</div>
                    <div className="font-sans text-xs text-noir-ink-2">{r.meta}</div>
                  </div>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={ok ? 'ok' : 'wait'}
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.6 }}
                      className={cn('rounded-full px-3 py-1.5 font-sans text-xs font-bold', ok ? 'bg-green text-noir' : 'bg-noir-2 text-noir-ink-2')}
                    >
                      {ok ? 'Accepted ✓' : 'Pending'}
                    </motion.span>
                  </AnimatePresence>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-[clamp(56px,7vw,104px)] font-extrabold leading-none tracking-[-0.06em] tabular-nums">
              {filled}<span className="text-noir-ink-2">/{cap}</span>
            </div>
            <div className="font-sans text-sm font-bold uppercase tracking-[0.16em] text-noir-ink-2">going</div>
          </div>
          <div className="mt-6 grid gap-2.5" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {seats.map((s, i) => (
              <div key={i} className="relative aspect-square rounded-xl bg-noir-3">
                <div
                  className={cn('absolute inset-1 rounded-lg', COLOR[s])}
                  style={{ transform: `scale(${i < filled ? 1 : 0})`, opacity: i < filled ? 1 : 0, transition: 'transform .45s cubic-bezier(.3,1.6,.5,1), opacity .3s' }}
                />
              </div>
            ))}
          </div>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-sans text-sm font-bold">
            {LEGEND.map(([k, label]) => (
              <span key={k} className="flex items-center gap-2">
                <span className={cn('size-3 rounded', COLOR[k])} />
                {label} <span className="tabular-nums text-noir-ink-2">{count(k)}/{total(k)}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
