'use client'

import Image from 'next/image'
import { useRef, useState, useSyncExternalStore } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { Chapter } from '@/components/ui/atoms'
import { EASE, EASE_CSS } from './shared'
import { TEAM, type Founder } from './team'

const mql = '(min-width: 768px)'
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(mql)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(mql).matches, () => false)

/**
 * Chapter 05, who's building it. The two founders start as one stacked pair
 * of polaroids and get dealt apart as you scroll, with a big serif "&"
 * landing between them. Hover a card: it straightens, tilts toward the
 * cursor, the photo warms to full colour and a note slides out from behind.
 */
export function Team() {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const desktop = useDesktop()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'center center'] })
  const deal = useSpring(useTransform(p, [0.25, 0.95], [reduce || !desktop ? 1 : 0, 1]), { stiffness: 120, damping: 24 })
  const ampScale = useTransform(deal, [0.4, 1], [0.4, 1])
  const ampOpacity = useTransform(deal, [0.4, 0.9], [0, 1])
  const ampRotate = useTransform(deal, [0.4, 1], [-30, 0])
  const [active, setActive] = useState<string | null>(null)

  return (
    <section ref={ref} className="relative overflow-hidden bg-cream px-6 pb-28 pt-28 md:px-12 md:pb-36 md:pt-36 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <div className="text-center">
          <Chapter n="05" title="Who’s building it" className="justify-center" />
          <h2 className="mt-4 font-display text-[clamp(44px,6.4vw,100px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
            Two people,
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">one open door.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-[520px] font-sans text-lg leading-relaxed text-ink-2">
            Gorave is built by a team of two. One writes the code, one makes the city care.
          </p>
        </div>

        <div className="relative mt-16 grid items-start gap-16 md:mt-24 md:grid-cols-[1fr_auto_1fr] md:gap-6">
          <Card f={TEAM[0]} deal={deal} desktop={desktop} reduce={reduce} hover={active === TEAM[0].key} onHover={on => setActive(on ? TEAM[0].key : null)} />
          <motion.div
            aria-hidden
            style={{ scale: ampScale, opacity: ampOpacity, rotate: ampRotate }}
            className="hidden select-none self-center font-serif text-[clamp(140px,16vw,260px)] italic leading-none md:block"
          >
            {/* Steps back while a founder's note slides over it */}
            <span className="block text-brand transition-[opacity,transform] duration-500" style={{ opacity: active ? 0.12 : 1, transform: active ? 'scale(.85)' : 'none' }}>
              &amp;
            </span>
          </motion.div>
          <Card f={TEAM[1]} deal={deal} desktop={desktop} reduce={reduce} hover={active === TEAM[1].key} onHover={on => setActive(on ? TEAM[1].key : null)} />
        </div>

        <div className="mx-auto mt-24 max-w-[860px] text-center md:mt-28">
          <p className="font-display text-[clamp(30px,3.8vw,56px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
            Nitin <span className="font-serif font-normal italic tracking-[-0.02em] text-orange">builds the night.</span>{' '}
            Kaveesha <span className="font-serif font-normal italic tracking-[-0.02em] text-orange">tells the city about it.</span>
          </p>
          <p className="mt-5 font-sans text-base font-bold text-ink-3">The rest is up to the hosts.</p>
        </div>
      </div>
    </section>
  )
}

interface CardProps {
  f: Founder
  deal: MotionValue<number>
  desktop: boolean
  reduce: boolean
  hover: boolean
  onHover: (on: boolean) => void
}

