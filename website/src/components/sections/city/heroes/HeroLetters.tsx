'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { PHOTOS, type City } from '@/constants'
import { useIstClock } from '@/hooks/useIstClock'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import type { HeroProps } from './types'

/** The city's name IS the image — a party photo pans through the letters as you scroll. */
export function HeroLetters({ city, crumbs }: HeroProps) {
  const ref = useRef<HTMLElement>(null)
  const time = useIstClock()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgPos = useTransform(scrollYProgress, [0, 1], ['30% 40%', '90% 70%'])
  const y = useTransform(scrollYProgress, [0, 1], [0, -80])

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream pt-28">
      <div className="flex items-center justify-between px-6 md:px-20">
        <Breadcrumbs crumbs={crumbs} />
        <div className="flex items-center gap-2 font-sans text-[13px] font-bold text-ink-2">
          {time ? `${time} IST in ${city.name}` : city.name}
        </div>
      </div>

      <motion.h1
        style={{ y, backgroundPosition: bgPos, backgroundImage: `url(${PHOTOS[city.photo]}?w=1800&q=70&auto=format)`, fontSize: `min(23vw, ${Math.round(1900 / city.name.length)}px)` }}
        className="mt-10 bg-[length:130%_auto] bg-clip-text text-center font-display font-extrabold uppercase leading-[0.8] tracking-[-0.075em] text-transparent"
      >
        {city.name}
      </motion.h1>

      <div className="grid items-end gap-8 px-6 pb-11 pt-9 md:grid-cols-[1fr_auto_1fr] md:px-20">
        <p className="max-w-[420px] font-sans text-xl leading-relaxed text-ink-2">
          Living rooms, rooftops and long tables across {city.name}. Hosted by people, not venues.
        </p>
        <div className="flex flex-wrap gap-2.5">
          <Button href="#tonight" size="lg">See tonight</Button>
          <Button href="/host" kind="ghost" size="lg">Host in {city.name}</Button>
        </div>
        <div className="font-serif text-[28px] italic text-orange md:text-right">{city.coords}</div>
      </div>

      <AreaTicker city={city} />
    </section>
  )
}

export function AreaTicker({ city, dark }: { city: City; dark?: boolean }) {
  const items = [...city.areas, ...city.areas]
  return (
    <div className={dark ? 'border-y border-noir-ink/15 py-4' : 'border-y-[1.5px] border-ink py-4'}>
      <div className="overflow-hidden">
        <div className="flex w-max" style={{ animation: 'marquee 40s linear infinite' }}>
          {[...items, ...items].map((a, i) => (
            <span key={i} className={`flex items-center whitespace-nowrap px-6 font-display text-[28px] font-extrabold tracking-[-0.03em] ${dark ? 'text-noir-ink' : 'text-ink'}`}>
              {a}<span className="ml-12 text-lg text-brand">●</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
