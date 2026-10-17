'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import type { City, SampleEvent } from '@/constants'
import { AREA_SCENES, cityStreet } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'
import { EASE_CSS, ProofLink, eventImage } from '../shared'

const NUM = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve']

const SCENES = [AREA_SCENES.rooftop, AREA_SCENES.livingroom, AREA_SCENES.chai, AREA_SCENES.latebite, AREA_SCENES.building, AREA_SCENES.doorway]

/** Four pictures per city: its street, then real events there, then scenes. */
function picsFor(city: City, i: number, events: SampleEvent[]) {
  const own = events.filter(e => e.city === city.name).map(eventImage)
  const fill = SCENES.map((_, k) => SCENES[(i + k) % SCENES.length])
  return [cityStreet(city.slug), ...own, ...fill].slice(0, 4)
}

/**
 * Chapter 03, where. Every city as a huge name with its live count; hover a
 * name and polaroids of that city slide out from behind it to both sides.
 * Mobile gets a plain list with the street photo.
 */
export function Cities({ cities, events }: { cities: { city: City; count: number }[]; events: SampleEvent[] }) {
  const [active, setActive] = useState<number | null>(null)

  return (
    <section className="overflow-hidden bg-paper pb-28 pt-28 md:pb-36 md:pt-36">
      <div className="mb-14 px-6 text-center md:mb-16">
        <Chapter n="03" title="Where it’s happening" className="justify-center" />
        <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          {NUM[cities.length] ?? cities.length} cities, <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">so far.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-[520px] font-sans text-lg text-ink-2">
          Hosted by people who live there. Hover a city to look inside, tap to see what’s on.
        </p>
      </div>

      {/* Desktop: the reveal */}
      <div className="hidden md:block" onMouseLeave={() => setActive(null)}>
        {cities.map(({ city, count }, i) => {
          const on = active === i
          const dim = active !== null && !on
          const pics = picsFor(city, i, events)
          return (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex items-center justify-center"
              style={{ height: on ? 250 : 128, transition: `height .55s ${EASE_CSS}` }}
            >
              {pics.map((src, k) => {
                const side = k % 2 === 0 ? -1 : 1
                const lane = Math.floor(k / 2)
                const out = side * (360 + lane * 200)
                return (
                  <div
                    key={k}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1]"
                    style={{
                      transform: on
                        ? `translate(calc(-50% + ${out}px), -50%) rotate(${side * (4 + lane * 3)}deg) scale(1)`
                        : 'translate(-50%, -50%) rotate(0deg) scale(.4)',
                      opacity: on ? 1 : 0,
                      transition: `transform .65s ${EASE_CSS} ${on ? lane * 0.07 : 0}s, opacity .4s ${on ? lane * 0.07 : 0}s`,
                    }}
                  >
                    <div className="bg-white p-2 pb-8 shadow-pop">
                      <div className="relative h-[190px] w-[156px] overflow-hidden">
                        <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                      </div>
                      <div className="absolute inset-x-0 bottom-2 text-center font-serif text-[15px] italic text-ink-2">
                        {city.areas[k % city.areas.length].toLowerCase()}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div className="relative z-[2] text-center">
                <div className="flex items-start justify-center gap-3">
                  <span
                    className="font-display leading-none tracking-[-0.05em] text-ink"
                    style={{
                      fontWeight: on ? 800 : 500,
                      fontSize: on ? 'clamp(60px,8.6vw,132px)' : 'clamp(44px,6.6vw,100px)',
                      opacity: dim ? 0.18 : 1,
                      transition: `all .5s ${EASE_CSS}`,
                    }}
                  >
                    {city.name}
                  </span>
                  {count > 0 && (
                    <span
                      className="mt-2 rounded-full bg-ink px-2.5 py-1 font-sans text-xs font-bold text-cream"
                      style={{ opacity: dim ? 0.2 : 1, transition: `opacity .5s ${EASE_CSS}` }}
                    >
                      {count}
                    </span>
                  )}
                </div>
                <div
                  className="mt-1 font-sans text-base font-bold text-ink-2"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE_CSS} .1s` }}
                >
                  {count > 0 ? `${count} ${count === 1 ? 'night' : 'nights'} coming up in ${city.name} ↗` : `See ${city.name} ↗`}
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Mobile: list */}
      <ul className="px-6 md:hidden">
        {cities.map(({ city, count }) => (
          <li key={city.slug}>
            <Link href={`/${city.slug}`} className="flex items-center gap-4 border-b border-ink/12 py-4">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
                <Image src={cityStreet(city.slug)} alt="" fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-display text-[34px] font-extrabold leading-none tracking-[-0.05em]">{city.name}</div>
                <div className="mt-1 truncate font-sans text-[13px] font-bold text-ink-3">
                  {count > 0 ? `${count} ${count === 1 ? 'night' : 'nights'} coming up` : city.areas.slice(0, 2).join(', ')}
                </div>
              </div>
              <span aria-hidden className="font-sans text-lg font-bold text-ink-3">↗</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-14 flex flex-col items-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl italic text-ink-2">More cities on the way.</p>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-3">
          <ProofLink href="/cities">All cities</ProofLink>
          <ProofLink href="/tonight">What’s on tonight</ProofLink>
        </div>
      </div>
    </section>
  )
}
