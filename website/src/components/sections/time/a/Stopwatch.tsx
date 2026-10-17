'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { TimeContent } from '@/lib/time'
import { cn } from '@/lib/cn'
import { EASE, Head, lower, pad } from './kit'

// Dial geometry in a 400-unit viewBox.
const C = 200
const RAD = 168
const LAPS = [0, 1, 2, 3].map(i => {
  const a = (i / 4) * Math.PI * 2 - Math.PI / 2
  return { x: Math.round((C + Math.cos(a) * RAD) * 100) / 100, y: Math.round((C + Math.sin(a) * RAD) * 100) / 100, lx: Math.round((C + Math.cos(a) * (RAD + 26)) * 100) / 100, ly: Math.round((C + Math.sin(a) * (RAD + 26)) * 100) / 100 }
})

/**
 * Chapter 02, make it happen in time. Pinned on desktop: a stopwatch whose
 * ring sweeps round as you scroll, one lap per step, while the step list on
 * the left advances and the face swaps to the current step. Stacked on phones.
 */
export function Stopwatch({ time }: { time: TimeContent }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(p, 'change', v => setStep(Math.max(0, Math.min(3, Math.floor(v * 4.15)))))
  const sweep = useTransform(p, [0.02, 0.92], [0, 1])
  const handRot = useTransform(sweep, v => Math.round(v * 3600) / 10)
  const steps = time.steps

  const head = <Head n="04" label="In time" title="Make it happen" serif={`${lower(time)}.`} />

  return (
    <>
      <section ref={ref} className="relative hidden bg-paper lg:block lg:h-[400vh]">
        <div className="sticky top-0 flex h-screen items-center px-20">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_minmax(0,0.95fr)] items-center gap-16">
            <div>
              {head}
              <ol className="mt-12 grid gap-1">
                {steps.map((s, i) => {
                  const on = i === step
                  return (
                    <li key={s.title} className="relative grid grid-cols-[64px_1fr] gap-x-4 py-4">
                      <span className={cn('font-display text-[34px] font-extrabold leading-none tracking-[-0.05em] tabular-nums transition-colors duration-500', on ? 'text-brand' : i < step ? 'text-ink' : 'text-ink/20')}>
                        {pad(i + 1)}
                      </span>
                      <div className={cn('transition-opacity duration-500', on ? 'opacity-100' : 'opacity-40')}>
                        <div className="font-display text-[clamp(24px,2.3vw,34px)] font-extrabold leading-tight tracking-[-0.035em]">{s.title}</div>
                        <div className="grid transition-[grid-template-rows] duration-500" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                          <p className="overflow-hidden font-sans text-lg leading-relaxed text-ink-2">
                            <span className="block max-w-[460px] pt-1.5">{s.body}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            {/* The stopwatch */}
            <div className="relative mx-auto aspect-square w-[min(68vh,560px)]">
              {/* Crown and side button */}
              <div aria-hidden className="absolute left-1/2 top-[-4.5%] h-[5%] w-[14%] -translate-x-1/2 rounded-t-[10px] bg-ink" />
              <div aria-hidden className="absolute left-1/2 top-[-7.5%] h-[3.5%] w-[22%] -translate-x-1/2 rounded-full bg-ink" />
              <div aria-hidden className="absolute right-[8%] top-[6%] h-[4%] w-[9%] rotate-45 rounded-full bg-ink/80" />

              <div className="absolute inset-0 rounded-full bg-white shadow-pop" />
              <svg viewBox="0 0 400 400" aria-hidden className="absolute inset-0 size-full overflow-visible">
                <defs>
                  <linearGradient id="ta-sweep" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#FF3864" />
                  </linearGradient>
                </defs>
                {Array.from({ length: 120 }, (_, i) => {
                  const a = (i / 120) * Math.PI * 2 - Math.PI / 2
                  const major = i % 10 === 0
                  const r1 = major ? 136 : 144
                  return (
                    <line
                      key={i}
                      x1={(C + Math.cos(a) * r1).toFixed(2)}
                      y1={(C + Math.sin(a) * r1).toFixed(2)}
                      x2={(C + Math.cos(a) * 152).toFixed(2)}
                      y2={(C + Math.sin(a) * 152).toFixed(2)}
                      stroke="#171310"
                      strokeOpacity={major ? 0.55 : 0.16}
                      strokeWidth={major ? 2 : 1}
                    />
                  )
                })}
                <circle cx={C} cy={C} r={RAD} fill="none" stroke="#171310" strokeOpacity={0.08} strokeWidth={10} />
                <motion.circle
                  cx={C}
                  cy={C}
                  r={RAD}
                  fill="none"
                  stroke="url(#ta-sweep)"
                  strokeWidth={10}
                  strokeLinecap="round"
                  transform={`rotate(-90 ${C} ${C})`}
                  style={{ pathLength: reduce ? 1 : sweep }}
                />
                {LAPS.map((l, i) => (
                  <g key={i}>
                    <circle cx={l.x} cy={l.y} r={11} fill={i <= step ? '#171310' : '#FFFFFF'} stroke="#171310" strokeWidth={2} style={{ transition: 'fill .4s' }} />
                    <text x={l.x} y={l.y + 4} textAnchor="middle" fontSize="11" fontWeight={800} fill={i <= step ? '#F1E9D8' : '#171310'} className="font-display">
                      {i + 1}
                    </text>
                  </g>
                ))}
                {/* The hand */}
                <motion.g style={{ rotate: reduce ? 0 : handRot }}>
                  <circle cx={C} cy={C} r={130} fill="none" />
                  <line x1={C} y1={C + 18} x2={C} y2={C - 128} stroke="#FF3864" strokeWidth={3} strokeLinecap="round" />
                </motion.g>
                <circle cx={C} cy={C} r={8} fill="#171310" />
              </svg>

              {/* The face */}
              <div className="absolute inset-[24%] grid place-items-center text-center">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={reduce ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -14 }}
                    transition={{ duration: 0.4, ease: EASE }}
                    className="rounded-2xl bg-white/85 px-3 py-2 backdrop-blur-sm"
                  >
                    <div className="font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">Lap {step + 1} of 4</div>
                    <div className="mt-1 font-display text-[clamp(26px,2.6vw,38px)] font-extrabold leading-[0.95] tracking-[-0.045em] text-ink">{steps[step]?.title}</div>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Phones and tablets */}
      <section className="bg-paper px-6 py-24 md:px-12 lg:hidden">
        {head}
        <ol className="relative mt-10 grid gap-4">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="flex gap-4 rounded-[24px] bg-white p-5 shadow-soft"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-ink font-display text-lg font-extrabold text-cream">{pad(i + 1)}</span>
              <div>
                <div className="font-display text-2xl font-extrabold tracking-[-0.035em]">{s.title}</div>
                <p className="mt-1 font-sans text-base leading-relaxed text-ink-2">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  )
}
