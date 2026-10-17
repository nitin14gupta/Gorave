'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { HOST_BADGES, SAFETY_FEATURES, STAGES, type SafetyFeature } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { TicketCard } from '@/components/ui/TicketCard'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const N = SAFETY_FEATURES.length
/** Scroll progress at which row i switches on. */
const at = (i: number) => 0.03 + (0.9 * (i + 0.5)) / N

/**
 * Chapter 01, the journey. The section pins; as you scroll through one
 * night out, each protection switches on in the order you'd meet it,
 * its check mark drawing in. Small screens get the same night as a list.
 */
export function JourneyA() {
  return (
    <div id="journey" className="scroll-mt-0">
      <JourneyPinned />
      <JourneyList />
    </div>
  )
}

function JourneyPinned() {
  const ref = useRef<HTMLElement>(null)
  const [on, setOn] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => {
    setOn(Math.max(0, Math.min(N, Math.floor(((v - 0.03) / 0.9) * N + 0.5))))
  })
  const active = SAFETY_FEATURES[Math.max(0, on - 1)]
  const stage = STAGES.find(s => s.key === active.stage)!

  return (
    <section ref={ref} className="relative hidden bg-cream md:block md:h-[440vh]">
      <div className="sticky top-0 flex h-screen items-center px-20">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-16 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <Chapter n="01" title="The journey" />
            <h2 className="mt-4 font-display text-[clamp(44px,5.4vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              One night out,<br />layer by layer.
            </h2>

            <div className="mt-8 flex items-baseline gap-4">
              <div className="relative h-[1.1em] overflow-hidden font-serif text-[clamp(44px,4.6vw,68px)] italic leading-none text-orange">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={stage.key}
                    className="block"
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    transition={{ duration: 0.6, ease: EASE }}
                  >
                    {stage.label}
                  </motion.span>
                </AnimatePresence>
              </div>
              <div className="font-sans text-base text-ink-2">{stage.line}</div>
            </div>

            <div className="relative mt-6 h-[270px] max-w-[540px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={active.key}
                  initial={{ opacity: 0, y: 24, rotate: 1 }}
                  animate={{ opacity: on ? 1 : 0.4, y: 0, rotate: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="absolute inset-0 flex gap-6 rounded-[28px] bg-white p-6 shadow-soft"
                >
                  <div className="flex-1">
                    <div className="font-display text-[28px] font-extrabold leading-tight tracking-[-0.03em]">{active.title}</div>
                    <p className="mt-2 font-sans text-[15px] leading-relaxed text-ink-2">{active.body}</p>
                  </div>
                  <div className="grid w-[150px] shrink-0 place-items-center">
                    <Visual k={active.key} />
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="rounded-[32px] bg-paper p-6 shadow-soft">
            <div className="flex items-center justify-between border-b border-line pb-4">
              <div>
                <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Your night</div>
                <div className="font-display text-xl font-extrabold tracking-[-0.02em]">Sunset Rooftop Sessions</div>
              </div>
              <div className="flex items-center gap-3">
                <Meter progress={scrollYProgress} />
                <div className="font-display text-2xl font-extrabold tabular-nums">
                  {on}<span className="text-ink-3">/{N}</span>
                </div>
              </div>
            </div>
            {STAGES.map(s => (
              <div key={s.key} className="mt-3">
                <div className="px-2 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">{s.label}</div>
                {SAFETY_FEATURES.map((f, i) => (f.stage === s.key ? <Row key={f.key} i={i} f={f} progress={scrollYProgress} active={on - 1 === i} /> : null))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Meter({ progress }: { progress: MotionValue<number> }) {
  const len = useTransform(progress, [0.03, 0.93], [0, 1])
  return (
    <svg viewBox="0 0 36 36" className="size-9 -rotate-90" aria-hidden>
      <circle cx={18} cy={18} r={15} fill="none" stroke="#ddd2be" strokeWidth={4} />
      <motion.circle cx={18} cy={18} r={15} fill="none" stroke="#00C48C" strokeWidth={4} strokeLinecap="round" style={{ pathLength: len }} />
    </svg>
  )
}

function Row({ i, f, progress, active }: { i: number; f: SafetyFeature; progress: MotionValue<number>; active: boolean }) {
  const a = at(i)
  const draw = useTransform(progress, [a - 0.035, a], [0, 1])
  const fill = useTransform(progress, [a - 0.01, a], ['rgba(0,196,140,0)', 'rgba(0,196,140,1)'])
  const knob = useTransform(progress, [a - 0.02, a], [0, 16])
  const track = useTransform(progress, [a - 0.02, a], ['#ddd2be', '#00C48C'])
  const opacity = useTransform(progress, [a - 0.06, a], [0.4, 1])
  return (
    <motion.div style={{ opacity }} className={cn('flex items-center gap-3 rounded-2xl px-2 py-2 transition-colors duration-300', active && 'bg-white shadow-soft')}>
      <svg viewBox="0 0 24 24" className="size-6 shrink-0" aria-hidden>
        <circle cx={12} cy={12} r={10.5} fill="none" stroke="#ddd2be" strokeWidth={1.5} />
        <motion.circle cx={12} cy={12} r={10.5} fill={fill} stroke="#00C48C" strokeWidth={1.5} style={{ pathLength: draw, rotate: -90 }} />
        <motion.path d="M7.5 12.4 L10.6 15.4 L16.6 9.2" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: draw }} />
      </svg>
      <div className="min-w-0 flex-1">
        <div className="font-sans text-[15px] font-bold leading-tight">{f.title}</div>
        <div className="truncate font-sans text-xs text-ink-3">{f.short}</div>
      </div>
      <motion.div className="relative h-5 w-9 shrink-0 rounded-full" style={{ backgroundColor: track }}>
        <motion.span className="absolute left-0.5 top-0.5 size-4 rounded-full bg-white shadow" style={{ x: knob }} />
      </motion.div>
    </motion.div>
  )
}

/** A small illustration for the active protection. */
function Visual({ k }: { k: string }) {
  switch (k) {
    case 'verified':
      return (
        <div className="w-full rounded-2xl bg-cream p-3 text-center font-sans">
          <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Phone</div>
          <div className="mt-1 text-sm font-bold tabular-nums">+91 98••• ••210</div>
          <div className="mt-2 inline-flex rounded-full bg-green px-2.5 py-1 text-[11px] font-bold text-white">Verified · 18+</div>
        </div>
      )
    case 'request':
      return (
        <div className="w-full rounded-2xl bg-cream p-3 font-sans">
          <div className="text-sm font-bold">Riya wants to join</div>
          <div className="text-[11px] text-ink-3">24 · 3 mutuals</div>
          <div className="mt-2 flex gap-1.5">
            <span className="flex-1 rounded-full bg-ink py-1 text-center text-[11px] font-bold text-cream">Accept</span>
            <span className="flex-1 rounded-full bg-white py-1 text-center text-[11px] font-bold">Decline</span>
          </div>
        </div>
      )
    case 'mix':
      return (
        <div className="w-full font-sans">
          <div className="flex h-10 overflow-hidden rounded-xl">
            <motion.div className="bg-coral" initial={{ width: '30%' }} animate={{ width: '50%' }} transition={{ duration: 0.8, ease: EASE }} />
            <div className="flex-1 bg-orange" />
          </div>
          <div className="mt-2 flex justify-between text-[11px] font-bold text-ink-2"><span>Women 50</span><span>Men 50</span></div>
          <div className="mt-2 inline-flex rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold text-cream">21+</div>
        </div>
      )
    case 'address':
      return (
        <div className="relative grid size-[140px] place-items-center rounded-full bg-cream">
          <span className="absolute inset-3 rounded-full border-2 border-dashed border-orange/60" />
          <div className="text-center font-sans">
            <div className="text-sm font-bold">Bandra W</div>
            <div className="text-[11px] text-ink-3">~1 km area</div>
          </div>
        </div>
      )
    case 'payments':
      return (
        <div className="grid w-full gap-1.5 font-sans">
          {['UPI', 'Wallet'].map(m => (
            <div key={m} className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-[13px] font-bold">
              {m}<span className="text-green">✓</span>
            </div>
          ))}
          <div className="rounded-xl border border-dashed border-ink/20 px-3 py-2 text-center text-[12px] font-bold text-ink-3 line-through">Cash at door</div>
        </div>
      )
    case 'qr':
      return <TicketCard width={128} backdrop="#fff" className="rotate-[-4deg]" />
    case 'sos':
      return (
        <div className="relative grid size-[120px] place-items-center">
          <motion.span
            className="absolute size-16 rounded-full border-2 border-coral"
            initial={{ scale: 1, opacity: 0.7 }}
            animate={{ scale: 1.9, opacity: 0 }}
            transition={{ duration: 1.1, ease: EASE, delay: 0.2 }}
          />
          <span className="relative grid size-16 place-items-center rounded-full bg-coral font-display text-lg font-extrabold text-white shadow-pop">SOS</span>
        </div>
      )
    case 'reviews':
      return (
        <div className="grid grid-cols-2 gap-2">
          {HOST_BADGES.map((b, i) => (
            <motion.div key={b.key} initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.08, duration: 0.4, ease: EASE }} className="text-center">
              <Image src={b.src} alt={`${b.label} host badge`} width={52} height={52} className="mx-auto size-[52px] object-contain" />
              <div className="font-sans text-[10px] font-bold text-ink-2">{b.label}</div>
            </motion.div>
          ))}
        </div>
      )
    default:
      return (
        <div className="grid w-full gap-1.5 font-sans text-[13px] font-bold">
          <div className="rounded-xl bg-cream px-3 py-2">⚑ Report event</div>
          <div className="rounded-xl bg-cream px-3 py-2">⊘ Block user</div>
        </div>
      )
  }
}

function JourneyList() {
  return (
    <section className="bg-cream px-6 py-20 md:hidden">
      <Chapter n="01" title="The journey" />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">One night out,<br />layer by layer.</h2>
      {STAGES.map(s => (
        <div key={s.key} className="mt-10">
          <div className="font-serif text-4xl italic text-orange">{s.label}</div>
          <div className="font-sans text-sm text-ink-2">{s.line}</div>
          <div className="mt-4 grid gap-3">
            {SAFETY_FEATURES.filter(f => f.stage === s.key).map(f => (
              <motion.div
                key={f.key}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, ease: EASE }}
                className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft"
              >
                <svg viewBox="0 0 24 24" className="mt-0.5 size-6 shrink-0" aria-hidden>
                  <motion.circle cx={12} cy={12} r={10.5} fill="#00C48C" initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.2 }} style={{ transformOrigin: '12px 12px' }} />
                  <motion.path d="M7.5 12.4 L10.6 15.4 L16.6 9.2" fill="none" stroke="#fff" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} whileInView={{ pathLength: 1 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: 0.5 }} />
                </svg>
                <div>
                  <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{f.title}</div>
                  <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
