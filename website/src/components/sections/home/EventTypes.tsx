'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { EVENT_TYPES, PHOTOS } from '@/constants'
import { cn } from '@/lib/cn'
import { Eyebrow, H2 } from '@/components/ui/atoms'

/** Six tall panels in one row; the one you point at opens up. A plain grid on phones. */
export function EventTypes() {
  const [active, setActive] = useState(0)

  return (
    <section className="px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>A million reasons to hang</Eyebrow>
            <H2 className="mt-3.5">Pick your kind<br />of night.</H2>
          </div>
          <Link href="/events" className="hidden shrink-0 pb-3 font-sans text-[15px] font-bold underline-offset-4 hover:underline md:block">Browse every type →</Link>
        </div>

        <div className="mt-11 hidden h-[min(560px,68vh)] gap-3 md:flex">
          {EVENT_TYPES.map((t, i) => {
            const open = i === active
            return (
              <Link
                key={t.key}
                href={`/${t.slug}`}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                className="relative min-w-0 basis-0 overflow-hidden rounded-[20px] bg-tile transition-[flex-grow] duration-500 ease-out-expo"
                style={{ flexGrow: open ? 5 : 1 }}
              >
                <Image src={PHOTOS[t.photo]} alt={t.label} fill sizes="600px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className={cn('absolute bottom-5 left-5 right-5 transition-opacity duration-300', open ? 'opacity-100 delay-200' : 'opacity-0')}>
                  <div className="whitespace-nowrap font-display text-[30px] font-extrabold tracking-[-0.03em] text-white">{t.label}</div>
                  <div className="mt-1 whitespace-nowrap font-sans text-[15px] text-white/85">{t.blurb}</div>
                </div>
                <div className={cn(
                  'absolute bottom-5 left-1/2 -translate-x-1/2 rotate-180 whitespace-nowrap font-display text-[19px] font-extrabold tracking-[-0.02em] text-white transition-opacity duration-200 [writing-mode:vertical-rl]',
                  open ? 'opacity-0' : 'opacity-100',
                )}>
                  {t.label}
                </div>
              </Link>
            )
          })}
        </div>

        <div className="mt-9 grid grid-cols-2 gap-3 md:hidden">
          {EVENT_TYPES.map(t => (
            <Link key={t.key} href={`/${t.slug}`} className="relative aspect-[4/5] overflow-hidden rounded-[20px] bg-tile">
              <Image src={PHOTOS[t.photo]} alt={t.label} fill sizes="50vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
              <div className="absolute bottom-3.5 left-3.5 right-3 font-display text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-white">{t.label}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
