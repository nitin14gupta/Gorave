'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS, type SampleEvent } from '@/constants'
import type { CrowdViewProps } from '../types'
import { AvatarStack, Chapter, Chip } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { r2 } from './kit'

const MAX = 7

/**
 * Chapter 02, the real listings as a deck of cards. Pinned on desktop: scroll
 * and the top card slides out and tucks under the pile, one event at a time.
 * Hover the top card and it lifts and tilts toward the cursor.
 */
export function Deck({ crowd, place, events, total, chapter = '02' }: Pick<CrowdViewProps, 'crowd' | 'place' | 'events' | 'total'> & { chapter?: string }) {
  const cards = events.slice(0, MAX)
  const n = cards.length
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const f = useTransform(scrollYProgress, [0.06, 0.94], [0, Math.max(n - 1, 0)])
  const shown = useTransform(f, v => String(Math.min(n, Math.round(v) + 1)).padStart(2, '0'))
  const bar = useTransform(scrollYProgress, [0.06, 0.94], [1 / Math.max(n, 1), 1])

  const head = (
    <>
      <Chapter n={chapter} title="What's on" />
      <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
        Coming up
        <br />
        in {place.name}.
      </h2>
      <p className="mt-5 max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">
        {n > 0
          ? `Real ${crowd.nights}, listed by real hosts. Area shown now, address after you're in.`
          : `Nothing listed in ${place.name} yet. That means the first one is yours.`}
      </p>
    </>
  )

  if (n === 0) {
    return (
      <section id="whats-on" className="scroll-mt-20 bg-cream px-6 py-24 md:px-20 md:py-32">
        <div className="mx-auto grid max-w-[1280px] items-center gap-12 md:grid-cols-[1fr_1fr]">
          <div>
            {head}
            <div className="mt-8"><Button href="/host" size="lg">Host the first one</Button></div>
          </div>
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[380px]">
            {[2, 1, 0].map(k => (
              <div
                key={k}
                className="absolute inset-0 rounded-[30px] border-[1.5px] border-dashed border-ink/25 bg-paper"
                style={{ transform: `translateY(${k * 14}px) rotate(${(k % 2 ? 1 : -1) * k * 3}deg) scale(${r2(1 - k * 0.05)})` }}
              >
                {k === 0 && (
                  <div className="flex size-full flex-col items-center justify-center p-8 text-center">
                    <div className="font-serif text-2xl italic text-orange">Your night here</div>
                    <div className="mt-2 font-display text-3xl font-extrabold tracking-[-0.04em]">{crowd.label}</div>
                    <p className="mt-3 font-sans text-[15px] text-ink-2">{crowd.hostLine}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="whats-on" ref={ref} className="relative scroll-mt-20 bg-cream md:h-[var(--deck-h)]" style={{ '--deck-h': `${100 + (n > 1 ? n * 46 : 0)}vh` } as React.CSSProperties}>
      {/* Desktop: pinned deck */}
      <div className="sticky top-0 hidden h-screen overflow-hidden md:block">
        <div className="mx-auto grid h-full max-w-[1280px] grid-cols-[0.9fr_1.1fr] items-center gap-10 px-20">
          <div className="relative z-10">
            {head}
            <div className="mt-10 flex items-end gap-4">
              <div className="font-display text-[88px] font-extrabold leading-none tracking-[-0.06em] text-ink">
                <motion.span>{shown}</motion.span>
              </div>
              <div className="pb-3 font-sans text-sm font-bold text-ink-3">/ {String(n).padStart(2, '0')}</div>
            </div>
            <div className="mt-3 h-[3px] w-[220px] overflow-hidden rounded-full bg-ink/10">
              <motion.div className="h-full origin-left bg-brand" style={{ scaleX: bar }} />
            </div>
            <div className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
              {total > n ? `${total} upcoming · ` : ''}Hover the top card
            </div>
          </div>
          <div className="relative flex h-full items-center justify-center" style={{ perspective: 1400 }}>
            <div className="relative aspect-[4/5] w-[min(380px,34vw)]">
              {cards.map((e, i) => (
                <DeckCard key={e.id} event={e} i={i} n={n} f={f} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: a swipeable rail */}
      <div className="px-6 py-24 md:hidden">
        {head}
        <div className="no-scrollbar -mx-6 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
          {cards.map(e => (
            <div key={e.id} className="w-[78vw] max-w-[340px] shrink-0 snap-center">
              <Card event={e} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const DEPTH = 3

function DeckCard({ event, i, n, f }: { event: SampleEvent; i: number; n: number; f: MotionValue<number> }) {
  const reduce = useReducedMotion()
  const side = i % 2 ? 1 : -1
  // Position in the pile: 0 is on top. Between n-1 and n the card is mid-shuffle.
  const c = useTransform(f, v => (((i - v) % n) + n) % n)
  const t = useTransform(c, v => (v > n - 1 ? n - v : 0))
  const depth = useTransform(c, v => (v > n - 1 ? (n - v) * (n - 1) : v))

  const swing = useTransform(t, v => Math.sin(Math.PI * v))
  const x = useTransform(swing, v => `${r2(side * v * (reduce ? 0 : 118))}%`)
  const rotate = useTransform([swing, depth], ([s, d]: number[]) => r2(side * s * 12 + (i % 2 ? 1 : -1) * Math.min(d, DEPTH) * 2.4))
  const y = useTransform(depth, d => `${r2(Math.min(d, DEPTH) * 4.2)}%`)
  const scale = useTransform(depth, d => r2(1 - Math.min(d, DEPTH) * 0.06))
  const opacity = useTransform(depth, d => r2(Math.max(0, Math.min(1, DEPTH + 0.6 - d))))
  const zIndex = useTransform([c, t], ([cv, tv]: number[]) => (tv > 0.5 ? 0 : tv > 0 ? 100 : Math.round(50 - cv * 5)))
  const shade = useTransform(depth, d => r2(Math.min(d, DEPTH) * 0.12))

  return (
    <motion.div className="absolute inset-0" style={{ x, y, rotate, scale, opacity, zIndex }}>
      <Card event={event} tilt />
      <motion.div aria-hidden className="pointer-events-none absolute inset-0 rounded-[30px] bg-ink" style={{ opacity: shade }} />
    </motion.div>
  )
}

/** A full-bleed event card. With `tilt` it leans toward the cursor on hover. */
function Card({ event, tilt }: { event: SampleEvent; tilt?: boolean }) {
  const reduce = useReducedMotion()
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const lift = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 160, damping: 18 })
  const sy = useSpring(my, { stiffness: 160, damping: 18 })
  const sl = useSpring(lift, { stiffness: 200, damping: 20 })
  const rotateY = useTransform(sx, [-0.5, 0.5], [-14, 14])
  const rotateX = useTransform(sy, [-0.5, 0.5], [12, -12])
  const scale = useTransform(sl, [0, 1], [1, 1.045])
  const glareX = useTransform(sx, [-0.5, 0.5], ['0%', '100%'])
  const glareY = useTransform(sy, [-0.5, 0.5], ['0%', '100%'])
  const glare = useTransform([glareX, glareY], ([gx, gy]: string[]) => `radial-gradient(circle at ${gx} ${gy}, rgb(255 255 255 / 0.28), transparent 55%)`)

  function onMove(e: React.PointerEvent<HTMLAnchorElement>) {
    if (!tilt || reduce || e.pointerType !== 'mouse') return
    const b = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - b.left) / b.width - 0.5)
    my.set((e.clientY - b.top) / b.height - 0.5)
    lift.set(1)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
    lift.set(0)
  }

  return (
    <motion.div className="size-full" style={tilt ? { rotateX, rotateY, scale, transformPerspective: 1200 } : undefined}>
      <Link
        href={`/e/${event.id}`}
        draggable={false}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="group relative block aspect-[4/5] size-full overflow-hidden rounded-[30px] bg-noir shadow-pop"
      >
        <Image
          src={event.image ?? PHOTOS[event.photo]}
          alt={event.title}
          fill
          sizes="(max-width: 768px) 80vw, 420px"
          draggable={false}
          className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir/90 via-noir/15 to-noir/30" />
        {tilt && <motion.div aria-hidden className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{ backgroundImage: glare }} />}
        <div className="absolute left-4 right-4 top-4 flex flex-wrap gap-1.5">
          <Chip className="bg-white/90 text-ink">{event.when}</Chip>
          {event.request && <Chip className="bg-white/90 text-ink">Request to join</Chip>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-6 text-noir-ink">
          <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-noir-ink/70">{event.type}</div>
          <div className="mt-1.5 font-display text-[clamp(24px,2.2vw,30px)] font-extrabold leading-[1.02] tracking-[-0.035em]">{event.title}</div>
          <div className="mt-1.5 font-sans text-sm text-noir-ink/75">{event.area} · {event.price}</div>
          <div className="mt-4 flex items-center gap-2">
            <AvatarStack n={3} size={22} ringClass="ring-noir" />
            <span className="font-sans text-xs font-bold text-noir-ink/85">{event.going} going</span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
