'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useMotionValue, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { templateImage } from '@/constants'
import type { Crumb } from '@/lib/seo'
import { HOST_TEMPLATES } from '@/lib/host'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { StoreBadges } from '@/components/ui/atoms'

const FAN = HOST_TEMPLATES.slice(0, 5)

/**
 * Opening shot — a closed deck of the app's invite templates. Scroll and the
 * deck fans open like a hand of cards; the cursor tilts the whole hand.
 */
export function HeroA({ crumbs }: { crumbs: Crumb[] }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const open = useSpring(useTransform(scrollYProgress, [0, 0.5], [0.25, 1]), { stiffness: 90, damping: 20 })
  const mx = useMotionValue(0)
  const tiltX = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 120, damping: 18 })
  const lift = useTransform(scrollYProgress, [0, 1], [0, -120])

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
  }

  return (
    <section ref={ref} onPointerMove={onMove} onPointerLeave={() => mx.set(0)} className="relative overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-20 md:pb-28">
      <div className="mx-auto max-w-[1280px]">
        <Breadcrumbs crumbs={crumbs} />
        <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.15fr_1fr]">
          <div>
            <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">For hosts · free to list</div>
            <h1 className="mt-4 font-display text-[clamp(56px,8.4vw,136px)] font-extrabold leading-[0.86] tracking-[-0.06em]">
              Your first party,
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">start to finish.</span>
            </h1>
            <p className="mt-7 max-w-[500px] font-sans text-xl leading-relaxed text-ink-2">
              Make the event in a few minutes, pick who comes, scan them in at the door. Two free-entry events a month — or sell tickets from ₹99 and keep 90%.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Button href="#build" size="lg">See how it works</Button>
              <StoreBadges height={46} />
            </div>
          </div>

          <motion.div style={{ y: lift }} className="relative mx-auto h-[380px] w-full max-w-[460px] md:h-[520px]">
            <motion.div style={{ rotate: tiltX }} className="absolute inset-0 origin-bottom">
              {FAN.map((t, i) => (
                <FanCard key={t} name={t} i={i} n={FAN.length} open={open} />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function FanCard({ name, i, n, open }: { name: string; i: number; n: number; open: MotionValue<number> }) {
  const k = i - (n - 1) / 2
  const rotate = useTransform(open, v => k * 13 * v)
  const x = useTransform(open, v => k * 46 * v)
  const y = useTransform(open, v => Math.abs(k) * 18 * v)
  return (
    <motion.div
      style={{ rotate, x, y, zIndex: n - Math.abs(Math.round(k)) }}
      className="absolute bottom-6 left-1/2 -ml-[105px] h-[290px] w-[210px] origin-[50%_120%] md:-ml-[125px] md:h-[350px] md:w-[250px]"
    >
      <motion.div
        whileHover={{ y: -36, scale: 1.04 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        className="relative size-full overflow-hidden rounded-[22px] shadow-pop"
      >
        <Image src={templateImage(name)} alt={`${name} invite template`} fill sizes="260px" className="object-cover" priority={i === 2} draggable={false} />
      </motion.div>
    </motion.div>
  )
}
