'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { Stagger } from '@/components/sections/type/Stagger'
import { EASE, Head } from './kit'

const SHOW = 6

/**
 * Chapter 01, the real listings for this crowd and place. Cards rise in as
 * the grid scrolls into view; with nothing listed, a table of empty chairs
 * draws itself and asks you to host the first one.
 */
export function OnTheList({ crowd, place, events, total }: Pick<CrowdViewProps, 'crowd' | 'place' | 'events' | 'total'>) {
  const shown = events.slice(0, SHOW)
  const more = Math.max(total, events.length) - shown.length

  return (
    <section id="on-the-list" className="scroll-mt-24 bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head
          n="01"
          label="On the list"
          title="Coming up"
          serif={`in ${place.name}.`}
          aside={
            shown.length ? (
              <div className="flex items-end gap-4">
                <span className="font-display text-[72px] font-extrabold leading-[0.8] tracking-[-0.06em] text-ink">{Math.max(total, events.length)}</span>
                <span className="pb-1 font-sans text-base leading-snug">live {crowd.nights}. Area shown now, address after you&apos;re in.</span>
              </div>
            ) : undefined
          }
        />

        {shown.length ? (
          <>
            <Stagger className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map(e => <EventCard key={e.id} event={e} />)}
            </Stagger>
            {more > 0 && (
              <div className="mt-12 flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-paper px-7 py-6 shadow-soft">
                <p className="font-display text-2xl font-extrabold tracking-[-0.035em]">
                  {more} more on Gorave.<span className="font-serif font-normal italic text-orange"> See them all in the app.</span>
                </p>
                <StoreBadges height={44} />
              </div>
            )}
          </>
        ) : (
          <Empty crowd={crowd} place={place} />
        )}
      </div>
    </section>
  )
}

function Empty({ crowd, place }: Pick<CrowdViewProps, 'crowd' | 'place'>) {
  const reduce = useReducedMotion()
  const seats = [0, 1, 2, 3, 4, 5]
  return (
    <div className="mt-14 rounded-[32px] border-[1.5px] border-dashed border-ink/25 px-6 py-16 text-center md:px-8">
      <svg viewBox="0 0 420 120" className="mx-auto w-full max-w-[420px]" aria-hidden>
        <motion.rect
          x={40} y={46} width={340} height={28} rx={14} fill="none" stroke="#171310" strokeWidth={1.5}
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: EASE }}
        />
        {seats.map(i => {
          const cx = 90 + (i % 3) * 120
          const cy = i < 3 ? 22 : 98
          return (
            <motion.circle
              key={i} cx={cx} cy={cy} r={14} fill="none" stroke="#8A8076" strokeWidth={1.5} strokeDasharray="4 4"
              initial={reduce ? false : { opacity: 0, scale: 0.4 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 + i * 0.08, ease: EASE }}
              style={{ transformOrigin: `${cx}px ${cy}px` }}
            />
          )
        })}
      </svg>
      <div className="mt-8 font-display text-[clamp(28px,3.4vw,44px)] font-extrabold tracking-[-0.04em]">
        No {crowd.nights} listed in {place.name} yet.
      </div>
      <p className="mx-auto mt-3 max-w-[460px] font-sans text-lg text-ink-2">
        Every chair is still empty. {crowd.hostLine}
      </p>
      <div className="mt-7 flex flex-wrap justify-center gap-2.5">
        <Button href="/host" size="lg">Host the first one</Button>
        {place.citySlug && <Button href={`/${crowd.slug}`} kind="ghost" size="lg">See all of India</Button>}
      </div>
      {place.citySlug && (
        <p className="mt-5 font-sans text-sm text-ink-3">
          Or browse <Link href={`/${place.citySlug}`} className="font-bold text-ink underline-offset-4 hover:underline">everything in {place.name}</Link>.
        </p>
      )}
    </div>
  )
}
