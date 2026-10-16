'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { guideHref, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'

const W = 1000
const RH = 230
const XS = [430, 570] as const

const stepLabel = (i: number, n: number) => (i === 0 ? 'Start here' : i === n - 1 ? 'Finish with' : 'Then')

function points(n: number) {
  return Array.from({ length: n }, (_, i) => ({ x: XS[i % 2], y: RH * i + RH / 2 }))
}

function pathFor(n: number) {
  const pts = points(n)
  let d = `M500 0 C500 ${RH / 4} ${pts[0].x} ${pts[0].y - RH / 4} ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1]
    const b = pts[i]
    d += ` C${a.x} ${a.y + RH / 2} ${b.x} ${b.y - RH / 2} ${b.x} ${b.y}`
  }
  const last = pts[pts.length - 1]
  return `${d} C${last.x} ${last.y + RH / 4} 500 ${RH * n - RH / 4} 500 ${RH * n}`
}

/**
 * Chapter 03 — the reading path. A route snakes down the page and draws
 * itself as you scroll; each stop lights up when the line reaches it.
 * Phones get a straight line that fills down a simple list.
 */
export function ReadingPath({ guides }: { guides: HostGuide[] }) {
  return (
    <section className="relative bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1100px]">
        <div className="text-center">
          <Chapter n="03" title="The reading path" className="justify-center" />
          <h2 className="mx-auto mt-4 max-w-[760px] font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Read them in<br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">this order.</span>
          </h2>
          <p className="mx-auto mt-4 max-w-[480px] font-sans text-lg leading-relaxed text-ink-2">
            From the first idea to the last guest out the door, each guide picks up where the last one stops.
          </p>
        </div>
        <PathDesktop guides={guides} />
        <PathMobile guides={guides} />
      </div>
    </section>
  )
}

function PathDesktop({ guides }: { guides: HostGuide[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const n = guides.length
  const H = RH * n
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 60%', 'end 60%'] })
  const p = useSpring(scrollYProgress, { stiffness: 120, damping: 26 })
  const pts = points(n)

  return (
    <div ref={ref} className="relative mt-16 hidden md:block" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="guides-a-path" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF6B35" />
            <stop offset="100%" stopColor="#FF3864" />
          </linearGradient>
        </defs>
        <path d={pathFor(n)} fill="none" stroke="#171310" strokeOpacity={0.14} strokeWidth={2} strokeDasharray="4 10" strokeLinecap="round" />
        <motion.path d={pathFor(n)} fill="none" stroke="url(#guides-a-path)" strokeWidth={5} strokeLinecap="round" style={{ pathLength: p }} />
        {pts.map((pt, i) => (
          <Node key={i} x={pt.x} y={pt.y} at={pt.y / H} progress={p} n={i + 1} />
        ))}
      </svg>
      {guides.map((g, i) => (
        <Stop key={g.slug} guide={g} i={i} n={n} at={pts[i].y / H} top={(pts[i].y / H) * 100} progress={p} />
      ))}
    </div>
  )
}

function Node({ x, y, at, progress, n }: { x: number; y: number; at: number; progress: MotionValue<number>; n: number }) {
  const lit = useTransform(progress, [at - 0.02, at], [0, 1])
  const scale = useTransform(lit, [0, 1], [0.6, 1])
  const ring = useTransform(lit, [0, 1], [0, 1])
  return (
    <g>
      <circle cx={x} cy={y} r={20} fill="#fbf7ef" stroke="#171310" strokeOpacity={0.2} strokeWidth={2} />
      <motion.circle cx={x} cy={y} r={20} fill="#171310" style={{ scale, opacity: lit }} />
      <motion.circle cx={x} cy={y} r={32} fill="none" stroke="#FF3864" strokeWidth={2} style={{ opacity: ring, scale: ring }} />
      <motion.text x={x} y={y + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill="#f1e9d8" style={{ opacity: lit }} className="font-display">
        {n}
      </motion.text>
    </g>
  )
}

function Stop({ guide, i, n, at, top, progress }: { guide: HostGuide; i: number; n: number; at: number; top: number; progress: MotionValue<number> }) {
  const left = i % 2 === 0
  const opacity = useTransform(progress, [at - 0.08, at], [0.2, 1])
  const x = useTransform(progress, [at - 0.08, at], [left ? -40 : 40, 0])
  return (
    <motion.div
      style={{ top: `${top}%`, opacity, x }}
      className={`absolute w-[36%] -translate-y-1/2 ${left ? 'left-0 text-right' : 'right-0 text-left'}`}
    >
      <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">{stepLabel(i, n)}</div>
      <Link href={guideHref(guide.slug)} className="group mt-2 block">
        <h3 className="font-display text-[clamp(24px,2.4vw,34px)] font-extrabold leading-[0.98] tracking-[-0.04em] transition-colors group-hover:text-coral">{guide.title}</h3>
        <p className="mt-2 font-sans text-[15px] leading-relaxed text-ink-2">{guide.dek}</p>
        <div className="mt-2 font-sans text-sm font-bold text-ink-3">{guide.category} · {guide.readMinutes} min</div>
      </Link>
    </motion.div>
  )
}

function PathMobile({ guides }: { guides: HostGuide[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 70%', 'end 70%'] })
  return (
    <ol ref={ref} className="relative mt-12 grid gap-9 pl-12 md:hidden">
      <span aria-hidden className="absolute bottom-2 left-[15px] top-2 w-[2px] bg-ink/10" />
      <motion.span aria-hidden style={{ scaleY: scrollYProgress }} className="absolute bottom-2 left-[15px] top-2 w-[2px] origin-top bg-brand" />
      {guides.map((g, i) => (
        <li key={g.slug} className="relative">
          <motion.span
            aria-hidden
            initial={{ scale: 0.5, backgroundColor: '#e9e1cf' }}
            whileInView={{ scale: 1, backgroundColor: '#171310' }}
            viewport={{ margin: '0px 0px -30% 0px' }}
            className="absolute -left-12 top-0 grid size-8 place-items-center rounded-full font-display text-sm font-extrabold text-cream"
          >
            {i + 1}
          </motion.span>
          <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-orange">{stepLabel(i, guides.length)}</div>
          <Link href={guideHref(g.slug)} className="mt-1.5 block">
            <h3 className="font-display text-2xl font-extrabold leading-tight tracking-[-0.04em]">{g.title}</h3>
            <div className="mt-1 font-sans text-sm font-bold text-ink-3">{g.category} · {g.readMinutes} min</div>
          </Link>
        </li>
      ))}
    </ol>
  )
}
