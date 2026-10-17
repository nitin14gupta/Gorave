'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS, type SampleEvent } from '@/constants'
import type { SiteStats } from '@/lib/pagesData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { EventDetailScreen } from '@/components/ui/AppScreens'
import { ScanCard } from '../ScanCard'
import { CRUMBS, EASE, SECONDARY, statPieces } from '../data'

/**
 * The cover. Big editorial promise on the left, the store badges right under
 * it; on the right a phone that tilts toward your cursor in 3D while little
 * app moments float around it at different depths. Scroll and it sinks back.
 */
export function Hero({ events, stats }: { events: SampleEvent[]; stats: SiteStats }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 120, damping: 18 })
  const sy = useSpring(my, { stiffness: 120, damping: 18 })
  const rotY = useTransform(sx, [-0.5, 0.5], [-16, 16])
  const rotX = useTransform(sy, [-0.5, 0.5], [12, -12])

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const sink = useTransform(p, [0, 1], [0, reduce ? 0 : 160])
  const fade = useTransform(p, [0.6, 1], [1, 0.3])

  const onMove = (e: React.PointerEvent) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  const onLeave = () => {
    mx.set(0)
    my.set(0)
  }

  const pieces = statPieces(stats)
  const behind = [events[1], events[2]].filter(Boolean)
  const rise = (delay: number) => ({
    initial: reduce ? false : { y: '108%' },
    animate: { y: '0%' },
    transition: { duration: 1.05, ease: EASE, delay },
  })
  const up = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.85, ease: EASE, delay },
  })

  return (
    <section ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="relative overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-12 md:pb-28 md:pt-32 lg:px-20">
      {/* soft brand glow behind the phone */}
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 hidden size-[760px] rounded-full opacity-60 blur-3xl lg:block" style={{ background: 'radial-gradient(closest-side, rgb(255 107 53 / 0.35), rgb(255 56 100 / 0.12) 55%, transparent)' }} />

      <div className="relative mx-auto grid max-w-[1320px] items-center gap-14 lg:grid-cols-[1.12fr_1fr]">
        <div>
          <motion.div {...up(0)} className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Breadcrumbs crumbs={CRUMBS} />
            <Chapter n="00" title="iPhone and Android" className="hidden sm:flex" />
          </motion.div>

          <h1 className="mt-8 font-display font-extrabold leading-[0.88] tracking-[-0.06em] text-ink">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span {...rise(0.05)} className="block text-[clamp(56px,8.4vw,132px)]">Your Saturday,</motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.1em]">
              <motion.span {...rise(0.16)} className="block font-serif text-[clamp(52px,7.8vw,124px)] font-normal italic tracking-[-0.035em] text-brand">in one app.</motion.span>
            </span>
          </h1>

          <motion.p {...up(0.35)} className="mt-6 max-w-[540px] font-sans text-[19px] leading-relaxed text-ink-2 md:text-xl">
            House parties, rooftops, game nights and dinners hosted by real people near you. Find one, request or book in a tap, and walk in with a QR ticket.
          </motion.p>

          <motion.div {...up(0.48)} className="mt-9 flex flex-wrap items-center gap-5">
            <StoreBadges height={54} />
            <ScanCard tilt={-2} />
          </motion.div>

          <motion.div {...up(0.6)} className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2 font-sans text-sm font-bold">
            {SECONDARY.map(s => (
              <Link key={s.href} href={s.href} className="group inline-flex items-center gap-1.5 text-ink-2 transition-colors hover:text-ink">
                <span className="underline decoration-ink/20 underline-offset-4 group-hover:decoration-ink">{s.label}</span>
                <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
              </Link>
            ))}
          </motion.div>

          {pieces.length > 0 && (
            <motion.div {...up(0.72)} className="mt-10 flex flex-wrap gap-x-9 gap-y-4 border-t border-ink/12 pt-6">
              {pieces.map(s => (
                <div key={s.small}>
                  <div className="font-display text-[34px] font-extrabold leading-none tracking-[-0.04em] text-ink">{s.big}</div>
                  <div className="mt-1 font-sans text-[13px] font-bold text-ink-3">{s.small}</div>
                </div>
              ))}
            </motion.div>
          )}
        </div>

        {/* The phone */}
        <motion.div style={{ y: sink, opacity: fade }} className="relative mx-auto h-[600px] w-full max-w-[520px] md:h-[720px]">
          {behind.map((e, i) => (
            <motion.div
              key={e.id}
              initial={reduce ? false : { opacity: 0, rotate: 0, x: 0 }}
              animate={{ opacity: 1, rotate: i ? 9 : -10, x: 0 }}
              transition={{ duration: 1.1, ease: EASE, delay: 0.55 + i * 0.1 }}
              className={i ? 'absolute right-0 top-[52%] hidden md:block' : 'absolute left-0 top-[10%] hidden md:block'}
            >
              <Depth mx={sx} my={sy} depth={i ? 26 : -22}>
                <div className="w-[190px] overflow-hidden rounded-[22px] bg-white p-2 shadow-pop">
                  <div className="relative h-[150px] overflow-hidden rounded-[16px]">
                    <Image src={e.image ?? PHOTOS[e.photo]} alt="" fill sizes="380px" className="object-cover" />
                  </div>
                  <div className="px-1.5 pb-1 pt-2.5">
                    <div className="line-clamp-1 font-display text-[15px] font-extrabold tracking-[-0.02em]">{e.title}</div>
                    <div className="font-sans text-[11px] text-ink-3">{e.area} · {e.price}</div>
                  </div>
                </div>
              </Depth>
            </motion.div>
          ))}

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 90, rotate: 6 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1.2, ease: EASE, delay: 0.2 }}
            className="absolute left-1/2 top-0 -translate-x-1/2"
            style={{ perspective: 1200 }}
          >
            <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }}>
              <Phone width={320} className="origin-top scale-[0.86] md:scale-100">
                <EventDetailScreen event={events[0]} cta="Request to join" />
              </Phone>
            </motion.div>
          </motion.div>

          <Floater mx={sx} my={sy} depth={46} delay={0.9} className="left-[2%] top-[50%] md:left-[-4%] md:top-[62%]">
            <span className="flex size-6 items-center justify-center rounded-full bg-green text-xs text-white">✓</span>
            Request sent
          </Floater>
          <Floater mx={sx} my={sy} depth={-38} delay={1.05} className="right-[0%] top-[14%] md:right-[-2%] md:top-[20%]">
            <span className="font-display text-lg font-extrabold text-orange">₹50</span>
            flat platform fee
          </Floater>
          <Floater mx={sx} my={sy} depth={30} delay={1.2} className="bottom-[8%] right-[4%] md:bottom-[6%] md:right-[2%]">
            <span className="flex size-6 items-center justify-center rounded-full bg-ink text-[11px] text-cream">⌖</span>
            Address unlocks once you&apos;re in
          </Floater>
        </motion.div>
      </div>
    </section>
  )
}

function Depth({ mx, my, depth, children }: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; children: ReactNode }) {
  const x = useTransform(mx, v => Math.round(v * depth * 2))
  const y = useTransform(my, v => Math.round(v * depth * 2))
  return <motion.div style={{ x, y }}>{children}</motion.div>
}

function Floater({ mx, my, depth, delay, className, children }: { mx: MotionValue<number>; my: MotionValue<number>; depth: number; delay: number; className: string; children: ReactNode }) {
  const reduce = useReducedMotion() ?? false
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, scale: 0.7, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={`absolute z-10 ${className}`}
    >
      <Depth mx={mx} my={my} depth={depth}>
        <div className="flex items-center gap-2 whitespace-nowrap rounded-full bg-white/95 py-2 pl-2 pr-4 font-sans text-[13px] font-bold text-ink shadow-pop backdrop-blur">
          {children}
        </div>
      </Depth>
    </motion.div>
  )
}
