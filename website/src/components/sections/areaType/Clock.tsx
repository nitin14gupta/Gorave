'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { Chapter } from '@/components/ui/atoms'
import { EASE } from './kit'

const R = 46
const C = 2 * Math.PI * R

/**
 * Chapter 04, the night by the clock. Pinned; as you scroll the time rolls
 * forward digit by digit like an odometer, the round photo opens onto the
 * next part of the night and an arc fills around it. Phones get a list.
 */
export function Clock({ area, story }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const night = story.night
  const n = night.length
  const [i, setI] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(p, 'change', v => setI(Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999)))))
  const dash = useTransform(p, [0, 1], [C, 0])
  const stop = night[i]

  return (
    <>
      <section ref={ref} className="relative hidden bg-paper md:block" style={{ height: `${n * 80}vh` }}>
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-12 lg:px-20">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1.2fr_1fr] items-center gap-12">
            <div>
              <Chapter n="04" title="The night, by the clock" />
              <div className="mt-6 flex font-display text-[clamp(96px,12vw,200px)] font-extrabold leading-[0.9] tracking-[-0.065em] tabular-nums">
                {stop.time.split('').map((ch, k) => (
                  <span key={k} className="relative inline-block overflow-hidden">
                    <AnimatePresence mode="popLayout" initial={false}>
                      <motion.span
                        key={`${ch}-${i}`}
                        className={`inline-block ${ch === ' ' ? 'w-[0.25em]' : ''} ${/[APM]/.test(ch) ? 'font-serif text-[0.45em] font-normal italic tracking-normal text-orange' : ''}`}
                        initial={reduce ? false : { y: '100%' }}
                        animate={{ y: 0 }}
                        exit={reduce ? undefined : { y: '-100%' }}
                        transition={{ duration: 0.55, ease: EASE, delay: k * 0.035 }}
                      >
                        {ch === ' ' ? ' ' : ch}
                      </motion.span>
                    </AnimatePresence>
                  </span>
                ))}
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={i} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }} transition={{ duration: 0.35 }}>
                  <div className="mt-6 font-display text-[clamp(32px,3.4vw,52px)] font-extrabold tracking-[-0.045em]">{stop.title}</div>
                  <div className="mt-2 max-w-[440px] font-sans text-lg text-ink-2">{stop.detail}</div>
                </motion.div>
              </AnimatePresence>
              <div className="mt-10 flex gap-2">
                {night.map((s, k) => (
                  <span key={s.time} className="h-1.5 rounded-full transition-all duration-500" style={{ width: k === i ? 44 : 14, background: k <= i ? 'var(--color-orange)' : 'rgb(23 19 16 / .12)' }} />
                ))}
              </div>
              <p className="mt-6 font-sans text-sm font-bold text-ink-3">How a {story.singular} in {area.name} usually goes.</p>
            </div>

            <div className="relative mx-auto aspect-square w-full max-w-[520px]">
              <svg viewBox="0 0 100 100" className="absolute inset-0 -rotate-90" aria-hidden>
                <circle cx="50" cy="50" r={R} fill="none" stroke="rgb(23 19 16 / .08)" strokeWidth="1.2" />
                <motion.circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-orange)" strokeWidth="1.2" strokeLinecap="round" strokeDasharray={C} style={{ strokeDashoffset: dash }} />
              </svg>
              <div className="absolute inset-[7%] overflow-hidden rounded-full bg-tile">
                <AnimatePresence initial={false}>
                  <motion.div
                    key={i}
                    initial={reduce ? false : { clipPath: 'circle(0% at 50% 50%)' }}
                    animate={{ clipPath: 'circle(75% at 50% 50%)' }}
                    transition={{ duration: 0.9, ease: EASE }}
                    className="absolute inset-0"
                  >
                    <Image src={PHOTOS[stop.photo]} alt={stop.title} fill sizes="480px" className="object-cover" />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phones */}
      <section className="bg-paper px-6 py-24 md:hidden">
        <Chapter n="04" title="The night, by the clock" />
        <ol className="mt-8 space-y-6">
          {night.map(s => (
            <li key={s.time} className="flex items-center gap-4">
              <div className="relative size-20 shrink-0 overflow-hidden rounded-full">
                <Image src={PHOTOS[s.photo]} alt="" fill sizes="80px" className="object-cover" />
              </div>
              <div>
                <div className="font-display text-3xl font-extrabold tracking-[-0.05em]">{s.time}</div>
                <div className="font-sans text-[15px] font-bold">{s.title}</div>
                <div className="font-sans text-sm text-ink-2">{s.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </>
  )
}
