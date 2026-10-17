'use client'

import Link from 'next/link'
import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'

/**
 * Chapter 06, deal yourself in. The big round "Host a night" chip is
 * magnetic: it leans toward the cursor anywhere in the section, and a warm
 * glow follows underneath. On touch it simply sits there, waiting.
 */
export function HostCtaB({ firstGuide }: { firstGuide: string }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const gx = useMotionValue(50)
  const gy = useMotionValue(50)
  const x = useSpring(mx, { stiffness: 150, damping: 15, mass: 0.6 })
  const y = useSpring(my, { stiffness: 150, damping: 15, mass: 0.6 })
  const sgx = useSpring(gx, { stiffness: 80, damping: 20 })
  const sgy = useSpring(gy, { stiffness: 80, damping: 20 })
  const glow = useMotionTemplate`radial-gradient(circle 420px at ${sgx}% ${sgy}%, rgb(255 56 100 / 0.28), transparent 70%)`
  const label = useTransform(x, v => v * 0.35)
  const labelY = useTransform(y, v => v * 0.35)

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    gx.set(((e.clientX - r.left) / r.width) * 100)
    gy.set(((e.clientY - r.top) / r.height) * 100)
    const chip = e.currentTarget.querySelector<HTMLElement>('[data-chip]')?.getBoundingClientRect()
    if (!chip) return
    const dx = e.clientX - (chip.left + chip.width / 2)
    const dy = e.clientY - (chip.top + chip.height / 2)
    const pull = Math.max(0, 1 - Math.hypot(dx, dy) / 600)
    mx.set(dx * 0.35 * pull)
    my.set(dy * 0.35 * pull)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  return (
    <section onPointerMove={onMove} onPointerLeave={onLeave} className="relative overflow-hidden bg-noir px-6 py-28 text-noir-ink md:px-20 md:py-40">
      <motion.div aria-hidden style={{ backgroundImage: glow }} className="pointer-events-none absolute inset-0" />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1.3fr_1fr]">
        <div>
          <Chapter n="06" title="Deal yourself in" dark />
          <h2 className="mt-4 font-display text-[clamp(52px,7.4vw,124px)] font-extrabold leading-[0.86] tracking-[-0.065em]">
            You&apos;ve read<br />the plays.<br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Run one.</span>
          </h2>
          <p className="mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Listing is free. Run up to two free-entry events a month, or sell tickets from ₹99 and keep 90%. Payouts go to UPI or your bank.
          </p>
          <div className="mt-8 flex flex-wrap gap-2.5">
            <Button href="/host" size="lg">Start hosting</Button>
            <Button href={firstGuide} kind="ghost" dark size="lg">Start with play 01</Button>
          </div>
          <div className="mt-8"><StoreBadges height={44} /></div>
        </div>

        <div className="flex justify-center lg:justify-end">
          <div data-chip><motion.div style={{ x, y }} className="relative">
            <Link
              href="/host"
              className="relative grid size-[220px] place-items-center rounded-full bg-brand text-center shadow-[0_30px_80px_-20px_rgb(255_56_100/0.7)] transition-transform duration-500 ease-out-expo hover:scale-105 md:size-[280px]"
            >
              <motion.span style={{ x: label, y: labelY }} className="font-display text-[34px] font-extrabold leading-[0.9] tracking-[-0.04em] text-white md:text-[42px]">
                Host<br />a night →
              </motion.span>
            </Link>
          </motion.div></div>
        </div>
      </div>
    </section>
  )
}
