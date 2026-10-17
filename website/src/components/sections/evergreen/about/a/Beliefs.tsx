'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { Chapter } from '@/components/ui/atoms'
import { BELIEFS, ProofLink, pad, r2, type Belief } from '../shared'

// Board is 760×640 units; the photo sits at x 150..610 and the callout cards
// hang off both edges. Dots are in board units so lines meet the right spot.
const W = 760
const H = 640
const PX = 150
const PW = 460
const CARD = 220
const SLOTS = [
  { side: 'l', y: 56 },
  { side: 'r', y: 252 },
  { side: 'l', y: 452 },
] as const

/** Where each rule points on its photo (board units). */
const DOTS: [number, number][][] = [
  [[300, 214], [472, 222], [330, 556]], // doorway: host, guests, threshold
  [[258, 282], [478, 356], [330, 430]], // sofa: who asks, the mix, the gate
  [[382, 100], [430, 398], [330, 398]], // building: the block, the lit flat, help
  [[356, 182], [492, 352], [396, 528]], // rooftop: the lights, the host, the crate
  [[356, 318], [470, 452], [318, 540]], // game night: faces, the table, the lamp
]

const n = BELIEFS.length

/**
 * Chapter 02, what we believe. A pinned chapter per belief: the photo cuts
 * to the next scene and three callouts draw themselves onto it, each one a
 * rule the app enforces, with the page that proves it. Mobile (and reduced
 * motion) gets a plain stack with numbered dots on each photo.
 */
