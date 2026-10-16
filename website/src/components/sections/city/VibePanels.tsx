'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { EVENT_TYPES, PHOTOS, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'

const EASE = 'cubic-bezier(.2,.8,.2,1)'

/** Chapter 05 — the vibe. Six panels; the one you hover stretches open. */
export function VibePanels({ city }: { city: City }) {
  const [open, setOpen] = useState(0)
  return (
    <section className="bg-cream px-6 py-28 md:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="mb-11 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <Chapter n="05" title="The vibe" />
            <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">Pick a vibe.</h2>
          </div>
          <p className="max-w-[360px] font-sans text-lg text-ink-2">Every vibe has its own page in {city.name}, with only that kind of night.</p>
        </div>
        <div className="flex h-[540px] flex-col gap-3 md:flex-row">
          {EVENT_TYPES.map((t, i) => {
            const on = open === i
            return (
              <Link
                key={t.key}
                href={`/${city.slug}/${t.slug}`}
                onMouseEnter={() => setOpen(i)}
                onFocus={() => setOpen(i)}
                className="relative min-h-0 min-w-0 overflow-hidden rounded-[32px]"
                style={{ flex: on ? 5 : 1, transition: `flex .7s ${EASE}` }}
              >
                <Image
                  src={PHOTOS[t.photo]}
                  alt={t.label}
                  fill
                  sizes="(max-width: 768px) 100vw, 60vw"
                  className="object-cover"
                  style={{ transform: `scale(${on ? 1 : 1.25})`, transition: `transform 1s ${EASE}` }}
                />
                <div className="absolute inset-0 transition-colors duration-500" style={{ background: on ? 'linear-gradient(180deg, transparent 45%, rgb(0 0 0 / .6))' : 'rgb(23 19 16 / .35)' }} />
                <span
                  className="absolute bottom-7 left-1/2 hidden -translate-x-1/2 rotate-180 whitespace-nowrap font-display text-[28px] font-extrabold tracking-[-0.03em] text-white [writing-mode:vertical-rl] md:block"
                  style={{ opacity: on ? 0 : 1, transition: 'opacity .3s' }}
                >
                  {t.label}
                </span>
                <div
                  className="absolute inset-x-7 bottom-7 text-white"
                  style={{ opacity: on ? 1 : 0, transform: `translateY(${on ? 0 : 20}px)`, transition: `all .5s ${EASE} ${on ? '.2s' : '0s'}` }}
                >
                  <div className="font-display text-[clamp(36px,4vw,58px)] font-extrabold leading-[0.95] tracking-[-0.05em]">{t.label}</div>
                  <div className="mt-2.5 flex flex-wrap items-end justify-between gap-3">
                    <span className="font-sans text-[17px] opacity-90">{t.blurb}</span>
                    <span className="rounded-full bg-noir-ink px-4 py-2.5 font-sans text-[13px] font-bold text-ink">{t.label} in {city.name} →</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </section>
  )
}
