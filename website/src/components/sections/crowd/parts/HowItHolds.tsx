'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { cn } from '@/lib/cn'
import { EASE, Head } from './kit'

// Where the photo leans for each step: a slow push-in on a different part of the room.
const FOCUS = [
  { scale: 1.04, x: '0%', y: '0%' },
  { scale: 1.22, x: '6%', y: '4%' },
  { scale: 1.3, x: '-7%', y: '-2%' },
  { scale: 1.16, x: '0%', y: '-6%' },
] as const

type Mock = 'toggle' | 'check' | 'approve' | 'qr' | 'waitlist'
const mockFor = (i: number, title: string): Mock =>
  i === 3 && /waitlist/i.test(title) ? 'waitlist' : (['toggle', 'check', 'approve', 'qr'] as const)[i]

/**
 * Chapter 03, how the app makes it true. Pinned on desktop: four steps on
 * the left, and on the right the photo pushes in to a new corner of the room
 * while a small app card swaps to show that step. A plain list on phones.
 */
export function HowItHolds({ crowd }: Pick<CrowdViewProps, 'crowd'>) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  useMotionValueEvent(scrollYProgress, 'change', v => setStep(Math.max(0, Math.min(3, Math.floor(v * 4.2)))))
  const steps = crowd.how
  const f = FOCUS[step]

  return (
    <>
      <section ref={ref} className="relative hidden bg-paper text-ink md:block md:h-[420vh]">
        <div className="sticky top-0 flex h-screen items-center px-20">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_minmax(0,0.9fr)] items-center gap-16">
            <div>
              <Head n="05" label="How it holds" title="How the app" serif="makes it true." />
              <ol className="mt-12 grid gap-1">
                {steps.map((s, i) => {
                  const on = i === step
                  return (
                    <li key={s.title} className="relative grid grid-cols-[56px_1fr] gap-x-4 py-4">
                      <span className="absolute inset-y-0 left-[18px] w-px bg-ink/15" />
                      <span
                        className="absolute left-[18px] top-0 w-px origin-top bg-brand"
                        style={{ height: '100%', transform: `scaleY(${i < step ? 1 : on ? 0.5 : 0})`, transition: 'transform .6s cubic-bezier(.2,.8,.2,1)' }}
                      />
                      <span
                        className={cn(
                          'relative z-[1] grid size-9 place-items-center rounded-full font-serif text-lg italic transition-all duration-500',
                          on ? 'bg-brand text-white' : i < step ? 'bg-ink text-cream' : 'bg-cream-deep text-ink-3',
                        )}
                      >
                        {i + 1}
                      </span>
                      <div className={cn('transition-opacity duration-500', on ? 'opacity-100' : 'opacity-35')}>
                        <div className="font-display text-[clamp(24px,2.3vw,34px)] font-extrabold leading-tight tracking-[-0.035em]">{s.title}</div>
                        <div
                          className="grid transition-[grid-template-rows] duration-500"
                          style={{ gridTemplateRows: on ? '1fr' : '0fr' }}
                        >
                          <p className="overflow-hidden font-sans text-lg leading-relaxed text-ink-2">
                            <span className="block pt-1.5">{s.body}</span>
                          </p>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ol>
            </div>

            <div className="relative mx-auto aspect-[4/5] h-[min(76vh,720px)] max-w-full">
              <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                <motion.div
                  className="absolute inset-0"
                  animate={reduce ? undefined : { scale: f.scale, x: f.x, y: f.y }}
                  transition={{ duration: 1.2, ease: EASE }}
                >
                  <Image src={crowd.image} alt="" fill sizes="560px" className="object-cover" />
                </motion.div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />
              </div>
              <div className="absolute -left-10 bottom-10 w-[300px]">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={step}
                    initial={reduce ? false : { opacity: 0, y: 24, rotate: -2 }}
                    animate={{ opacity: 1, y: 0, rotate: -1.5 }}
                    exit={{ opacity: 0, y: -16, rotate: 1 }}
                    transition={{ duration: 0.45, ease: EASE }}
                  >
                    <AppCard i={step} crowd={crowd} />
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="absolute right-6 top-6 font-display text-sm font-extrabold text-white/70">0{step + 1} / 04</div>
            </div>
          </div>
        </div>
      </section>

      {/* Phones: the same four steps, stacked */}
      <section className="bg-paper px-6 py-24 text-ink md:hidden">
        <Head n="05" label="How it holds" title="How the app" serif="makes it true." />
        <ol className="mt-10 grid gap-5">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="rounded-[24px] bg-white shadow-soft p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid size-8 place-items-center rounded-full bg-brand font-serif text-base italic text-white">{i + 1}</span>
                <div className="font-display text-2xl font-extrabold tracking-[-0.035em]">{s.title}</div>
              </div>
              <p className="mt-2 font-sans text-base leading-relaxed text-ink-2">{s.body}</p>
              <div className="mt-4"><AppCard i={i} crowd={crowd} /></div>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  )
}

/** A small, generic app card for each step. UI illustration only, no data. */
function AppCard({ i, crowd }: { i: number; crowd: CrowdViewProps['crowd'] }) {
  const s = crowd.how[i]
  const mock = mockFor(i, s.title)
  return (
    <div className="rounded-[22px] bg-paper p-4 text-ink shadow-pop">
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">Step {i + 1}</div>
      <div className="mt-1 font-display text-lg font-extrabold leading-tight tracking-[-0.03em]">{s.title}</div>
      <div className="mt-3 rounded-2xl bg-white p-3">
        {mock === 'toggle' && (
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Crowd</div>
              <div className="font-sans text-sm font-bold">{crowd.label}</div>
            </div>
            <span className="relative h-6 w-11 rounded-full bg-brand"><span className="absolute right-0.5 top-0.5 size-5 rounded-full bg-white" /></span>
          </div>
        )}
        {mock === 'check' && (
          <div className="flex items-center gap-3">
            <span className="size-9 rounded-full bg-tile" />
            <div className="flex-1">
              <div className="h-2 w-24 rounded-full bg-ink/15" />
              <div className="mt-1.5 h-2 w-16 rounded-full bg-ink/10" />
            </div>
            <span className="rounded-full bg-green/15 px-2.5 py-1 font-sans text-xs font-bold text-[#007a57]">✓ Checked</span>
          </div>
        )}
        {mock === 'approve' && (
          <div className="flex items-center gap-2">
            <span className="size-9 rounded-full bg-tile" />
            <div className="h-2 flex-1 rounded-full bg-ink/15" />
            <span className="rounded-full px-3 py-1.5 font-sans text-xs font-bold text-ink-2 shadow-[inset_0_0_0_1.5px_rgb(23_19_16/0.15)]">Decline</span>
            <span className="rounded-full bg-ink px-3 py-1.5 font-sans text-xs font-bold text-cream">Accept</span>
          </div>
        )}
        {mock === 'qr' && (
          <div className="flex items-center gap-3">
            <Qr />
            <div>
              <div className="font-sans text-sm font-bold">Ticket ready</div>
              <div className="font-sans text-xs text-ink-3">Shown at the door</div>
            </div>
          </div>
        )}
        {mock === 'waitlist' && (
          <div className="flex items-center justify-between gap-3">
            <div className="font-sans text-sm font-bold">This side is full</div>
            <span className="rounded-full bg-gold/25 px-3 py-1.5 font-sans text-xs font-bold text-ink">Join waitlist</span>
          </div>
        )}
      </div>
    </div>
  )
}

// A fixed 9×9 pattern: looks like a QR code, encodes nothing.
const QR = ['111101111', '100101001', '101100101', '000011000', '110101011', '001010100', '111100101', '100101110', '111101011']
function Qr() {
  return (
    <svg viewBox="0 0 9 9" className="size-12 shrink-0" shapeRendering="crispEdges" aria-hidden>
      {QR.flatMap((row, y) => [...row].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#171310" /> : null)))}
    </svg>
  )
}
