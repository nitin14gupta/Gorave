'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from 'motion/react'
import { TRUST_LAYERS, type SafetyFeature } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const
const N = TRUST_LAYERS.length
const GAP = 44 // px between plates in the stack
// Plate i drops in over this slice of the pinned scroll.
const seg = (i: number): [number, number] => [0.04 + (i / N) * 0.86, 0.04 + ((i + 0.75) / N) * 0.86]
const TINTS = ['#00C48C', '#5BC0EB', '#FFB830', '#FF6B35', '#FF3864', '#C77DFF']

/**
 * Chapter 01, the stack. The section pins and six translucent glass plates
 * drop one by one onto an isometric stack, each a layer of protection. The
 * newest plate is lit; the copy on the right follows it. Mobile: a sticky card stack.
 */
export function LayersB() {
  return (
    <div id="layers">
      <LayersPinned />
      <LayersList />
    </div>
  )
}

function LayersPinned() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => {
    let a = 0
    for (let i = 0; i < N; i++) if (v >= seg(i)[0] + 0.02) a = i
    setActive(a)
  })
  const spin = useTransform(scrollYProgress, [0, 1], [-50, -32])
  const f = TRUST_LAYERS[active]

  return (
    <section ref={ref} className="relative hidden bg-noir text-noir-ink md:block" style={{ height: `${N * 75 + 100}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-20">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_60%_at_35%_55%,rgb(0_196_140/0.10),transparent)]" />
        <div className="relative mx-auto grid w-full max-w-[1280px] grid-cols-[1.2fr_1fr] items-center gap-10">
          <div className="relative h-[80vh] [perspective:1600px]">
            <motion.div
              className="absolute left-1/2 top-[58%] h-0 w-0 [transform-style:preserve-3d]"
              style={{ rotateX: 58, rotateZ: spin }}
            >
              {TRUST_LAYERS.map((l, i) => (
                <Plate key={l.key} i={i} f={l} progress={scrollYProgress} active={i === active} />
              ))}
            </motion.div>
          </div>

          <div>
            <Chapter n="01" title="The stack" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5vw,76px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Six layers<br />of trust.
            </h2>
            <div className="mt-10 flex items-center gap-3 font-sans text-sm font-bold text-noir-ink-2">
              <span className="font-serif text-3xl italic text-orange tabular-nums">0{active + 1}</span>
              <span>/ 0{N}</span>
              <div className="ml-2 flex gap-1.5">
                {TRUST_LAYERS.map((l, i) => (
                  <span key={l.key} className="h-1 w-6 rounded-full transition-colors duration-500" style={{ background: i <= active ? TINTS[i] : 'rgb(245 240 235 / 0.15)' }} />
                ))}
              </div>
            </div>
            <div className="relative mt-5 h-[230px]">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={f.key}
                  initial={{ opacity: 0, y: 30, filter: 'blur(6px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
                  transition={{ duration: 0.45, ease: EASE }}
                  className="absolute inset-0"
                >
                  <div className="font-display text-[clamp(32px,3vw,44px)] font-extrabold leading-tight tracking-[-0.04em]" style={{ color: TINTS[active] }}>{f.title}</div>
                  <p className="mt-3 max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">{f.body}</p>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Plate({ i, f, progress, active }: { i: number; f: SafetyFeature; progress: MotionValue<number>; active: boolean }) {
  const [a, b] = seg(i)
  const z = useTransform(progress, [a, b], [i * GAP + 520, i * GAP])
  const opacity = useTransform(progress, [a, a + (b - a) * 0.4], [0, 1])
  const tint = TINTS[i]
  return (
    <motion.div
      className="absolute -left-[190px] -top-[130px] h-[260px] w-[380px] rounded-[28px] backdrop-blur-[2px]"
      style={{
        z,
        opacity,
        background: `linear-gradient(135deg, ${tint}${active ? '40' : '1f'}, rgb(255 255 255 / 0.03))`,
        boxShadow: `inset 0 0 0 1.5px ${tint}${active ? 'cc' : '55'}, 0 30px 60px -20px rgb(0 0 0 / 0.6)`,
        transition: 'background .5s, box-shadow .5s',
      }}
    >
      <div className="absolute bottom-5 left-6 font-sans">
        <div className="font-serif text-2xl italic" style={{ color: tint }}>0{i + 1}</div>
        <div className="font-display text-2xl font-extrabold tracking-[-0.03em] text-noir-ink">{f.title}</div>
        <div className="text-sm text-noir-ink-2">{f.short}</div>
      </div>
    </motion.div>
  )
}

function LayersList() {
  return (
    <section className="bg-noir px-6 py-20 text-noir-ink md:hidden">
      <Chapter n="01" title="The stack" dark />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">Six layers<br />of trust.</h2>
      <div className="mt-10 flex flex-col gap-4">
        {TRUST_LAYERS.map((l, i) => (
          <div
            key={l.key}
            className="sticky rounded-[26px] bg-noir-2 p-6"
            style={{ top: `${88 + i * 14}px`, boxShadow: `inset 0 0 0 1.5px ${TINTS[i]}66` }}
          >
            <div className="font-serif text-2xl italic" style={{ color: TINTS[i] }}>0{i + 1}</div>
            <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.03em]">{l.title}</div>
            <p className="mt-2 font-sans text-[15px] leading-relaxed text-noir-ink-2">{l.body}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
