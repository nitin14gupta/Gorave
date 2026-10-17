'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { PHOTOS, type City, type SampleEvent } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { BrowseFirst } from '../BrowseFirst'

const EASE = 'cubic-bezier(.2,.8,.2,1)'

/**
 * Chapter 03, where it's live. Huge city names with their real upcoming
 * counts; hover one and photos slide out from behind it to both sides.
 * Then the web-first row for people who want to look around before installing.
 */
export function Cities({ cities, events }: { cities: { city: City; count: number }[]; events: SampleEvent[] }) {
  const [active, setActive] = useState<number | null>(null)
  const rows = [...cities].sort((a, b) => b.count - a.count).slice(0, 6)

  const photosFor = (c: City) => {
    const own = events.filter(e => e.city === c.name).map(e => e.image ?? PHOTOS[e.photo])
    const fill = [PHOTOS[c.photo], PHOTOS.party1, PHOTOS.roof1, PHOTOS.dine1, PHOTOS.gig1]
    return [...own, ...fill].slice(0, 4)
  }

  return (
    <section className="overflow-hidden bg-paper pb-28 pt-24 md:pb-32 md:pt-28">
      <div className="mb-10 px-6 text-center">
        <Chapter n="05" title="Where it's on" className="justify-center" />
        <h2 className="mt-4 font-display text-[clamp(46px,6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          Open it in<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">your city.</span>
        </h2>
      </div>

      <div onMouseLeave={() => setActive(null)}>
        {rows.map(({ city, count }, i) => {
          const on = active === i
          const dim = active !== null && !on
          const pics = photosFor(city)
          return (
            <Link
              key={city.slug}
              href={`/${city.slug}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex items-center justify-center"
              style={{ height: on ? 230 : 124, transition: `height .55s ${EASE}` }}
            >
              {pics.map((src, k) => {
                const side = k % 2 === 0 ? -1 : 1
                const lane = Math.floor(k / 2)
                const out = side * (380 + lane * 200)
                return (
                  <div
                    key={k}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1] hidden overflow-hidden rounded-[18px] shadow-pop md:block"
                    style={{
                      width: 170,
                      height: 200,
                      transform: on
                        ? `translate(calc(-50% + ${out}px), -50%) rotate(${side * (4 + lane * 3)}deg) scale(1)`
                        : 'translate(-50%, -50%) rotate(0deg) scale(.4)',
                      opacity: on ? 1 : 0,
                      transition: `transform .65s ${EASE} ${on ? lane * 0.07 : 0}s, opacity .4s ${on ? lane * 0.07 : 0}s`,
                    }}
                  >
                    <Image src={src} alt="" fill sizes="340px" className="object-cover" />
                  </div>
                )
              })}
              <div className="relative z-[2] text-center">
                <div
                  className="flex items-start justify-center gap-2 font-display leading-none tracking-[-0.05em] text-ink"
                  style={{ fontWeight: on ? 800 : 500, fontSize: on ? 'clamp(52px,7.6vw,112px)' : 'clamp(42px,6.8vw,100px)', opacity: dim ? 0.18 : 1, transition: `all .5s ${EASE}` }}
                >
                  {city.name}
                  {count > 0 && (
                    <sup className="mt-[0.1em] font-serif text-[0.36em] font-normal italic tracking-normal text-orange">{count}</sup>
                  )}
                </div>
                <div
                  className="mt-1 font-sans text-base font-bold text-ink-2"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE} .1s` }}
                >
                  {count > 0 ? `${count} coming up in ${city.name}` : `See ${city.name}`} ↗
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="mx-auto mt-16 max-w-[1100px] px-6 text-center">
        <Link href="/cities" className="font-sans text-sm font-bold text-ink-2 underline decoration-ink/25 underline-offset-4 hover:text-ink">All cities →</Link>
        <BrowseFirst className="mt-14 flex flex-col items-center [&>div:last-child]:justify-center" />
      </div>
    </section>
  )
}
