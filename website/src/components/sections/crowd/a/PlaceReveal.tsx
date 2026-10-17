'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdViewProps } from '../types'
import { EASE_CSS, Head } from './kit'

const SCENES = [AREA_SCENES.livingroom, AREA_SCENES.rooftop, AREA_SCENES.doorway, AREA_SCENES.chai, AREA_SCENES.latebite, AREA_SCENES.building]

const countLine = (n: number) => (n > 0 ? `${n} coming up` : 'host the first')

/**
 * Chapter 04, where. Huge centred place names (cities on the hub,
 * neighbourhoods on a city page), busiest first. Hover one and photos slide
 * out from behind it to both sides; leave and they tuck away again.
 */
export function PlaceReveal({ crowd, place, places }: Pick<CrowdViewProps, 'crowd' | 'place' | 'places'>) {
  const [active, setActive] = useState<number | null>(null)
  const list = places
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .slice(0, 8)
  const hub = !place.citySlug

  return (
    <section className="overflow-hidden bg-cream pb-28 pt-24 md:pb-36 md:pt-32">
      <div className="mb-10 px-6 md:mb-14">
        <Head
          center
          n="04"
          label={hub ? 'Pick your city' : 'Pick your area'}
          title={hub ? 'Pick your city.' : `Around ${place.name}.`}
          serif={hub ? `${crowd.label}, city by city.` : 'Closer to home.'}
        />
      </div>

      {/* Desktop: the reveal */}
      <div className="hidden md:block" onMouseLeave={() => setActive(null)}>
        {list.map((p, i) => {
          const on = active === i
          const dim = active !== null && !on
          const imgs = [p.image, SCENES[i % SCENES.length], SCENES[(i + 3) % SCENES.length], crowd.image]
          return (
            <Link
              key={p.href}
              href={p.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex items-center justify-center outline-none"
              style={{ height: on ? 270 : 132, transition: `height .55s ${EASE_CSS}` }}
            >
              {imgs.map((src, k) => {
                const side = k % 2 === 0 ? -1 : 1
                const lane = Math.floor(k / 2)
                const out = side * (350 + lane * 200)
                const tilt = side * (4 + lane * 3)
                return (
                  <div
                    key={k}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1]"
                    style={{
                      transform: on ? `translate(calc(-50% + ${out}px), -50%) rotate(${tilt}deg) scale(1)` : 'translate(-50%, -50%) rotate(0deg) scale(.4)',
                      opacity: on ? 1 : 0,
                      transition: `transform .65s ${EASE_CSS} ${on ? lane * 0.07 : 0}s, opacity .4s ${on ? lane * 0.07 : 0}s`,
                    }}
                  >
                    <div className="relative h-[220px] w-[170px] overflow-hidden rounded-[14px] bg-tile shadow-pop ring-4 ring-white">
                      <Image src={src} alt="" fill sizes="180px" className="object-cover" />
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
                      fontSize: on ? 'clamp(56px,8.4vw,124px)' : 'clamp(44px,6.8vw,100px)',
                      opacity: dim ? 0.18 : 1,
                      transition: `all .5s ${EASE_CSS}`,
                    }}
                  >
                    {p.label}
                  </span>
                  <span
                    className={`mt-2 whitespace-nowrap font-serif text-xl italic ${p.count > 0 ? 'text-orange' : 'text-ink-3'}`}
                    style={{ opacity: dim ? 0.18 : 1, transition: `opacity .5s ${EASE_CSS}` }}
                  >
                    {p.count > 0 ? p.count : '0'}
                  </span>
                </div>
                <div
                  className="mt-1 font-sans text-base font-bold text-ink-2"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE_CSS} .1s` }}
                >
                  {countLine(p.count)} in {p.label} ↗
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Phones: a plain list with a thumbnail */}
      <ul className="grid gap-2 px-6 md:hidden">
        {list.map((p, i) => (
          <li key={p.href}>
            <Link href={p.href} className="flex items-center gap-4 border-b border-ink/10 py-3">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-tile">
                <Image src={i % 2 ? SCENES[i % SCENES.length] : p.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-[28px] font-extrabold leading-none tracking-[-0.045em]">{p.label}</span>
                <span className={`mt-1 block font-serif text-base italic ${p.count > 0 ? 'text-orange' : 'text-ink-3'}`}>{countLine(p.count)}</span>
              </span>
              <span className="text-xl text-ink-3">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
