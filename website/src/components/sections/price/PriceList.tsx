'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { PHOTOS } from '@/constants'
import { priceHref, type PriceProps } from '@/lib/price'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'
import { ProofLink } from '@/components/ui/ProofLink'
import { Head } from '@/components/sections/areaType/kit'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Chapter 01, the list. Real events, cheapest first, as rows with the
 * price set big; hover a row and its photo pops at the cursor.
 */
export function PriceList(props: PriceProps) {
  const { tier, place, events, wider } = props
  const reduce = !!useReducedMotion()
  const where = place.kind === 'india' ? 'across India' : `in ${place.name}`
  const cityName = place.city?.name

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head
          n="01"
          label="On the list"
          title={events.length ? (wider ? `Quiet in ${place.name}.` : `${events.length === 1 ? 'One' : events.length} ${tier.noun}`) : `No ${tier.noun} yet.`}
          serif={events.length ? (wider ? `Here’s ${cityName}.` : `${where}.`) : 'Check back Thursday.'}
          aside={events.length ? 'Cheapest first. Hover one to look, tap for the details.' : 'New nights go up every week, and most fill up fast.'}
        />
        {events.length > 0 && (
          <HoverPopGroup size="lg">
            <ul className="mt-12 border-t border-ink/12">
              {events.map((e, i) => {
                const [day, time] = e.when.split(' · ')
                return (
                  <motion.li
                    key={e.id}
                    initial={reduce ? false : { opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-5% 0px' }}
                    transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 6) * 0.04 }}
                  >
                    <HoverPop as="div" image={e.image ?? PHOTOS[e.photo]} caption={`${e.area} · ${e.going} going`}>
                      <Link href={`/e/${e.id}`} className="group grid grid-cols-[88px_1fr_auto] items-center gap-4 border-b border-ink/12 py-5 transition-colors duration-500 hover:bg-white md:grid-cols-[150px_1fr_160px_auto] md:gap-8 md:px-5">
                        <span className="font-display text-[clamp(30px,3.4vw,48px)] font-extrabold leading-none tracking-[-0.06em] transition-colors duration-500 group-hover:text-orange">{e.price === 'Free' ? '₹0' : e.price}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-display text-[clamp(19px,2vw,26px)] font-extrabold tracking-[-0.035em]">{e.title}</span>
                          <span className="mt-0.5 block font-sans text-[13px] font-bold text-ink-3">{e.type} · {e.area}{e.request ? ' · Request to join' : ''}</span>
                        </span>
                        <span className="hidden font-sans text-sm font-bold text-ink-2 md:block">{day}<span className="text-ink-3"> · {time}</span></span>
                        <span aria-hidden className="text-xl text-ink-3 transition-transform duration-500 ease-out-expo group-hover:translate-x-1 group-hover:text-ink">→</span>
                      </Link>
                    </HoverPop>
                  </motion.li>
                )
              })}
            </ul>
          </HoverPopGroup>
        )}
        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {place.kind !== 'india' && <ProofLink href={priceHref({ place: { kind: 'india', name: 'India' } }, tier.slug)}>{tier.label} across India</ProofLink>}
          {place.kind === 'area' && <ProofLink href={`/${place.city!.slug}/${tier.slug}`}>{tier.label} in {place.city!.name}</ProofLink>}
          <ProofLink href="/host">Host one yourself</ProofLink>
        </div>
      </div>
    </section>
  )
}
