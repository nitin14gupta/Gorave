'use client'

import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BROWSE_CITIES, type SampleEvent } from '@/constants'
import { cn } from '@/lib/cn'
import { Eyebrow, H2 } from '@/components/ui/atoms'
import { EventCard } from '@/components/ui/EventCard'

const EASE = [0.2, 0.8, 0.2, 1] as const

/** Real events by city in a draggable rail, replaces a decorative marquee. */
export function ThisWeek({ byCity }: { byCity: Record<string, SampleEvent[]> }) {
  const [city, setCity] = useState<string>(BROWSE_CITIES[0])
  const constraintsRef = useRef<HTMLDivElement>(null)
  const events = useMemo(() => byCity[city] ?? [], [byCity, city])

  return (
    <section className="bg-paper py-28">
      <div className="mx-auto mb-10 flex max-w-[1280px] flex-col justify-between gap-6 px-6 md:flex-row md:items-end md:px-20">
        <div>
          <Eyebrow>Happening this week</Eyebrow>
          <H2 className="mt-3.5 !text-[clamp(40px,5vw,72px)]">
            This week in{' '}
            <AnimatePresence mode="wait">
              <motion.span
                key={city}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="inline-block text-brand"
              >
                {city}
              </motion.span>
            </AnimatePresence>
          </H2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {BROWSE_CITIES.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCity(c)}
              aria-pressed={c === city}
              className={cn(
                'rounded-full px-4 py-2.5 font-sans text-sm font-bold transition-colors',
                c === city ? 'bg-ink text-cream' : 'bg-white text-ink-2 shadow-[inset_0_0_0_1.5px_var(--color-line)] hover:text-ink',
              )}
            >
              {c}
            </button>
          ))}
          <Link href={`/${city.toLowerCase()}`} className="ml-3 font-sans text-[15px] font-bold underline-offset-4 hover:underline">All events →</Link>
        </div>
      </div>

      <div ref={constraintsRef} className="overflow-hidden px-6 md:px-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={city}
            drag="x"
            dragConstraints={constraintsRef}
            dragElastic={0.08}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.45, ease: EASE }}
            className="flex w-max cursor-grab gap-5 active:cursor-grabbing"
          >
            {events.map(e => <EventCard key={e.id} event={e} width={300} />)}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  )
}
