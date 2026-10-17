'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { TicketScreen } from '@/components/ui/AppScreens'
import { ScanCard } from '../ScanCard'
import { SECONDARY } from '../data'

/**
 * Chapter 05, the door. The two halves of the line slide together as you
 * arrive, a phone with your ticket rises up between them, then the badges.
 */
export function FinalCta() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end end'] })
  const left = useTransform(p, [0, 0.8], [reduce ? 0 : -180, 0])
  const right = useTransform(p, [0, 0.8], [reduce ? 0 : 180, 0])
  const phoneY = useTransform(p, [0.2, 0.95], [reduce ? 0 : 220, 0])
  const phoneR = useTransform(p, [0.2, 0.95], [reduce ? 0 : 8, -4])

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream px-6 pb-24 pt-24 md:px-12 md:pt-32 lg:px-20">
      <div className="mx-auto max-w-[1320px] text-center">
        <Chapter n="07" title="See you inside" className="justify-center" />
        <div className="mt-8 font-display font-extrabold leading-[0.84] tracking-[-0.065em] text-ink">
          <motion.div style={{ x: left }} className="text-[clamp(64px,13vw,220px)]">See you</motion.div>
          <motion.div style={{ x: right }} className="font-serif text-[clamp(56px,11vw,190px)] font-normal italic tracking-[-0.035em] text-brand">Saturday.</motion.div>
        </div>

        <div className="relative mt-12 grid items-center gap-10 lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex flex-col items-center gap-4 lg:items-end lg:text-right">
            <p className="max-w-[340px] font-sans text-lg leading-relaxed text-ink-2">Get the app, find a night near you, and walk in with your QR.</p>
            <StoreBadges height={54} />
          </div>
          <motion.div style={{ y: phoneY, rotate: phoneR }} className="mx-auto">
            <Phone width={250}><TicketScreen /></Phone>
          </motion.div>
          <div className="flex flex-col items-center gap-5 lg:items-start">
            <ScanCard tilt={2} />
            <div className="flex flex-col items-center gap-2 font-sans text-sm font-bold lg:items-start">
              {SECONDARY.map(s => (
                <Link key={s.href} href={s.href} className="group inline-flex items-center gap-1.5 text-ink-2 transition-colors hover:text-ink">
                  <span className="underline decoration-ink/20 underline-offset-4 group-hover:decoration-ink">{s.label}</span>
                  <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
