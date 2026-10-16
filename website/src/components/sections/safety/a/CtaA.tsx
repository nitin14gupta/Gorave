'use client'

import Link from 'next/link'
import { motion, useMotionValue, useSpring } from 'motion/react'
import { SAFETY_LINKS } from '@/lib/safety'
import { StoreBadges } from '@/components/ui/atoms'

const RINGS = [0, 1, 2, 3]

/**
 * Chapter 07 — go out. Calm rings open out once around the call to action
 * (the shield from the hero, let loose); the big button leans towards the cursor.
 */
export function CtaA({ chapter = '07' }: { chapter?: string }) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const sx = useSpring(x, { stiffness: 200, damping: 18 })
  const sy = useSpring(y, { stiffness: 200, damping: 18 })

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left - r.width / 2) * 0.25)
    y.set((e.clientY - r.top - r.height / 2) * 0.35)
  }
  function onLeave() {
    x.set(0)
    y.set(0)
  }

  return (
    <section className="relative flex min-h-[820px] items-center justify-center overflow-hidden bg-cream px-6 py-28">
      <div aria-hidden className="pointer-events-none absolute left-1/2 top-1/2">
        <span className="absolute left-0 top-0 size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-paper" />
        {RINGS.map(i => {
          const size = 620 + i * 200
          return (
            <motion.span
              key={i}
              className="absolute rounded-full border-2 border-green/30"
              style={{ width: size, height: size, left: -size / 2, top: -size / 2 }}
              initial={{ scale: 0.6, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 - i * 0.2 }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: [0.2, 0.8, 0.2, 1], delay: i * 0.15 }}
            />
          )
        })}
      </div>

      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="mb-5 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
          <span className="font-serif text-xl normal-case italic tracking-normal text-orange">{chapter}</span> · Go out
        </div>
        <h2 className="max-w-[760px] font-display text-[clamp(48px,6.4vw,96px)] font-extrabold leading-[0.9] tracking-[-0.06em]">
          Say yes to<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">the invite.</span>
        </h2>
        <p className="mt-5 max-w-[440px] font-sans text-lg text-ink-2">Add your SOS contacts, check the host, and go meet some new people.</p>
        <motion.div style={{ x: sx, y: sy }} className="mt-9">
          <Link
            href="/app"
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            className="inline-block rounded-full bg-ink px-12 py-6 font-display text-[clamp(28px,3.4vw,44px)] font-extrabold uppercase leading-none tracking-[-0.04em] text-cream shadow-pop transition-colors duration-300 hover:bg-[#00865f]"
          >
            Get the app
          </Link>
        </motion.div>
        <div className="mt-7"><StoreBadges /></div>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-sm font-bold text-ink-2">
          <Link href={SAFETY_LINKS.guidelines} className="underline decoration-ink/20 underline-offset-4 hover:text-ink">Community guidelines</Link>
          <Link href={SAFETY_LINKS.refunds} className="underline decoration-ink/20 underline-offset-4 hover:text-ink">Refund policy</Link>
        </div>
      </div>
    </section>
  )
}
