'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { NIGHT_WALK, type Area } from '@/lib/area'
import { CARD_SHADOW, Deckle, Grain, SectionHead } from './kit'

type Stop = (typeof NIGHT_WALK)[number]

// Deal windows: the first polaroid is already on the table when the section pins.
const START = [-0.2, 0.06, 0.3, 0.54]
const LEN = 0.2
// Clock: 7:30 PM → 1:30 AM, in minutes since the evening's midnight
const T = START.map(a => Math.max(0, a + LEN))
const MINUTES = [19 * 60 + 30, 21 * 60, 23 * 60, 25 * 60 + 30]
function clock(m: number) {
  const h24 = Math.floor(m / 60) % 24
  const mm = Math.floor(m % 60)
  const h = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h}:${String(mm).padStart(2, '0')} ${h24 >= 12 ? 'PM' : 'AM'}`
}

// Where each polaroid comes to rest on the table (percent of the stage).
const SPOTS = [
  { left: 2, top: 10, rotate: -7 },
  { left: 26, top: 30, rotate: 4 },
  { left: 51, top: 4, rotate: -3 },
  { left: 75, top: 24, rotate: 6 },
]

function Polaroid({ stop, rotate, compact }: { stop: Stop; rotate: number; compact?: boolean }) {
  return (
    <div
      className={`group/p bg-white p-3 pb-4 ${CARD_SHADOW} transition-[transform,box-shadow] duration-700 ease-out-expo [transform:rotate(0deg)] hover:shadow-pop hover:[transform:rotate(var(--unrotate))_translateY(-14px)_scale(1.05)]`}
      style={{ '--unrotate': `${-rotate}deg` } as React.CSSProperties}
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-tile">
        <Image src={stop.image} alt={stop.title} fill sizes={compact ? '80vw' : '280px'} className="object-cover transition-transform duration-[1200ms] ease-out-expo group-hover/p:scale-[1.05]" />
      </div>
      <div className="flex items-baseline justify-between gap-3 px-1 pt-3">
        <span className="font-serif text-[22px] italic leading-none text-orange">{stop.time}</span>
        <span className="font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-ink-3">{stop.title}</span>
      </div>
      <p className="px-1 pt-1.5 font-serif text-[17px] italic leading-snug text-ink-2">{stop.detail}</p>
    </div>
  )
}

/** One polaroid, dealt from below as its slice of the scroll passes. */
function Dealt({ p, i, stop }: { p: MotionValue<number>; i: number; stop: Stop }) {
  const s = SPOTS[i]
  const a = START[i]
  const b = a + LEN
  const y = useTransform(p, [a, b], ['115vh', '0vh'])
  const x = useTransform(p, [a, b], [`${(1.5 - i) * 70}%`, '0%'])
  const rotate = useTransform(p, [a, b], [s.rotate + (i % 2 ? 28 : -24), s.rotate])
  const opacity = useTransform(p, [a, a + 0.05], [0, 1])
  return (
    <motion.div
      style={{ left: `${s.left}%`, top: `${s.top}%`, x, y, rotate, opacity, zIndex: 10 + i, width: 'min(250px, 20vw, 34vh)' }}
      className="absolute"
    >
      <Polaroid stop={stop} rotate={s.rotate} />
    </motion.div>
  )
}

/**
 * Chapter 04 — a night in the area. Four polaroids get dealt onto a table as
 * you scroll, in the order the night goes. Hover one
 * and it lifts and straightens. On phones they simply stack.
 */
export function NightTable({ area }: { area: Area }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const smooth = useSpring(scrollYProgress, { stiffness: 70, damping: 22, mass: 0.6 })
  const done = useTransform(scrollYProgress, () => 1)
  const p = reduce ? done : smooth
  const note = useTransform(p, [0.74, 0.86], [0, 1])
  const noteY = useTransform(p, [0.74, 0.86], [16, 0])
  const time = useTransform(useTransform(p, T, MINUTES), clock)

  const heading = <SectionHead n="04" label={`A night in ${area.name}`} title="Four stops," serif="one night." />

  return (
    <>
      {/* Desktop: pinned table */}
      <section ref={ref} className="relative hidden h-[260vh] bg-paper md:block">
        <Deckle from="cream" seed={2} />
        <div className="sticky top-0 flex h-[100svh] flex-col overflow-hidden px-12 pb-10 pt-24 lg:px-20">
          <Grain />
          <div className="relative mx-auto flex w-full max-w-[1240px] items-end justify-between gap-8">
            {heading}
            {/* the clock, as a postmark date stamp */}
            <div className="mb-1 -rotate-[4deg] rounded-[14px] border-[1.5px] border-ink/35 p-1 text-ink/70">
              <div className="rounded-[10px] border border-ink/25 px-5 py-2.5 text-center">
                <div className="font-sans text-[9px] font-bold uppercase tracking-[0.24em]">{area.name} · tonight</div>
                <motion.div className="mt-0.5 min-w-[150px] font-serif text-[40px] italic leading-none tabular-nums text-orange">{time}</motion.div>
                <div className="mt-1 font-sans text-[9px] font-bold uppercase tracking-[0.24em]">{area.city.name}</div>
              </div>
            </div>
          </div>
          <div className="relative mx-auto mt-6 w-full max-w-[1240px] flex-1">
            {NIGHT_WALK.map((stop, i) => <Dealt key={stop.time} p={p} i={i} stop={stop} />)}
            <motion.div style={{ opacity: note, y: noteY }} className="absolute bottom-0 right-2 font-serif text-[26px] italic text-ink-2">
              — {area.name}, any given Saturday
            </motion.div>
          </div>
        </div>
      </section>

      {/* Phones: a simple stack */}
      <section className="relative bg-paper px-6 py-24 md:hidden">
        <Deckle from="cream" seed={2} />
        <Grain />
        <div className="relative">{heading}</div>
        <ol className="relative mt-12 space-y-12">
          {NIGHT_WALK.map((stop, i) => {
            const r = SPOTS[i].rotate * 0.6
            return (
              <motion.li
                key={stop.time}
                initial={reduce ? false : { opacity: 0, x: i % 2 ? 60 : -60, rotate: r * 3 }}
                whileInView={{ opacity: 1, x: 0, rotate: r }}
                viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                transition={{ type: 'spring', stiffness: 55, damping: 14 }}
                className={i % 2 ? 'ml-auto w-[84%]' : 'w-[84%]'}
              >
                <Polaroid stop={stop} rotate={r} compact />
              </motion.li>
            )
          })}
        </ol>
      </section>
    </>
  )
}
