'use client'

import { useRef, type PointerEvent } from 'react'
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import type { TimeViewProps } from '../types'
import { cn } from '@/lib/cn'
import { EASE, Head, pad } from './kit'

const TINTS = [
  { bg: 'bg-blush', ink: 'text-blush-ink', glyph: '#FF3864' },
  { bg: 'bg-sky', ink: 'text-sky-ink', glyph: '#3B6EA8' },
  { bg: 'bg-sage', ink: 'text-sage-ink', glyph: '#2F7A4E' },
  { bg: 'bg-cream-deep', ink: 'text-ink', glyph: '#FF6B35' },
]
const LIFT = ['md:mt-0', 'md:mt-16', 'md:mt-6', 'md:mt-24']

/**
 * Chapter 04, why this window. The reasons as pastel index cards, staggered
 * like they were dropped on a desk; each one leans toward the cursor with a
 * soft highlight that follows it.
 */
export function Why({ time, place, chapter = '04' }: Pick<TimeViewProps, 'time' | 'place'> & { chapter?: string }) {
  return (
    <section className="overflow-hidden bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <Head
          n={chapter}
          label="Why this window"
          title={`Why ${time.label.toLowerCase()}`}
          serif={`works in ${place.name}.`}
          aside={`${time.why.length} reasons the timing is on your side.`}
        />
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4 [perspective:1200px]">
          {time.why.map((w, i) => (
            <motion.div
              key={w.title}
              className={LIFT[i % LIFT.length]}
              initial={{ opacity: 0, y: 50, rotate: i % 2 ? 2 : -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.9, ease: EASE, delay: i * 0.08 }}
            >
              <TiltCard i={i} title={w.title} body={w.body} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TiltCard({ i, title, body }: { i: number; title: string; body: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 160, damping: 18 })
  const sy = useSpring(my, { stiffness: 160, damping: 18 })
  const rotateY = useTransform(sx, [0, 1], [-11, 11])
  const rotateX = useTransform(sy, [0, 1], [9, -9])
  const gx = useTransform(sx, v => `${Math.round(v * 100)}%`)
  const gy = useTransform(sy, v => `${Math.round(v * 100)}%`)
  const glare = useMotionTemplate`radial-gradient(420px circle at ${gx} ${gy}, rgb(255 255 255 / 0.55), transparent 55%)`
  const tint = TINTS[i % TINTS.length]

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }
  const leave = () => {
    mx.set(0.5)
    my.set(0.5)
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={leave}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={cn('group relative flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[30px] p-7 shadow-soft transition-shadow duration-500 hover:shadow-pop md:min-h-[400px]', tint.bg, tint.ink)}
    >
      <motion.div aria-hidden style={{ background: glare }} className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      {/* Index-card ruling */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-[92px] h-px bg-current opacity-15" />
      <div className="relative flex items-start justify-between" style={{ transform: 'translateZ(40px)' }}>
        <span className="font-serif text-[64px] italic leading-none">{pad(i + 1)}</span>
        <Glyph i={i} color={tint.glyph} />
      </div>
      <div className="relative" style={{ transform: 'translateZ(60px)' }}>
        <h3 className="font-display text-[clamp(28px,2.4vw,36px)] font-extrabold leading-[0.98] tracking-[-0.045em]">{title}</h3>
        <p className="mt-3 font-sans text-[17px] leading-relaxed opacity-80">{body}</p>
      </div>
    </motion.div>
  )
}

/** Small calendar-ish marks, one per card: a ring, a tick, a star, a dot grid. */
function Glyph({ i, color }: { i: number; color: string }) {
  const k = i % 4
  return (
    <svg viewBox="0 0 48 48" className="size-12 transition-transform duration-700 ease-out-expo group-hover:rotate-12" aria-hidden>
      {k === 0 && <circle cx="24" cy="24" r="17" fill="none" stroke={color} strokeWidth="3" strokeDasharray="4 5" />}
      {k === 1 && <path d="M10 25 L20 34 L38 14" fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
      {k === 2 && <path d="M24 6 L28.5 19.5 L42 24 L28.5 28.5 L24 42 L19.5 28.5 L6 24 L19.5 19.5 Z" fill={color} />}
      {k === 3 &&
        [0, 1, 2].flatMap(r => [0, 1, 2].map(c => <rect key={`${r}${c}`} x={8 + c * 12} y={8 + r * 12} width="8" height="8" rx="2" fill={color} opacity={r === 1 && c === 1 ? 1 : 0.3} />))}
    </svg>
  )
}
