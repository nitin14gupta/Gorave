'use client'

import Link from 'next/link'
import { useEffect, useRef, type ReactNode } from 'react'
import { animate, motion, useMotionValue, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { SampleEvent } from '@/constants'
import type { SiteStats } from '@/lib/pagesData'
import { useLiveEvents } from '@/components/ui/LiveEvents'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { StoreBadges } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { DiscoverScreen } from '@/components/ui/AppScreens'
import { ScanCard } from '../ScanCard'
import { CRUMBS, EASE, SECONDARY, statPieces } from '../data'
import { MiniCard } from './MiniCard'

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/**
 * The cover. A pile of real event cards deals itself out into a fan on load
 * (hover one and it lifts). Scroll and the whole fan gathers, shrinks and
 * drops into a phone, which wakes up on the events list: that's the app.
 * Desktop pins for it; phones get the fan without the pin.
 */
export function Hero({ stats }: { stats: SiteStats }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const all = useLiveEvents()
  const cards = all.slice(0, 5)
  const spread = useMotionValue(reduce ? 1 : 0)

  useEffect(() => {
    if (reduce) return
    const c = animate(spread, 1, { duration: 1.5, ease: EASE, delay: 0.35 })
    return () => c.stop()
  }, [spread, reduce])

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const phoneO = useTransform(p, [0.3, 0.6], [0, 1])
  const phoneS = useTransform(p, [0.3, 0.7], [0.82, 1])
  const tagsO = useTransform(p, [0.66, 0.84], [0, 1])
  const cueO = useTransform(p, [0, 0.1], [1, 0])

  const pieces = statPieces(stats)
  const up = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, ease: EASE, delay },
  })
  const word = (delay: number) => ({
    initial: reduce ? false : { y: '110%', rotate: 6 },
    animate: { y: '0%', rotate: 0 },
    transition: { duration: 0.9, ease: EASE, delay },
  })

  return (
    <section ref={ref} className="relative bg-cream md:h-[240vh]">
      <div className="relative md:sticky md:top-0 md:h-screen md:overflow-hidden">
        <div className="mx-auto grid h-full max-w-[1360px] items-center gap-6 px-6 pb-16 pt-28 md:grid-cols-[1fr_1.05fr] md:px-12 md:pb-0 md:pt-16 lg:px-20">
          {/* Copy */}
          <div className="relative z-20">
            <motion.div {...up(0)}><Breadcrumbs crumbs={CRUMBS} /></motion.div>
            <h1 className="mt-5 font-display text-[clamp(64px,min(8.6vw,14vh),140px)] font-extrabold leading-[0.84] tracking-[-0.065em] text-ink">
              <span className="inline-block overflow-hidden pb-[0.05em] pr-[0.12em]"><motion.span {...word(0.05)} className="inline-block origin-bottom-left">Tap,</motion.span></span>
              <span className="inline-block overflow-hidden pb-[0.05em]"><motion.span {...word(0.16)} className="inline-block origin-bottom-left">tap,</motion.span></span>
              <br />
              <span className="inline-block overflow-hidden pb-[0.04em] pr-[0.05em]">
                <motion.span {...word(0.3)} className="inline-block origin-bottom-left font-serif font-normal italic tracking-[-0.035em] text-brand">party.</motion.span>
              </span>
            </h1>
            <motion.p {...up(0.45)} className="mt-4 max-w-[470px] font-sans text-[18px] leading-relaxed text-ink-2">
              Real house parties, rooftops, game nights and dinners near you. Tap to request or book, tap again at the door. iPhone and Android.
            </motion.p>
            <motion.div {...up(0.55)} className="mt-6 flex flex-wrap items-center gap-4">
              <StoreBadges height={52} />
              <ScanCard tilt={2} className="!p-2.5 !pr-4" />
            </motion.div>
            <motion.div {...up(0.65)} className="mt-5 flex flex-wrap gap-2">
              {SECONDARY.map(s => (
                <Link key={s.href} href={s.href} className="rounded-full bg-white/70 px-4 py-2 font-sans text-[13px] font-bold text-ink-2 transition-colors hover:bg-white hover:text-ink">
                  {s.label} →
                </Link>
              ))}
            </motion.div>
            {pieces.length > 0 && (
              <motion.div {...up(0.75)} className="mt-5 flex flex-wrap gap-x-7 gap-y-2 font-sans text-sm text-ink-3">
                {pieces.map(s => (
                  <span key={s.small}><b className="font-display text-xl font-extrabold tracking-[-0.03em] text-ink">{s.big}</b> {s.small}</span>
                ))}
              </motion.div>
            )}
          </div>

          {/* Desktop stage: fan → phone */}
          <div className="relative hidden h-full md:block">
            <div className="absolute left-[46%] top-1/2">
              <motion.div style={{ opacity: phoneO, scale: phoneS }} className="absolute -translate-x-1/2 -translate-y-1/2">
                <Phone width={290}><DiscoverScreen /></Phone>
              </motion.div>
              {cards.map((e, i) => (
                <FanCard key={e.id} event={e} i={i} n={cards.length} spread={spread} p={p} />
              ))}
              <motion.div style={{ opacity: tagsO }} className="pointer-events-none absolute inset-0">
                <Tag className="-left-[330px] -top-[170px]">Closest first</Tag>
                <Tag className="left-[175px] -top-[60px]">Free · Tonight · Weekend</Tag>
                <Tag className="-left-[380px] top-[150px]">Request or book in a tap</Tag>
              </motion.div>
            </div>
            <motion.div style={{ opacity: cueO }} className="absolute bottom-8 left-1/2 flex -translate-x-1/2 items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">
              <span className="h-px w-8 bg-ink/25" /> Scroll to open the app <span className="h-px w-8 bg-ink/25" />
            </motion.div>
          </div>

          {/* Phones: just the fan */}
          <div className="relative mt-6 h-[300px] md:hidden">
            <div className="absolute left-1/2 top-[40px]">
              {cards.slice(0, 3).map((e, i) => (
                <motion.div
                  key={e.id}
                  initial={reduce ? false : { x: '-50%', rotate: 0 }}
                  animate={{ x: `calc(-50% + ${(i - 1) * 86}px)`, rotate: (i - 1) * 9, y: i === 1 ? -14 : 0 }}
                  transition={{ duration: 1.2, ease: EASE, delay: 0.4 }}
                  className="absolute left-0 top-0"
                  style={{ zIndex: i === 1 ? 3 : 1 }}
                >
                  <MiniCard event={e} width={180} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Tag({ className, children }: { className: string; children: ReactNode }) {
  return <div className={`absolute whitespace-nowrap rounded-full bg-white px-4 py-2.5 font-sans text-sm font-bold text-ink shadow-pop ${className}`}>{children}</div>
}

function FanCard({ event, i, n, spread, p }: { event: SampleEvent; i: number; n: number; spread: MotionValue<number>; p: MotionValue<number> }) {
  const t = i - (n - 1) / 2
  const pose = (s: number, v: number) => {
    const q = clamp((v - 0.06) / 0.5)
    const e = q * q * (3 - 2 * q)
    const fx = mix(t * 5, t * 104, s)
    const fy = mix(0, t * t * 18 - 10, s)
    const fr = mix(t * 2, t * 10, s)
    return { x: Math.round(mix(fx, 0, e)), y: Math.round(mix(fy, -70 + t * 26, e)), r: Math.round(mix(fr, 0, e) * 10) / 10, sc: Math.round(mix(1, 0.52, e) * 1000) / 1000 }
  }
  const x = useTransform([spread, p] as MotionValue<number>[], ([s, v]: number[]) => pose(s, v).x)
  const y = useTransform([spread, p] as MotionValue<number>[], ([s, v]: number[]) => pose(s, v).y)
  const rotate = useTransform([spread, p] as MotionValue<number>[], ([s, v]: number[]) => pose(s, v).r)
  const scale = useTransform([spread, p] as MotionValue<number>[], ([s, v]: number[]) => pose(s, v).sc)
  const opacity = useTransform(p, [0.5, 0.64], [1, 0])
  return (
    <motion.div style={{ x, y, rotate, scale, opacity, zIndex: 10 + n - Math.round(Math.abs(t) * 2) }} className="absolute left-0 top-0">
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div className="transition-transform duration-500 ease-out-expo hover:-translate-y-6 hover:scale-[1.04]">
          <MiniCard event={event} width={230} />
        </div>
      </div>
    </motion.div>
  )
}
