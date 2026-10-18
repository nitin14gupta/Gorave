'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { EVENT_TYPES } from '@/constants'
import type { Area } from '@/lib/area'
import { cn } from '@/lib/cn'
import { Deckle, Grain, SectionHead } from './kit'

const TAG_SHAPE = 'polygon(22% 0, 78% 0, 100% 14%, 100% 100%, 0 100%, 0 14%)'
// Decorative barcode widths.
const BARS = [2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3]

/**
 * Chapter 06, kinds of nights. Every event type is a luggage tag hanging on
 * a rail by its string. Tags drop in and settle; hover one and it sways.
 */
export function LuggageTags({ area }: { area: Area }) {
  const reduce = useReducedMotion()
  const { city } = area
  return (
    <section className="relative overflow-hidden bg-paper px-6 py-28 md:px-20 md:py-32">
      <Deckle from="cream" seed={5} />
      <Grain />
      <div className="relative mx-auto max-w-[1280px]">
        <SectionHead n="06" label="Kinds of nights" title="Pick a night," serif="pack light." aside={`Every kind of night people host around ${area.name} and the rest of ${city.name}.`} />

        <ul className="mt-14 grid grid-cols-2 gap-x-5 gap-y-10 sm:grid-cols-3 lg:grid-cols-6">
          {EVENT_TYPES.map((t, i) => (
            <li key={t.slug} className="relative pt-12">
              <div aria-hidden className="absolute -left-3 -right-3 top-0 h-[3px] rounded-full bg-gradient-to-b from-[#b9a68a] to-[#8f7d63]" />
              <motion.div
                initial={reduce ? false : { opacity: 0, y: -36, rotate: i % 2 ? 9 : -9 }}
                whileInView={{ opacity: 1, y: 0, rotate: 0 }}
                viewport={{ once: true, margin: '0px 0px -10% 0px' }}
                transition={{ type: 'spring', stiffness: 70, damping: 8, delay: (i % 6) * 0.08 }}
                whileHover={reduce ? undefined : { rotate: [0, 5, -3.5, 2, -1, 0], transition: { duration: 1.6, ease: 'easeOut' } }}
                className="absolute inset-x-0 top-0 transition-[filter] duration-500 [filter:drop-shadow(0_10px_12px_rgb(23_19_16/0.14))] hover:[filter:drop-shadow(0_22px_22px_rgb(23_19_16/0.22))]"
                style={{ transformOrigin: '50% 0%', height: '100%' }}
              >
                {/* string */}
                <svg viewBox="0 0 40 52" className="absolute left-1/2 top-0 h-[52px] w-10 -translate-x-1/2 text-ink/45" fill="none" aria-hidden>
                  <path d="M20 0 C 14 18, 26 30, 20 52" stroke="currentColor" strokeWidth="1.3" />
                </svg>
                <Link
                  href={`/${city.slug}/${area.slug}/${t.slug}`}
                  className={cn('group absolute inset-x-0 bottom-0 top-10 flex flex-col p-4 pt-9', t.tint, t.ink)}
                  style={{ clipPath: TAG_SHAPE }}
                >
                  <span aria-hidden className="absolute left-1/2 top-3 size-3.5 -translate-x-1/2 rounded-full bg-paper shadow-[inset_0_1px_2px_rgb(23_19_16/0.35)] ring-[3px] ring-white/70" />
                  <span className="font-sans text-[9px] font-bold uppercase tracking-[0.2em] opacity-60">{city.name} · No. {String(i + 1).padStart(2, '0')}</span>
                  <span className="mt-2 font-display text-[22px] font-extrabold leading-[0.98] tracking-[-0.035em]">{t.label}</span>
                  <span className="mt-2 font-serif text-[16px] italic leading-snug opacity-80">{t.blurb}</span>
                  <span className="mt-auto border-t border-dashed border-current/25 pt-3">
                    <span aria-hidden className="flex h-6 items-stretch gap-[2px] opacity-50">
                      {BARS.map((w, k) => <span key={k} className="bg-current" style={{ width: w }} />)}
                    </span>
                    <span className="mt-2 flex items-center justify-between font-sans text-xs font-bold">
                      {area.name}
                      <span className="inline-block transition-transform duration-300 group-hover:translate-x-1">→</span>
                    </span>
                  </span>
                </Link>
              </motion.div>
              {/* spacer that gives the absolutely-positioned tag its height */}
              <div aria-hidden className="h-[300px]" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