export function Beliefs() {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  return (
    <section ref={ref} className="relative bg-cream">
      {/* Desktop: pinned */}
      {!reduce && (
        <div className="hidden md:block" style={{ height: `${(n + 0.6) * 100}vh` }}>
          <div className="sticky top-0 flex h-screen items-center px-12 lg:px-20">
            <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[0.72fr_1.28fr] items-center gap-8 lg:gap-12">
              <div className="relative">
                <Chapter n="02" title="What we believe" />
                <div className="mt-5 flex items-center gap-2">
                  {BELIEFS.map((b, i) => <Tick key={b.key} i={i} p={p} />)}
                </div>
                <div className="relative mt-8 h-[440px]">
                  {BELIEFS.map((b, i) => <Copy key={b.key} i={i} belief={b} p={p} />)}
                </div>
              </div>

              <div className="relative mx-auto w-[min(100%,calc((100vh-150px)*760/640))]" style={{ aspectRatio: `${W}/${H}` }}>
                {BELIEFS.map((b, i) => <Board key={b.key} i={i} belief={b} p={p} />)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile + reduced motion: stacked */}
      <div className={reduce ? 'px-6 py-24 md:px-20' : 'px-6 py-24 md:hidden'}>
        <div className="mx-auto max-w-[760px]">
          <Chapter n="02" title="What we believe" />
          <h2 className="mt-4 font-display text-[clamp(40px,9vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Five rules we <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">built it on.</span>
          </h2>
          <ol className="mt-12 grid gap-16">
            {BELIEFS.map((b, i) => <Stacked key={b.key} i={i} belief={b} />)}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** Window for belief i, with a short overlap for the crossfade. */
function win(i: number) {
  const s = i / n
  const e = (i + 1) / n
  return { s, e, w: 0.02 }
}

function fade(i: number) {
  const { s, e, w } = win(i)
  if (i === 0) return { at: [0, e - w, e + w], to: [1, 1, 0] }
  if (i === n - 1) return { at: [s - w, s + w, 1], to: [0, 1, 1] }
  return { at: [s - w, s + w, e - w, e + w], to: [0, 1, 1, 0] }
}

function Tick({ i, p }: { i: number; p: MotionValue<number> }) {
  const { s, e } = win(i)
  const fill = useTransform(p, [s, e], [0, 1])
  return (
    <div className="h-[3px] w-10 overflow-hidden rounded-full bg-ink/12">
      <motion.div style={{ scaleX: fill }} className="h-full origin-left bg-brand" />
    </div>
  )
}

function Copy({ i, belief, p }: { i: number; belief: Belief; p: MotionValue<number> }) {
  const f = fade(i)
  const opacity = useTransform(p, f.at, f.to)
  const yTo = i === 0 ? [0, 0, -40] : i === n - 1 ? [40, 0, 0] : [40, 0, 0, -40]
  const y = useTransform(p, f.at, yTo)
  const pe = useTransform(opacity, v => (v > 0.5 ? 'auto' : 'none'))
  return (
    <motion.div style={{ opacity, y, pointerEvents: pe }} className="absolute inset-x-0 top-0">
      <div className="font-serif text-[clamp(64px,7vw,110px)] italic leading-[0.8] text-orange">{pad(i + 1)}</div>
      <h2 className="mt-5 font-display text-[clamp(40px,4.4vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
        {belief.title}
        <br />
        <span className="font-serif font-normal italic tracking-[-0.03em]">{belief.serif}</span>
      </h2>
      <p className="mt-6 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">{belief.body}</p>
      <ProofLink href={belief.href} className="mt-7">{belief.cta}</ProofLink>
    </motion.div>
  )
}

function Board({ i, belief, p }: { i: number; belief: Belief; p: MotionValue<number> }) {
  const { s, e } = win(i)
  const f = fade(i)
  const opacity = useTransform(p, f.at, f.to)
  const scale = useTransform(p, [Math.max(0, s - 0.02), Math.min(1, e + 0.02)], [1.08, 1])
  return (
    <motion.div style={{ opacity, zIndex: i }} className="absolute inset-0">
      <div
        className="absolute overflow-hidden rounded-[28px] bg-cream-deep shadow-pop"
        style={{ left: `${r2((PX / W) * 100)}%`, width: `${r2((PW / W) * 100)}%`, top: 0, height: '100%' }}
      >
        <motion.div style={{ scale }} className="absolute inset-0">
          <Image src={belief.image} alt={belief.alt} fill sizes="(max-width: 1280px) 40vw, 480px" className="object-cover" />
        </motion.div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/35 to-transparent px-5 pb-4 pt-10 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-white/85">
          Fig. {pad(i + 1)} · {belief.key === 'money' ? 'Hosting pays' : belief.title.replace(/,$/, '')}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        {SLOTS.map((slot, j) => <Line key={j} i={i} j={j} slot={slot} dot={DOTS[i][j]} p={p} />)}
      </svg>
      {SLOTS.map((slot, j) => <Callout key={j} i={i} j={j} slot={slot} rule={belief.rules[j]} p={p} />)}
    </motion.div>
  )
}

/** Draw-in range for callout j of belief i, inside that belief's window. */
function draw(i: number, j: number) {
  const { s } = win(i)
  const a = s + (0.06 + j * 0.22) / n
  return [r2(a * 10000) / 10000, r2((a + 0.16 / n) * 10000) / 10000]
}

function Line({ i, j, slot, dot, p }: { i: number; j: number; slot: (typeof SLOTS)[number]; dot: [number, number]; p: MotionValue<number> }) {
  const [a, b] = draw(i, j)
  const pathLength = useTransform(p, [a, b], [0, 1])
  const pop = useTransform(p, [b - 0.004, b], [0, 1])
  const left = slot.side === 'l'
  const x1 = left ? CARD : W - CARD
  const y1 = slot.y + 46
  const mid = left ? x1 + 24 : x1 - 24
  const [dx, dy] = dot
  return (
    <g>
      <motion.path d={`M${x1} ${y1} H${mid} L${dx} ${dy}`} fill="none" stroke="#FBF7EF" strokeWidth={1.6} style={{ pathLength }} />
      <motion.circle cx={dx} cy={dy} r={7} fill="#FF3864" style={{ scale: pop, opacity: pop }} />
      <motion.circle cx={dx} cy={dy} r={15} fill="none" stroke="#FFF" strokeWidth={2} style={{ scale: pop, opacity: pop }} />
    </g>
  )
}

function Callout({ i, j, slot, rule, p }: { i: number; j: number; slot: (typeof SLOTS)[number]; rule: Belief['rules'][number]; p: MotionValue<number> }) {
  const [a] = draw(i, j)
  const left = slot.side === 'l'
  const opacity = useTransform(p, [Math.max(0, a - 0.01), a + 0.01], [0, 1])
  const x = useTransform(p, [Math.max(0, a - 0.01), a + 0.012], [left ? -20 : 20, 0])
  return (
    <motion.div
      className="absolute rounded-2xl bg-paper px-4 py-3.5 shadow-soft lg:px-5 lg:py-4"
      style={{ left: `${r2(((left ? 0 : W - CARD) / W) * 100)}%`, top: `${r2((slot.y / H) * 100)}%`, width: `${r2((CARD / W) * 100)}%`, opacity, x }}
    >
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-base italic text-orange">{j + 1}</span>
        <span className="font-display text-[clamp(17px,1.5vw,22px)] font-extrabold leading-tight tracking-[-0.03em] text-ink">{rule.label}</span>
      </div>
      <div className="mt-1 font-sans text-[13.5px] leading-snug text-ink-2">{rule.detail}</div>
    </motion.div>
  )
}

function Stacked({ i, belief }: { i: number; belief: Belief }) {
  return (
    <li>
      <div className="relative aspect-[460/640] overflow-hidden rounded-[24px] shadow-soft">
        <Image src={belief.image} alt={belief.alt} fill sizes="(max-width: 768px) 100vw, 760px" className="object-cover" />
        {DOTS[i].map(([x, y], j) => (
          <span
            key={j}
            className="absolute grid size-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-coral font-serif text-base italic text-white ring-[3px] ring-white"
            style={{ left: `${r2(((x - PX) / PW) * 100)}%`, top: `${r2((y / H) * 100)}%` }}
          >
            {j + 1}
          </span>
        ))}
      </div>
      <div className="mt-6 font-serif text-5xl italic leading-none text-orange">{pad(i + 1)}</div>
      <h3 className="mt-3 font-display text-[clamp(32px,8vw,48px)] font-extrabold leading-[0.95] tracking-[-0.05em]">
        {belief.title} <span className="font-serif font-normal italic tracking-[-0.03em]">{belief.serif}</span>
      </h3>
      <p className="mt-4 font-sans text-lg leading-relaxed text-ink-2">{belief.body}</p>
      <ol className="mt-6 grid gap-3">
        {belief.rules.map((r, j) => (
          <li key={r.label} className="flex gap-4 rounded-2xl bg-paper p-4 shadow-soft">
            <span className="font-serif text-2xl italic text-orange">{j + 1}</span>
            <div>
              <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{r.label}</div>
              <div className="mt-0.5 font-sans text-[15px] text-ink-2">{r.detail}</div>
            </div>
          </li>
        ))}
      </ol>
      <ProofLink href={belief.href} className="mt-6">{belief.cta}</ProofLink>
    </li>
  )
}
