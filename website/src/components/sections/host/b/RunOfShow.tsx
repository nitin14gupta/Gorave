'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { RUN_OF_SHOW } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const N = RUN_OF_SHOW.length
const TILT = [-1.5, 1, -0.5, 1.5, -1, 0.5, -1.2]

/**
 * Chapter 01, the run of show. A stage manager's clipboard: the section
 * pins and the cues slide past sideways; each one gets ticked off as it
 * crosses the centre line. Small screens get the same list, ticked on view.
 */
export function RunOfShow() {
  return (
    <div id="run-of-show">
      <RunPinned />
      <RunList />
    </div>
  )
}

function Check({ on }: { on: boolean }) {
  return (
    <span className={cn('relative grid size-9 shrink-0 place-items-center rounded-lg border-2 transition-colors duration-300', on ? 'border-green bg-green' : 'border-ink/25')}>
      <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
        <motion.path
          d="M5 12.5l4.5 4.5L19 7.5"
          fill="none"
          stroke="#111"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: on ? 1 : 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
        />
      </svg>
    </span>
  )
}

function Cue({ cue, on, i }: { cue: (typeof RUN_OF_SHOW)[number]; on: boolean; i: number }) {
  return (
    <div className="relative rounded-[22px] bg-[#F7F3EC] p-7 text-ink shadow-[0_30px_60px_-30px_rgb(0_0_0/0.8)]">
      <span aria-hidden className="absolute -top-3 left-1/2 h-6 w-20 -translate-x-1/2 rotate-[-2deg] bg-gold/70" />
      <div className="flex items-start justify-between gap-4">
        <div className="font-serif text-[44px] italic leading-none text-coral">{cue.cue}</div>
        <Check on={on} />
      </div>
      <div className="mt-6 font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3">Cue {String(i + 1).padStart(2, '0')}</div>
      <h3 className={cn('mt-1 font-display text-[30px] font-extrabold leading-tight tracking-[-0.04em] transition-all duration-500', on && 'line-through decoration-coral decoration-[3px]')}>{cue.title}</h3>
      <p className="mt-2 font-sans text-[15px] leading-relaxed text-ink-2">{cue.body}</p>
    </div>
  )
}

function RunPinned() {
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const [p, setP] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0.04, 0.96], [0, -dist])
  useMotionValueEvent(scrollYProgress, 'change', v => setP(Math.round(v * 200) / 200))

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  const done = RUN_OF_SHOW.filter((_, i) => p >= 0.1 + (i / N) * 0.84).length

  return (
    <section ref={ref} className="relative hidden bg-noir text-noir-ink md:block" style={{ height: `${N * 70 + 60}vh` }}>
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <div aria-hidden className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(90deg,#fff_1px,transparent_1px),linear-gradient(#fff_1px,transparent_1px)] [background-size:64px_64px]" />
        <div aria-hidden className="absolute left-1/2 top-0 h-full w-px bg-gradient-to-b from-transparent via-coral/60 to-transparent" />

        <motion.div ref={track} style={{ x }} className="relative flex w-max items-center gap-8 pl-20 pr-[40vw]">
          <div className="w-[34vw] shrink-0 pr-6">
            <Chapter n="01" title="Run of show" dark />
            <h2 className="mt-4 font-display text-[clamp(48px,5.6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Seven cues<br />to doors.
            </h2>
            <p className="mt-4 max-w-[380px] font-sans text-lg text-noir-ink-2">From listing the night to the lights coming up. Keep scrolling and we&apos;ll tick them off.</p>
          </div>
          {RUN_OF_SHOW.map((c, i) => (
            <div key={c.cue} className="w-[min(380px,30vw)] shrink-0" style={{ rotate: `${TILT[i]}deg` }}>
              <Cue cue={c} i={i} on={i < done} />
            </div>
          ))}
        </motion.div>

        <div className="absolute inset-x-20 bottom-10 flex items-center gap-5 font-sans text-sm font-bold">
          <span className="tabular-nums text-gold">{done}/{N}</span>
          <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-noir-3">
            <motion.div className="absolute inset-0 origin-left bg-brand" style={{ scaleX: scrollYProgress }} />
          </div>
          <span className="text-noir-ink-2">{done === N ? 'House lights up' : 'Standby'}</span>
        </div>
      </div>
    </section>
  )
}

function RunList() {
  return (
    <section className="bg-noir px-6 py-20 text-noir-ink md:hidden">
      <Chapter n="01" title="Run of show" dark />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">Seven cues<br />to doors.</h2>
      <div className="mt-10 grid gap-6">
        {RUN_OF_SHOW.map((c, i) => (
          <RunListItem key={c.cue} cue={c} i={i} />
        ))}
      </div>
    </section>
  )
}

function RunListItem({ cue, i }: { cue: (typeof RUN_OF_SHOW)[number]; i: number }) {
  const [seen, setSeen] = useState(false)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-30% 0px -30% 0px' }}
      onViewportEnter={() => setSeen(true)}
      transition={{ duration: 0.6 }}
      style={{ rotate: `${TILT[i] * 0.6}deg` }}
    >
      <Cue cue={cue} i={i} on={seen} />
    </motion.div>
  )
}
