'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import type { City } from '@/constants'
import { cityStreet } from '@/lib/area'
import type { TypeContent } from '@/lib/eventType'
import { Chapter } from '@/components/ui/atoms'

const TILT = [-3, 2, -1.5, 3, -2.5, 1.5, -2, 2.5]

/**
 * Chapter 03, pick your city. Every city is a postcard of its own street at
 * blue hour; hover one and it lifts off the table and straightens.
 */
export function TypeCities({ story, slug, cities }: { story: TypeContent; slug: string; cities: { city: City; count: number }[] }) {
  return (
    <section className="overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="03" title="Pick your city" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              {story.plural}<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">near you.</span>
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg text-ink-2">Hosted in homes across eight cities. Pick yours to see what’s on.</p>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-4">
          {cities.map(({ city, count }, i) => (
            <motion.div
              key={city.slug}
              initial={{ opacity: 0, y: 40, rotate: TILT[i % TILT.length] * 2 }}
              whileInView={{ opacity: 1, y: 0, rotate: TILT[i % TILT.length] }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, delay: (i % 4) * 0.08, ease: [0.2, 0.8, 0.2, 1] }}
            >
              <Link
                href={`/${city.slug}/${slug}`}
                className="group block bg-white p-2.5 pb-3.5 shadow-[0_2px_0_rgb(23_19_16/0.04),0_26px_50px_-26px_rgb(23_19_16/0.5)] transition-[transform,box-shadow] duration-700 ease-out-expo hover:-translate-y-2 hover:shadow-pop md:p-3 md:pb-4"
                style={{ ['--r' as string]: `${-TILT[i % TILT.length]}deg` }}
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-tile">
                  <Image src={cityStreet(city.slug)} alt={`${city.name} at blue hour`} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover:scale-[1.06]" />
                </div>
                <div className="px-1 pt-3 font-display text-[clamp(18px,1.8vw,26px)] font-extrabold leading-none tracking-[-0.04em]">{city.name}</div>
                <div className="px-1 pt-1 font-serif text-sm italic text-orange md:text-base">
                  {count > 0 ? `${count} coming up` : 'be the first to host'}
                </div>
                <div className="px-1 pt-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                  {city.areas.slice(0, 2).join(' · ')} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
