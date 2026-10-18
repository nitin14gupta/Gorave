'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { Chapter } from '@/components/ui/atoms'
import { Ctas } from './kit'

/**
 * Chapter 08, the window closes. The page opened by zooming into the night;
 * it ends the other way. A full-screen photo shrinks and tilts into a ticket
 * in your hand, the stub tears in, and the line lands around it.
 */
export function SignOff({ area, story, type, events }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const close = useTransform(p, [0.05, 0.6], [reduce ? 1 : 0, 1])
  const w = useTransform(close, v => `calc(${100 - v * 100}vw + ${v * 300}px)`)
  const h = useTransform(close, v => `calc(${100 - v * 100}vh + ${v * 400}px)`)
  const radius = useTransform(close, [0, 1], [0, 28])
  const rotate = useTransform(close, [0.6, 1], [0, -5])
  const stub = useTransform(p, [0.55, 0.7], [0, 1])
  const words = useTransform(p, [0.6, 0.78], [0, 1])
  const left = useTransform(words, [0, 1], ['-12vw', '0vw'])
  const right = useTransform(words, [0, 1], ['12vw', '0vw'])
  const photo = events.find(e => e.image)?.image ?? PHOTOS[story.night[story.night.length - 1]?.photo ?? story.heroPhoto]

  return (
    <section ref={ref} className="relative h-[260vh] bg-cream">
      <div className="sticky top-0 h-screen overflow-hidden">
        <div className="absolute inset-x-0 top-20 z-10 text-center md:top-24">
          <motion.div style={{ opacity: words }}>
            <Chapter n="08" title="See you there" className="justify-center" />
          </motion.div>
        </div>

        <div className="absolute inset-0 grid place-items-center">
          <motion.div style={{ width: w, height: h, borderRadius: radius, rotate }} className="relative overflow-hidden bg-tile shadow-pop">
            <Image src={photo} alt="" fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/10" />
            <motion.div style={{ opacity: stub }} className="absolute inset-x-0 bottom-0 bg-white px-5 pb-5 pt-4">
              <div aria-hidden className="absolute -top-2 left-0 right-0 flex justify-between px-1">
                {Array.from({ length: 14 }, (_, k) => <span key={k} className="size-4 rounded-full bg-cream" />)}
              </div>
              <div className="font-sans text-[10px] font-bold uppercase tracking-[0.18em] text-ink-3">Admit one</div>
              <div className="mt-1 font-display text-xl font-extrabold leading-tight tracking-[-0.03em]">{type.label}</div>
              <div className="font-sans text-xs font-bold text-ink-2">{area.name}, {area.city.name}</div>
            </motion.div>
          </motion.div>
        </div>

        <motion.div style={{ opacity: words }} className="pointer-events-none absolute inset-x-0 top-1/2 z-10 hidden -translate-y-1/2 justify-between px-12 font-display text-[clamp(56px,8vw,140px)] font-extrabold leading-none tracking-[-0.06em] lg:flex">
          <motion.span style={{ x: left }}>See you</motion.span>
          <motion.span style={{ x: right }} className="font-serif font-normal italic tracking-[-0.03em] text-brand">in {area.name}.</motion.span>
        </motion.div>

        <motion.div style={{ opacity: words }} className="absolute inset-x-0 bottom-8 z-10 flex flex-col items-center px-6 text-center md:bottom-12">
          <div className="mb-5 font-display text-[clamp(36px,9vw,56px)] font-extrabold leading-none tracking-[-0.05em] lg:hidden">
            See you <span className="font-serif font-normal italic text-brand">in {area.name}.</span>
          </div>
          <Ctas className="items-center" badges={false} />
        </motion.div>
      </div>
    </section>
  )
}