function Card({ f, deal, desktop, reduce, hover, onHover }: CardProps) {
  // Dealt from a shared stack in the middle out to its own column.
  const x = useTransform(deal, [0, 1], [desktop ? -f.side * 260 : 0, 0])
  const rotate = useTransform(deal, [0, 1], [f.side * 3, f.side * 5])
  // Cursor tilt while hovered.
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rotateY = useSpring(useTransform(mx, [-0.5, 0.5], [-12, 12]), { stiffness: 160, damping: 18 })
  const rotateX = useSpring(useTransform(my, [-0.5, 0.5], [10, -10]), { stiffness: 160, damping: 18 })
  const glareX = useTransform(mx, [-0.5, 0.5], ['20%', '80%'])
  const glareY = useTransform(my, [-0.5, 0.5], ['20%', '80%'])
  const glare = useTransform([glareX, glareY] as MotionValue<string>[], ([gx, gy]) => `radial-gradient(circle at ${gx} ${gy}, rgba(255,255,255,.35), transparent 55%)`)

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    if (reduce || e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    onHover(false)
    mx.set(0)
    my.set(0)
  }

  const [first, ...rest] = f.name.split(' ')

  return (
    <motion.div style={{ x, zIndex: f.side === -1 ? 2 : 1 }} className="relative mx-auto w-full max-w-[400px]">
      {/* The card */}
      <div style={{ perspective: 1100 }} className="relative">
        {/* Note that slides out from behind, inward over the "&", on hover */}
        <div
          aria-hidden
          className="absolute top-[38%] z-0 hidden w-[240px] rounded-2xl bg-white p-5 shadow-pop lg:block"
          style={{
            [f.side === -1 ? 'right' : 'left']: 0,
            transform: hover ? `translateX(${-f.side * 96}%) rotate(${-f.side * 4}deg)` : 'translateX(0) rotate(0deg)',
            opacity: hover ? 1 : 0,
            transition: `transform .6s ${EASE_CSS}, opacity .35s`,
          }}
        >
          <div className="font-serif text-[19px] italic leading-snug text-ink">“{f.note}”</div>
        </div>

        <motion.div style={{ rotate }} className="relative z-[1]">
          <motion.div
            onPointerEnter={() => onHover(true)}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            animate={{ rotate: hover ? -f.side * 5 : 0, y: hover ? -14 : 0, scale: hover ? 1.03 : 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative bg-white p-3 pb-20 shadow-pop"
          >
            <div className="relative aspect-[4/5] overflow-hidden bg-tile">
              <Image
                src={f.photo}
                alt={`${f.name}, ${f.role} of Gorave`}
                fill
                sizes="(min-width: 768px) 400px, 90vw"
                className="object-cover"
                style={{
                  objectPosition: f.pos,
                  filter: hover ? 'saturate(1.05) contrast(1.02)' : 'saturate(.7) sepia(.18) contrast(.96)',
                  transform: hover ? 'scale(1.06)' : 'scale(1)',
                  transition: `filter .6s ${EASE_CSS}, transform 1s ${EASE_CSS}`,
                }}
              />
              <motion.div aria-hidden className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: glare, opacity: hover ? 1 : 0 }} />
              {/* Role stamp */}
              <span
                className="absolute left-3 top-3 rounded-full bg-cream/95 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink"
                style={{ transform: hover ? 'rotate(-4deg) translateY(-2px)' : 'rotate(0deg)', transition: `transform .5s ${EASE_CSS}` }}
              >
                {f.role}
              </span>
            </div>
            {/* Polaroid caption */}
            <div className="absolute inset-x-3 bottom-4 flex items-baseline justify-between gap-3">
              <span className="font-serif text-[26px] italic leading-none text-ink">
                {first} <span className="text-orange">{f.verb}</span>
              </span>
            </div>
            {/* Tape */}
            <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-3deg] bg-gold/45 shadow-sm" />
          </motion.div>
        </motion.div>
      </div>

      {/* Name + what they own */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.7, ease: EASE, delay: 0.15 }}
        className="mt-10"
      >
        <h3 className="font-display text-[clamp(38px,4.2vw,60px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
          {first}
          <br />
          <span className="text-ink-3">{rest.join(' ')}</span>
        </h3>
        <div className="mt-5 flex flex-wrap gap-2">
          {f.owns.map((o, i) => (
            <span
              key={o}
              className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-soft"
              style={{
                transform: hover ? `translateY(-3px) rotate(${(i - 1) * 2}deg)` : 'none',
                transition: `transform .45s ${EASE_CSS} ${i * 0.05}s`,
              }}
            >
              {o}
            </span>
          ))}
        </div>
        <p className="mt-4 font-sans text-[15px] leading-relaxed text-ink-2 lg:hidden">{f.note}</p>
      </motion.div>
    </motion.div>
  )
}
