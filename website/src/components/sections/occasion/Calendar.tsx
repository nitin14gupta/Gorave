'use client'

import Link from 'next/link'
import { useSyncExternalStore } from 'react'
import { daysBetween, todayIST, type OccasionProps } from '@/lib/occasion'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'
import { Head } from '@/components/sections/areaType/kit'

const noop = () => () => {}

/**
 * Chapter 07, the calendar. The other occasions in date order as tear-off
 * calendar pages; hover one and it lifts while its photo pops.
 */
export function Calendar({ others }: OccasionProps) {
  const today = useSyncExternalStore(noop, todayIST, () => null)
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head n="07" label="Coming up" title="The rest of" serif="the party calendar." />
        <HoverPopGroup size="md">
          <ul className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-5">
            {others.map((x, i) => {
              const d = x.date ? new Date(`${x.date}T00:00:00Z`) : null
              const away = today && x.date ? daysBetween(today, x.date) : null
              return (
                <HoverPop as="li" key={x.slug} image={x.image} caption={x.name}>
                  <Link
                    href={x.href}
                    className="group block overflow-hidden rounded-[24px] bg-white shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-2 hover:shadow-pop"
                    style={{ transform: `rotate(${i % 2 ? 1.5 : -1.5}deg)` }}
                  >
                    <div className="bg-brand px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white">
                      {d ? d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'UTC' }) : 'Date TBC'}
                    </div>
                    <div className="px-4 pb-5 pt-3 text-center">
                      <div className="font-display text-[64px] font-extrabold leading-none tracking-[-0.06em]">{d ? d.getUTCDate() : '··'}</div>
                      <div className="mt-2 text-2xl">{x.emoji}</div>
                      <div className="mt-1 font-display text-lg font-extrabold leading-tight tracking-[-0.03em] transition-colors group-hover:text-orange">{x.name}</div>
                      <div className="mt-1 font-sans text-xs font-bold text-ink-3">{away !== null ? (away <= 0 ? 'This week' : `in ${away} days`) : ' '}</div>
                    </div>
                  </Link>
                </HoverPop>
              )
            })}
          </ul>
        </HoverPopGroup>
      </div>
    </section>
  )
}
