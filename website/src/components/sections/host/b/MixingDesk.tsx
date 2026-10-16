'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { MIX_PRESETS, customMix, mixSeats, type Mix } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const LEDS = 14
const CHANNELS = [
  { k: 'women', label: 'Women', color: '#FF3864' },
  { k: 'men', label: 'Men', color: '#FF6B35' },
  { k: 'open', label: 'Open', color: '#FFB830' },
] as const

/**
 * Chapter 05 — the mix. The crowd mix as a sound desk: presets are the scene
 * buttons, the Women fader sets a custom split in 10% steps (Men follows),
 * and the Open channel is locked at 10% on split mixes. Meters bounce to the level.
 */
export function MixingDesk() {
  const [mix, setMix] = useState<Mix>(MIX_PRESETS[1])
  const [cap, setCap] = useState(30)
  const [ageGate, setAgeGate] = useState(true)
  const seats = mixSeats(mix, cap)
  const splitLocked = mix.open === 100 || mix.women === 100 || mix.men === 100
  const womenSteps = Math.round(mix.women / 9)

  return (
    <section className="overflow-hidden bg-noir-2 px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_1fr]">
          <div>
            <Chapter n="05" title="The mix" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              You&apos;re on<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">the desk.</span>
            </h2>
          </div>
          <p className="max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Open, 50:50, 60:40, women-only, men-only — or ride the fader for a custom split in 10% steps. On split mixes 10% of seats stay open. Add an age gate if the night needs one.
          </p>
        </div>

        <div className="mt-12 rounded-[36px] bg-[linear-gradient(180deg,#262626,#161616)] p-5 shadow-[inset_0_1px_0_rgb(255_255_255/0.08),0_40px_80px_-40px_rgb(0_0_0/0.9)] md:p-8">
          {/* Scene buttons */}
          <div className="flex flex-wrap gap-2">
            {MIX_PRESETS.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMix(m)}
                aria-pressed={mix.key === m.key}
                className={cn(
                  'rounded-xl px-4 py-2.5 font-sans text-sm font-bold transition-all duration-200 active:translate-y-px',
                  mix.key === m.key ? 'bg-gold text-ink shadow-[0_0_24px_rgb(255_184_48/0.5)]' : 'bg-noir-3 text-noir-ink-2 shadow-[inset_0_-3px_0_rgb(0_0_0/0.4)] hover:text-noir-ink',
                )}
              >
                {m.label}
              </button>
            ))}
            <span className={cn('rounded-xl px-4 py-2.5 font-sans text-sm font-bold', mix.key === 'custom' ? 'bg-gold text-ink' : 'bg-noir-3/50 text-noir-ink-2/60')}>
              {mix.key === 'custom' ? mix.label : 'Custom — ride the fader'}
            </span>
          </div>

          <div className="mt-8 grid gap-6 md:grid-cols-[1fr_auto]">
            <div className="grid grid-cols-3 gap-3 md:gap-6">
              {CHANNELS.map(c => {
                const level = mix[c.k] / 100
                const fader = c.k === 'women'
                const linked = c.k === 'men'
                return (
                  <div key={c.k} className="flex flex-col items-center rounded-[24px] bg-noir/70 px-2 py-5 md:px-4">
                    <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">{c.label}</div>
                    <div className="mt-1 font-display text-3xl font-extrabold tabular-nums md:text-4xl">{mix[c.k]}%</div>
                    <div className="font-sans text-xs text-noir-ink-2 tabular-nums">{seats[c.k]} seats</div>

                    <div className="mt-5 flex h-[240px] items-stretch gap-3 md:gap-5">
                      <Meter level={level} color={c.color} />
                      <div className="relative w-10">
                        <div className="absolute inset-y-0 left-1/2 w-1.5 -translate-x-1/2 rounded-full bg-black shadow-[inset_0_1px_2px_rgb(0_0_0)]" />
                        {Array.from({ length: 11 }, (_, i) => (
                          <span key={i} className="absolute left-0 h-px w-2 bg-noir-ink/25" style={{ bottom: `${i * 10}%` }} />
                        ))}
                        <motion.div
                          className="absolute left-1/2 h-9 w-10 -translate-x-1/2 translate-y-1/2 rounded-md bg-[linear-gradient(180deg,#e9e4de,#9c958d)] shadow-[0_6px_14px_rgb(0_0_0/0.6)]"
                          initial={false}
                          animate={{ bottom: `${level * 100}%` }}
                          transition={{ type: 'spring', stiffness: 260, damping: 24 }}
                        >
                          <span className="absolute inset-x-1.5 top-1/2 h-0.5 -translate-y-1/2 rounded-full" style={{ background: c.color }} />
                        </motion.div>
                        {fader && (
                          <input
                            type="range"
                            min={0}
                            max={10}
                            step={1}
                            value={womenSteps}
                            onChange={e => setMix(customMix(Number(e.target.value)))}
                            aria-label="Women share, custom split in 10% steps"
                            className="absolute inset-0 size-full cursor-ns-resize opacity-0 [direction:rtl] [writing-mode:vertical-lr]"
                          />
                        )}
                      </div>
                    </div>
                    <div className="mt-4 h-4 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-noir-ink-2/70">
                      {fader ? 'drag' : linked ? 'follows women' : splitLocked ? '' : 'locked 10%'}
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-row gap-3 md:w-[200px] md:flex-col">
              <div className="flex-1 rounded-[24px] bg-noir/70 p-5">
                <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Capacity</div>
                <div className="mt-1 font-display text-4xl font-extrabold tabular-nums">{cap}</div>
                <div className="mt-3 flex gap-2">
                  {[-5, 5].map(d => (
                    <button key={d} type="button" onClick={() => setCap(c => Math.max(10, Math.min(100, c + d)))} className="grid size-10 place-items-center rounded-xl bg-noir-3 font-display text-xl font-bold active:translate-y-px" aria-label={d < 0 ? 'Fewer seats' : 'More seats'}>
                      {d < 0 ? '−' : '+'}
                    </button>
                  ))}
                </div>
              </div>
              <button type="button" role="switch" aria-checked={ageGate} onClick={() => setAgeGate(v => !v)} className="flex-1 rounded-[24px] bg-noir/70 p-5 text-left">
                <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Age gate</div>
                <div className="mt-3 flex items-center gap-3">
                  <span className={cn('size-4 rounded-full transition-all', ageGate ? 'bg-green shadow-[0_0_14px_rgb(0_196_140/0.9)]' : 'bg-noir-3')} />
                  <span className="font-display text-2xl font-extrabold">{ageGate ? 'On' : 'Off'}</span>
                </div>
                <div className="mt-2 font-sans text-xs text-noir-ink-2">All guests are 18+ anyway; the gate sets a higher minimum.</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

/** LED column; the top lit segment flickers like a live signal. */
function Meter({ level, color }: { level: number; color: string }) {
  const lit = Math.round(level * LEDS)
  return (
    <div className="flex w-3 flex-col-reverse gap-1 md:w-4">
      {Array.from({ length: LEDS }, (_, i) => {
        const on = i < lit
        const peak = on && i >= lit - 2
        const hot = i >= LEDS - 3
        return (
          <span
            key={i}
            className="flex-1 rounded-[2px] transition-colors duration-300"
            style={{
              background: on ? (hot ? '#FF3864' : color) : 'rgb(255 255 255 / 0.06)',
              boxShadow: on ? `0 0 8px ${hot ? '#FF3864' : color}` : 'none',
              animation: peak ? `twinkle ${0.6 + (i % 3) * 0.25}s ease-in-out infinite` : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
