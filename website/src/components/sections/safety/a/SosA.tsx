'use client'

import { useRef, useState } from 'react'
import { animate, AnimatePresence, motion, useMotionValue, useTransform, type AnimationPlaybackControls } from 'motion/react'
import { SOS_CONTACTS } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const HOLD = 1.6 // seconds to fill the ring
const R = 40 // contact orbit radius, % of the stage
const ANGLES = [-90, -18, 54, 126, 198]

/**
 * Chapter 03 — SOS. Press and hold: the ring fills, then lines shoot out to
 * five contacts and each one pings as it "receives" your live location.
 * It's a demo — nothing leaves this page.
 */
export function SosA() {
  const p = useMotionValue(0)
  const ctrl = useRef<AnimationPlaybackControls | null>(null)
  const [holding, setHolding] = useState(false)
  const [sent, setSent] = useState(false)
  const scale = useTransform(p, [0, 1], [1, 0.93])
  const glow = useTransform(p, [0, 1], [0, 0.65])

  function start() {
    if (sent) return
    setHolding(true)
    ctrl.current?.stop()
    ctrl.current = animate(p, 1, {
      duration: HOLD * (1 - p.get()),
      ease: 'linear',
      onComplete: () => {
        setHolding(false)
        setSent(true)
      },
    })
  }
  function cancel() {
    if (sent) return
    setHolding(false)
    ctrl.current?.stop()
    ctrl.current = animate(p, 0, { duration: 0.35, ease: EASE })
  }
  function reset() {
    setSent(false)
    ctrl.current?.stop()
    ctrl.current = animate(p, 0, { duration: 0.5, ease: EASE })
  }

  const label = sent ? 'Sent' : holding ? 'Keep holding' : 'Hold for SOS'

  return (
    <section className="relative overflow-hidden bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1fr_1.15fr]">
        <div>
          <Chapter n="03" title="The SOS" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            One tap.<br />Five people <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">know where you are.</span>
          </h2>
          <p className="mt-5 max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Add up to five emergency contacts in the app. If you need them, one tap shares your live location with all of them — and it keeps sharing even with the app in the background.
          </p>
          <ul className="mt-7 grid max-w-[460px] gap-2.5 font-sans text-[15px] text-noir-ink-2">
            <li className="flex gap-3"><span className="text-green">●</span>Set your contacts before your first event.</li>
            <li className="flex gap-3"><span className="text-green">●</span>Works in the background while you&apos;re on another app.</li>
            <li className="flex gap-3"><span className="text-green">●</span>For emergencies, still call 112 as well.</li>
          </ul>
        </div>

        <div className="relative mx-auto aspect-square w-full max-w-[560px] select-none">
          <div className="absolute left-0 top-0 z-20 rounded-full bg-noir-3 px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">
            Demo · nothing is sent
          </div>

          <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden>
            <circle cx={50} cy={50} r={R} fill="none" stroke="#F5F0EB" strokeOpacity={0.08} strokeWidth={0.3} strokeDasharray="0.8 1.6" />
            {ANGLES.map((a, i) => {
              const rad = (a * Math.PI) / 180
              return (
                <motion.line
                  key={a}
                  x1={50} y1={50} x2={50 + Math.cos(rad) * R} y2={50 + Math.sin(rad) * R}
                  stroke="#00C48C" strokeWidth={0.4} strokeLinecap="round"
                  initial={false}
                  animate={{ pathLength: sent ? 1 : 0, opacity: sent ? 0.8 : 0 }}
                  transition={{ duration: 0.5, ease: EASE, delay: sent ? i * 0.18 : 0 }}
                />
              )
            })}
          </svg>

          {SOS_CONTACTS.map((c, i) => {
            const rad = (ANGLES[i] * Math.PI) / 180
            return (
              <div
                key={c.name}
                className="absolute z-10 flex w-[84px] -translate-x-1/2 -translate-y-1/2 flex-col items-center text-center"
                style={{ left: `${50 + Math.cos(rad) * R}%`, top: `${50 + Math.sin(rad) * R}%` }}
              >
                <div className="relative">
                  {sent && (
                    <motion.span
                      className="absolute inset-0 rounded-full border-2 border-green"
                      initial={{ scale: 1, opacity: 0.8 }}
                      animate={{ scale: 2.1, opacity: 0 }}
                      transition={{ duration: 1, ease: EASE, delay: 0.4 + i * 0.18 }}
                    />
                  )}
                  <motion.div
                    initial={false}
                    animate={{ backgroundColor: sent ? '#00C48C' : '#222222', scale: sent ? [1, 1.25, 1] : 1 }}
                    transition={{ duration: 0.5, delay: sent ? 0.4 + i * 0.18 : 0 }}
                    className="relative grid size-12 place-items-center rounded-full font-display text-lg font-extrabold text-noir-ink md:size-14"
                  >
                    {c.name[0]}
                  </motion.div>
                </div>
                <div className="mt-1.5 font-sans text-[13px] font-bold">{c.name}</div>
                <div className="h-4 font-sans text-[11px] text-noir-ink-2">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={String(sent)}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.3, delay: sent ? 0.5 + i * 0.18 : 0 }}
                      className={cn('block', sent && 'text-green')}
                    >
                      {sent ? 'Location shared' : c.rel}
                    </motion.span>
                  </AnimatePresence>
                </div>
              </div>
            )
          })}

          {/* the button */}
          <div className="absolute left-1/2 top-1/2 size-[42%] -translate-x-1/2 -translate-y-1/2">
            <motion.div aria-hidden className="absolute -inset-6 rounded-full bg-coral blur-2xl" style={{ opacity: glow }} />
            <svg viewBox="0 0 100 100" className="absolute inset-0 size-full -rotate-90" aria-hidden>
              <circle cx={50} cy={50} r={47} fill="none" stroke="#F5F0EB" strokeOpacity={0.12} strokeWidth={3} />
              <motion.circle cx={50} cy={50} r={47} fill="none" stroke="#FF3864" strokeWidth={3} strokeLinecap="round" style={{ pathLength: p }} />
            </svg>
            <motion.button
              type="button"
              aria-label="SOS demo: press and hold"
              style={{ scale, touchAction: 'none' }}
              onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); start() }}
              onPointerUp={cancel}
              onPointerCancel={cancel}
              onContextMenu={e => e.preventDefault()}
              onKeyDown={e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); start() } }}
              onKeyUp={e => { if (e.key === ' ' || e.key === 'Enter') cancel() }}
              className={cn(
                'absolute inset-[9%] grid place-items-center rounded-full font-display font-extrabold text-white outline-none transition-colors focus-visible:ring-4 focus-visible:ring-coral/50',
                sent ? 'bg-green' : 'bg-gradient-to-br from-orange to-coral',
              )}
            >
              <span className="text-center">
                <span className="block text-[clamp(28px,4vw,44px)] leading-none tracking-[-0.04em]">{sent ? '✓' : 'SOS'}</span>
                <span className="mt-1.5 block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-white/85">{label}</span>
              </span>
            </motion.button>
          </div>

          <AnimatePresence>
            {sent && (
              <motion.button
                type="button"
                onClick={reset}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ delay: 1.4 }}
                className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-noir-3 px-4 py-2 font-sans text-xs font-bold text-noir-ink transition-colors hover:bg-noir-2"
              >
                ↺ Run the demo again
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
