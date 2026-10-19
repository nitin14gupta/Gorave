'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { OccasionProps } from '@/lib/occasion'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'
import { Head } from '@/components/sections/areaType/kit'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Chapter 02, the lineup. Nights listed for the occasion as rows that pop
 * their photo on hover. Early in the season there may be none yet: then
 * it says so and shows what's on now instead.
 */
export function Lineup({ occasion: o, place, events, fallback }: OccasionProps) {
  const reduce = !!useReducedMotion()
  const where = place.kind === 'india' ? 'across India' : `in ${place.name}`
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head
          n="02"
          label="The lineup"
          title={fallback ? `${o.name} nights are coming.` : `${events.length === 1 ? 'One' : events.length} ${o.night}${events.length === 1 ? '' : 's'}`}
          serif={fallback ? 'Here’s what’s on now.' : `${where}.`}
          aside={fallback ? `Hosts usually list ${o.name} nights a week or two before. Until then, these are the nights coming up ${where}.` : 'Hover one to look, tap for the details.'}
        />
        {events.length > 0 && (
          <HoverPopGroup size="lg">
            <ul className="mt-12 border-t border-ink/12">
              {events.map((e, i) => {
                const [day, time] = e.when.split(' · ')
                return (
                  <motion.li key={e.id} initial={reduce ? false : { opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-5% 0px' }} transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 6) * 0.04 }}>
                    <HoverPop as="div" image={e.image ?? PHOTOS[e.photo]} caption={`${e.area} · ${e.going} going`}>
                      <Link href={`/e/${e.id}`} className="group grid grid-cols-[72px_1fr_auto] items-center gap-4 border-b border-ink/12 py-5 transition-colors duration-500 hover:bg-white md:grid-cols-[120px_1fr_auto_auto] md:gap-8 md:px-5">
                        <span className="font-sans text-sm font-bold leading-tight">{day}<span className="block text-ink-3">{time}</span></span>
                        <span className="min-w-0">
                          <span className="block truncate font-display text-[clamp(19px,2vw,26px)] font-extrabold tracking-[-0.035em] transition-colors group-hover:text-orange">{e.title}</span>
                          <span className="mt-0.5 block font-sans text-[13px] font-bold text-ink-3">{e.type} · {e.area}{e.request ? ' · Request to join' : ''}</span>
                        </span>
                        <span className="hidden rounded-full bg-white px-3 py-1.5 font-sans text-sm font-bold shadow-soft md:block">{e.price}</span>
                        <span aria-hidden className="text-xl text-ink-3 transition-transform duration-500 group-hover:translate-x-1 group-hover:text-ink">→</span>
                      </Link>
                    </HoverPop>
                  </motion.li>
                )
              })}
            </ul>
          </HoverPopGroup>
        )}
      </div>
    </section>
  )
}
