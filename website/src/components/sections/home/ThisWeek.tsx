'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { BROWSE_CITIES, PHOTOS, type SampleEvent } from '@/constants'
import { cn } from '@/lib/cn'
import { Eyebrow, H2 } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const

function eventImage(e: SampleEvent) {
  return e.image ?? PHOTOS[e.photo]
}

/** The city switcher: text tabs on one ruled line, the line marks the current city. */
function CityTabs({ city, onChange }: { city: string; onChange: (c: string) => void }) {
  return (
    <div className="flex gap-7 overflow-x-auto border-b border-line [scrollbar-width:none]">
      {BROWSE_CITIES.map(c => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={c === city}
          className={cn(
            'relative shrink-0 pb-3.5 font-sans text-[15px] font-bold transition-colors',
            c === city ? 'text-ink' : 'text-ink-3 hover:text-ink',
          )}
        >
          {c}
          {c === city && <motion.span layoutId="city-tab" className="absolute inset-x-0 -bottom-px h-0.5 bg-ink" />}
        </button>
      ))}
    </div>
  )
}

/** A gig guide. Dated rows on the right; the poster follows your cursor down the list. */
export function ThisWeek({ byCity }: { byCity: Record<string, SampleEvent[]> }) {
  const [city, setCity] = useState<string>(BROWSE_CITIES[0])
  const [hovered, setHovered] = useState<string | null>(null)
  const events = (byCity[city] ?? []).slice(0, 6)
  const active = events.find(e => e.id === hovered) ?? events[0]

  const pick = (c: string) => {
    setCity(c)
    setHovered(null)
  }

  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>Happening this week</Eyebrow>
            <H2 className="mt-3.5">This week in {city}</H2>
          </div>
          <Link href={`/${city.toLowerCase()}`} className="hidden shrink-0 pb-3 font-sans text-[15px] font-bold underline-offset-4 hover:underline md:block">
            All of {city} →
          </Link>
        </div>

        <div className="mt-9"><CityTabs city={city} onChange={pick} /></div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-16">
          <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[24px] bg-tile lg:block">
            <AnimatePresence initial={false}>
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3, ease: EASE }}
                  className="absolute inset-0"
                >
                  <Image src={eventImage(active)} alt={active.title} fill sizes="400px" className="object-cover" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div>
            {events.map(e => (
              <Link
                key={e.id}
                href={`/e/${e.id}`}
                onMouseEnter={() => setHovered(e.id)}
                onFocus={() => setHovered(e.id)}
                className="group grid grid-cols-[72px_minmax(0,1fr)_auto] items-center gap-4 border-b border-line py-5 first:pt-0 md:grid-cols-[130px_minmax(0,1fr)_auto] md:gap-6"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-tile md:hidden">
                  <Image src={eventImage(e)} alt="" fill sizes="72px" className="object-cover" />
                </div>
                <div className="hidden font-sans text-[13px] font-bold uppercase tracking-[0.06em] text-ink-3 md:block">{e.when}</div>
                <div className="min-w-0">
                  <div className="truncate font-display text-[clamp(20px,2.1vw,28px)] font-extrabold leading-[1.15] tracking-[-0.025em] text-ink transition-transform duration-300 ease-out-expo group-hover:translate-x-1.5">{e.title}</div>
                  <div className="mt-0.5 truncate font-sans text-sm text-ink-2"><span className="md:hidden">{e.when} · </span>{e.area}</div>
                </div>
                <div className="font-sans text-[15px] font-bold text-ink">{e.price}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
