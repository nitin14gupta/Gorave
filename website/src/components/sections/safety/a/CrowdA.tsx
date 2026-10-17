'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AGE_GATES, CROWD_MIXES } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const CAP = 24
// A fixed "seating order" so women's seats spread around the room instead of filling one corner.
const ORDER = [0, 13, 6, 19, 3, 22, 9, 16, 1, 12, 7, 20, 4, 23, 10, 17, 2, 14, 8, 21, 5, 18, 11, 15]
const RANK = ORDER.reduce<number[]>((acc, seat, i) => { acc[seat] = i; return acc }, [])
const COLOR = { w: '#FF3864', m: '#FF6B35', o: '#FFB830' }
// Sample guests asking to come, illustrative ages for the age-gate demo.
const AGES = [19, 22, 24, 27, 20, 31]

/**
 * Chapter 04, the room. Pick a crowd mix and the seats recolour in a wave
 * to match; pick an age gate and the guests under it drop out of the queue.
 */
export function CrowdA() {
  const [mixKey, setMixKey] = useState('women')
  const [gate, setGate] = useState<(typeof AGE_GATES)[number]>('21+')
  const mix = CROWD_MIXES.find(m => m.key === mixKey)!
  const women = mix.women === null ? 0 : Math.round(CAP * mix.women)
  const seatOf = (i: number) => (mix.women === null ? 'o' : RANK[i] < women ? 'w' : 'm')
  const min = parseInt(gate, 10)

  return (
    <section className="overflow-hidden bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Chapter n="04" title="The room" />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Women-only,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">if you want it.</span>
            </h2>
          </div>
          <p className="max-w-[480px] font-sans text-lg leading-relaxed text-ink-2">
            Hosts choose the room: women-only, 50:50, 60:40 or open, plus an age gate. Gender is set once when you sign up and can&apos;t be changed later, so a women-only night stays that way.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
          <div className="rounded-[32px] bg-paper p-6 shadow-soft md:p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap gap-1.5">
                {CROWD_MIXES.map(m => (
                  <button
                    key={m.key}
                    type="button"
                    aria-pressed={m.key === mixKey}
                    onClick={() => setMixKey(m.key)}
                    className={cn('relative rounded-full px-4 py-2.5 font-sans text-sm font-bold transition-colors', m.key === mixKey ? 'text-cream' : 'text-ink-2 hover:bg-ink/5')}
                  >
                    {m.key === mixKey && <motion.span layoutId="crowd-a-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                    <span className="relative">{m.label}</span>
                  </button>
                ))}
              </div>
              <div className="font-sans text-sm font-bold tabular-nums text-ink-2">
                {mix.women === null ? `${CAP} open seats` : `${women} women · ${CAP - women} men`}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-6 gap-2.5 sm:grid-cols-8">
              {Array.from({ length: CAP }, (_, i) => {
                const s = seatOf(i)
                return (
                  <motion.div
                    key={i}
                    initial={false}
                    animate={{ backgroundColor: COLOR[s], scale: [0.86, 1] }}
                    transition={{ duration: 0.45, ease: EASE, delay: RANK[i] * 0.02 }}
                    whileHover={{ y: -4, scale: 1.06 }}
                    className="grid aspect-square place-items-center rounded-2xl"
                  >
                    <svg viewBox="0 0 24 24" className="size-[46%]" aria-hidden>
                      <circle cx={12} cy={7.5} r={4} fill="#fff" />
                      <path d="M4 21 C4 15.5 7.6 13 12 13 C16.4 13 20 15.5 20 21 Z" fill="#fff" />
                    </svg>
                  </motion.div>
                )
              })}
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={mix.key}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="mt-5 font-sans text-[15px] text-ink-2"
              >
                {mix.note}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="rounded-[32px] bg-white p-6 text-ink shadow-soft shadow-pop md:p-8">
            <div className="flex items-center justify-between">
              <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-2">Age gate</div>
              <div className="flex gap-1 rounded-full bg-cream p-1">
                {AGE_GATES.map(g => (
                  <button
                    key={g}
                    type="button"
                    aria-pressed={g === gate}
                    onClick={() => setGate(g)}
                    className={cn('rounded-full px-3.5 py-1.5 font-sans text-sm font-bold transition-colors', g === gate ? 'bg-cream text-ink' : 'text-ink-2 hover:text-cream')}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative mt-6 h-[120px] overflow-hidden">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={gate}
                  initial={{ y: 60, rotate: -8, opacity: 0 }}
                  animate={{ y: 0, rotate: -4, opacity: 1 }}
                  exit={{ y: -60, rotate: 4, opacity: 0 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="absolute font-display text-[120px] font-extrabold leading-none tracking-[-0.06em] text-brand"
                >
                  {gate}
                </motion.div>
              </AnimatePresence>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {AGES.map((age, i) => {
                const ok = age >= min
                return (
                  <motion.div
                    key={i}
                    layout
                    animate={{ opacity: ok ? 1 : 0.32, scale: ok ? 1 : 0.94 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    className={cn('rounded-2xl px-3 py-2.5 font-sans', ok ? 'bg-cream' : 'bg-paper opacity-60')}
                  >
                    <div className="text-[11px] text-ink-2">Guest {i + 1}</div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-xl font-extrabold tabular-nums">{age}</span>
                      <span className={cn('text-[11px] font-bold', ok ? 'text-green' : 'text-ink-2')}>{ok ? 'Can ask' : 'Under'}</span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
            <p className="mt-5 font-sans text-sm text-ink-2">Gorave is 18+ for everyone. Hosts can raise the bar for their event.</p>
          </div>
        </div>
      </div>
    </section>
  )
}
