'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS, type City } from '@/constants'
import type { TypeContent } from '@/lib/eventType'
import { Chapter } from '@/components/ui/atoms'

// Board is 1180×640; boxes and dots are in board units so the SVG lines line up at any width.
const W = 1180
const H = 640
const BOX = 270
const SPOTS = [
  { x: 0, y: 60, dot: [470, 140] },
  { x: 0, y: 285, dot: [430, 330] },
  { x: 0, y: 510, dot: [505, 520] },
  { x: W - BOX, y: 140, dot: [725, 210] },
  { x: W - BOX, y: 420, dot: [700, 450] },
] as const

/**
 * Chapter 02, what's actually in one. A pinned photo; as you scroll, five
 * callout lines draw themselves onto it, one ingredient at a time.
 */
export function Anatomy({ city, story, chapter = '02' }: { city: City; story: TypeContent; chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const scale = useTransform(scrollYProgress, [0, 1], [0.92, 1.04])
  const singular = story.singular

  return (
    <section ref={ref} className="relative bg-paper md:h-[320vh]">
      <div className="flex flex-col justify-center px-6 py-24 md:sticky md:top-0 md:h-screen md:px-20 md:py-0">
        <div className="mx-auto w-full max-w-[1180px]">
          <Chapter n={chapter} title="The anatomy" />
          <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            What makes a good {singular}.
          </h2>
        </div>

        {/* Desktop: the drawn diagram */}
        <div className="relative mx-auto mt-8 hidden w-full max-w-[1180px] md:block" style={{ aspectRatio: `${W}/${H}` }}>
          <motion.div
            className="absolute overflow-hidden rounded-[28px] shadow-pop"
            style={{ left: `${(390 / W) * 100}%`, width: `${(400 / W) * 100}%`, top: '2%', height: '96%', scale }}
          >
            <Image src={PHOTOS[story.heroPhoto]} alt={`${story.plural} in ${city.name}`} fill sizes="420px" className="object-cover" />
          </motion.div>
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {SPOTS.map((s, i) => (
              <Line key={i} i={i} spot={s} progress={scrollYProgress} />
            ))}
          </svg>
          {SPOTS.map((s, i) => (
            <Callout key={i} i={i} spot={s} item={story.anatomy[i]} progress={scrollYProgress} />
          ))}
        </div>

        {/* Mobile: a simple numbered list */}
        <ol className="mt-10 grid gap-4 md:hidden">
          {story.anatomy.map((a, i) => (
            <li key={a.label} className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft">
              <span className="font-serif text-2xl italic text-orange">{i + 1}</span>
              <div>
                <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{a.label}</div>
                <div className="mt-0.5 font-sans text-[15px] text-ink-2">{a.detail}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const range = (i: number) => [0.08 + i * 0.16, 0.2 + i * 0.16]

function Line({ i, spot, progress }: { i: number; spot: (typeof SPOTS)[number]; progress: MotionValue<number> }) {
  const pathLength = useTransform(progress, range(i), [0, 1])
  const dot = useTransform(progress, [range(i)[1] - 0.02, range(i)[1]], [0, 1])
  const left = spot.x === 0
  const x1 = left ? BOX : W - BOX
  const y1 = spot.y + 34
  const [dx, dy] = spot.dot
  const mid = left ? x1 + 40 : x1 - 40
  return (
    <g>
      <motion.path d={`M${x1} ${y1} H${mid} L${dx} ${dy}`} fill="none" stroke="#171310" strokeWidth={1.5} strokeDasharray="0 1" style={{ pathLength }} />
      <motion.circle cx={dx} cy={dy} r={9} fill="#FF3864" style={{ scale: dot, opacity: dot }} />
      <motion.circle cx={dx} cy={dy} r={18} fill="none" stroke="#FFF" strokeWidth={2} style={{ scale: dot, opacity: dot }} />
    </g>
  )
}

function Callout({ i, spot, item, progress }: { i: number; spot: (typeof SPOTS)[number]; item: TypeContent['anatomy'][number]; progress: MotionValue<number> }) {
  const [a] = range(i)
  const opacity = useTransform(progress, [a - 0.04, a + 0.02], [0.15, 1])
  const x = useTransform(progress, [a - 0.04, a + 0.02], [spot.x === 0 ? -24 : 24, 0])
  return (
    <motion.div
      className={`absolute ${spot.x === 0 ? 'text-right' : 'text-left'}`}
      style={{ left: `${(spot.x / W) * 100}%`, top: `${(spot.y / H) * 100}%`, width: `${(BOX / W) * 100}%`, opacity, x }}
    >
      <div className="font-serif text-lg italic text-orange">0{i + 1}</div>
      <div className="font-display text-[clamp(20px,2vw,28px)] font-extrabold leading-tight tracking-[-0.03em]">{item.label}</div>
      <div className="mt-1 font-sans text-[15px] text-ink-2">{item.detail}</div>
    </motion.div>
  )
}
