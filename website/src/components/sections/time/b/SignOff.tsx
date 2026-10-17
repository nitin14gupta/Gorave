'use client'

import { useMemo, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { TimeViewProps } from '../types'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { keyParts } from './kit'
import { useWindowKeys } from './useWindow'

const RING = 'M30 120 C 20 40, 160 12, 250 40 C 330 66, 320 196, 200 214 C 90 230, 14 180, 24 110 C 30 70, 80 40, 140 32'

/**
 * Chapter 08, the back page. "See you" and the window slide together from
 * either side while a pen rings the date on the last calendar page, then the
 * app badges.
 */
export function SignOff({ time, place, days, chapter = '08' }: Pick<TimeViewProps, 'time' | 'place' | 'days'> & { chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const fallback = useMemo(() => days.map(d => d.key).filter(k => keyParts(k)), [days])
  const keys = useWindowKeys(time.slug, fallback)
  const d = keyParts(keys[0] ?? '')
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const left = useTransform(p, [0, 0.8], [reduce ? 0 : -160, 0])
  const right = useTransform(p, [0, 0.8], [reduce ? 0 : 160, 0])
  const ring = useTransform(p, [0.35, 0.85], [0, 1])
  const pageRot = useTransform(p, [0, 0.8], [reduce ? -3 : 8, -3])
  const o = useTransform(p, [0.4, 0.8], [0, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-cream px-6 pb-20 pt-24 md:px-12 md:pb-28 md:pt-32 lg:px-20">
      <div className="mx-auto max-w-[1320px] text-center">
        <Chapter n={chapter} title="See you there" className="justify-center" />
        <div className="mt-10 flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10">
          <motion.div style={{ x: left }} className="font-display text-[clamp(64px,10vw,176px)] font-extrabold leading-[0.85] tracking-[-0.06em] text-ink">
            See you
          </motion.div>

          {/* The last page, date ringed */}
          <motion.div style={{ rotate: pageRot }} className="relative w-[190px] shrink-0 md:w-[230px]">
            <div className="overflow-hidden rounded-[24px] bg-white shadow-pop">
              <div className="flex items-center justify-between bg-blush px-4 pb-2.5 pt-4 font-sans text-[10px] font-bold uppercase tracking-[0.2em]">
                <span>{d ? d.month : time.label}</span>
                <span className="text-ink/55">{place.name}</span>
              </div>
              <div className="flex flex-col items-center px-4 pb-5 pt-3">
                <span className="font-serif text-xl italic text-orange">{d ? d.weekday : 'Soon'}</span>
                <span className="relative font-display text-[104px] font-extrabold leading-[0.85] tracking-[-0.07em] md:text-[128px]">
                  {d ? d.day : '·'}
                  <svg viewBox="0 0 340 240" className="pointer-events-none absolute -inset-x-10 -inset-y-6 h-[calc(100%+48px)] w-[calc(100%+80px)] overflow-visible" aria-hidden>
                    <motion.path d={RING} fill="none" stroke="#FF3864" strokeWidth={5} strokeLinecap="round" style={{ pathLength: ring }} />
                  </svg>
                </span>
              </div>
            </div>
          </motion.div>

          <motion.div style={{ x: right }} className="font-serif text-[clamp(52px,8vw,140px)] italic leading-[0.9] tracking-[-0.03em] text-brand">
            {time.label.toLowerCase()}.
          </motion.div>
        </div>

        <motion.div style={{ opacity: o }} className="mt-14 flex flex-col items-center gap-5">
          <p className="max-w-[460px] font-sans text-lg text-ink-2">{time.promise} in {place.name}. Pick a night, book or request, and the address arrives once you&apos;re in.</p>
          <StoreBadges />
          <Button href="/host" kind="ghost">Or host one yourself</Button>
        </motion.div>
      </div>
    </section>
  )
}
