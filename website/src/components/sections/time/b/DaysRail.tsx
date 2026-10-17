'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useLenis } from 'lenis/react'
import type { SampleEvent } from '@/constants'
import type { TimeViewProps } from '../types'
import { Chapter } from '@/components/ui/atoms'
import { EventCard } from '@/components/ui/EventCard'
import { cn } from '@/lib/cn'
import { DiaryRow, MobileDays, type DayGroup } from './cards'
import { EmptyWindow } from './EmptyWindow'
import { EASE, eventHour, hourLabel, keyParts, pad, plural, rangeLabel } from './kit'
import { useIstMinutes } from './useWindow'

type Props = Pick<TimeViewProps, 'time' | 'place' | 'events' | 'total' | 'days' | 'others'> & { chapter?: string }

/**
 * Chapter 02, the days. Several days: a calendar laid on its side, one column
 * per day with that day's real listings; the section pins and the week slides
 * past while the day in focus stays named in the header. One day (tonight,
 * tomorrow): an hour ruler, each listing pinned to its start time by a line
 * that draws itself in as it arrives. Zero listings: a blank page that points
 * to the other windows and to hosting.
 */
export function DaysRail(props: Props) {
  const { time, events, others, place, chapter = '02' } = props
  if (!events.length) return <EmptyWindow time={time} place={place} others={others} chapter={chapter} />
  const single = time.slug === 'tonight' || time.slug === 'tomorrow'
  return single ? <HourRuler {...props} chapter={chapter} /> : <DayColumns {...props} chapter={chapter} />
}

// ── Pinning ─────────────────────────────────────────────────────────────

/** Measures how far the track must travel sideways (desktop only, 0 when it fits). */
function usePinned(track: React.RefObject<HTMLDivElement | null>, section: React.RefObject<HTMLElement | null>, cols?: React.RefObject<(HTMLElement | null)[]>) {
  const [m, setM] = useState({ dist: 0, vw: 1440, offs: [] as number[] })
  useEffect(() => {
    const el = track.current
    const sec = section.current
    if (!el || !sec) return
    const measure = () => {
      const wide = window.matchMedia('(min-width: 768px)').matches
      const dist = wide ? Math.max(0, Math.round(el.scrollWidth - window.innerWidth)) : 0
      setM({ dist, vw: window.innerWidth, offs: (cols?.current ?? []).map(c => c?.offsetLeft ?? 0) })
    }
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    ro.observe(sec)
    return () => ro.disconnect()
  }, [track, section, cols])
  return m
}

const browseOf = (place: Props['place']) => (place.citySlug ? `/${place.citySlug}` : '/cities')

// ── Several days: columns ──────────────────────────────────────────────

const SHOWN = 3 // per column: one card + two diary lines

