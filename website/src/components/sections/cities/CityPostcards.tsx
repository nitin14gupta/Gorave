'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import type { City } from '@/constants'
import { cityStreet } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'

const TILT = [-2.5, 2, -1.5, 3, -2, 1.5, -3, 2.5]

/**
 * Chapter 01, the cities. Big postcards of each city's street at blue hour,
 * dealt onto the page; hover one and it lifts and straightens.
 */
export function CityPostcards({ cities }: { cities: { city: City; count: number }[] }) {
  return (
    <section className="bg-cream px-6 pb-24 pt-10 md:px-20 md:pb-32">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n="01" title="The cities" />
        <div className="mt-10 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {cities.map(({ city, count }, i) => {
            const tilt = TILT[i % TILT.length]
            return (
              <motion.div
                key={city.slug}
                initial={{ opacity: 0, y: 50, rotate: tilt * 2.5 }}
                whileInView={{ opacity: 1, y: 0, rotate: tilt }}
                whileHover={{ rotate: 0, y: -10, scale: 1.02 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 140, damping: 18 }}
              >
                <Link href={`/${city.slug}`} className="block bg-white p-3 pb-5 shadow-[0_2px_0_rgb(23_19_16/0.04),0_30px_60px_-30px_rgb(23_19_16/0.55)]">
                  <div className="relative aspect-[3/2] overflow-hidden bg-tile">
                    <Image src={cityStreet(city.slug)} alt={`${city.name} at blue hour`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                    <div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 font-sans text-xs font-bold text-ink">
                      {count > 0 ? `${count} coming up` : 'Be the first to host'}
                    </div>
                  </div>
                  <div className="flex items-end justify-between gap-4 px-1 pt-4">
                    <div>
                      <div className="font-serif text-base italic text-ink-3">Greetings from</div>
                      <div className="font-display text-[clamp(30px,3vw,44px)] font-extrabold leading-none tracking-[-0.05em]">{city.name}</div>
                    </div>
                    <div className="pb-1 text-right font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{city.state}</div>
                  </div>
                  <div className="mt-2 px-1 font-sans text-sm text-ink-2">{city.areas.slice(0, 3).join(' · ')}</div>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
