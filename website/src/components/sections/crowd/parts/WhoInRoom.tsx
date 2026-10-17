'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { cn } from '@/lib/cn'
import { COLORS, EASE_CSS, Head, roomKind } from './kit'

// One example table of 20 seats, in SVG units (1000×400). Coordinates are integers so SSR matches.
const N = 20
const OPEN = 2
const SEATS = Array.from({ length: N }, (_, j) => {
  const k = Math.floor(j / 2)
  const top = j % 2 === 0
  return { x: 140 + Math.round((k * 720) / 9), y: top ? 92 : 308, top }
})
// Open seats arrive in the middle and at the end, so they read as "kept aside".
const OPEN_AT = new Set([8, 19])

type Seat = 'woman' | 'man' | 'open'
const SPLITS = [
  { label: '50:50', w: 50 },
  { label: '60:40', w: 60 },
  { label: '40:60', w: 40 },
] as const

/** Seat types in arrival order for a given women share, interleaved so the table looks mixed. */
function seatsFor(w: number): Seat[] {
  const women = Math.round(((N - OPEN) * w) / 100)
  const target = { woman: women, man: N - OPEN - women }
  const have = { woman: 0, man: 0 }
  return Array.from({ length: N }, (_, j): Seat => {
    if (OPEN_AT.has(j)) return 'open'
    // Checkerboard around the table, so neighbours and the person opposite alternate.
    const want: 'woman' | 'man' = (Math.floor(j / 2) + (j % 2)) % 2 === 0 ? 'woman' : 'man'
    const pick: 'woman' | 'man' = have.woman >= target.woman ? 'man' : have.man >= target.man ? 'woman' : want
    have[pick]++
    return pick
  })
}

/**
 * Chapter 02, who's in the room. A long table of empty chairs that fills as
 * you scroll (pinned on desktop). Women-only fills one colour; balanced
 * fills evenly with a few open seats, and hovering a split re-seats the
 * table; 21+ and 25+ first walk an age marker up to the gate.
 */
