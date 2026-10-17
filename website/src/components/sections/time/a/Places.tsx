'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AREA_SCENES } from '@/lib/area'
import type { TimeContent } from '@/lib/time'
import type { TimeViewProps } from '../types'
import { cn } from '@/lib/cn'
import { EASE_CSS, Head, lower } from './kit'

const SCENES = [AREA_SCENES.rooftop, AREA_SCENES.livingroom, AREA_SCENES.chai, AREA_SCENES.doorway, AREA_SCENES.latebite, AREA_SCENES.building]

/**
 * Chapter 04, where. Huge place names (cities on the hub, neighbourhoods on a
 * city page), busiest first, each with its live count. Hover one and photos
 * fly out from behind it to both sides; leave and they tuck back in.
 */
export function Places({ time, place, places }: { time: TimeContent; place: { name: string; citySlug: string | null }; places: TimeViewProps['places'] }) {
  const [active, setActive] = useState<number | null>(null)
  const list = places
    .map((p, i) => ({ ...p, i }))
    .sort((a, b) => b.count - a.count || a.i - b.i)
    .slice(0, 8)
  const hub = !place.citySlug
  if (!list.length) return null
  const line = (n: number) => (n > 0 ? `${n} ${n === 1 ? 'night' : 'nights'} ${lower(time)}` : `nothing ${lower(time)} yet`)

  return (
    <section className="overflow-hidden bg-paper pb-28 pt-24 md:pb-36 md:pt-32">
      <div className="mb-10 px-6 md:mb-14">
        <Head
          center
          n="06"
          label={hub ? 'City by city' : 'Area by area'}
          title={hub ? `${time.label}, city by city.` : `${time.label} around ${place.name}.`}
          serif={hub ? 'Pick yours.' : 'Closer to home.'}
        />
      </div>

      {/* Desktop: the reveal */}
      <div className="hidden md:block" onMouseLeave={() => setActive(null)}>
        {list.map((p, i) => {
          const on = active === i
          const dim = active !== null && !on
          const imgs = [p.image, SCENES[i % SCENES.length], SCENES[(i + 2) % SCENES.length], time.image]
          return (
            <Link
              key={p.href}
              href={p.href}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              className="relative flex items-center justify-center outline-none"
              style={{ height: on ? 280 : 128, transition: `height .55s ${EASE_CSS}` }}
            >
              {imgs.map((src, k) => {
                const side = k % 2 === 0 ? -1 : 1
                const lane = Math.floor(k / 2)
                const out = side * (360 + lane * 205)
                const tilt = side * (5 + lane * 3)
                const lift = lane ? -14 : 10
                return (
                  <div
                    key={k}
                    aria-hidden
                    className="pointer-events-none absolute left-1/2 top-1/2 z-[1]"
                    style={{
                      transform: on ? `translate(calc(-50% + ${out}px), calc(-50% + ${lift}px)) rotate(${tilt}deg) scale(1)` : 'translate(-50%, -50%) rotate(0deg) scale(.35)',
                      opacity: on ? 1 : 0,
                      transition: `transform .7s ${EASE_CSS} ${on ? lane * 0.08 : 0}s, opacity .4s ${on ? lane * 0.08 : 0}s`,
                    }}
                  >
                    <div className="relative h-[228px] w-[176px] overflow-hidden rounded-[16px] bg-tile shadow-pop ring-4 ring-white">
                      <Image src={src} alt="" fill sizes="190px" className="object-cover" />
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
                      fontSize: on ? 'clamp(56px,8.6vw,128px)' : 'clamp(44px,6.6vw,98px)',
                      opacity: dim ? 0.16 : 1,
                      transition: `all .5s ${EASE_CSS}`,
                    }}
                  >
                    {p.label}
                  </span>
                  <span
                    className={cn('mt-2 min-w-[1.5ch] text-left font-serif text-2xl italic', p.count > 0 ? 'text-orange' : 'text-ink-3')}
                    style={{ opacity: dim ? 0.16 : 1, transition: `opacity .5s ${EASE_CSS}` }}
                  >
                    {p.count}
                  </span>
                </div>
                <div
                  className="mt-1 font-sans text-base font-bold text-ink-2"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : -6}px)`, transition: `all .4s ${EASE_CSS} .1s` }}
                >
                  {line(p.count)} in {p.label} ↗
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Phones: a plain list with a thumbnail */}
      <ul className="grid gap-1 px-6 md:hidden">
        {list.map((p, i) => (
          <li key={p.href}>
            <Link href={p.href} className="flex items-center gap-4 border-b border-ink/10 py-3">
              <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-tile">
                <Image src={i % 2 ? SCENES[i % SCENES.length] : p.image} alt="" fill sizes="64px" className="object-cover" />
              </span>
              <span className="flex-1">
                <span className="block font-display text-[28px] font-extrabold leading-none tracking-[-0.045em]">{p.label}</span>
                <span className={cn('mt-1 block font-serif text-base italic', p.count > 0 ? 'text-orange' : 'text-ink-3')}>{line(p.count)}</span>
              </span>
              <span className="text-xl text-ink-3">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
