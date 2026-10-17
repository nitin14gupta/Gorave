'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { DEMO_EVENT } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Map board in viewBox units.
const C = { x: 560, y: 300 } // centre of the public circle
const PIN = { x: 604, y: 262 } // the actual building
const STREETS = [
  'M180 90 C340 110 520 70 700 96 S920 120 1000 104',
  'M150 230 C330 250 480 214 660 240 S880 262 1000 250',
  'M130 390 C320 410 500 370 700 400 S900 420 1000 410',
  'M160 540 C360 560 560 520 760 548 S940 566 1000 556',
  'M320 0 C330 160 300 360 336 620',
  'M470 0 C462 200 490 420 476 620',
  'M640 0 C650 180 620 380 650 620',
  'M820 0 C810 200 840 420 826 620',
  'M380 160 L740 470',
]
const STEPS = ['Someone opens the listing', 'They see a ~1 km circle', 'The host accepts them', 'Now they get the door']

/**
 * Chapter 03, the circle. A dark street map; as you scroll, a wide circle
 * draws itself over the neighbourhood, that's all the public gets. Then the
 * request is accepted, the circle closes onto one building and a route draws in.
 */
export function MapB() {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  useMotionValueEvent(p, 'change', v => setStep(v < 0.33 ? 0 : v < 0.46 ? 1 : v < 0.57 ? 2 : 3))

  const draw = useTransform(p, [0.28, 0.4], [0, 1])
  const r = useTransform(p, [0.28, 0.4, 0.5, 0.58], [40, 170, 170, 12])
  const cx = useTransform(p, [0.5, 0.58], [C.x, PIN.x])
  const cy = useTransform(p, [0.5, 0.58], [C.y, PIN.y])
  const fillOpacity = useTransform(p, [0.3, 0.4, 0.52, 0.58], [0, 0.14, 0.14, 0])
  const areaLabel = useTransform(p, [0.34, 0.4, 0.5, 0.54], [0, 1, 1, 0])
  const pin = useTransform(p, [0.56, 0.6], [0, 1])
  const pinY = useTransform(p, [0.56, 0.6], [-40, 0])
  const route = useTransform(p, [0.58, 0.68], [0, 1])
  const card = useTransform(p, [0.6, 0.67], [0, 1])
  const cardY = useTransform(p, [0.6, 0.67], [30, 0])

  return (
    <section ref={ref} className="relative bg-noir text-noir-ink md:h-[260vh]">
      <div className="flex flex-col justify-center gap-10 px-6 py-24 md:sticky md:top-0 md:h-screen md:px-20 md:py-0">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[0.8fr_1.4fr]">
          <div>
            <Chapter n="03" title="The circle" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              A neighbourhood,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">not a doorstep.</span>
            </h2>
            <ol className="mt-8 grid gap-2">
              {STEPS.map((s, i) => (
                <li key={s} className={cn('flex items-center gap-3 font-sans text-[15px] font-bold transition-all duration-500', i === step ? 'translate-x-1 text-noir-ink' : 'text-noir-ink-2/50')}>
                  <span className={cn('grid size-6 place-items-center rounded-full text-[11px] transition-colors duration-500', i <= step ? 'bg-green text-noir' : 'bg-noir-3')}>{i + 1}</span>
                  {s}
                </li>
              ))}
            </ol>
          </div>

          <div className="relative overflow-hidden rounded-[32px] bg-[#161616] shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
            <svg viewBox="0 0 1000 620" className="block h-auto w-full" aria-label="Map demo: an approximate circle closes onto the exact building once you're confirmed">
              <path d="M0 0 H150 C110 160 170 300 120 420 C90 500 120 580 110 620 H0 Z" fill="#132029" />
              <rect x={700} y={430} width={110} height={90} rx={10} fill="#16231a" />
              <rect x={360} y={260} width={90} height={110} rx={10} fill="#16231a" />
              {STREETS.map(d => <path key={d} d={d} fill="none" stroke="#2a2a2a" strokeWidth={14} strokeLinecap="round" />)}
              {STREETS.map(d => <path key={`${d}-c`} d={d} fill="none" stroke="#333" strokeWidth={1.5} strokeDasharray="6 10" />)}
              {/* buildings */}
              {Array.from({ length: 22 }, (_, i) => {
                const bx = 200 + ((i * 137) % 760)
                const by = 30 + ((i * 89) % 560)
                return <rect key={i} x={bx} y={by} width={26 + (i % 3) * 8} height={18 + (i % 4) * 6} rx={3} fill="#1e1e1e" />
              })}
              <rect x={PIN.x - 18} y={PIN.y - 12} width={36} height={24} rx={4} fill="#262626" />

              <motion.path
                d={`M180 600 C260 520 300 470 360 440 S520 330 ${PIN.x} ${PIN.y + 6}`}
                fill="none" stroke="#00C48C" strokeWidth={5} strokeLinecap="round" strokeDasharray="1 0"
                style={{ pathLength: route }}
              />
              <motion.circle
                r={r} cx={cx} cy={cy}
                fill="#FF6B35" stroke="#FF6B35" strokeWidth={2.5} strokeDasharray="10 8"
                style={{ fillOpacity, pathLength: draw }}
              />
              <motion.g style={{ opacity: areaLabel }}>
                <rect x={C.x - 120} y={C.y + 186} width={240} height={36} rx={18} fill="#F5F0EB" />
                <text x={C.x} y={C.y + 210} textAnchor="middle" fontSize={16} fontWeight={700} fill="#171310" style={{ fontFamily: "var(--font-satoshi)" }}>Bandra West · approx. 1 km</text>
              </motion.g>
              <motion.g style={{ opacity: pin, y: pinY }}>
                <path d={`M${PIN.x} ${PIN.y} c-14 -16 -20 -26 -20 -36 a20 20 0 0 1 40 0 c0 10 -6 20 -20 36 Z`} fill="#FF3864" />
                <circle cx={PIN.x} cy={PIN.y - 36} r={7} fill="#fff" />
              </motion.g>
              <circle cx={180} cy={600} r={9} fill="#00C48C" stroke="#111" strokeWidth={3} />
            </svg>

            <motion.div
              style={{ opacity: card, y: cardY }}
              className="absolute right-4 top-4 max-w-[64%] rounded-2xl bg-noir-ink p-4 text-ink shadow-pop md:right-6 md:top-6"
            >
              <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-[#00865f]">✓ You&apos;re in</div>
              <div className="mt-1 font-display text-lg font-extrabold leading-tight tracking-[-0.02em] md:text-xl">{DEMO_EVENT.address}</div>
              <div className="font-sans text-sm text-ink-2">{DEMO_EVENT.flat} · {DEMO_EVENT.street}</div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
