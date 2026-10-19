'use client'

import Link from 'next/link'
import type { PriceProps } from '@/lib/price'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'
import { Head } from '@/components/sections/areaType/kit'

/**
 * Chapter 04, by place. Every city (India page), neighbourhood (city page)
 * or neighbour (area page) set huge in a flowing line; hover a name and
 * its photo pops; places with something on wear their count.
 */
export function Places({ tier, place, places }: PriceProps) {
  if (!places.length) return null
  const title = place.kind === 'india' ? 'Pick a city.' : place.kind === 'city' ? `Around ${place.name}.` : 'Next door.'
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Head n="04" label="By place" title={title} serif={`${tier.label}, everywhere.`} aside="Hover a name to peek, tap to go." />
        <HoverPopGroup size="md">
          <ul className="mt-12 flex flex-wrap items-baseline gap-x-8 gap-y-2">
            {places.map(p => (
              <HoverPop as="li" key={p.href} image={p.image} caption={p.count ? `${p.count} on now` : `${tier.label} in ${p.name}`}>
                <Link href={p.href} className="group inline-flex items-start gap-2">
                  <span className="font-display text-[clamp(40px,6vw,96px)] font-extrabold leading-[1] tracking-[-0.06em] text-ink transition-colors duration-300 group-hover:text-orange">{p.name}</span>
                  {p.count > 0 && <span className="mt-2 rounded-full bg-ink px-2 py-0.5 font-sans text-xs font-bold text-cream">{p.count}</span>}
                </Link>
              </HoverPop>
            ))}
          </ul>
        </HoverPopGroup>
      </div>
    </section>
  )
}
