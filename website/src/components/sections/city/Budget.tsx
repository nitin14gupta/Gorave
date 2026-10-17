'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'motion/react'
import { type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const MAX = 2000
const priceOf = (p: string) => (p === 'Free' ? 0 : Number(p.replace(/[^\d]/g, '')))

/** Chapter 07, the budget. Drag the price; nights in range stay lit. */
export function Budget({ city }: { city: City }) {
  const { slots, posters } = useCityKit()
  const [value, setValue] = useState(500)
  const nights = slots.map((s, i) => ({ ...s, area: s.area ?? city.areas[i % city.areas.length], amount: priceOf(s.price) }))
  const inRange = nights.filter(n => n.amount <= value).length

  return (
    <section className="bg-cream px-6 py-28 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-end gap-10 lg:grid-cols-[1fr_1.2fr]">
          <div>
            <Chapter n="07" title="The budget" />
            <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">What&apos;s your<br />budget?</h2>
          </div>
          <div>
            <div className="flex items-end justify-between">
              <motion.span key={value} initial={{ y: 8, opacity: 0.4 }} animate={{ y: 0, opacity: 1 }} className="font-display text-[clamp(64px,8vw,120px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">
                {value === 0 ? 'Free' : `₹${value.toLocaleString('en-IN')}`}
              </motion.span>
              <span className="pb-3 font-sans text-sm font-bold text-ink-3">{inRange} of {nights.length} nights</span>
            </div>
            <input
              type="range"
              min={0}
              max={MAX}
              step={50}
              value={value}
              onChange={e => setValue(Number(e.target.value))}
              aria-label="Maximum ticket price"
              className="mt-5 h-3 w-full cursor-pointer appearance-none rounded-full [&::-webkit-slider-thumb]:size-8 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-pop"
              style={{ background: `linear-gradient(90deg, var(--color-orange), var(--color-coral) ${(value / MAX) * 100}%, var(--color-line) ${(value / MAX) * 100}%)` }}
            />
            <div className="mt-3 flex gap-2">
              <Link href={`/${city.slug}/free-events`} className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-ink hover:text-cream">Free events</Link>
              <Link href={`/${city.slug}/under-500`} className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:bg-ink hover:text-cream">Under ₹500</Link>
            </div>
          </div>
        </div>

        <div className="no-scrollbar mt-14 flex gap-5 overflow-x-auto pb-4">
          {nights.map(n => {
            const ok = n.amount <= value
            return (
              <motion.div
                key={n.href ?? n.title}
                animate={{ opacity: ok ? 1 : 0.25, scale: ok ? 1 : 0.94, filter: ok ? 'grayscale(0)' : 'grayscale(1)', y: ok ? 0 : 12 }}
                transition={{ duration: 0.4 }}
                className="shrink-0"
              >
                <Poster poster={posters[n.poster]} area={n.area} width={200} height={260} />
                <div className="mt-3 font-display text-lg font-extrabold">{n.title}</div>
                <div className="font-sans text-sm text-ink-3">{n.area} · {n.price}</div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
