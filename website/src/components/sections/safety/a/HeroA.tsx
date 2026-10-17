'use client'

import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'

const EASE = [0.2, 0.8, 0.2, 1] as const

// Labels that settle onto the ring once it has formed, angle in degrees from 12 o'clock.
const ORBIT = [
  { label: 'Verified 18+', a: -58 },
  { label: 'Request to join', a: 12 },
  { label: 'Private address', a: 64 },
  { label: 'QR at the door', a: 124 },
  { label: 'One-tap SOS', a: 196 },
  { label: 'Rated hosts', a: 262 },
]

/**
 * Calm, daylight opener. A shield draws itself in the middle of three rings,
 * a check lands, then the protections settle onto the outer ring one by one.
 * The rings lean gently towards the cursor (mouse only).
 */
export function HeroA({ crumbs }: { crumbs: Crumb[] }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 80, damping: 20 })
  const sy = useSpring(my, { stiffness: 80, damping: 20 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-10, 10])
  const rotateX = useTransform(sy, [-0.5, 0.5], [8, -8])
  const innerX = useTransform(sx, [-0.5, 0.5], [-14, 14])
  const innerY = useTransform(sy, [-0.5, 0.5], [-14, 14])

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section onPointerMove={onMove} className="relative overflow-hidden bg-paper px-6 pb-20 pt-28 md:px-20 md:pb-28">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 size-[720px] rounded-full bg-green/10 blur-3xl" />
      <div className="relative mx-auto max-w-[1280px]">
        <Breadcrumbs crumbs={crumbs} />

        <div className="mt-10 grid items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: EASE }}
              className="inline-flex items-center gap-2.5 rounded-full bg-green/12 px-3.5 py-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-[#00865f]"
            >
              <span className="size-2 rounded-full bg-green" />
              Safety on Gorave
            </motion.div>
            <h1 className="mt-6 font-display text-[clamp(56px,8.4vw,132px)] font-extrabold leading-[0.86] tracking-[-0.06em] text-ink">
              {['Your night,', 'protected'].map((line, i) => (
                <span key={line} className="block overflow-hidden pb-[0.06em]">
                  <motion.span className="block" initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE, delay: 0.1 + i * 0.1 }}>
                    {line}
                  </motion.span>
                </span>
              ))}
              <span className="block overflow-hidden pb-[0.1em]">
                <motion.span
                  className="block font-serif font-normal italic tracking-[-0.03em] text-brand"
                  initial={{ y: '105%' }}
                  animate={{ y: 0 }}
                  transition={{ duration: 1, ease: EASE, delay: 0.3 }}
                >
                  at every step.
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
              className="mt-7 max-w-[480px] font-sans text-xl leading-relaxed text-ink-2"
            >
              Going to a stranger&apos;s house party should feel exciting, not risky. Here&apos;s what Gorave does before you arrive, while you&apos;re there, and after you leave.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.6 }}
              className="mt-9 flex flex-wrap gap-2.5"
            >
              <Button href="#journey" size="lg">See how it works</Button>
              <Button href="/guidelines" kind="ghost" size="lg">Community guidelines</Button>
            </motion.div>
          </div>

          <div className="relative mx-auto aspect-square w-full max-w-[540px] [perspective:1200px]">
            <motion.div className="absolute inset-0" style={{ rotateX, rotateY }}>
              <svg viewBox="0 0 400 400" className="absolute inset-0 size-full overflow-visible" aria-hidden>
                <defs>
                  <linearGradient id="hero-a-brand" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#FF3864" />
                  </linearGradient>
                </defs>
                <g transform="rotate(-90 200 200)">
                  <motion.circle
                    cx={200} cy={200} r={178} fill="none" stroke="#171310" strokeOpacity={0.12} strokeWidth={1.5}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: EASE, delay: 0.2 }}
                  />
                  <motion.circle
                    cx={200} cy={200} r={140} fill="none" stroke="#00C48C" strokeOpacity={0.5} strokeWidth={2}
                    initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.4, ease: EASE, delay: 0.45 }}
                  />
                  <motion.circle
                    cx={200} cy={200} r={104} fill="#fff" stroke="url(#hero-a-brand)" strokeWidth={3}
                    initial={{ pathLength: 0, fillOpacity: 0 }} animate={{ pathLength: 1, fillOpacity: 1 }} transition={{ duration: 1.2, ease: EASE, delay: 0.7 }}
                  />
                </g>
                {/* dashed outer ring turns a quarter and settles */}
                <motion.g
                  style={{ transformOrigin: '200px 200px' }}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 2.2, ease: EASE, delay: 0.2 }}
                >
                  <circle cx={200} cy={200} r={194} fill="none" stroke="#171310" strokeOpacity={0.18} strokeWidth={1} strokeDasharray="2 9" />
                </motion.g>
              </svg>

              <motion.svg viewBox="0 0 400 400" className="absolute inset-0 size-full" style={{ x: innerX, y: innerY }} aria-hidden>
                <motion.path
                  d="M200 128 L258 150 V198 C258 236 234 262 200 276 C166 262 142 236 142 198 V150 Z"
                  fill="url(#hero-a-brand)" stroke="#171310" strokeWidth={0}
                  initial={{ pathLength: 0, fillOpacity: 0, scale: 0.8 }}
                  animate={{ pathLength: 1, fillOpacity: 1, scale: 1 }}
                  transition={{ duration: 1, ease: EASE, delay: 1.1 }}
                  style={{ transformOrigin: '200px 200px' }}
                />
                <motion.path
                  d="M174 202 L193 221 L229 183"
                  fill="none" stroke="#fff" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.5, ease: EASE, delay: 1.8 }}
                />
              </motion.svg>

              {ORBIT.map((o, i) => {
                const rad = (o.a * Math.PI) / 180
                const left = 50 + Math.sin(rad) * 44.5
                const top = 50 - Math.cos(rad) * 44.5
                return (
                  <motion.div
                    key={o.label}
                    className="absolute hidden -translate-x-1/2 -translate-y-1/2 sm:block"
                    style={{ left: `${left}%`, top: `${top}%` }}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6, ease: EASE, delay: 2 + i * 0.12 }}
                  >
                    <span className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-3 py-1.5 font-sans text-[12px] font-bold text-ink shadow-soft transition-transform duration-300 ease-out-expo hover:-translate-y-0.5 hover:scale-105 md:text-[13px]">
                      <svg viewBox="0 0 16 16" className="size-3.5" aria-hidden>
                        <circle cx={8} cy={8} r={8} fill="#00C48C" />
                        <path d="M4.5 8.2 L7 10.5 L11.5 5.8" fill="none" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      {o.label}
                    </span>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:hidden">
            {ORBIT.map(o => (
              <span key={o.label} className="rounded-full bg-white px-3 py-1.5 font-sans text-xs font-bold text-ink shadow-soft">✓ {o.label}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
