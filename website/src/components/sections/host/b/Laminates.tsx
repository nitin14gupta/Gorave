'use client'

import Image from 'next/image'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { BRAND } from '@/constants'
import { BADGE_TIERS } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'

const STRAPS = ['#FF3864', '#FF6B35', '#FFB830', '#F5F0EB']

/**
 * Chapter 06, the laminates. Host badges as all-access passes on lanyards.
 * They drop in on a spring as the section arrives; brush one with the
 * cursor and it swings from its clip.
 */
export function Laminates() {
  return (
    <section className="relative overflow-hidden bg-noir pb-24 text-noir-ink md:pb-32">
      <div className="mx-auto max-w-[1280px] px-6 pt-24 md:px-20 md:pt-28">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <Chapter n="06" title="The laminate" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Earn your<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">access all areas.</span>
            </h2>
          </div>
          <p className="max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Guests review every event, and hosts earn badges as they go: Rising at 2+ events, Established at 10+, Elite at 25+, Legend at 75+.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-4 grid max-w-[1280px] grid-cols-2 gap-x-4 gap-y-6 px-6 md:grid-cols-4 md:px-20">
        {BADGE_TIERS.map((b, i) => (
          <Pass key={b.key} tier={b} i={i} />
        ))}
      </div>
    </section>
  )
}

function Pass({ tier, i }: { tier: (typeof BADGE_TIERS)[number]; i: number }) {
  const push = useMotionValue(0)
  const swing = useSpring(push, { stiffness: 60, damping: 4, mass: 0.8 })
  const rotate = useTransform(swing, v => Math.max(-28, Math.min(28, v)))

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    // Velocity-ish nudge: how far off-centre the cursor brushes the pass.
    const r = e.currentTarget.getBoundingClientRect()
    const dx = (e.clientX - (r.left + r.width / 2)) / r.width
    push.set(-dx * 22)
  }

  return (
    <motion.div initial="up" whileInView="down" viewport={{ once: true, margin: '-40px' }} className="flex justify-center">
      <motion.div
        variants={{ up: { y: -420 }, down: { y: 0 } }}
        transition={{ type: 'spring', stiffness: 90, damping: 9, delay: i * 0.12 }}
        style={{ rotate, transformOrigin: '50% 0%' }} className="flex flex-col items-center" onPointerMove={onMove} onPointerLeave={() => push.set(0)}>
        {/* lanyard */}
        <div className="relative h-[120px] w-[46px] md:h-[160px]">
          <span className="absolute left-0 top-0 h-full w-3 origin-top skew-x-[10deg] rounded-b-sm" style={{ background: STRAPS[i] }} />
          <span className="absolute right-0 top-0 h-full w-3 origin-top -skew-x-[10deg] rounded-b-sm" style={{ background: STRAPS[i] }} />
        </div>
        <div className="-mt-1 h-5 w-9 rounded-md bg-[linear-gradient(180deg,#d8d2cb,#8f877f)]" />
        <div className="relative -mt-1 w-[min(42vw,220px)] overflow-hidden rounded-[22px] bg-[linear-gradient(160deg,#2a2a2a,#151515)] p-4 pt-6 text-center shadow-[0_30px_60px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)]">
          <span aria-hidden className="absolute left-1/2 top-2 h-1.5 w-12 -translate-x-1/2 rounded-full bg-black" />
          <div aria-hidden className="pointer-events-none absolute -inset-x-10 -top-10 h-24 rotate-12 bg-gradient-to-b from-white/10 to-transparent" />
          <div className="font-sans text-[10px] font-bold uppercase tracking-[0.22em] text-noir-ink-2">Host · all access</div>
          <Image src={BRAND.badges[tier.key]} alt={`${tier.name} host badge`} width={140} height={140} className="mx-auto mt-2 size-[clamp(88px,22vw,140px)] object-contain" />
          <div className="mt-2 font-display text-2xl font-extrabold tracking-[-0.03em]">{tier.name}</div>
          <div className="font-serif text-lg italic text-orange">{tier.at}+ events</div>
        </div>
      </motion.div>
    </motion.div>
  )
}
