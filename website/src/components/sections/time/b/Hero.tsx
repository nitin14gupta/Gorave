'use client'

import Image from 'next/image'
import { useMemo, useRef } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { SampleEvent } from '@/constants'
import type { TimeViewProps } from '../types'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Chapter } from '@/components/ui/atoms'
import { EASE, eventTime, keyParts, plural, rangeLabel, r2 } from './kit'
import { useWindowKeys } from './useWindow'

type Props = Pick<TimeViewProps, 'time' | 'place' | 'total' | 'days' | 'crumbs'>

// Where the pad sits on a desktop screen (percent insets). The photo layer
// starts clipped to exactly this box, then opens to full bleed.
const BOX = { top: 17, right: 6, bottom: 8, left: 56 }

// Tear-off timeline (share of the pinned scroll).
const TEAR = [0.04, 0.5] as const
const OPEN = [0.52, 0.82] as const

/**
 * The cover. The window's dates are set huge on a tear-off desk calendar.
 * Scroll and the pages tear away one by one (Fri, Sat, Sun...), the last one
 * uncovers the photo underneath, and the photo opens out to full bleed with
 * the window's promise on it. Mobile: the pages tear off once on view.
 */
export function Hero({ time, place, total, days, crumbs }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion() ?? false
  const fallback = useMemo(() => days.map(d => d.key).filter(k => keyParts(k)), [days])
  const keys = useWindowKeys(time.slug, fallback)
  const byDay = useMemo(() => new Map(days.map(d => [d.key, d.events])), [days])
  const pages = keys.length ? keys : ['']
  const range = rangeLabel(keys)
  const liveDays = days.filter(d => d.events.length).length

  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const t = useTransform(p, [OPEN[0], OPEN[1]], [0, 1])
  const top = useTransform(t, [0, 1], [BOX.top, 0])
  const right = useTransform(t, [0, 1], [BOX.right, 0])
  const bottom = useTransform(t, [0, 1], [BOX.bottom, 0])
  const left = useTransform(t, [0, 1], [BOX.left, 0])
  const round = useTransform(t, [0, 1], [28, 0])
  const clip = useMotionTemplate`inset(${top}% ${right}% ${bottom}% ${left}% round ${round}px)`
  const imgScale = useTransform(t, [0, 1], [reduce ? 1 : 1.25, 1])
  const copyO = useTransform(p, [0.56, 0.72], [1, 0])
  const copyY = useTransform(p, [0.56, 0.72], [0, reduce ? 0 : -90])
  const binderO = useTransform(p, [TEAR[1] - 0.02, TEAR[1] + 0.03], [1, 0])
  const shade = useTransform(p, [0.8, 0.92], [0, 1])
  const capY = useTransform(p, [0.8, 0.95], [reduce ? 0 : 50, 0])
  const cueO = useTransform(p, [0, 0.06], [1, 0])

  const rise = (delay: number) => ({
    initial: reduce ? false : { y: '105%' },
    animate: { y: '0%' },
    transition: { duration: 1.1, ease: EASE, delay },
  })
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 16 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay },
  })

  const title = (
    <h1 className="font-display font-extrabold leading-[0.84] tracking-[-0.06em] text-ink">
      <span className="block overflow-hidden pb-[0.06em]">
        <motion.span {...rise(0.05)} className="block text-[clamp(64px,min(9.6vw,17vh),172px)]">{time.label}</motion.span>
      </span>
      <span className="block overflow-hidden pb-[0.1em]">
        <motion.span {...rise(0.15)} className="block font-serif text-[clamp(40px,min(5.6vw,10vh),104px)] font-normal italic tracking-[-0.03em] text-brand">
          in {place.name}.
        </motion.span>
      </span>
    </h1>
  )
  const dateLine = (
    <motion.div {...fade(0.3)} className="flex min-h-9 flex-wrap items-center gap-2.5">
      <span className="rounded-full bg-ink px-3.5 py-1.5 font-sans text-xs font-bold uppercase tracking-[0.16em] text-cream">{time.promise}</span>
      {range && <span className="font-serif text-2xl italic text-ink-2">{range}</span>}
    </motion.div>
  )
  const ctas = (
    <div className="flex flex-wrap gap-2.5">
      <Button href="#days" size="lg">See the days</Button>
      <Button href="/host" kind="ghost" size="lg">Host one</Button>
    </div>
  )
  const count = (
    <div className="font-sans text-sm font-bold text-ink-2">
      {total > 0 ? (
        <>
          <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">{total}</span> {total === 1 ? 'night' : 'nights'} listed
          {liveDays > 1 && <> across {liveDays} days</>}
        </>
      ) : (
        <>Nothing listed yet. Be the first to host.</>
      )}
    </div>
  )

  return (
    <section ref={ref} className="relative bg-cream md:h-[320vh]">
      {/* ── Desktop: pinned pad ── */}
      <div className="hidden md:sticky md:top-0 md:block md:h-screen md:overflow-hidden">
        {/* Faint ruled calendar grid behind everything */}
        <div aria-hidden className="absolute inset-0 opacity-60 [background-image:linear-gradient(to_right,rgb(23_19_16/0.05)_1px,transparent_1px)] [background-size:calc(100%/7)_100%]" />

        <motion.div style={{ opacity: copyO, y: copyY }} className="absolute inset-y-0 left-0 z-10 flex w-[54%] flex-col justify-center pl-12 pr-8 pt-16 lg:pl-20">
          <div className="flex flex-col gap-7">
            <motion.div {...fade(0)} className="flex flex-col gap-4">
              <Breadcrumbs crumbs={crumbs} />
              <Chapter n="00" title={`The calendar · ${place.name}`} />
            </motion.div>
            {title}
            {dateLine}
            <motion.p {...fade(0.4)} className="max-w-[460px] font-sans text-[19px] leading-relaxed text-ink-2">{time.heroLine}</motion.p>
            <motion.div {...fade(0.5)} className="flex flex-col gap-5">
              {ctas}
              {count}
            </motion.div>
          </div>
        </motion.div>

        {/* Photo layer: clipped to the pad, then full bleed */}
        <motion.div aria-hidden style={{ clipPath: clip }} className="absolute inset-0 z-20">
          <motion.div style={{ scale: imgScale }} className="absolute inset-0">
            <Image src={time.image} alt="" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
          <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-gradient-to-t from-ink/75 via-ink/15 to-transparent" />
          <motion.div style={{ opacity: shade, y: capY }} className="absolute inset-x-0 bottom-0 mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-8 px-12 pb-14 lg:px-20">
            <div>
              <Chapter n="✓" title={range || time.label} dark className="!text-cream/85" />
              <div className="mt-4 max-w-[900px] font-display text-[clamp(56px,7vw,120px)] font-extrabold leading-[0.9] tracking-[-0.055em] text-cream">
                {time.promise}.
              </div>
            </div>
            {total > 0 && (
              <div className="pb-3 text-right font-serif text-3xl italic text-cream/90">
                {plural(total, 'night')}, all hosted.
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* The pad */}
        <div
          className="absolute z-30 [perspective:1800px]"
          style={{ top: `${BOX.top}%`, right: `${BOX.right}%`, bottom: `${BOX.bottom}%`, left: `${BOX.left}%` }}
        >
          <motion.div style={{ opacity: binderO }} className="pointer-events-none absolute -top-5 left-0 right-0 z-[60] flex justify-center gap-[38%]">
            <Ring />
            <Ring />
          </motion.div>
          {pages.map((k, i) => (
            <Page key={k || i} i={i} n={pages.length} dayKey={k} label={time.label} count={k ? byDay.get(k)?.length ?? 0 : total} list={k ? byDay.get(k) ?? [] : []} p={p} reduce={reduce} />
          ))}
        </div>

        <motion.div
          style={{ opacity: cueO }}
          className="absolute bottom-6 left-12 z-40 flex items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 lg:left-20"
        >
          <span className="h-px w-8 bg-ink/25" /> Scroll to tear off {pages.length > 1 ? 'the days' : 'the page'}
        </motion.div>
      </div>

      {/* ── Mobile cover ── */}
      <div className="px-6 pb-16 pt-28 md:hidden">
        <div className="flex flex-col gap-4">
          <Breadcrumbs crumbs={crumbs} />
          <Chapter n="00" title={`The calendar · ${place.name}`} />
        </div>
        <div className="mt-6">{title}</div>
        <div className="mt-5">{dateLine}</div>
        <p className="mt-5 font-sans text-lg leading-relaxed text-ink-2">{time.heroLine}</p>
        <div className="mt-7 flex flex-col gap-4">
          {ctas}
          {count}
        </div>

        <div className="relative mt-12 aspect-[4/5] [perspective:1400px]">
          <div className="absolute inset-0 overflow-hidden rounded-[28px] bg-tile">
            <Image src={time.image} alt={`${time.label} in ${place.name}`} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 font-display text-[40px] font-extrabold leading-[0.95] tracking-[-0.05em] text-cream">{time.promise}.</div>
          </div>
          <div className="pointer-events-none absolute -top-4 left-0 right-0 z-[60] flex justify-center gap-[38%]">
            <Ring />
            <Ring />
          </div>
          {pages.map((k, i) => (
            <MobilePage key={k || i} i={i} n={pages.length} dayKey={k} label={time.label} count={k ? byDay.get(k)?.length ?? 0 : total} list={k ? byDay.get(k) ?? [] : []} reduce={reduce} />
          ))}
        </div>
      </div>
    </section>
  )
}

