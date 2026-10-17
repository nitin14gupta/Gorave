'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { EASE } from './kit'

// Board is 1180×640; boxes and dots live in board units so the SVG lines meet the photo at any width.
const W = 1180
const H = 640
const BOX = 300
const FRAME = { x: 390, w: 400 }
const SPOTS = [
  { x: 0, y: 40, dot: [478, 214] },
  { x: 0, y: 372, dot: [452, 486] },
  { x: W - BOX, y: 128, dot: [704, 300] },
  { x: W - BOX, y: 452, dot: [716, 540] },
] as const

type Callout = { title: string; detail: string }

/** The room's four promises, all taken from the crowd copy or the live count. */
function callouts({ crowd, place, total }: Pick<CrowdViewProps, 'crowd' | 'place' | 'total'>): Callout[] {
  return [
    { title: crowd.promise, detail: crowd.how[1].body },
    { title: crowd.how[0].title, detail: crowd.how[0].body },
    { title: 'Address after you’re in', detail: 'Until you’re confirmed you only see the area. The exact address is never public.' },
    total > 0
      ? { title: `${total} coming up`, detail: `Live ${crowd.nights} in ${place.name} right now.` }
      : { title: 'Nothing listed yet', detail: `The first of the ${crowd.nights} in ${place.name} could be yours.` },
  ]
}

/**
 * The hero: the crowd photo in a tall frame, with four callout lines drawing
 * out from the people in it to what the room promises. Lines draw once the
 * board is in view; scrolling drifts the photo inside its frame.
 */
export function Hero({ crowd, place, total, crumbs }: Pick<CrowdViewProps, 'crowd' | 'place' | 'total' | 'crumbs'>) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const shown = useInView(board, { once: true, amount: 0.3 })
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], reduce ? ['0%', '0%'] : ['-4%', '8%'])
  const titleY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -80])
  const items = callouts({ crowd, place, total })
  const alt = `${crowd.label} night in ${place.name}`

  return (
    <section ref={ref} className="relative overflow-hidden bg-paper px-6 pb-20 pt-28 md:px-20 md:pb-28">
      <div className="mx-auto max-w-[1180px]">
        <Breadcrumbs crumbs={crumbs} />
        <motion.div style={{ y: titleY }} className="mt-8 flex flex-wrap items-end justify-between gap-x-12 gap-y-7">
          <h1 className="font-display text-[clamp(56px,9vw,144px)] font-extrabold leading-[0.86] tracking-[-0.065em]">
            {crowd.label}
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">nights in {place.name}.</span>
          </h1>
          <div className="max-w-[400px] pb-2">
            <p className="font-sans text-lg leading-relaxed text-ink-2">{crowd.heroLine}</p>
            <div className="mt-6 flex flex-wrap gap-2.5">
              <Button href="#on-the-list" size="lg">See what&apos;s on</Button>
              <Button href="/host" kind="ghost" size="lg">Host one</Button>
            </div>
          </div>
        </motion.div>

        {/* Desktop: the photo with its callouts */}
        <div ref={board} className="relative mt-16 hidden md:block" style={{ aspectRatio: `${W}/${H}` }}>
          <motion.div
            className="absolute inset-y-0 overflow-hidden rounded-[32px] bg-tile shadow-pop"
            style={{ left: `${(FRAME.x / W) * 100}%`, width: `${(FRAME.w / W) * 100}%` }}
            initial={reduce ? false : { clipPath: 'inset(8% 8% 8% 8% round 32px)', opacity: 0 }}
            animate={shown ? { clipPath: 'inset(0% 0% 0% 0% round 32px)', opacity: 1 } : undefined}
            transition={{ duration: 1.1, ease: EASE }}
          >
            <motion.div className="absolute inset-[-8%_0]" style={{ y: imgY }}>
              <Image src={crowd.image} alt={alt} fill priority sizes="440px" className="object-cover" />
            </motion.div>
          </motion.div>
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
            {SPOTS.map((s, i) => {
              const left = s.x === 0
              const x1 = left ? BOX : W - BOX
              const y1 = s.y + 22
              const mid = left ? x1 + 46 : x1 - 46
              const [dx, dy] = s.dot
              const delay = 0.7 + i * 0.22
              return (
                <g key={i}>
                  <motion.path
                    d={`M${x1} ${y1} H${mid} L${dx} ${dy}`}
                    fill="none"
                    stroke="#171310"
                    strokeWidth={1.5}
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={shown ? { pathLength: 1 } : undefined}
                    transition={{ duration: 0.9, delay, ease: EASE }}
                  />
                  <motion.g
                    initial={reduce ? false : { scale: 0, opacity: 0 }}
                    animate={shown ? { scale: 1, opacity: 1 } : undefined}
                    transition={{ duration: 0.5, delay: delay + 0.75, ease: EASE }}
                    style={{ transformOrigin: `${dx}px ${dy}px` }}
                  >
                    <circle cx={dx} cy={dy} r={18} fill="none" stroke="#FFF" strokeWidth={2} />
                    <circle cx={dx} cy={dy} r={8} fill="#FF3864" />
                  </motion.g>
                </g>
              )
            })}
          </svg>
          {SPOTS.map((s, i) => (
            <motion.div
              key={i}
              className={`absolute ${s.x === 0 ? 'text-right' : 'text-left'}`}
              style={{ left: `${(s.x / W) * 100}%`, top: `${(s.y / H) * 100}%`, width: `${(BOX / W) * 100}%` }}
              initial={reduce ? false : { opacity: 0, x: s.x === 0 ? -24 : 24 }}
              animate={shown ? { opacity: 1, x: 0 } : undefined}
              transition={{ duration: 0.8, delay: 0.55 + i * 0.22, ease: EASE }}
            >
              <div className="font-serif text-lg italic text-orange">0{i + 1}</div>
              {/* Non-breaking hyphens keep "women-only" on one line */}
              <div className="font-display text-[clamp(22px,2.1vw,30px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{items[i].title.replace(/-/g, '‑')}</div>
              <div className="mt-1.5 font-sans text-[15px] leading-relaxed text-ink-2">{items[i].detail}</div>
            </motion.div>
          ))}
        </div>

        {/* Mobile: the photo, then the promises as a numbered list */}
        <div className="mt-12 md:hidden">
          <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] shadow-pop">
            <Image src={crowd.image} alt={alt} fill priority sizes="92vw" className="object-cover" />
          </div>
          <ol className="mt-8 grid gap-6">
            {items.map((c, i) => (
              <li key={i} className="flex gap-4 border-t border-ink/10 pt-5">
                <span className="font-serif text-2xl italic leading-none text-orange">0{i + 1}</span>
                <div>
                  <div className="font-display text-2xl font-extrabold leading-tight tracking-[-0.035em]">{c.title}</div>
                  <div className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{c.detail}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
