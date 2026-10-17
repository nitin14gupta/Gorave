'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { TimeViewProps } from '../types'
import { Button } from '@/components/ui/Button'
import { Chapter } from '@/components/ui/atoms'
import { EASE, plural } from './kit'

/**
 * No listings in this window yet. A blank diary page, with a hand-drawn
 * circle that draws itself round "nothing yet", the other windows (with their
 * real counts) as tabs to flip to, and an invite to host the first one.
 */
export function EmptyWindow({ time, place, others, chapter }: Pick<TimeViewProps, 'time' | 'place' | 'others'> & { chapter: string }) {
  const reduce = useReducedMotion()
  const sorted = [...others].sort((a, b) => b.count - a.count)
  return (
    <section id="days" className="scroll-mt-20 bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[1fr_1fr]">
        {/* The blank page */}
        <motion.div
          initial={reduce ? false : { opacity: 0, rotate: 0, y: 30 }}
          whileInView={{ opacity: 1, rotate: -2, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative mx-auto w-full max-w-[460px]"
        >
          <div className="overflow-hidden rounded-[28px] bg-white shadow-pop">
            <div className="flex items-center justify-between bg-blush px-7 pb-4 pt-7">
              <span className="font-sans text-xs font-bold uppercase tracking-[0.22em]">{time.label}</span>
              <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink/60">{place.name}</span>
            </div>
            <div className="relative h-[360px] [background-image:linear-gradient(rgb(23_19_16/0.08)_1px,transparent_1px)] [background-size:100%_44px] [background-position:0_34px]">
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="relative px-6 text-center">
                  <span className="font-serif text-[64px] italic leading-none text-ink">nothing yet</span>
                  <svg viewBox="0 0 320 120" className="pointer-events-none absolute -inset-x-4 -inset-y-6 h-[calc(100%+48px)] w-[calc(100%+32px)] overflow-visible" aria-hidden>
                    <motion.path
                      d="M30 64 C 26 20, 150 8, 250 18 C 318 26, 318 96, 230 104 C 140 112, 30 106, 22 70 C 18 50, 60 30, 110 26"
                      fill="none"
                      stroke="#FF6B35"
                      strokeWidth={3}
                      strokeLinecap="round"
                      initial={reduce ? false : { pathLength: 0 }}
                      whileInView={{ pathLength: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 1.3, ease: EASE, delay: 0.5 }}
                    />
                  </svg>
                </div>
                <p className="mt-10 max-w-[300px] text-center font-sans text-base text-ink-2">
                  No nights pencilled in for {time.label.toLowerCase()} in {place.name}. New ones are listed all the time.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div>
          <Chapter n={chapter} title="The days" />
          <h2 className="mt-4 font-display text-[clamp(40px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            A blank page.
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">Flip to another, or fill it.</span>
          </h2>
          <ul className="mt-10 grid gap-3">
            {sorted.map(o => (
              <li key={o.slug}>
                <Link href={o.href} className="group flex items-center gap-4 rounded-[22px] bg-white p-3 pr-5 shadow-soft transition-transform duration-500 ease-out-expo hover:-translate-y-1">
                  <span className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-tile">
                    <Image src={o.image} alt="" fill sizes="128px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110" />
                  </span>
                  <span className="flex-1">
                    <span className="block font-display text-2xl font-extrabold tracking-[-0.04em]">{o.label}</span>
                    <span className="block font-sans text-sm text-ink-3">{o.promise}</span>
                  </span>
                  <span className={`font-serif text-xl italic ${o.count ? 'text-orange' : 'text-ink-3'}`}>{o.count ? plural(o.count, 'night') : 'none yet'}</span>
                  <span className="text-xl text-ink-3 transition-transform duration-300 group-hover:translate-x-1">→</span>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Button href="/host" size="lg">Host the first one</Button>
            <span className="font-sans text-sm text-ink-2">Your home, your rules, your guest list.</span>
          </div>
        </div>
      </div>
    </section>
  )
}
