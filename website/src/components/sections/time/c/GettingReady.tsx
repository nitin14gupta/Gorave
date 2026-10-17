'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { PHOTOS, type SampleEvent } from '@/constants'
import { AREA_SCENES } from '@/lib/area'
import type { TimeContent } from '@/lib/time'
import { Chapter } from '@/components/ui/atoms'
import { EASE, clock12, lower, pad } from './kit'

interface Props {
  time: TimeContent
  place: { name: string }
  events: SampleEvent[]
  chapter: string
}

/**
 * Chapter 02, getting ready. The four steps from "no plans" to the front
 * door. Desktop pins: the photo wipes to the next scene and a soft app card
 * slides in for each beat as you scroll. Phones get each beat stacked with
 * its own picture and card.
 */
export function GettingReady({ time, place, events, chapter }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const steps = time.steps.slice(0, 4)
  const n = steps.length
  const [active, setActive] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(p, 'change', v => setActive(Math.min(n - 1, Math.max(0, Math.floor(v * n * 0.999)))))
  const bar = useTransform(p, [0, 1], [0, 1])
  const push = useTransform(p, [0, 1], [1.12, 1])
  const images = [time.image, AREA_SCENES.chai, AREA_SCENES.building, AREA_SCENES.doorway]

  const head = (
    <div>
      <Chapter n={chapter} title="Getting ready" />
      <h2 className="mt-4 font-display text-[clamp(40px,5.2vw,80px)] font-extrabold leading-[0.9] tracking-[-0.055em] text-ink">
        From no plans
        <span className="block font-serif font-normal italic tracking-[-0.03em] text-brand">to the front door.</span>
      </h2>
    </div>
  )

  return (
    <>
      {/* Desktop: pinned story */}
      <section ref={ref} className="relative hidden md:block" style={{ height: `${n * 85 + 30}vh` }}>
        <div className="sticky top-0 flex h-screen items-center px-12 lg:px-20">
          <div className="mx-auto grid w-full max-w-[1320px] grid-cols-[0.9fr_1.1fr] items-center gap-14 lg:gap-24">
            <div>
              {head}
              <ol className="relative mt-10 pl-8">
                <div className="absolute bottom-2 left-0 top-2 w-[2px] overflow-hidden rounded-full bg-ink/10">
                  <motion.div style={{ scaleY: bar }} className="h-full origin-top bg-brand" />
                </div>
                {steps.map((s, i) => {
                  const on = i === active
                  return (
                    <li key={s.title} className="py-3">
                      <div className="flex items-baseline gap-4">
                        <span className={`font-serif text-2xl italic transition-colors duration-500 ${on ? 'text-orange' : 'text-ink-3/60'}`}>{pad(i + 1)}</span>
                        <span
                          className="font-display font-extrabold tracking-[-0.04em] transition-all duration-500 ease-out-expo"
                          style={{ fontSize: on ? 40 : 26, color: on ? 'var(--color-ink)' : 'rgb(23 19 16 / 0.32)' }}
                        >
                          {s.title}
                        </span>
                      </div>
                      <div
                        className="grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo"
                        style={{ gridTemplateRows: on ? '1fr' : '0fr', opacity: on ? 1 : 0 }}
                      >
                        <p className="overflow-hidden pl-12 font-sans text-lg leading-relaxed text-ink-2">
                          <span className="block max-w-[420px] pt-2">{s.body}</span>
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="relative">
              <div className="relative h-[76vh] max-h-[760px] overflow-hidden rounded-[40px] bg-tile shadow-pop">
                {images.slice(0, n).map((src, i) => (
                  <motion.div
                    key={src + i}
                    initial={false}
                    animate={{ clipPath: i <= active ? 'inset(0% 0% 0% 0%)' : 'inset(100% 0% 0% 0%)' }}
                    transition={{ duration: reduce ? 0 : 1.05, ease: EASE }}
                    className="absolute inset-0"
                    style={{ zIndex: i }}
                  >
                    <motion.div style={{ scale: push }} className="absolute inset-0">
                      <Image src={src} alt="" fill sizes="(max-width: 1280px) 55vw, 700px" className="object-cover" />
                    </motion.div>
                  </motion.div>
                ))}
                <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-[#F6DFC6]/50 via-transparent to-transparent" />
                <div className="absolute right-6 top-6 z-10 rounded-full bg-paper/85 px-4 py-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-2 backdrop-blur">
                  Step {pad(active + 1)} / {pad(n)}
                </div>
              </div>

              <div className="absolute -left-10 bottom-10 z-20 w-[340px] lg:-left-16">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={active}
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: 70, rotate: -6 }}
                    animate={{ opacity: 1, y: 0, rotate: -2 }}
                    exit={reduce ? { opacity: 0 } : { opacity: 0, y: -40, rotate: 3 }}
                    transition={{ type: 'spring', stiffness: 140, damping: 20 }}
                  >
                    <BeatCard i={active} time={time} place={place} events={events} />
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phones: stacked beats */}
      <section className="px-6 py-20 md:hidden">
        {head}
        <ol className="mt-10 grid gap-14">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={reduce ? false : { opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <div className="relative">
                <div className="relative aspect-[4/5] overflow-hidden rounded-[28px] bg-tile">
                  <Image src={images[i % images.length]} alt="" fill sizes="100vw" className="object-cover" />
                </div>
                <div className="relative -mt-28 ml-4 mr-[-4px] -rotate-2">
                  <BeatCard i={i} time={time} place={place} events={events} />
                </div>
              </div>
              <div className="mt-6 flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-orange">{pad(i + 1)}</span>
                <h3 className="font-display text-3xl font-extrabold tracking-[-0.04em] text-ink">{s.title}</h3>
              </div>
              <p className="mt-2 font-sans text-lg leading-relaxed text-ink-2">{s.body}</p>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  )
}

/** A soft app card for each beat, built from the real listings. */
function BeatCard({ i, time, place, events }: { i: number; time: TimeContent; place: { name: string }; events: SampleEvent[] }) {
  const e = events[0]
  const shell = 'rounded-[26px] bg-paper/95 p-5 shadow-pop ring-1 ring-ink/5 backdrop-blur'

  if (i === 0) {
    const rows = events.slice(0, 3)
    return (
      <div className={shell}>
        <div className="flex items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
          <span>{time.label} · {place.name}</span>
          <span className="text-orange">Live</span>
        </div>
        <div className="mt-3 grid gap-2">
          {rows.length
            ? rows.map((r, k) => (
                <div key={r.id} className={`flex items-center gap-3 rounded-2xl p-2 ${k === 0 ? 'bg-white shadow-soft ring-2 ring-orange/70' : ''}`}>
                  <span className="relative size-11 shrink-0 overflow-hidden rounded-xl bg-tile">
                    <Image src={r.image ?? PHOTOS[r.photo]} alt="" fill sizes="44px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-display text-[15px] font-extrabold tracking-[-0.02em] text-ink">{r.title}</span>
                    <span className="block truncate font-sans text-xs text-ink-3">{clock12(r.clock) ?? r.when} · {r.area}</span>
                  </span>
                  {k === 0 && <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs text-white">✓</span>}
                </div>
              ))
            : [0, 1, 2].map(k => (
                <div key={k} className="flex items-center gap-3 rounded-2xl p-2">
                  <span className="size-11 shrink-0 rounded-xl bg-tile" />
                  <span className="flex-1 space-y-1.5">
                    <span className="block h-3 w-3/4 rounded-full bg-tile" />
                    <span className="block h-2.5 w-1/2 rounded-full bg-tile" />
                  </span>
                </div>
              ))}
        </div>
      </div>
    )
  }

  if (i === 1) {
    const free = e ? e.request || e.price === 'Free' : false
    return (
      <div className={shell}>
        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">{free ? 'Free · request to join' : 'Paid · instant booking'}</div>
        <div className="mt-2 truncate font-display text-2xl font-extrabold tracking-[-0.035em] text-ink">{e?.title ?? `A night ${lower(time.label)}`}</div>
        <div className="mt-1 font-sans text-sm text-ink-3">
          {e ? `${e.area} · ${e.going} going${e.spotsLeft != null ? ` · ${e.spotsLeft} spots left` : ''}` : place.name}
        </div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl bg-cream p-3">
          <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">{e?.price ?? 'Free'}</span>
          <motion.span
            initial={{ scale: 1 }}
            animate={{ scale: [1, 0.94, 1] }}
            transition={{ duration: 0.5, delay: 0.7, times: [0, 0.4, 1] }}
            className="rounded-full bg-brand px-4 py-2.5 font-sans text-sm font-bold text-white"
          >
            {free ? 'Request to join' : 'Book with UPI'}
          </motion.span>
        </div>
        <div className="mt-2.5 font-sans text-xs text-ink-3">{free ? 'The host says yes or no.' : 'Plus a flat ₹50 platform fee.'}</div>
      </div>
    )
  }

  if (i === 2) {
    return (
      <div className={shell}>
        <div className="flex items-center justify-between">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">The address</div>
          <Lock />
        </div>
        <div className="mt-3 rounded-2xl bg-white p-4 shadow-soft">
          <div className="font-sans text-xs font-bold text-ink-3">Area, shown to everyone</div>
          <div className="font-display text-xl font-extrabold tracking-[-0.03em] text-ink">{e?.area || place.name}</div>
          <div className="mt-3 font-sans text-xs font-bold text-ink-3">Exact address, for confirmed guests</div>
          <motion.div initial={{ filter: 'blur(6px)' }} animate={{ filter: 'blur(0px)' }} transition={{ duration: 0.9, delay: 0.6 }} className="mt-1.5 space-y-1.5">
            <span className="block h-3 w-4/5 rounded-full bg-orange/25" />
            <span className="block h-3 w-3/5 rounded-full bg-orange/25" />
          </motion.div>
        </div>
        <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-green/15 px-3 py-1.5 font-sans text-xs font-bold text-ink">
          <span className="size-2 rounded-full bg-green" /> Unlocked once you&apos;re confirmed
        </div>
      </div>
    )
  }

  return (
    <div className={shell}>
      <div className="flex items-center justify-between font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
        <span>Your ticket</span>
        <span>{e ? clock12(e.clock) ?? e.when : time.label}</span>
      </div>
      <div className="mt-3 flex items-center gap-4">
        <div className="relative shrink-0 overflow-hidden rounded-2xl bg-white p-2.5 shadow-soft">
          <Qr seed={e?.id ?? time.slug} />
          <motion.div
            initial={{ y: '-10%' }}
            animate={{ y: '1000%' }}
            transition={{ duration: 1.2, delay: 0.4, ease: 'easeInOut' }}
            className="absolute inset-x-0 top-0 h-[10%] bg-gradient-to-b from-transparent via-orange/50 to-transparent"
          />
        </div>
        <div className="min-w-0">
          <div className="line-clamp-2 font-display text-lg font-extrabold leading-tight tracking-[-0.03em] text-ink">{e?.title ?? `${time.label} in ${place.name}`}</div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.5 }}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 font-sans text-xs font-bold text-white"
          >
            ✓ Scanned at the door
          </motion.div>
        </div>
      </div>
    </div>
  )
}

/** A padlock whose shackle swings open once, on mount. */
function Lock() {
  return (
    <svg viewBox="0 0 24 24" className="size-6 text-orange" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <rect x="5" y="11" width="14" height="10" rx="2.5" />
      <motion.path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        initial={{ rotate: 0, x: 0 }}
        animate={{ rotate: -28, x: -2 }}
        transition={{ duration: 0.6, delay: 0.5, ease: EASE }}
        style={{ transformOrigin: '8px 11px' }}
      />
    </svg>
  )
}

/** A decorative QR-style grid, deterministic from the event id. */
function Qr({ seed }: { seed: string }) {
  let h = 0
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  const N = 11
  const cells: [number, number][] = []
  for (let y = 0; y < N; y++)
    for (let x = 0; x < N; x++) {
      const finder = (x < 3 && y < 3) || (x > N - 4 && y < 3) || (x < 3 && y > N - 4)
      if (finder) continue
      h = (h * 1103515245 + 12345) >>> 0
      if ((h >>> 16) % 2) cells.push([x, y])
    }
  const finder = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width={3} height={3} fill="var(--color-ink)" />
      <rect x={x + 0.6} y={y + 0.6} width={1.8} height={1.8} fill="white" />
      <rect x={x + 1.1} y={y + 1.1} width={0.8} height={0.8} fill="var(--color-ink)" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="size-[72px]" shapeRendering="crispEdges" aria-hidden>
      {finder(0, 0)}
      {finder(N - 3, 0)}
      {finder(0, N - 3)}
      {cells.map(([x, y]) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="var(--color-ink)" />
      ))}
    </svg>
  )
}
