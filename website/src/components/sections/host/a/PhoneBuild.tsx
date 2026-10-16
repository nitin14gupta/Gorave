'use client'

import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { BUILD_STEPS } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { cn } from '@/lib/cn'
import { BuildScreen } from './BuildScreens'

const N = BUILD_STEPS.length

/**
 * Chapter 01 — the build. The phone stays put while you scroll and the event
 * comes together screen by screen: create → invite → requests → the door.
 * Small screens get the four steps as a stack of phones.
 */
export function PhoneBuild() {
  return (
    <div id="build">
      <PhoneBuildPinned />
      <PhoneBuildList />
    </div>
  )
}

function PhoneBuildPinned() {
  const ref = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => setP(Math.round(v * 200) / 200))

  const raw = Math.min(N - 0.001, p * N)
  const active = Math.floor(raw)
  const t = raw - active
  const step = BUILD_STEPS[active]

  return (
    <section ref={ref} className="relative hidden bg-paper md:block" style={{ height: `${N * 100 + 60}vh` }}>
      <div className="sticky top-0 flex h-screen items-center overflow-hidden px-20">
        <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_auto_0.6fr] items-center gap-14">
          <div>
            <Chapter n="01" title="The build" />
            <h2 className="mt-4 font-display text-[clamp(48px,5.4vw,84px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              One phone.<br />Four screens.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">One party.</span>
            </h2>
            <ol className="mt-10 grid max-w-[460px] gap-1">
              {BUILD_STEPS.map((s, i) => (
                <li key={s.key} className="relative overflow-hidden rounded-2xl px-5 py-3.5">
                  {i === active && <motion.span layoutId="build-active" className="absolute inset-0 rounded-2xl bg-white shadow-soft" transition={{ type: 'spring', stiffness: 300, damping: 30 }} />}
                  <div className="relative flex items-baseline gap-4">
                    <span className={cn('font-serif text-xl italic transition-colors', i <= active ? 'text-orange' : 'text-ink-3')}>{s.n}</span>
                    <div>
                      <div className={cn('font-display text-2xl font-extrabold tracking-[-0.035em] transition-colors', i === active ? 'text-ink' : 'text-ink-3')}>{s.title}</div>
                      <AnimatePresence initial={false}>
                        {i === active && (
                          <motion.p
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
                            className="overflow-hidden font-sans text-[15px] leading-relaxed text-ink-2"
                          >
                            <span className="block pt-1">{s.body}</span>
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative">
            <div aria-hidden className="absolute -inset-16 rounded-full bg-brand opacity-20 blur-3xl" />
            <Phone width={290} className="relative">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={step.key}
                  initial={{ x: '100%', opacity: 0.4 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: '-35%', opacity: 0 }}
                  transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
                  className="absolute inset-0"
                >
                  <BuildScreen step={step.key} t={t} />
                </motion.div>
              </AnimatePresence>
            </Phone>
          </div>

          <div className="flex flex-col items-start gap-6">
            {BUILD_STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-3">
                <div className="relative h-14 w-1 overflow-hidden rounded-full bg-ink/10">
                  <div className="absolute inset-x-0 top-0 bg-brand" style={{ height: `${(i < active ? 1 : i === active ? t : 0) * 100}%` }} />
                </div>
                <span className={cn('font-sans text-xs font-bold uppercase tracking-[0.16em]', i === active ? 'text-ink' : 'text-ink-3')}>{s.key}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function PhoneBuildList() {
  return (
    <section className="bg-paper px-6 py-20 md:hidden">
      <Chapter n="01" title="The build" />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">
        One phone.<br />Four screens.<br /><span className="font-serif font-normal italic text-brand">One party.</span>
      </h2>
      <div className="mt-10 grid gap-14">
        {BUILD_STEPS.map(s => (
          <motion.div key={s.key} initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-60px' }} transition={{ duration: 0.7 }}>
            <div className="flex items-baseline gap-3">
              <span className="font-serif text-2xl italic text-orange">{s.n}</span>
              <span className="font-display text-3xl font-extrabold tracking-[-0.04em]">{s.title}</span>
            </div>
            <p className="mt-2 font-sans text-base leading-relaxed text-ink-2">{s.body}</p>
            <div className="mt-6 flex justify-center">
              <Phone width={250}>
                <BuildScreen step={s.key} t={1} />
              </Phone>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
