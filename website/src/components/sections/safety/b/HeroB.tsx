'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'

const EASE = [0.2, 0.8, 0.2, 1] as const

// A crowd of strangers scattered across the dark, seeded so server and client agree.
const COUNT = 140
const IN = 26 // the ones who make it onto the guest list
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280
  return x - Math.floor(x)
}
const DOTS = Array.from({ length: COUNT }, (_, i) => {
  const guest = i % Math.floor(COUNT / IN) === 0 && Math.floor(i / Math.floor(COUNT / IN)) < IN
  const k = Math.floor(i / Math.floor(COUNT / IN))
  const a = (k / IN) * Math.PI * 2 - Math.PI / 2
  return {
    x: 4 + rand(i + 1) * 92,
    y: 6 + rand(i + 101) * 88,
    r: 0.35 + rand(i + 211) * 0.45,
    guest,
    // guests gather onto a ring on the right
    gx: 72 + Math.cos(a) * 16,
    gy: 50 + Math.sin(a) * 28,
  }
})

/**
 * Noir opener. A crowd of strangers is scattered across the dark; after a
 * beat, most of them dim and a few drift into a lit circle — the guest list.
 * The whole field drifts a little with the cursor.
 */
export function HeroB({ crumbs }: { crumbs: Crumb[] }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(useTransform(mx, [-0.5, 0.5], [18, -18]), { stiffness: 60, damping: 20 })
  const y = useSpring(useTransform(my, [-0.5, 0.5], [12, -12]), { stiffness: 60, damping: 20 })

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section onPointerMove={onMove} className="relative min-h-[100svh] overflow-hidden bg-noir text-noir-ink">
      <motion.svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 size-full" style={{ x, y }} aria-hidden>
        <motion.ellipse
          cx={72} cy={50} rx={20} ry={34} fill="none" stroke="#00C48C" strokeWidth={0.12} vectorEffect="non-scaling-stroke"
          initial={{ opacity: 0, pathLength: 0 }} animate={{ opacity: 0.6, pathLength: 1 }} transition={{ duration: 1.6, ease: EASE, delay: 1.8 }}
        />
        {DOTS.map((d, i) => (
          <motion.ellipse
            key={i}
            rx={d.r * 0.55} ry={d.r}
            initial={{ cx: d.x, cy: d.y, opacity: 0 }}
            animate={d.guest
              ? { cx: [d.x, d.x, d.gx], cy: [d.y, d.y, d.gy], opacity: [0, 0.7, 1], fill: ['#F5F0EB', '#F5F0EB', '#00C48C'] }
              : { cx: d.x, cy: d.y, opacity: [0, 0.7, 0.14], fill: '#F5F0EB' }}
            transition={{ duration: 2.6, times: [0, 0.35, 1], ease: EASE, delay: rand(i + 7) * 0.5 }}
          />
        ))}
      </motion.svg>
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(60%_60%_at_25%_70%,rgb(17_17_17/0.95),transparent)]" />

      <div className="relative z-10 flex min-h-[100svh] flex-col px-6 pb-14 pt-28 md:px-20">
        <Breadcrumbs crumbs={crumbs} className="text-noir-ink-2 [&_[aria-current]]:text-noir-ink [&_a:hover]:text-noir-ink" />

        <div className="mt-auto max-w-[900px]">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-2.5 font-sans text-[13px] font-bold uppercase tracking-[0.18em] text-noir-ink-2"
          >
            <span className="inline-block size-2 rounded-full bg-green" />
            Safety on Gorave
          </motion.div>
          <h1 className="mt-5 font-display text-[clamp(60px,10vw,168px)] font-extrabold leading-[0.84] tracking-[-0.065em]">
            {['Not everyone', 'gets the'].map((l, i) => (
              <span key={l} className="block overflow-hidden pb-[0.05em]">
                <motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.2 + i * 0.12 }}>{l}</motion.span>
              </span>
            ))}
            <span className="block overflow-hidden pb-[0.1em]">
              <motion.span
                className="block font-serif font-normal italic tracking-[-0.03em] text-brand"
                initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1.1, ease: EASE, delay: 0.44 }}
              >
                address.
              </motion.span>
            </span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.8 }}
            className="mt-9 flex flex-wrap items-end justify-between gap-8"
          >
            <p className="max-w-[480px] font-sans text-xl leading-relaxed text-noir-ink-2">
              Six layers of trust sit between a stranger on the internet and your front door. Scroll through them, one at a time.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <Button href="#layers" size="lg">See the layers</Button>
              <Button href="/guidelines" kind="ghost" dark size="lg">Guidelines</Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
