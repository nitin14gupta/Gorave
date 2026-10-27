'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { PHOTOS, type SampleEvent } from '@/constants'

const EASE = 'cubic-bezier(.2,.8,.2,1)'

/**
 * A handful of real nights, as posters. On a big screen the list sits on
 * the left; hover or tab to a night and its 4:5 poster takes the stage on
 * the right (crossfade and a small settle, nothing loops). On a phone it's a
 * row of posters you swipe.
 */
export function PosterShelf({ events }: { events: SampleEvent[] }) {
  const [active, setActive] = useState(0)
  const shown = events.slice(0, 6)

  return (
    <>
      {/* Phone: swipe the posters */}
      <div className="-mx-6 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 no-scrollbar lg:hidden">
        {shown.map(e => (
          <Link key={e.id} href={`/e/${e.id}`} className="relative aspect-[4/5] w-[76vw] max-w-[340px] shrink-0 snap-center overflow-hidden rounded-[28px] bg-tile">
            <Image src={e.image ?? PHOTOS[e.photo]} alt={e.title} fill sizes="76vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 from-40% to-black/75" />
            <div className="absolute inset-x-5 bottom-5 text-white">
              <div className="font-sans text-xs font-bold opacity-85">{[e.when, e.area].filter(Boolean).join(' · ')}</div>
              <div className="mt-1 font-display text-[28px] font-extrabold leading-[0.95] tracking-[-0.04em]">{e.title}</div>
              <div className="mt-3 inline-block rounded-full bg-white px-3 py-1 font-sans text-xs font-bold text-ink">{e.price}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Big screens: list + stage */}
      <div className="mt-16 hidden grid-cols-[1.05fr_1fr] items-center gap-16 lg:grid">
        <ol className="divide-y divide-ink/10 border-y border-ink/10">
          {shown.map((e, i) => {
            const on = active === i
            return (
              <li key={e.id}>
                <Link
                  href={`/e/${e.id}`}
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  className="group flex items-baseline gap-6 py-6 outline-none"
                >
                  <span className="w-8 font-serif text-xl italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1">
                    <span
                      className="block font-display font-extrabold leading-[0.95] tracking-[-0.045em] text-ink"
                      style={{ fontSize: on ? 'clamp(34px,3.4vw,52px)' : 'clamp(26px,2.4vw,36px)', opacity: on ? 1 : 0.45, transition: `all .5s ${EASE}` }}
                    >
                      {e.title}
                    </span>
                    <span className="mt-2 block font-sans text-sm font-bold text-ink-2" style={{ opacity: on ? 1 : 0.6, transition: `opacity .4s ${EASE}` }}>
                      {[e.when, e.area, e.going ? `${e.going} going` : null].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                  <span className="font-sans text-sm font-bold text-ink" style={{ opacity: on ? 1 : 0, transform: `translateX(${on ? 0 : -8}px)`, transition: `all .4s ${EASE}` }}>
                    {e.price} ↗
                  </span>
                </Link>
              </li>
            )
          })}
        </ol>

        <div className="relative mx-auto aspect-[4/5] w-full max-w-[460px]">
          {shown.map((e, i) => {
            const on = active === i
            return (
              <Link
                key={e.id}
                href={`/e/${e.id}`}
                tabIndex={-1}
                aria-hidden={!on}
                className="absolute inset-0 overflow-hidden rounded-[32px] bg-tile shadow-pop"
                style={{
                  opacity: on ? 1 : 0,
                  transform: on ? 'rotate(-1.5deg) scale(1)' : 'rotate(2deg) scale(.94)',
                  pointerEvents: on ? 'auto' : 'none',
                  transition: `opacity .5s ${EASE}, transform .7s ${EASE}`,
                  zIndex: on ? 2 : 1,
                }}
              >
                <Image src={e.image ?? PHOTOS[e.photo]} alt={e.title} fill sizes="460px" className="object-cover" priority={i === 0} />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 from-45% to-black/75" />
                <div className="absolute left-5 top-5 rounded-full bg-white/90 px-3 py-1 font-sans text-xs font-bold text-ink">{e.when}</div>
                <div className="absolute inset-x-6 bottom-6 text-white">
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] opacity-80">{e.area}{e.city ? `, ${e.city}` : ''}</div>
                  <div className="mt-1.5 font-display text-[40px] font-extrabold leading-[0.92] tracking-[-0.045em]">{e.title}</div>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="font-sans text-sm font-bold opacity-85">{e.request ? 'Request to join' : e.going ? `${e.going} going` : 'Be the first in'}</span>
                    <span className="rounded-full bg-white px-3.5 py-1.5 font-sans text-sm font-bold text-ink">{e.price}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
