'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EASE, countLabel } from './kit'

/**
 * Hero, the window. The title sits in two lines with a small window into
 * the night between them. Scroll and the lines part while the window opens
 * to fill the screen, so you zoom straight into the party.
 */
export function Window({ area, story, events, crumbs }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const open = useTransform(p, [0, 0.7], [0, reduce ? 0 : 1])
  const w = useTransform(open, v => `calc(${26 + v * 74}vw)`)
  const h = useTransform(open, v => `calc(${30 + v * 70}vh)`)
  const radius = useTransform(open, [0, 1], [36, 0])
  const zoom = useTransform(open, [0, 1], [1.35, 1])
  const up = useTransform(open, v => `${-v * 46}vh`)
  const down = useTransform(open, v => `${v * 46}vh`)
  const fade = useTransform(open, [0, 0.35], [1, 0])
  const caption = useTransform(p, [0.6, 0.8], [0, 1])
  const photo = events.find(e => e.image)?.image ?? PHOTOS[story.heroPhoto]

  return (
    <section ref={ref} className="relative h-[240vh] bg-cream">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div style={{ opacity: fade }} className="absolute inset-x-6 top-24 z-20 md:inset-x-12 lg:inset-x-20">
          <Breadcrumbs crumbs={crumbs} />
        </motion.div>

        {/* The window */}
        <div className="absolute inset-0 grid place-items-center">
          <motion.div
            initial={reduce ? false : { opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE }}
            style={{ width: w, height: h, borderRadius: radius }}
            className="relative overflow-hidden bg-tile shadow-pop"
          >
            <motion.div style={{ scale: zoom }} className="absolute inset-0">
              <Image src={photo} alt={`A ${story.singular} in ${area.name}`} fill priority sizes="100vw" className="object-cover" />
            </motion.div>
            <motion.div style={{ opacity: caption }} className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
            <motion.div style={{ opacity: caption }} className="absolute inset-x-6 bottom-10 flex flex-wrap items-end justify-between gap-6 text-white md:inset-x-12 lg:inset-x-20">
              <p className="max-w-[520px] font-sans text-lg leading-relaxed md:text-xl">
                {story.heroLine} In {area.name}, {area.profile.line}.
              </p>
              <span className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold text-ink">{countLabel(events.length)}</span>
            </motion.div>
          </motion.div>
        </div>

        {/* The title, parting around the window */}
        <h1 className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
            className="block"
          >
            <motion.span style={{ y: up }} className="block -translate-y-[19vh] font-display text-[clamp(48px,8.4vw,144px)] font-extrabold leading-none tracking-[-0.06em] text-ink">
              {story.plural}
            </motion.span>
          </motion.span>
          <motion.span
            initial={reduce ? false : { opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.08 }}
            className="block"
          >
            <motion.span style={{ y: down }} className="block translate-y-[19vh] font-serif text-[clamp(46px,8vw,136px)] font-normal italic leading-none tracking-[-0.03em] text-orange">
              in {area.name}.
            </motion.span>
          </motion.span>
        </h1>

        <motion.div style={{ opacity: fade }} className="absolute inset-x-0 bottom-6 z-10 text-center font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
          Scroll to step inside
        </motion.div>
      </div>
    </section>
  )
}
