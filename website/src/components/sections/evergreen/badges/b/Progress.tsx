'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { BadgeTier } from '@/lib/pagesData'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { BadgeArt, EASE, Head, TIER_LOOK, r2 } from '../kit'

// The slider runs on a square-root scale so 2 and 10 aren't squashed at the start.
const MAX = 100
const STEPS = 1000
const toNights = (s: number) => Math.round(MAX * (s / STEPS) ** 2)
const toStep = (n: number) => Math.round(Math.sqrt(n / MAX) * STEPS)
const pos = (n: number) => r2(Math.sqrt(n / MAX) * 100)

/**
 * Chapter 02, try it. Drag the number of events you might host and see the
 * card you'd be holding, how far to the next one, and the ladder lit so far.
 * Clearly an example: the real count comes from the app.
 */
export function Progress({ tiers }: { tiers: BadgeTier[] }) {
  const reduce = !!useReducedMotion()
  const id = useId()
  const [step, setStep] = useState(toStep(12))
  const nights = toNights(step)
  const current = [...tiers].reverse().find(t => nights >= t.at) ?? null
  const next = tiers.find(t => nights < t.at) ?? null
  const prevAt = current?.at ?? 0
  const part = next ? (nights - prevAt) / (next.at - prevAt) : 1
  const look = current ? TIER_LOOK[current.key] : null

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Head n="03" label="Try it" title="Pick a number." serif="See your card." aside="Drag to set how many events you might host. This is an example; your real badge is counted from the events you host." />

        <div className="mt-14 grid items-center gap-10 rounded-[36px] bg-white p-6 shadow-soft md:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16 lg:p-14">
          {/* Controls */}
          <div>
            <div className="flex items-end gap-4">
              <motion.div
                key={nights}
                initial={reduce ? false : { y: 8, opacity: 0.4 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.25 }}
                className="font-display text-[clamp(96px,11vw,168px)] font-extrabold leading-[0.8] tracking-[-0.07em] tabular-nums"
              >
                {nights}
              </motion.div>
              <div className="pb-2 font-sans text-sm font-bold uppercase leading-snug tracking-[0.16em] text-ink-3">
                events
                <br />
                hosted
              </div>
            </div>

            <label htmlFor={id} className="sr-only">Events hosted, example</label>
            <div className="relative mt-10 pb-[72px]">
              <div className="absolute inset-x-0 top-0 h-10 rounded-full bg-cream" />
              {/* Inset by half the thumb so marks line up with where the thumb sits */}
              <div className="absolute inset-x-[18px] top-0 h-10">
              <div className="absolute inset-y-0 -left-[18px] rounded-full bg-brand" style={{ width: `calc(${pos(nights)}% + 36px)` }} />
              {tiers.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setStep(toStep(t.at))}
                  className="group absolute top-[calc(100%+12px)] -translate-x-1/2"
                  style={{ left: `${pos(t.at)}%` }}
                >
                  <span className={cn('mx-auto block h-2.5 w-[2px] rounded-full transition-colors', nights >= t.at ? 'bg-coral' : 'bg-ink/20')} />
                  <span className="mt-1 block w-max text-center">
                    <span className="block font-sans text-[13px] font-bold text-ink transition-colors group-hover:text-orange">{t.at}</span>
                    <span className="hidden font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink-3 sm:block">{t.name}</span>
                  </span>
                </button>
              ))}
              </div>
              <input
                id={id}
                type="range"
                min={0}
                max={STEPS}
                value={step}
                onChange={e => setStep(Number(e.target.value))}
                aria-valuetext={`${nights} events hosted`}
                className="relative z-10 block h-10 w-full cursor-grab appearance-none bg-transparent active:cursor-grabbing [&::-moz-range-thumb]:size-9 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-white [&::-moz-range-thumb]:bg-ink [&::-webkit-slider-thumb]:size-9 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:bg-ink [&::-webkit-slider-thumb]:shadow-pop"
              />
            </div>

            <div className="min-h-[64px] font-sans text-lg text-ink-2">
              {next ? (
                <>
                  <span className="font-bold text-ink">{next.at - nights} more</span> to {next.name}.
                  <div className="mt-3 h-2 w-full max-w-[360px] overflow-hidden rounded-full bg-cream">
                    <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${r2(part * 100)}%`, background: TIER_LOOK[next.key].color }} />
                  </div>
                </>
              ) : (
                <span className="font-bold text-ink">The top of the ladder. Nothing above Legend.</span>
              )}
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button href="/host">Start hosting</Button>
              <span className="font-sans text-sm text-ink-3">Example only. Nothing is saved.</span>
            </div>
          </div>

          {/* The card you'd hold */}
          <div className="relative mx-auto w-full max-w-[340px] [perspective:1100px]">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={current?.key ?? 'none'}
                initial={reduce ? { opacity: 0 } : { rotateY: -90, opacity: 0.6 }}
                animate={{ rotateY: 0, opacity: 1 }}
                exit={reduce ? { opacity: 0 } : { rotateY: 90, opacity: 0.6 }}
                transition={{ duration: 0.32, ease: EASE }}
                className="relative aspect-[5/7] overflow-hidden rounded-[28px] shadow-pop"
                style={{ background: look ? `linear-gradient(160deg, #fff 0%, ${look.tint} 60%)` : 'linear-gradient(160deg,#fff,#F1E9D8)' }}
              >
                <div className="absolute inset-[10px] rounded-[20px] border" style={{ borderColor: look ? `${look.color}33` : 'rgb(23 19 16 / 0.12)' }} />
                {current ? (
                  <>
                    <div className="absolute inset-x-0 top-[14%] flex justify-center">
                      <BadgeArt tier={current.key} size={180} className="!h-auto !w-[60%] drop-shadow-[0_18px_22px_rgb(23_19_16/0.25)]" />
                    </div>
                    <div className="absolute inset-x-6 bottom-6">
                      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">You&apos;d be</div>
                      <div className="font-display text-[44px] font-extrabold leading-none tracking-[-0.05em]">{current.name}</div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 grid place-items-center p-8 text-center">
                    <div>
                      <div className="mx-auto grid size-28 place-items-center rounded-[28px] border-2 border-dashed border-ink/20 font-display text-4xl font-extrabold text-ink-3">?</div>
                      <div className="mt-6 font-display text-3xl font-extrabold leading-none tracking-[-0.04em]">No badge yet</div>
                      <div className="mt-2 font-sans text-[15px] text-ink-2">Two hosted events and the first one is yours.</div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex justify-center gap-3">
              {tiers.map(t => (
                <div key={t.key} className={cn('w-12 transition-[filter,opacity,transform] duration-500', nights >= t.at ? 'scale-100 opacity-100' : 'scale-90 opacity-35 grayscale')}>
                  <BadgeArt tier={t.key} size={48} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
