'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { SampleEvent } from '@/constants'
import type { Area } from '@/lib/area'
import { Button } from '@/components/ui/Button'
import { EventCard } from '@/components/ui/EventCard'
import { CARD_SHADOW, Grain, SectionHead, Stamp } from './kit'

const TILT = [-2.2, 1.6, -1.2, 2.4, -1.8, 1.1]

/** A wooden peg clip. */
function Peg() {
  return (
    <div aria-hidden className="absolute left-1/2 top-0 z-20 h-11 w-[18px] -translate-x-1/2 rounded-[4px] bg-gradient-to-b from-[#d8b48a] to-[#b98d5f] shadow-[0_4px_8px_-3px_rgb(23_19_16/0.4)]">
      <div className="absolute inset-x-[3px] top-[18px] h-[5px] rounded-full bg-[#7d5a38]/55" />
    </div>
  )
}

/** The back of a blank postcard, nobody has written one from here yet. */
function EmptyCard({ area }: { area: Area }) {
  const reduce = useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 40, rotate: -6 }}
      whileInView={{ opacity: 1, y: 0, rotate: -1.5 }}
      viewport={{ once: true, margin: '0px 0px -15% 0px' }}
      transition={{ type: 'spring', stiffness: 55, damping: 14 }}
      className={`relative mx-auto mt-14 max-w-[820px] bg-white p-6 sm:p-10 ${CARD_SHADOW}`}
    >
      <div className="grid gap-8 sm:grid-cols-[1.1fr_1px_0.9fr]">
        <div>
          <p className="font-serif text-[clamp(26px,3vw,38px)] italic leading-[1.15] text-ink">
            No postcards yet, be the first to host in {area.name}.
          </p>
          <p className="mt-4 font-sans text-base leading-relaxed text-ink-2">
            Listing is free and takes a few minutes in the app. Your night becomes the first one people see here.
          </p>
          <div className="mt-7 flex flex-wrap gap-2.5">
            <Button href="/host">Host the first night</Button>
            <Button href={`/${area.city.slug}`} kind="ghost">See all of {area.city.name}</Button>
          </div>
        </div>
        <div className="hidden bg-ink/15 sm:block" />
        <div className="flex flex-col">
          <div className="ml-auto grid h-[112px] w-[92px] place-items-center border-2 border-dashed border-ink/20 text-center font-sans text-[10px] font-bold uppercase leading-snug tracking-[0.14em] text-ink-3">
            Your<br />stamp<br />here
          </div>
          <div className="mt-auto space-y-5 pt-8">
            <div className="border-b border-ink/20 pb-1 font-serif text-2xl italic text-ink-2">{area.name},</div>
            <div className="border-b border-ink/20 pb-1 font-serif text-2xl italic text-ink-2">{area.city.name}</div>
            <div className="border-b border-ink/20 pb-1">&nbsp;</div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Chapter 02, what's on. Real events, hung on a line with wooden pegs. Each
 * card swings in from its peg and settles; hovering straightens it.
 */
export function WhatsOn({ area, events }: { area: Area; events: SampleEvent[] }) {
  const reduce = useReducedMotion()
  const shown = events.slice(0, 6)
  return (
    <section id="whats-on" className="relative scroll-mt-20 overflow-hidden bg-paper px-6 py-28 md:px-20 md:py-32">
      <Grain />
      <div className="relative mx-auto max-w-[1280px]">
        <SectionHead
          n="02"
          label="What's on"
          title="Pinned up in"
          serif={`${area.name}.`}
          aside={shown.length > 0 && (
            <Link href={`/${area.city.slug}`} className="group not-italic font-sans text-sm font-bold text-ink-2 transition-colors hover:text-ink">
              Everything in {area.city.name} <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
            </Link>
          )}
        />

        {shown.length === 0 ? (
          <EmptyCard area={area} />
        ) : (
          <ul className={`mt-14 grid gap-x-8 gap-y-14 sm:grid-cols-2 ${shown.length === 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
            {shown.map((e, i) => (
              <li key={e.id} className="relative pt-7">
                {/* the line runs through every peg in a row */}
                <div aria-hidden className="absolute -left-4 -right-4 top-[13px] h-[1.5px] bg-ink/25" />
                <Peg />
                <motion.div
                  initial={reduce ? false : { opacity: 0, rotate: TILT[i] * 5, y: -24 }}
                  whileInView={{ opacity: 1, rotate: TILT[i], y: 0 }}
                  whileHover={reduce ? undefined : { rotate: 0, transition: { type: 'spring', stiffness: 140, damping: 12 } }}
                  viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                  transition={{ type: 'spring', stiffness: 60, damping: 7, delay: (i % 3) * 0.12 }}
                  style={{ transformOrigin: '50% 0%' }}
                  className="relative"
                >
                  <div className={`bg-white p-2 pb-3 ${CARD_SHADOW}`}>
                    <EventCard event={e} />
                  </div>
                </motion.div>
              </li>
            ))}
          </ul>
        )}

        {shown.length > 0 && (
          <div className="mt-16 flex flex-wrap items-center justify-center gap-4 text-center">
            <Stamp className="w-[54px] -rotate-6" innerClassName="!bg-blush">
              <div className="grid aspect-[4/5] place-items-center font-serif text-2xl italic text-blush-ink">+</div>
            </Stamp>
            <p className="font-serif text-2xl italic text-ink-2">Got a living room in {area.name}? <Link href="/host" className="text-ink underline decoration-orange/60 underline-offset-4 transition-colors hover:text-orange">Pin yours up.</Link></p>
          </div>
        )}
      </div>
    </section>
  )
}
