'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

/**
 * Chapter 05, for hosts. A pull quote set large in serif italic beside a
 * living-room photo that opens from a narrow slit as it scrolls into view,
 * with the picture drifting slower than the page.
 */
export function HostCta({ crowd, place, chapter = '05' }: { crowd: CrowdContent; place: { name: string }; chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const open = useTransform(p, [0.08, 0.42], [reduce ? 0 : 30, 0])
  const clip = useMotionTemplate`inset(0% ${open}% 0% ${open}% round 32px)`
  const imgY = useTransform(p, [0, 1], reduce ? ['0%', '0%'] : ['-8%', '8%'])
  const quoteY = useTransform(p, [0.1, 0.5], [reduce ? 0 : 50, 0])
  const quoteO = useTransform(p, [0.1, 0.4], [0, 1])

  return (
    <section ref={ref} className="overflow-hidden bg-paper px-6 py-24 md:px-12 md:py-36 lg:px-20">
      <div className="mx-auto grid max-w-[1320px] items-center gap-12 md:grid-cols-[1.1fr_1fr] md:gap-16 lg:gap-24">
        <motion.div style={{ y: quoteY, opacity: quoteO }}>
          <Chapter n={chapter} title="For hosts" />
          <blockquote className="mt-6 font-serif text-[clamp(36px,4.4vw,68px)] italic leading-[1.02] tracking-[-0.02em] text-ink">
            <span className="text-brand">“</span>{crowd.hostLine}<span className="text-brand">”</span>
          </blockquote>
          <p className="mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">
            Hosting {crowd.nights} in {place.name} takes a few minutes in the app. You set the crowd, the app keeps it.
          </p>
          <div className="mt-9 flex flex-wrap gap-2.5">
            <Button href="/host" size="lg">Start hosting</Button>
            <Button href="/safety" kind="ghost" size="lg">How we keep it safe</Button>
          </div>
        </motion.div>
        <motion.div style={{ clipPath: clip }} className="relative aspect-[4/5] overflow-hidden rounded-[32px]">
          <motion.div style={{ y: imgY }} className="absolute -inset-y-[9%] inset-x-0">
            <Image src={AREA_SCENES.livingroom} alt={`A living room set up for ${crowd.nights}`} fill sizes="(max-width: 768px) 100vw, 45vw" className="object-cover" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
