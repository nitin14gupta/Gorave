'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { PHOTOS, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'
import { BrowseFirst } from '../BrowseFirst'

/**
 * Chapter 03, the cities. A strip of tall city cards that opens like an
 * accordion: hover one and it widens to show its neighbourhoods and its
 * real upcoming count. Phones swipe the strip. Then the web-first row.
 */
export function CitiesStrip({ cities }: { cities: { city: City; count: number }[] }) {
  const rows = [...cities].sort((a, b) => b.count - a.count)
  const [active, setActive] = useState(0)

  return (
    <section className="overflow-hidden bg-paper py-24 md:py-32">
      <div className="mx-auto max-w-[1320px] px-6 md:px-12 lg:px-20">
        <Chapter n="03" title="Where it's on" />
        <h2 className="mt-4 font-display text-[clamp(46px,6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          Pick your city.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">The app does the rest.</span>
        </h2>
      </div>

      <div className="mx-auto mt-12 max-w-[1320px] md:px-12 lg:px-20">
        <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-6 [scrollbar-width:none] md:h-[480px] md:overflow-visible md:px-0" onMouseLeave={() => setActive(0)}>
          {rows.map(({ city, count }, i) => {
            const on = active === i
            return (
              <Link
                key={city.slug}
                href={`/${city.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className={cn(
                  'group relative h-[420px] w-[72vw] shrink-0 snap-start overflow-hidden rounded-[28px] md:h-full md:w-auto md:min-w-0 md:[flex:var(--g)_1_0%]',
                  'transition-[flex-grow,flex] duration-700 ease-out-expo',
                )}
                style={{ ['--g' as string]: on ? 5 : 1 }}
              >
                <Image src={PHOTOS[city.photo]} alt={`House parties in ${city.name}`} fill sizes="(max-width: 768px) 72vw, 600px" className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
                  <div className={cn('font-display font-extrabold leading-none tracking-[-0.045em] text-cream transition-all duration-500', on ? 'text-[44px] md:text-[56px]' : 'text-[44px] md:text-[22px] md:[writing-mode:vertical-rl] md:rotate-180')}>
                    {city.name}
                  </div>
                  <div className={cn('mt-3 transition-opacity duration-500', on ? 'opacity-100 delay-200' : 'opacity-100 md:opacity-0')}>
                    <div className="whitespace-nowrap font-sans text-sm font-bold text-cream/85">{city.areas.slice(0, 3).join(' · ')}</div>
                    <div className="mt-3 inline-flex items-center gap-2 whitespace-nowrap rounded-full bg-cream px-4 py-2 font-sans text-[13px] font-bold text-ink">
                      {count > 0 ? <><span className="font-display text-base font-extrabold text-orange">{count}</span> coming up</> : <>See {city.name}</>} →
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      <div className="mx-auto mt-16 max-w-[1320px] px-6 md:px-12 lg:px-20">
        <BrowseFirst />
      </div>
    </section>
  )
}