function DayColumns({ time, place, total, days, chapter }: Props & { chapter: string }) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const cols = useRef<(HTMLElement | null)[]>([])
  const m = usePinned(track, section, cols)
  const lenis = useLenis()
  const pinned = m.dist > 0
  const browse = browseOf(place)

  const list = useMemo(
    () => days.map(d => ({ ...d, parts: keyParts(d.key) })),
    [days],
  )

  const { scrollYProgress: p } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(p, v => (m.dist ? -Math.round(v * m.dist) : 0))
  const bar = useTransform(p, v => (m.dist ? v : 1))
  const [cur, setCur] = useState(0)
  useMotionValueEvent(x, 'change', v => {
    let c = 0
    m.offs.forEach((o, i) => {
      if (o + v <= m.vw * 0.42) c = i
    })
    setCur(c)
  })

  const jump = (i: number) => {
    const sec = section.current
    if (!sec || !m.dist) return
    const off = Math.max(0, Math.min(m.dist, (m.offs[i] ?? 0) - m.vw * 0.3))
    const top = sec.getBoundingClientRect().top + window.scrollY + off
    if (lenis) lenis.scrollTo(top)
    else window.scrollTo({ top, behavior: 'smooth' })
  }

  const span = rangeLabel(list.filter(d => d.parts).map(d => d.key)) || time.label

  const groups: DayGroup[] = list.map(d => ({
    key: d.key,
    big: d.parts ? String(d.parts.day) : '·',
    serif: d.parts ? d.parts.weekday : d.label,
    sub: `${d.parts ? `${d.parts.month} · ` : ''}${plural(d.events.length, 'night')}`,
    events: d.events,
  }))
  const curDay = list[cur]

  return (
    <section
      ref={section}
      id="days"
      className="relative scroll-mt-20 bg-cream"
      style={pinned ? { height: `calc(100vh + ${m.dist}px)` } : undefined}
    >
      <div className={pinned ? 'sticky top-0 flex h-screen flex-col overflow-hidden pt-[92px]' : 'py-24 md:py-32'}>
        {/* Sticky header: the day in focus + the week's tabs */}
        <div className="hidden px-12 md:block lg:px-20">
          <div className="flex items-center justify-between gap-6 border-b border-ink/15 pb-4">
            <div className="flex items-center gap-5">
              <Chapter n={chapter} title="Day by day" />
              {pinned && curDay && (
                <div className="relative h-8 w-[300px] overflow-hidden">
                  <AnimatePresence initial={false} mode="popLayout">
                    <motion.div
                      key={curDay.key}
                      initial={{ y: '100%', opacity: 0 }}
                      animate={{ y: '0%', opacity: 1 }}
                      exit={{ y: '-100%', opacity: 0 }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-0 flex items-center gap-2 whitespace-nowrap font-serif text-2xl italic text-ink"
                    >
                      <span className="text-ink-3">now on</span> {curDay.parts ? `${curDay.parts.weekday} ${curDay.parts.day}` : curDay.label}
                    </motion.div>
                  </AnimatePresence>
                </div>
              )}
            </div>
            <div className="flex flex-wrap justify-end gap-1.5">
              {list.map((d, i) => (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => jump(i)}
                  className={cn(
                    'rounded-full px-3 py-1.5 font-sans text-xs font-bold transition-colors duration-300',
                    pinned && cur === i ? 'bg-ink text-cream' : 'bg-white/70 text-ink-2 hover:bg-white',
                  )}
                >
                  {d.parts ? `${d.parts.wd} ${d.parts.day}` : d.label}
                  <span className={cn('ml-1.5', pinned && cur === i ? 'text-cream/60' : 'text-ink-3')}>{d.events.length}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop track */}
        <div className={cn('hidden md:block', pinned ? 'flex-1 pt-8' : 'mt-10 overflow-x-auto [scrollbar-width:none]')}>
          <motion.div ref={track} style={{ x }} className="flex w-max items-start gap-0 px-12 lg:px-20">
            {/* Intro panel */}
            <div className="w-[380px] shrink-0 pr-12">
              <h2 className="font-display text-[clamp(48px,5vw,80px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
                {span},
                <br />
                <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">night by night.</span>
              </h2>
              <p className="mt-6 max-w-[300px] font-sans text-lg leading-relaxed text-ink-2">
                {plural(total, 'night')} listed in {place.name}, laid out by day. Area shown now, address once you&apos;re in.
              </p>
              {pinned && (
                <div className="mt-8 flex items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">
                  Keep scrolling <span className="h-px w-10 bg-ink/25" /> →
                </div>
              )}
            </div>

            {list.map((d, i) => (
              <div
                key={d.key}
                ref={el => {
                  cols.current[i] = el
                }}
                className="w-[324px] shrink-0 border-l border-ink/12 px-6 transition-opacity duration-500"
                style={{ opacity: pinned && Math.abs(cur - i) > 1 ? 0.5 : 1 }}
              >
                <DayHead parts={d.parts} label={d.label} count={d.events.length} on={!pinned || cur === i} />
                <div className="mt-5">
                  <EventCard event={d.events[0]} width={276} />
                </div>
                <div className="mt-3 flex flex-col gap-1">
                  {d.events.slice(1, SHOWN).map((e, k) => (
                    <DiaryRow key={e.id} e={e} className={k ? '[@media(max-height:840px)]:hidden' : undefined} />
                  ))}
                </div>
                {d.events.length > SHOWN && (
                  <Link href={browse} className="group mt-2 inline-flex items-center gap-2 px-2 font-sans text-sm font-bold text-ink-2 hover:text-ink">
                    <span className="font-serif text-lg italic text-orange">+{d.events.length - SHOWN}</span> more on {d.parts?.weekday ?? 'this day'}
                    <span className="transition-transform duration-300 group-hover:translate-x-1">→</span>
                  </Link>
                )}
              </div>
            ))}

            <EndCard browse={browse} place={place.name} />
          </motion.div>
        </div>

        {pinned && (
          <div className="mt-auto hidden items-center gap-5 px-12 pb-8 md:flex lg:px-20">
            <div className="h-[2px] flex-1 overflow-hidden rounded-full bg-ink/10">
              <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-ink" />
            </div>
            <div className="font-serif text-xl italic text-ink-2">
              {pad(cur + 1)} / {pad(list.length)}
            </div>
          </div>
        )}

        {/* Phones */}
        <div className="px-6 md:hidden">
          <Chapter n={chapter} title="Day by day" />
          <h2 className="mb-6 mt-4 font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.055em]">
            {span}, <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">night by night.</span>
          </h2>
          <MobileDays groups={groups} browse={browse} browseLabel={place.citySlug ? `All of ${place.name}` : 'All cities'} />
        </div>
      </div>
    </section>
  )
}

function DayHead({ parts, label, count, on }: { parts: ReturnType<typeof keyParts>; label: string; count: number; on: boolean }) {
  return (
    <div className="flex items-end gap-3 border-b-2 border-ink pb-3">
      <span className={cn('font-display text-[84px] font-extrabold leading-[0.78] tracking-[-0.065em] transition-colors duration-500', on ? 'text-brand' : 'text-ink')}>
        {parts ? parts.day : '·'}
      </span>
      <span className="pb-1">
        <span className="block font-serif text-[26px] italic leading-none text-ink">{parts ? parts.weekday : label}</span>
        <span className="mt-1.5 block font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">
          {parts ? `${parts.month} · ` : ''}
          {plural(count, 'night')}
        </span>
      </span>
    </div>
  )
}

function EndCard({ browse, place }: { browse: string; place: string }) {
  return (
    <div className="shrink-0 border-l border-ink/12 pl-6 pr-6">
      <Link
        href={browse}
        className="group flex h-[388px] w-[250px] flex-col justify-between rounded-[28px] bg-brand p-7 text-white transition-transform duration-500 ease-out-expo hover:-translate-y-1.5"
      >
        <span className="font-serif text-3xl italic">More</span>
        <span>
          <span className="block font-display text-[32px] font-extrabold leading-[0.95] tracking-[-0.045em]">Every night in {place}.</span>
          <span className="mt-3 inline-block font-sans text-sm font-bold text-white/85 transition-transform duration-300 group-hover:translate-x-1">Browse all →</span>
        </span>
      </Link>
    </div>
  )
}

// ── One day: hour ruler ────────────────────────────────────────────────

const PX = 210 // px per hour
const CARD = 264
const GAP = 28
const INTRO = 420
const RISE = 64 // stem height between the card stack and the axis

interface Slot {
  h: number | null
  exact: number | null
  events: SampleEvent[]
}

function buildSlots(events: SampleEvent[]) {
  const map = new Map<number, SampleEvent[]>()
  const loose: SampleEvent[] = []
  for (const e of events) {
    const h = eventHour(e)
    if (h === null) loose.push(e)
    else map.set(Math.floor(h), [...(map.get(Math.floor(h)) ?? []), e])
  }
  const slots: Slot[] = [...map.entries()].sort((a, b) => a[0] - b[0]).map(([h, list]) => ({ h, exact: eventHour(list[0]), events: list }))
  if (loose.length) slots.push({ h: null, exact: null, events: loose })
  return slots
}

/** Pure layout for the hour ruler: where each stack sits and where its tick is. */
function layoutRuler(events: SampleEvent[]) {
  const slots = buildSlots(events)
  const timed = slots.filter(s => s.h !== null)
  const start = timed.length ? (timed[0].h as number) - 1 : 18
  const tick = (h: number) => Math.round(INTRO + CARD / 2 + (h - start) * PX)
  const placed: (Slot & { left: number; target: number })[] = []
  for (const s of slots) {
    const prev = placed.length ? placed[placed.length - 1].left : -Infinity
    const ideal = s.h === null ? prev + CARD + GAP : tick(s.exact ?? s.h) - CARD / 2
    const left = Math.round(Math.max(ideal, prev + CARD + GAP, INTRO))
    placed.push({ ...s, left, target: s.h === null ? left + CARD / 2 : tick(s.exact ?? s.h) })
  }
  const lastRight = (placed[placed.length - 1]?.left ?? INTRO) + CARD
  const end = start + Math.max(6, Math.ceil((lastRight - INTRO) / PX) + 1)
  const hours = Array.from({ length: end - start + 1 }, (_, i) => start + i)
  const width = Math.max(tick(end) + 60, lastRight + 80)
  return { slots: placed, start, end, hours, tick, width }
}

function HourRuler({ time, place, events, total, chapter }: Props & { chapter: string }) {
  const section = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const m = usePinned(track, section)
  const pinned = m.dist > 0
  const reduce = useReducedMotion() ?? false
  const browse = browseOf(place)
  const nowMin = useIstMinutes()

  const geo = useMemo(() => layoutRuler(events), [events])

  const { scrollYProgress: p } = useScroll({ target: section, offset: ['start start', 'end end'] })
  const x = useTransform(p, v => (m.dist ? -Math.round(v * m.dist) : 0))

  // "Now" needle, tonight only, once the browser knows the time.
  let nowX: number | null = null
  if (time.slug === 'tonight' && nowMin >= 0) {
    let h = nowMin / 60
    if (h < 5) h += 24
    if (h >= geo.start && h <= geo.end) nowX = geo.tick(h)
  }

  const groups: DayGroup[] = geo.slots.map((s, i) => {
    const [num, ap] = s.h === null ? ['More', ''] : hourLabel(s.h).split(' ')
    return {
      key: `${s.h ?? 'tba'}-${i}`,
      big: num,
      serif: s.h === null ? 'times on the listing' : s.h >= 24 ? `${ap}, after midnight` : `${ap} onwards`,
      sub: plural(s.events.length, 'night'),
      events: s.events,
    }
  })

  return (
    <section
      ref={section}
      id="days"
      className="relative scroll-mt-20 bg-cream"
      style={pinned ? { height: `calc(100vh + ${m.dist}px)` } : undefined}
    >
      <div className={pinned ? 'sticky top-0 flex h-screen flex-col overflow-hidden pt-[92px]' : 'py-24 md:py-32'}>
        <div className="hidden px-12 md:block lg:px-20">
          <div className="flex items-center justify-between gap-6 border-b border-ink/15 pb-4">
            <Chapter n={chapter} title="Hour by hour" />
            <div className="font-serif text-xl italic text-ink-2">
              {plural(total, 'night')} · {hourLabel(geo.start + 1)} onwards
            </div>
          </div>
        </div>

        <div className={cn('relative hidden md:block', pinned ? 'flex-1' : 'mt-10 overflow-x-auto [scrollbar-width:none]')}>
          <motion.div ref={track} style={{ x, width: geo.width }} className="relative h-full min-h-[640px]">
            {/* Intro */}
            <div className="absolute left-12 top-8 w-[340px] lg:left-20">
              <h2 className="font-display text-[clamp(48px,5vw,80px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
                {time.label},
                <br />
                <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">hour by hour.</span>
              </h2>
              <p className="mt-6 max-w-[290px] font-sans text-lg leading-relaxed text-ink-2">
                Every listing in {place.name} pinned to the time its doors open. Pick the hour that suits you.
              </p>
            </div>

            {/* Card stacks, bottom-aligned on the ruler like bars */}
            {geo.slots.map((s, i) => (
              <div key={`${s.h}-${i}`} className="absolute flex flex-col justify-end gap-1" style={{ left: s.left, width: CARD, bottom: 128 + RISE }}>
                {s.events.slice(1, 3).map((e, k) => (
                  <DiaryRow key={e.id} e={e} className={cn('bg-white/60', k ? '[@media(max-height:860px)]:hidden' : undefined)} />
                ))}
                {s.events.length > 3 && (
                  <Link href={browse} className="px-2 pb-1 font-sans text-sm font-bold text-ink-2 hover:text-ink">
                    <span className="font-serif text-lg italic text-orange">+{s.events.length - 3}</span> more at {s.h === null ? 'other times' : hourLabel(s.h)} →
                  </Link>
                )}
                <div className="mt-1">
                  <EventCard event={s.events[0]} width={CARD} />
                </div>
              </div>
            ))}

            {/* Stems */}
            <svg className="pointer-events-none absolute left-0 overflow-visible" style={{ bottom: 128, width: geo.width, height: RISE }} aria-hidden>
              {geo.slots.map((s, i) => (
                <Stem key={i} from={s.left + CARD / 2} to={s.target} x={x} vw={m.vw} pinned={pinned} reduce={reduce} />
              ))}
            </svg>

            {/* The ruler */}
            <div className="absolute inset-x-0 bottom-0 h-[128px]">
              <div className="absolute h-[2px] bg-ink" style={{ left: INTRO - 40, width: geo.width - INTRO + 40, top: 0 }} />
              {geo.hours.map(h => (
                <div key={h} className="absolute top-0" style={{ left: geo.tick(h) }}>
                  <div className="h-4 w-[2px] -translate-x-1/2 bg-ink" />
                  <div className="absolute left-0 top-6 -translate-x-1/2 whitespace-nowrap font-serif text-[28px] italic leading-none text-ink">{hourLabel(h)}</div>
                </div>
              ))}
              {geo.hours.slice(0, -1).map(h => (
                <div key={`h${h}`} className="absolute top-0 h-2.5 w-px -translate-x-1/2 bg-ink/40" style={{ left: geo.tick(h + 0.5) }} />
              ))}
              {nowX !== null && (
                <div className="absolute -top-[54px]" style={{ left: nowX }}>
                  <div className="h-[70px] w-[2px] -translate-x-1/2 bg-coral" />
                  <div className="absolute -top-7 left-0 -translate-x-1/2 rounded-full bg-coral px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-white">Now</div>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {pinned && (
          <div className="hidden px-12 pb-6 pt-2 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 md:block lg:px-20">
            Scroll to move through the {time.slug === 'tonight' ? 'night' : 'day'} →
          </div>
        )}

        <div className="px-6 md:hidden">
          <Chapter n={chapter} title="Hour by hour" />
          <h2 className="mb-6 mt-4 font-display text-[44px] font-extrabold leading-[0.9] tracking-[-0.055em]">
            {time.label}, <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">hour by hour.</span>
          </h2>
          <MobileDays groups={groups} browse={browse} browseLabel={place.citySlug ? `All of ${place.name}` : 'All cities'} />
        </div>
      </div>
    </section>
  )
}

/** A callout line from a card stack down to its tick; draws in as it enters the screen. */
function Stem({ from, to, x, vw, pinned, reduce }: { from: number; to: number; x: MotionValue<number>; vw: number; pinned: boolean; reduce: boolean }) {
  const pathLength = useTransform(x, v => (!pinned || reduce ? 1 : Math.min(1, Math.max(0, (vw * 0.92 - (from + v)) / 220))))
  const dot = useTransform(pathLength, [0.85, 1], [0, 1])
  return (
    <g>
      <motion.path d={`M${from} 0 V${RISE * 0.45} L${to} ${RISE}`} fill="none" stroke="#171310" strokeWidth={1.5} style={{ pathLength }} />
      <motion.circle cx={to} cy={RISE} r={6} fill="#FF3864" style={{ scale: dot, opacity: dot }} />
    </g>
  )
}