function Ring() {
  return (
    <div className="flex flex-col items-center">
      <div className="h-9 w-3.5 rounded-full border-[3px] border-ink/80 bg-cream shadow-[0_3px_0_rgb(23_19_16/0.15)]" />
    </div>
  )
}

/** One sheet of the pad: month band, the date set huge, how many nights it has. */
function Sheet({ dayKey, label, count, list, i, n }: { dayKey: string; label: string; count: number; list: SampleEvent[]; i: number; n: number }) {
  const d = keyParts(dayKey)
  const tints = ['bg-blush', 'bg-sage', 'bg-sky']
  return (
    <div className="flex size-full flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_1px_0_rgb(23_19_16/0.05),0_30px_60px_-30px_rgb(23_19_16/0.35)]">
      <div className={`flex items-center justify-between px-7 pb-4 pt-8 ${tints[i % tints.length]}`}>
        <span className="font-sans text-xs font-bold uppercase tracking-[0.22em] text-ink">{d ? `${d.month} ${d.year}` : label}</span>
        <span className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink/60">{n > 1 ? `Page ${i + 1} of ${n}` : 'One night'}</span>
      </div>
      {/* Perforation */}
      <div aria-hidden className="h-[3px] [background-image:radial-gradient(circle,rgb(23_19_16/0.25)_1.2px,transparent_1.5px)] [background-size:9px_3px]" />
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="font-serif text-[clamp(26px,3.4vh,42px)] italic leading-none text-orange">{d ? d.weekday : label}</div>
        <div className="mt-2 font-display text-[clamp(104px,min(14vw,25vh),240px)] font-extrabold leading-[0.8] tracking-[-0.07em] text-ink">
          {d ? d.day : '·'}
        </div>
      </div>
      {/* Diary lines: what's pencilled in */}
      {list.length > 0 && (
        <ul className="px-7 pb-2">
          {list.slice(0, 3).map((e, k) => (
            <li key={e.id} className={`flex items-baseline gap-3 border-t border-dashed border-ink/15 py-2 ${k === 2 ? '[@media(max-height:820px)]:hidden' : ''}`}>
              <span className="w-[64px] shrink-0 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-orange">{eventTime(e)}</span>
              <span className="truncate font-serif text-[19px] italic leading-tight text-ink">{e.title}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center justify-between border-t border-line px-7 py-5">
        <span className="font-sans text-sm font-bold text-ink-2">
          {count > 0 ? (
            <>
              <span className="font-display text-xl font-extrabold text-ink">{count}</span> {count === 1 ? 'night' : 'nights'} pencilled in
            </>
          ) : (
            'Nothing pencilled in yet'
          )}
        </span>
        <span className="font-serif text-lg italic text-ink-3">{label}</span>
      </div>
    </div>
  )
}

function Page({ i, n, dayKey, label, count, list, p, reduce }: { i: number; n: number; dayKey: string; label: string; count: number; list: SampleEvent[]; p: MotionValue<number>; reduce: boolean }) {
  const seg = (TEAR[1] - TEAR[0]) / n
  const a = TEAR[0] + seg * i
  const b = a + seg
  const side = i % 2 ? 1 : -1
  const rotateX = useTransform(p, [a, b], [0, reduce ? 0 : 70])
  const rotateZ = useTransform(p, [a, b], [r2(side * 0.6 * (i ? 1 : 0)), reduce ? 0 : side * 9])
  const y = useTransform(p, [a, b], [Math.min(i, 3) * 7, reduce ? 0 : -320])
  const x = useTransform(p, [a, b], [0, reduce ? 0 : side * 60])
  const opacity = useTransform(p, [a + seg * 0.45, b], [1, 0])
  return (
    <motion.div
      className="absolute inset-0 origin-top will-change-transform"
      style={{ zIndex: 50 - i, rotateX, rotateZ, y, x, opacity }}
    >
      <Sheet dayKey={dayKey} label={label} count={count} list={list} i={i} n={n} />
    </motion.div>
  )
}

function MobilePage({ i, n, dayKey, label, count, list, reduce }: { i: number; n: number; dayKey: string; label: string; count: number; list: SampleEvent[]; reduce: boolean }) {
  const side = i % 2 ? 1 : -1
  return (
    <motion.div
      className="absolute inset-0 origin-top"
      style={{ zIndex: 50 - i }}
      initial={{ y: Math.min(i, 3) * 6, rotate: 0, rotateX: 0, opacity: 1 }}
      whileInView={{ y: -260, rotate: side * 10, rotateX: 60, opacity: 0, transitionEnd: { display: 'none' } }}
      viewport={{ once: true, amount: 0.7 }}
      transition={reduce ? { duration: 0 } : { duration: 0.9, ease: EASE, delay: 0.5 + i * 0.45 }}
    >
      <Sheet dayKey={dayKey} label={label} count={count} list={list} i={i} n={n} />
    </motion.div>
  )
}
