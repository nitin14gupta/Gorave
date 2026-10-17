'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { TimeContent } from '@/lib/time'
import { cn } from '@/lib/cn'
import { EASE, Head, lower, pad } from './kit'

const PAGES = [
  { bg: 'bg-blush', ink: 'text-blush-ink', num: 'text-coral' },
  { bg: 'bg-sage', ink: 'text-sage-ink', num: 'text-[#3E7A4F]' },
  { bg: 'bg-sky', ink: 'text-sky-ink', num: 'text-[#2F5E92]' },
  { bg: 'bg-white', ink: 'text-ink', num: 'text-orange' },
] as const

// Rest tilt of each page in the pad, so the stack reads as paper.
const TILT = [0, -2.2, 1.8, -1.2]

const tear = (i: number) => [0.08 + i * 0.27, 0.3 + i * 0.27]

/**
 * Chapter 03, why this window works. A tear-off calendar pad, pinned on
 * desktop: scroll and each page rips off and falls away to reveal the next
 * reason, while the index on the left keeps count. Stacked pages on phones.
 */
export function TearOff({ time, place }: { time: TimeContent; place: { name: string; citySlug: string | null } }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [on, setOn] = useState(0)
  useMotionValueEvent(p, 'change', v => setOn([0, 1, 2].filter(i => v >= (tear(i)[0] + tear(i)[1]) / 2).length))
  const where = place.citySlug ? place.name : 'India'
  const why = time.why

  const head = <Head n="05" label="Why now" title={`Why ${lower(time)}`} serif="works." />

  return (
    <>
      <section ref={ref} className="relative hidden bg-cream lg:block lg:h-[380vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-20">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_minmax(0,1fr)] items-center gap-16">
            <div>
              {head}
              <ul className="mt-12 grid gap-3">
                {why.map((w, i) => (
                  <li key={w.title} className="flex items-center gap-4">
                    <span className={cn('h-[2px] rounded-full transition-all duration-500', i === on ? 'w-12 bg-brand' : i < on ? 'w-6 bg-ink' : 'w-6 bg-ink/15')} />
                    <span className={cn('font-sans text-lg font-bold transition-colors duration-500', i === on ? 'text-ink' : i < on ? 'text-ink-3 line-through decoration-ink/30' : 'text-ink-3')}>
                      {w.title}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-10 font-serif text-2xl italic text-ink-2">
                <span className="text-orange">{pad(on + 1)}</span> / {pad(why.length)}
              </div>
            </div>

            <div className="relative mx-auto h-[min(66vh,580px)] w-[min(34vw,470px)]">
              {why
                .map((w, i) => ({ w, i }))
                .reverse()
                .map(({ w, i }) => (
                  <Page key={w.title} i={i} last={i === why.length - 1} p={p} reduce={!!reduce} title={w.title} body={w.body} label={time.label} where={where} />
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Phones and tablets */}
      <section className="bg-cream px-6 py-24 md:px-12 lg:hidden">
        {head}
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {why.map((w, i) => (
            <motion.div
              key={w.title}
              initial={reduce ? false : { opacity: 0, y: 40, rotate: i % 2 ? 2 : -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: TILT[i] / 2 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.8, ease: EASE }}
            >
              <Sheet i={i} title={w.title} body={w.body} label={time.label} where={where} />
            </motion.div>
          ))}
        </div>
      </section>
    </>
  )
}

function Page({ i, last, p, reduce, ...sheet }: { i: number; last: boolean; p: MotionValue<number>; reduce: boolean; title: string; body: string; label: string; where: string }) {
  const t = useTransform(p, tear(i), [0, 1])
  const rotate = useTransform(t, v => Math.round((TILT[i] + (last || reduce ? 0 : v * -32)) * 100) / 100)
  const x = useTransform(t, v => (last ? '0%' : `${Math.round(v * -70)}%`))
  const y = useTransform(t, v => (last ? '0%' : `${Math.round(v * v * 120)}%`))
  const opacity = useTransform(t, [0, 0.55, 1], last ? [1, 1, 1] : [1, 1, 0])
  return (
    <motion.div className="absolute inset-0 origin-top-left" style={{ rotate, x, y, opacity, zIndex: 10 - i }}>
      <Sheet i={i} {...sheet} tall />
    </motion.div>
  )
}

function Sheet({ i, title, body, label, where, tall }: { i: number; title: string; body: string; label: string; where: string; tall?: boolean }) {
  const c = PAGES[i % PAGES.length]
  return (
    <div className={cn('relative flex flex-col overflow-hidden rounded-[26px] shadow-pop', c.bg, c.ink, tall ? 'h-full' : 'min-h-[340px]')}>
      {/* Binding */}
      <div className="flex h-12 shrink-0 items-center justify-center gap-[38%] bg-ink">
        <span className="size-4 rounded-full bg-cream" />
        <span className="size-4 rounded-full bg-cream" />
      </div>
      <div className="relative flex flex-1 flex-col p-7 md:p-9">
        <div className="flex items-center justify-between font-sans text-xs font-bold uppercase tracking-[0.18em] opacity-70">
          <span>{label}</span>
          <span>{where}</span>
        </div>
        <div className={cn('mt-2 font-display text-[clamp(110px,11vw,180px)] font-extrabold leading-[0.8] tracking-[-0.07em]', c.num)}>{pad(i + 1)}</div>
        <div className="mt-auto pt-6">
          <div className="font-display text-[clamp(28px,2.6vw,40px)] font-extrabold leading-[0.95] tracking-[-0.045em]">{title}</div>
          <p className="mt-3 max-w-[380px] font-sans text-lg leading-relaxed opacity-80">{body}</p>
        </div>
      </div>
      {/* Perforation */}
      <div aria-hidden className="absolute inset-x-0 top-12 border-t-2 border-dashed border-ink/15" />
    </div>
  )
}