export function WhoInRoom({ crowd }: Pick<CrowdViewProps, 'crowd'>) {
  const kind = roomKind(crowd)
  const gate = crowd.query.min_age ?? 21
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'end end'] })
  const [arrived, setArrived] = useState(0)
  const [scrollAge, setScrollAge] = useState(18)
  const [hoverAge, setHoverAge] = useState<number | null>(null)
  const [split, setSplit] = useState(50)

  // Age crowds spend the first half of the scroll at the gate, then seat people.
  const seatFrom = kind === 'age' ? 0.48 : 0.06
  const seatSpan = kind === 'age' ? 0.44 : 0.8
  useMotionValueEvent(scrollYProgress, 'change', v => {
    setArrived(Math.max(0, Math.min(N, Math.floor(((v - seatFrom) / seatSpan) * N) + 1)))
    if (kind === 'age') setScrollAge(Math.max(18, Math.min(34, 18 + Math.round(((v - 0.04) / 0.38) * 16))))
  })

  const filled = reduce ? N : arrived
  const types: Seat[] = kind === 'balanced' ? seatsFor(split) : Array.from({ length: N }, () => (kind === 'women' ? 'woman' : 'open'))
  const count = (t: Seat) => types.slice(0, filled).filter(x => x === t).length
  const age = hoverAge ?? (reduce ? gate + 4 : scrollAge)

  const serif = kind === 'women' ? 'Every seat, a woman.' : kind === 'balanced' ? 'Even, seat by seat.' : `Everyone ${gate} and up.`
  const aside = kind === 'women' ? crowd.why[1].body : kind === 'balanced' ? crowd.how[1].body : crowd.how[1].body

  return (
    <section ref={ref} className="relative bg-paper md:h-[240vh]">
      <div className="px-6 py-24 md:sticky md:top-0 md:flex md:h-screen md:flex-col md:justify-center md:px-20 md:py-0">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-12 lg:grid-cols-[minmax(0,400px)_1fr] lg:gap-16">
          <div>
            <Head n="03" label="Who's in the room" title="Pull up a chair." serif={serif} />
            <p className="mt-6 max-w-[400px] font-sans text-lg leading-relaxed text-ink-2">{aside}</p>

            {kind === 'balanced' && (
              <div className="mt-7">
                <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">The host picks the split</div>
                <div className="mt-3 flex gap-2" onMouseLeave={() => setSplit(50)}>
                  {SPLITS.map(s => (
                    <button
                      key={s.label}
                      type="button"
                      onMouseEnter={() => setSplit(s.w)}
                      onFocus={() => setSplit(s.w)}
                      onClick={() => setSplit(s.w)}
                      className={cn(
                        'rounded-full px-4 py-2 font-sans text-sm font-bold transition-colors duration-300',
                        split === s.w ? 'bg-ink text-cream' : 'text-ink shadow-[inset_0_0_0_1.5px_rgb(23_19_16/0.18)] hover:bg-ink/[0.04]',
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-4">
              {kind === 'women' && <Count color={COLORS.woman} label="Women" n={count('woman')} />}
              {kind === 'balanced' && (
                <>
                  <Count color={COLORS.woman} label="Women" n={count('woman')} />
                  <Count color={COLORS.man} label="Men" n={count('man')} />
                  <Count color={COLORS.open} label="Open to anyone" n={count('open')} />
                </>
              )}
              {kind === 'age' && <Count color={COLORS.open} label={`Guests ${gate}+`} n={count('open')} />}
            </dl>
          </div>

          <div>
            {kind === 'age' && <AgeGate gate={gate} age={age} onHover={setHoverAge} />}
            <Table types={types} filled={filled} label={kind === 'age' ? `${gate}+` : null} />
            <p className="mt-3 text-center font-sans text-sm text-ink-3">
              One example table of {N}. The host decides how many seats.
              {kind === 'balanced' && ' About one in ten stays open to anyone.'}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

function Count({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <div>
      <dt className="flex items-center gap-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">
        <span className="size-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </dt>
      <dd className="mt-1 font-display text-5xl font-extrabold tabular-nums tracking-[-0.05em]">
        {n}<span className="text-2xl text-ink-3">/{N}</span>
      </dd>
    </div>
  )
}

function Table({ types, filled, label }: { types: Seat[]; filled: number; label: string | null }) {
  return (
    <svg viewBox="0 0 1000 400" className="w-full" role="img" aria-label={`An example table of ${N} seats, ${filled} filled`}>
      <rect x={70} y={152} width={860} height={96} rx={48} fill="#E9E1CF" stroke="#171310" strokeOpacity={0.12} />
      {SEATS.map((s, j) => {
        const on = j < filled
        const plateY = s.top ? 178 : 222
        return (
          <g key={j}>
            <circle cx={s.x} cy={plateY} r={13} fill="#FBF7EF" stroke="#171310" strokeOpacity={0.14}
              style={{ opacity: on ? 1 : 0.35, transition: `opacity .5s ${EASE_CSS}` }} />
            <circle cx={s.x} cy={s.y} r={30} fill="none" stroke="#8A8076" strokeWidth={1.5} strokeDasharray="4 5" />
            <g
              style={{
                transform: on ? 'scale(1)' : 'scale(0.3)',
                opacity: on ? 1 : 0,
                transformOrigin: `${s.x}px ${s.y}px`,
                transition: `transform .6s ${EASE_CSS}, opacity .35s`,
              }}
            >
              <circle cx={s.x} cy={s.y} r={30} style={{ fill: COLORS[types[j]], transition: `fill .5s ${EASE_CSS}` }} />
              {label && (
                <text x={s.x} y={s.y + 6} textAnchor="middle" fontSize={17} fontWeight={800} fill="#171310" style={{ fontFamily: 'var(--font-cabinet), sans-serif' }}>
                  {label}
                </text>
              )}
            </g>
          </g>
        )
      })}
    </svg>
  )
}

// Age ruler, 18 to 40, in SVG units (1000×130).
const R0 = 60
const R1 = 940
const ax = (a: number) => Math.round(R0 + ((a - 18) / 22) * (R1 - R0))

function AgeGate({ gate, age, onHover }: { gate: number; age: number; onHover: (a: number | null) => void }) {
  const ok = age >= gate
  const ticks = Array.from({ length: 23 }, (_, i) => 18 + i)
  function move(e: React.PointerEvent<SVGSVGElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    const a = Math.round(18 + (((e.clientX - r.left) / r.width) * 1000 - R0) / ((R1 - R0) / 22))
    onHover(Math.max(18, Math.min(40, a)))
  }
  return (
    <div className="mb-8">
      <div className="mb-3 flex items-center justify-between gap-4 font-sans text-sm font-bold">
        <span className="text-ink-3">Guest aged <span className="font-display text-xl text-ink tabular-nums">{age}{age === 40 ? '+' : ''}</span></span>
        <span className={cn('rounded-full px-3 py-1.5 transition-colors duration-300', ok ? 'bg-green/15 text-[#007a57]' : 'bg-ink/[0.06] text-ink-2')}>
          {ok ? '✓ Request goes through' : '✕ Request doesn’t go through'}
        </span>
      </div>
      <svg viewBox="0 0 1000 130" className="w-full cursor-ew-resize touch-pan-y" onPointerMove={move} onPointerLeave={() => onHover(null)} aria-hidden>
        <defs>
          <pattern id="crowd-a-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="10" height="10" fill="#E9E1CF" />
            <line x1="0" y1="0" x2="0" y2="10" stroke="#171310" strokeOpacity={0.12} strokeWidth={4} />
          </pattern>
          <linearGradient id="crowd-a-brand" x1="0" x2="1">
            <stop offset="0" stopColor="#FF6B35" />
            <stop offset="1" stopColor="#FF3864" />
          </linearGradient>
        </defs>
        <rect x={R0} y={54} width={ax(gate) - R0} height={22} rx={4} fill="url(#crowd-a-hatch)" />
        <rect x={ax(gate)} y={54} width={R1 - ax(gate)} height={22} rx={4} fill="url(#crowd-a-brand)" opacity={0.9} />
        {ticks.map(t => (
          <g key={t}>
            <line x1={ax(t)} x2={ax(t)} y1={80} y2={t % 2 === 0 ? 92 : 86} stroke="#171310" strokeOpacity={0.35} />
            {(t === 18 || t === 30 || t === 35 || t === 40 || t === gate) && (
              <text x={ax(t)} y={112} textAnchor="middle" fontSize={15} fontWeight={700} fill="#4A423A" style={{ fontFamily: 'var(--font-satoshi), sans-serif' }}>
                {t === 40 ? '40+' : t}
              </text>
            )}
          </g>
        ))}
        <line x1={ax(gate)} x2={ax(gate)} y1={20} y2={96} stroke="#171310" strokeWidth={3} />
        <text x={ax(gate) + 10} y={34} fontSize={15} fontWeight={800} fill="#171310" style={{ fontFamily: 'var(--font-satoshi), sans-serif' }}>
          THE GATE: {gate}+
        </text>
        <motion.g initial={false} animate={{ x: ax(age) }} transition={{ type: 'spring', stiffness: 260, damping: 30 }}>
          <circle cx={0} cy={65} r={17} fill={ok ? '#00C48C' : '#FBF7EF'} stroke="#171310" strokeWidth={2} style={{ transition: 'fill .3s' }} />
          <text x={0} y={71} textAnchor="middle" fontSize={16} fontWeight={800} fill="#171310">{ok ? '✓' : '✕'}</text>
        </motion.g>
      </svg>
    </div>
  )
}
