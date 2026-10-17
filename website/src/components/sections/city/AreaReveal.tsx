'use client'

import Link from 'next/link'
import { useState } from 'react'
import { type City } from '@/constants'
import { areaSlug } from '@/lib/city'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const EASE = 'cubic-bezier(.2,.8,.2,1)'

/**
 * Chapter 06 — the neighbourhood. Huge centred area names; hover one and
 * flyers slide out from behind it to both sides, leave and they tuck away.
 */
interface Props {
  city: City
  chapter?: string
  title?: string
  subtitle?: string
  /** Links each area to /city/area/<typeSlug> instead of /city/area */
  typeSlug?: string
}

export function AreaReveal({ city, chapter = '06', title = 'Closer to home.', subtitle, typeSlug }: Props) {
  const { posters } = useCityKit()
  const [active, setActive] = useState<number | null>(null)
  const areas = city.areas.slice(0, 6)

  return (
    <section className="overflow-hidden bg-paper pb-36 pt-28">
      <div className="mb-12 px-6 text-center">
        <Chapter n={chapter} title="The neighbourhood" className="justify-center" />
        <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">{title}</h2>
        <p className="mt-3 font-sans text-[19px] text-ink-2">{subtitle ?? `See what's happening in your part of ${city.name}.`}</p>
      </div>
      <div onMouseLeave={() => setActive(null)}>
        {areas.map((a, i) => {
          const on = active === i
          const dim = active !== null && !on
          return (
            <Link
              key={a}
              href={`/${city.slug}/${areaSlug(a)}${typeSlug ? `/${typeSlug}` : ''}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex items-center justify-center"
              style={{ height: on ? 260 : 140, transition: `height .55s ${EASE}` }}
            >
              {[0, 1, 2, 3].map(k => {
                const side = k % 2 === 0 ? -1 : 1
                const lane = Math.floor(k / 2)
                const out = side * (330 + lane * 190)
                return (
                  <div
                    key={k}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1] hidden md:block"
                    style={{
                      transform: on
                        ? `translate(calc(-50% + ${out}px), -50%) rotate(${side * (4 + lane * 3)}deg) scale(1)`
                        : 'translate(-50%, -50%) rotate(0deg) scale(.4)',
                      opacity: on ? 1 : 0,
                      transition: `transform .65s ${EASE} ${on ? lane * 0.07 : 0}s, opacity .4s ${on ? lane * 0.07 : 0}s`,
                    }}
                  >
                    <Poster poster={posters[(i * 3 + k * 4) % posters.length]} area={a} width={160} height={210} radius={12} />
                  </div>
                )
              })}
              <div className="relative z-[2] text-center">
                <div
                  className="font-display leading-none tracking-[-0.05em] text-ink"
                  style={{ fontWeight: on ? 800 : 500, fontSize: on ? 'clamp(56px,8.8vw,128px)' : 'clamp(44px,7.2vw,104px)', opacity: dim ? 0.18 : 1, transition: `all .5s ${EASE}` }}
                >
                  {a}
                </div>
                <div
                  className="mt-1 font-sans text-base font-bold text-ink-2"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE} .1s` }}
                >
                  Explore {a} ↗
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
