'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'

// Velvet: vertical folds over a deep coral-to-oxblood gradient.
const VELVET =
  'repeating-linear-gradient(90deg, rgb(0 0 0 / 0.38) 0px, rgb(0 0 0 / 0) 22px, rgb(255 255 255 / 0.07) 38px, rgb(0 0 0 / 0) 54px, rgb(0 0 0 / 0.38) 76px),' +
  'linear-gradient(180deg, #7a0f24 0%, #b0182f 45%, #5a0a1a 100%)'

/**
 * Backstage, before doors. Two velvet curtains hold the title; scroll and
 * they draw apart to show the room you're about to run. The cursor is a
 * follow-spot on the velvet.
 */
export function HeroB({ crumbs }: { crumbs: Crumb[] }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const part = useSpring(useTransform(scrollYProgress, [0.02, 0.6], [0, 1]), { stiffness: 80, damping: 22 })
  const left = useTransform(part, [0, 1], ['0%', '-102%'])
  const right = useTransform(part, [0, 1], ['0%', '102%'])
  const skewL = useTransform(part, [0, 0.5, 1], [0, 4, 0])
  const skewR = useTransform(skewL, v => -v)
  const titleOpacity = useTransform(part, [0, 0.35], [1, 0])
  const titleScale = useTransform(part, [0, 0.35], [1, 0.9])
  const stageScale = useTransform(part, [0, 1], [1.18, 1])
  const stageOpacity = useTransform(part, [0.3, 0.8], [0, 1])

  const sx = useMotionValue(50)
  const sy = useMotionValue(40)
  const spot = useMotionTemplate`radial-gradient(circle 260px at ${sx}% ${sy}%, rgb(255 220 180 / 0.28), transparent 70%)`

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    sx.set(((e.clientX - r.left) / r.width) * 100)
    sy.set(((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <section ref={ref} className="relative h-[220vh] bg-noir text-noir-ink">
      <div onPointerMove={onMove} className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The stage behind the curtain */}
        <motion.div className="absolute inset-0" style={{ scale: stageScale }}>
          <Image src={PHOTOS.party2} alt="A house party in full swing" fill sizes="100vw" className="object-cover" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-noir/50" />
        </motion.div>

        <motion.div style={{ opacity: stageOpacity }} className="absolute inset-x-0 bottom-0 z-10 px-6 pb-14 md:px-20">
          <div className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-gold">Call sheet · you</div>
          <h2 className="mt-3 font-display text-[clamp(52px,8.5vw,140px)] font-extrabold leading-[0.85] tracking-[-0.06em]">
            Tonight,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">you run the show.</span>
          </h2>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <p className="max-w-[480px] font-sans text-lg leading-relaxed text-noir-ink-2">
              The list, the door, the mix, the money. Gorave runs the backstage so you can run the room. Free to list.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button href="/app" size="lg">Start hosting</Button>
              <Button href="#run-of-show" kind="ghost" dark size="lg">See the run of show</Button>
            </div>
          </div>
        </motion.div>

        {/* Curtains */}
        <motion.div aria-hidden className="absolute inset-y-0 left-0 z-20 w-1/2 origin-top-left shadow-[20px_0_60px_rgb(0_0_0/0.6)]" style={{ x: left, skewY: skewL, background: VELVET }} />
        <motion.div aria-hidden className="absolute inset-y-0 right-0 z-20 w-1/2 origin-top-right shadow-[-20px_0_60px_rgb(0_0_0/0.6)]" style={{ x: right, skewY: skewR, background: VELVET }} />
        <motion.div aria-hidden className="pointer-events-none absolute inset-0 z-20 mix-blend-screen" style={{ background: spot, opacity: titleOpacity }} />
        {/* valance */}
        <div aria-hidden className="absolute inset-x-0 top-0 z-30 h-16 bg-[linear-gradient(180deg,#3d0712,#7a0f24)] shadow-[0_10px_30px_rgb(0_0_0/0.5)] [mask-image:radial-gradient(40px_30px_at_40px_100%,transparent_98%,#000)] [mask-size:80px_100%]" />

        <div className="absolute inset-x-0 top-0 z-40 px-6 pt-24 md:px-20">
          <Breadcrumbs crumbs={crumbs} className="text-noir-ink-2 [&_[aria-current]]:text-noir-ink [&_a:hover]:text-noir-ink" />
        </div>

        <motion.div style={{ opacity: titleOpacity, scale: titleScale }} className="pointer-events-none absolute inset-0 z-30 grid place-items-center px-6 text-center">
          <div>
            <div className="font-sans text-xs font-bold uppercase tracking-[0.24em] text-white/70">Host on Gorave</div>
            <h1 className="mt-4 font-display text-[clamp(72px,15vw,240px)] font-extrabold leading-[0.8] tracking-[-0.07em] text-[#FFF1E6] [text-shadow:0_10px_40px_rgb(0_0_0/0.45)]">
              Backstage.<span className="sr-only"> Host a house party on Gorave.</span>
            </h1>
            <div className="mt-6 font-sans text-sm font-bold uppercase tracking-[0.2em] text-white/70">Scroll to open the curtain</div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
