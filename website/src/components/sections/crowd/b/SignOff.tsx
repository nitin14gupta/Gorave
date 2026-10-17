'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter, StoreBadges } from '@/components/ui/atoms'

/**
 * Chapter 08, the back page. The crowd's name set edge to edge, the two
 * halves of the line sliding together as you reach the end, then the app.
 */
export function SignOff({ crowd, place, chapter = '08' }: { crowd: CrowdContent; place: { name: string }; chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const left = useTransform(p, [0, 0.85], [reduce ? 0 : -140, 0])
  const right = useTransform(p, [0, 0.85], [reduce ? 0 : 140, 0])
  const o = useTransform(p, [0.1, 0.6], [0, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-cream px-6 pb-20 pt-24 md:px-12 md:pb-28 md:pt-32 lg:px-20">
      <div className="mx-auto max-w-[1320px] text-center">
        <Chapter n={chapter} title="See you inside" className="justify-center" />
        <div className="mt-8 font-display font-extrabold leading-[0.86] tracking-[-0.06em] text-ink">
          <motion.div style={{ x: left }} className="text-[clamp(60px,12vw,200px)]">{crowd.label}</motion.div>
          <motion.div style={{ x: right }} className="font-serif text-[clamp(40px,7vw,120px)] font-normal italic tracking-[-0.03em] text-brand">
            nights in {place.name}.
          </motion.div>
        </div>
        <motion.div style={{ opacity: o }} className="mt-12 flex flex-col items-center gap-5">
          <p className="max-w-[440px] font-sans text-lg text-ink-2">{crowd.promise}. Find one, request a spot, and the address arrives once you&apos;re in.</p>
          <StoreBadges />
        </motion.div>
      </div>
    </section>
  )
}
