'use client'

import { useRef, useState } from 'react'
import { motion } from 'motion/react'
import { MIX_PRESETS, customMix, mixSeats, type Mix } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const R = 120
const C = 2 * Math.PI * R
const CAP = 24
const SEG = [
  { k: 'women', label: 'Women', color: '#FF3864' },
  { k: 'men', label: 'Men', color: '#FF6B35' },
  { k: 'open', label: 'Open', color: '#FFB830' },
] as const

/**
 * Chapter 03, the room. A dial for the crowd mix: tap a preset and the rings
 * swing round, or grab the knob and turn it to set a custom split in 10% steps.
 */
export function MixDial() {
  const [mix, setMix] = useState<Mix>(MIX_PRESETS[1])
  const [ageGate, setAgeGate] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const [dragging, setDragging] = useState(false)
  const seats = mixSeats(mix, CAP)

  // Knob sits where the women arc ends (custom split: share of the 90% that isn't open).
  const knobFrac = mix.open === 100 ? 0 : mix.women / 100
  const knobAngle = knobFrac * 2 * Math.PI - Math.PI / 2

  function turn(e: React.PointerEvent) {
    const r = svg.current?.getBoundingClientRect()
    if (!r) return
    const a = Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2)) + Math.PI / 2
    const frac = ((a / (2 * Math.PI)) % 1 + 1) % 1
    setMix(customMix(Math.round((frac / 0.9) * 10)))
  }

  // Each arc starts where the previous ones end.
  const arcs = SEG.map((s, i) => ({
    ...s,
    len: (mix[s.k] / 100) * C,
    start: SEG.slice(0, i).reduce((sum, prev) => sum + (mix[prev.k] / 100) * C, 0),
  }))

  return (
    <section className="overflow-hidden bg-blush px-6 py-24 text-blush-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1fr_1fr]">
        <div>
          <Chapter n="03" title="The room" className="!text-blush-ink/70" />
          <h2 className="mt-4 font-display text-[clamp(44px,5.8vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Dial in<br />the crowd.
          </h2>
          <p className="mt-4 max-w-[460px] font-sans text-lg leading-relaxed text-blush-ink/80">
            Open, 50:50, 60:40, women-only, men-only, or turn the knob for a custom split in 10% steps. On split mixes 10% of seats stay open.
          </p>

          <div className="mt-8 flex flex-wrap gap-2">
            {MIX_PRESETS.map(m => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMix(m)}
                aria-pressed={mix.key === m.key}
                className={cn('rounded-full px-4 py-2.5 font-sans text-sm font-bold transition-all duration-300', mix.key === m.key ? 'bg-blush-ink text-blush' : 'bg-white/60 hover:bg-white')}
              >
                {m.label}
              </button>
            ))}
            <span className={cn('rounded-full px-4 py-2.5 font-sans text-sm font-bold', mix.key === 'custom' ? 'bg-blush-ink text-blush' : 'bg-white/30 text-blush-ink/60')}>
              {mix.key === 'custom' ? mix.label : 'Custom: turn the knob'}
            </span>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={ageGate}
            onClick={() => setAgeGate(v => !v)}
            className="mt-6 flex items-center gap-3 font-sans text-sm font-bold"
          >
            <span className={cn('relative h-7 w-12 rounded-full transition-colors', ageGate ? 'bg-blush-ink' : 'bg-white/60')}>
              <motion.span layout className={cn('absolute top-1 size-5 rounded-full', ageGate ? 'right-1 bg-blush' : 'left-1 bg-blush-ink')} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
            </span>
            Age gate {ageGate ? 'on, you set the minimum age' : 'off'}
          </button>
        </div>

        <div className="flex flex-col items-center">
          <div className="relative w-full max-w-[420px]">
            <svg
              ref={svg}
              viewBox="-160 -160 320 320"
              className={cn('w-full touch-none select-none', dragging ? 'cursor-grabbing' : 'cursor-grab')}
              onPointerDown={e => { e.currentTarget.setPointerCapture(e.pointerId); setDragging(true); turn(e) }}
              onPointerMove={e => dragging && turn(e)}
              onPointerUp={() => setDragging(false)}
              onPointerCancel={() => setDragging(false)}
              role="img"
              aria-label={`Crowd mix: ${mix.women}% women, ${mix.men}% men, ${mix.open}% open`}
            >
              {/* tick marks every 10% */}
              {Array.from({ length: 10 }, (_, i) => {
                const a = (i / 10) * 2 * Math.PI - Math.PI / 2
                return <line key={i} x1={Math.cos(a) * 146} y1={Math.sin(a) * 146} x2={Math.cos(a) * 156} y2={Math.sin(a) * 156} stroke="currentColor" strokeOpacity={0.35} strokeWidth={2} strokeLinecap="round" />
              })}
              <circle r={R} fill="none" stroke="white" strokeOpacity={0.5} strokeWidth={34} />
              <g transform="rotate(-90)">
                {arcs.map(a => (
                  <motion.circle
                    key={a.k}
                    r={R}
                    fill="none"
                    stroke={a.color}
                    strokeWidth={34}
                    initial={false}
                    animate={{ strokeDasharray: `${Math.max(0.001, a.len)} ${C}`, strokeDashoffset: -a.start }}
                    transition={{ type: 'spring', stiffness: dragging ? 400 : 120, damping: dragging ? 40 : 18 }}
                  />
                ))}
              </g>
              {mix.open !== 100 && (
                <motion.g initial={false} animate={{ x: Math.cos(knobAngle) * R, y: Math.sin(knobAngle) * R }} transition={{ type: 'spring', stiffness: dragging ? 600 : 140, damping: dragging ? 40 : 16 }}>
                  <circle r={22} fill="#2B1418" />
                  <circle r={8} fill="#F4D9DF" />
                </motion.g>
              )}
            </svg>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-display text-[clamp(40px,5vw,64px)] font-extrabold leading-none tracking-[-0.05em]">{mix.key === 'custom' ? mix.label.replace('Custom ', '') : mix.label}</div>
                <div className="mt-1 font-sans text-xs font-bold uppercase tracking-[0.16em] opacity-60">{CAP} seats</div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid w-full max-w-[420px] grid-cols-3 gap-2.5">
            {SEG.map(s => (
              <div key={s.k} className="rounded-2xl bg-white/55 p-3 text-center">
                <div className="mx-auto size-2.5 rounded-full" style={{ background: s.color }} />
                <motion.div key={seats[s.k]} initial={{ y: -8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mt-1 font-display text-3xl font-extrabold tabular-nums">
                  {seats[s.k]}
                </motion.div>
                <div className="font-sans text-xs font-bold opacity-70">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
