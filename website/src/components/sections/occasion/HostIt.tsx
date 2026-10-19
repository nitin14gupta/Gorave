'use client'

import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { templateImage } from '@/constants'
import type { OccasionProps } from '@/lib/occasion'
import { Button } from '@/components/ui/Button'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 05, host one. The app's real invite design for the occasion,
 * tilting toward your cursor, beside the pitch and the real numbers.
 */
export function HostIt({ occasion: o, place }: OccasionProps) {
  const reduce = !!useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-14, 14]), { stiffness: 160, damping: 16 })
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 16 })
  const where = place.kind === 'india' ? 'at yours' : `in ${place.name}`
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1180px] items-center gap-16 lg:grid-cols-[1fr_1fr]">
        <div style={{ perspective: 1000 }} className="order-2 mx-auto w-full max-w-[340px] lg:order-1">
          <motion.div
            onPointerMove={e => {
              if (reduce || e.pointerType !== 'mouse') return
              const r = e.currentTarget.getBoundingClientRect()
              mx.set((e.clientX - r.left) / r.width - 0.5)
              my.set((e.clientY - r.top) / r.height - 0.5)
            }}
            onPointerLeave={() => { mx.set(0); my.set(0) }}
            style={{ rotateX: rx, rotateY: ry, rotate: -3, transformStyle: 'preserve-3d' }}
            className="relative aspect-[9/16] overflow-hidden rounded-[32px] bg-tile shadow-pop"
          >
            <Image src={templateImage(o.template)} alt={`A ${o.name} invite made in the Gorave app`} fill sizes="340px" className="object-cover" />
            <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 font-sans text-xs font-bold backdrop-blur" style={{ transform: 'translateZ(40px)' }}>Made in the app</span>
          </motion.div>
        </div>
        <div className="order-1 lg:order-2">
          <Chapter n="05" title="Host one" />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
            Your {o.night},
            <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> {where}.</span>
          </h2>
          <p className="mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">{o.hostLine}</p>
          <ul className="mt-7 flex flex-wrap gap-2">
            {['Free to list', '2 free nights a month', 'Tickets from ₹99', 'You keep 90%'].map(f => (
              <li key={f} className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-soft">{f}</li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button href="/host" size="lg">Host a night</Button>
            <Button href="/host/guides" kind="ghost" size="lg">Hosting guides</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
