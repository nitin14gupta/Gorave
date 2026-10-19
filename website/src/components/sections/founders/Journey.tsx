'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useInView, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { JOURNEY } from '@/lib/founders'
import { Chapter } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Chapter 01, the journey. The big chapter number on the left stays put
 * and rolls to the next as you scroll; on the right each moment arrives
 * with its photo wiping open, along a line that draws itself down the page.
 * "The call" gets a little phone instead of a photo.
 */
export function Journey() {
  const ref = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 60%', 'end 60%'] })
  const line = useTransform(p, [0, 1], ['0%', '100%'])
  const cur = JOURNEY[active]

  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Chapter n="01" title="How it started" />
        <div ref={ref} className="relative mt-14 grid gap-10 lg:grid-cols-[320px_1fr] lg:gap-16">
          {/* The sticky chapter number */}
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <div className="relative h-[180px] overflow-hidden">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={cur.n}
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '-100%' }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className="font-display text-[180px] font-extrabold leading-none tracking-[-0.08em] text-orange"
                  >
                    {cur.n}
                  </motion.div>
                </AnimatePresence>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.div key={cur.when} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="mt-3 font-sans text-sm font-bold uppercase tracking-[0.18em] text-ink-3">
                  {cur.when}
                </motion.div>
              </AnimatePresence>
              <div className="mt-8 flex gap-1.5">
                {JOURNEY.map((j, i) => (
                  <span key={j.n} className="h-1 rounded-full transition-all duration-500" style={{ width: i === active ? 40 : 12, background: i <= active ? 'var(--color-orange)' : 'rgb(23 19 16 / .12)' }} />
                ))}
              </div>
            </div>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute bottom-0 left-[11px] top-2 w-px bg-ink/10">
              <motion.div style={{ height: line }} className="w-px bg-orange" />
            </div>
            <ol className="space-y-24 md:space-y-32">
              {JOURNEY.map((j, i) => (
                <Moment key={j.n} j={j} onActive={() => setActive(i)} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  )
}

function Moment({ j, onActive }: { j: (typeof JOURNEY)[number]; onActive: () => void }) {
  const ref = useRef<HTMLLIElement>(null)
  const reduce = !!useReducedMotion()
  const center = useInView(ref, { margin: '-45% 0px -45% 0px' })
  const seen = useInView(ref, { once: true, margin: '-15% 0px' })
  useEffect(() => { if (center) onActive() }, [center, onActive])

  return (
    <li ref={ref} className="relative pl-12">
      <span aria-hidden className="absolute left-0 top-2 grid size-[23px] place-items-center rounded-full bg-paper">
        <span className="size-[11px] rounded-full transition-colors duration-500" style={{ background: seen ? 'var(--color-orange)' : 'rgb(23 19 16 / .2)' }} />
      </span>
      <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3 lg:hidden">{j.n} · {j.when}</div>
      <motion.h3
        initial={reduce ? false : { opacity: 0, y: 24 }}
        animate={seen ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: EASE }}
        className="font-display text-[clamp(36px,4.6vw,68px)] font-extrabold leading-[0.95] tracking-[-0.055em]"
      >
        {j.title}
      </motion.h3>
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={seen ? { opacity: 1, y: 0 } : undefined}
        transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
        className="mt-5 max-w-[560px] font-sans text-[18px] leading-[1.7] text-ink-2"
      >
        {j.body}
      </motion.p>
      <div className="mt-8">{j.tone === 'call' ? <Call play={seen} /> : <Photo src={j.image} play={seen} />}</div>
    </li>
  )
}

function Photo({ src, play }: { src: string; play: boolean }) {
  const reduce = !!useReducedMotion()
  return (
    <motion.div
      initial={reduce ? false : { clipPath: 'inset(0% 100% 0% 0% round 28px)' }}
      animate={play ? { clipPath: 'inset(0% 0% 0% 0% round 28px)' } : undefined}
      transition={{ duration: 1.1, ease: EASE, delay: 0.15 }}
      className="group relative aspect-[16/9] max-w-[640px] overflow-hidden rounded-[28px] bg-tile"
    >
      <Image src={src} alt="" fill sizes="(min-width: 1024px) 640px, 90vw" className="scale-105 object-cover transition-transform duration-[1.4s] ease-out-expo group-hover:scale-100" />
    </motion.div>
  )
}

/** The Baburao call: two missed calls stack up, then the call back connects. */
function Call({ play }: { play: boolean }) {
  const reduce = !!useReducedMotion()
  const [step, setStep] = useState(reduce ? 3 : 0)
  useEffect(() => {
    if (!play || reduce) return
    const ids = [700, 1500, 2600].map((ms, i) => window.setTimeout(() => setStep(i + 1), ms))
    return () => ids.forEach(window.clearTimeout)
  }, [play, reduce])

  return (
    <div className="w-full max-w-[380px] rounded-[36px] bg-white p-5 shadow-pop">
      <div className="flex items-center justify-between font-sans text-[11px] font-bold text-ink-3">
        <span>9:41</span>
        <span>Calls</span>
      </div>
      <div className="mt-5 space-y-2.5">
        {[1, 2].map(k => (
          <motion.div
            key={k}
            initial={{ opacity: 0, y: -10 }}
            animate={step >= k ? { opacity: 1, y: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="flex items-center gap-3 rounded-2xl bg-cream px-4 py-3"
          >
            <span className="grid size-9 place-items-center rounded-full bg-blush font-display text-sm font-extrabold text-blush-ink">B</span>
            <span className="flex-1">
              <span className="block font-display text-[16px] font-extrabold tracking-[-0.02em]">Baburao</span>
              <span className="block font-sans text-[12px] font-bold text-red-500">Missed call</span>
            </span>
            <span className="font-sans text-[11px] font-bold text-ink-3">ignored</span>
          </motion.div>
        ))}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={step >= 3 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="flex items-center gap-3 rounded-2xl bg-brand px-4 py-3 text-white"
        >
          <span className="grid size-9 place-items-center rounded-full bg-white/20 font-display text-sm font-extrabold">K</span>
          <span className="flex-1">
            <span className="block font-display text-[16px] font-extrabold tracking-[-0.02em]">Calling back…</span>
            <span className="block font-sans text-[12px] font-bold text-white/80">Turns out it was Kaveesha</span>
          </span>
          <span aria-hidden className="text-lg">📞</span>
        </motion.div>
      </div>
    </div>
  )
}
