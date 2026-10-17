'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { Area } from '@/lib/area'
import { cn } from '@/lib/cn'
import { CARD_SHADOW, Deckle, Grain, Postmark, Stamp } from './kit'

/**
 * Chapter 10 — the questions, written on the back of a postcard. The card
 * arrives a little crooked and straightens as it scrolls into place. The
 * shared <Faq> renders inside, unchanged; only its section chrome is reset.
 */
export function FaqPostcard({ area, children }: { area: Area; children: ReactNode }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'start 25%'] })
  const p = useSpring(scrollYProgress, { stiffness: 70, damping: 22 })
  const rotate = useTransform(p, [0, 1], [reduce ? 0 : 3.5, 0])
  const y = useTransform(p, [0, 1], [reduce ? 0 : 70, 0])

  return (
    <section ref={ref} className="relative overflow-hidden bg-paper px-4 py-24 sm:px-6 md:px-20 md:py-32">
      <Deckle from="cream" seed={3} />
      <Grain />
      <motion.div style={{ rotate, y }} className={cn('relative mx-auto max-w-[1220px] bg-white px-5 pb-6 pt-6 sm:px-10 sm:pb-10 md:px-14', CARD_SHADOW)}>
        {/* postcard-back header: handwriting left, postmark + stamp right */}
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-ink/15 pb-5">
          <div>
            <div className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">Post card · {area.name}</div>
            <div className="mt-2 font-serif text-[clamp(26px,3vw,40px)] italic leading-none text-ink-2">Questions, answered —</div>
          </div>
          <div className="flex shrink-0 items-start gap-1">
            <Postmark top={`${area.name} · ${area.city.name}`} bottom="faq" center="ask away" className="hidden w-[84px] -rotate-12 text-ink/45 sm:block" />
            <Stamp className="w-[54px] rotate-3 sm:w-[64px]">
              <div className="grid aspect-[4/5] place-items-center bg-brand font-serif text-2xl italic text-white">?</div>
            </Stamp>
          </div>
        </div>
        <div
          className={cn(
            // reset the shared section's own chrome
            '[&>section]:bg-transparent [&>section]:px-0 [&>section]:pb-0 [&>section]:pt-8 md:[&>section]:pt-10',
            // the vertical line down the middle of a postcard back
            'lg:[&>section>div>*:last-child]:relative lg:[&>section>div>*:last-child]:before:absolute lg:[&>section>div>*:last-child]:before:inset-y-0 lg:[&>section>div>*:last-child]:before:-left-6 lg:[&>section>div>*:last-child]:before:border-l lg:[&>section>div>*:last-child]:before:border-dashed lg:[&>section>div>*:last-child]:before:border-ink/20',
          )}
        >
          {children}
        </div>
      </motion.div>
    </section>
  )
}
