'use client'

import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { crowdKind } from './kit'
import { ApproveScreen, CheckScreen, DoorScreen, SetupScreen } from './Screens'

/**
 * Chapter 04, how the app makes it true. Pinned on desktop: a phone turns
 * slowly as you scroll and its screen steps through the four states while
 * the matching step lights up beside it. Mobile gets the steps stacked.
 */
export function How({ crowd, title, chapter = '04' }: { crowd: CrowdContent; title: string; chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const rotateY = useTransform(p, [0, 1], [reduce ? 0 : -16, reduce ? 0 : 16])
  const rotateZ = useTransform(p, [0, 1], [reduce ? 0 : -3, reduce ? 0 : 3])
  const line = useTransform(p, [0.04, 0.96], [0, 1])

  const kind = crowdKind(crowd.slug)
  const sp = { crowd, kind, title }
  const screens: ReactNode[] = [<SetupScreen key="s" {...sp} />, <CheckScreen key="c" {...sp} />, <ApproveScreen key="a" {...sp} />, <DoorScreen key="d" {...sp} />]

  const head = (
    <>
      <Chapter n={chapter} title="How it works" dark />
      <h2 className="mt-4 font-display text-[clamp(44px,5.4vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
        Set by the host.
        <br />
        <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Kept by the app.</span>
      </h2>
    </>
  )

  return (
    <section ref={ref} className="relative bg-noir text-noir-ink md:h-[420vh]">
      {/* Desktop: pinned phone */}
      <div className="sticky top-0 hidden h-screen overflow-hidden md:block">
        <div aria-hidden className="absolute inset-0 bg-cover bg-center opacity-[0.12] blur-2xl" style={{ backgroundImage: `url(${crowd.image})` }} />
        <div className="relative mx-auto grid h-full max-w-[1280px] grid-cols-[1.1fr_0.9fr] items-center gap-16 px-20">
          <div>
            {head}
            <ol className="relative mt-12 space-y-7 pl-14">
              <span aria-hidden className="absolute bottom-2 left-0 top-2 w-px bg-noir-ink/15" />
              <motion.span aria-hidden className="absolute bottom-2 left-0 top-2 w-px origin-top bg-brand" style={{ scaleY: line }} />
              {crowd.how.map((s, i) => (
                <Step key={s.title} i={i} p={p}>
                  <div className="font-display text-[clamp(22px,2vw,30px)] font-extrabold leading-tight tracking-[-0.035em]">{s.title}</div>
                  <p className="mt-1 max-w-[440px] font-sans text-base leading-relaxed text-noir-ink-2">{s.body}</p>
                </Step>
              ))}
            </ol>
          </div>

          <div className="relative flex justify-center" style={{ perspective: 1600 }}>
            {[0, 1, 2, 3].map(i => (
              <Numeral key={i} i={i} p={p} />
            ))}
            <motion.div style={{ rotateY, rotateZ }} className="relative">
              <Phone>
                {screens.map((s, i) => (
                  <ScreenLayer key={i} i={i} p={p}>{s}</ScreenLayer>
                ))}
              </Phone>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Mobile: steps stacked, each with its screen */}
      <div className="px-6 py-24 md:hidden">
        {head}
        <ol className="mt-12 space-y-14">
          {crowd.how.map((s, i) => (
            <li key={s.title}>
              <div className="font-serif text-2xl italic text-orange">0{i + 1}</div>
              <div className="mt-1 font-display text-[28px] font-extrabold leading-tight tracking-[-0.035em]">{s.title}</div>
              <p className="mt-1 font-sans text-base leading-relaxed text-noir-ink-2">{s.body}</p>
              <div className="mt-6 flex justify-center">
                <Phone small>{screens[i]}</Phone>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const seg = (i: number) => [i / 4, (i + 1) / 4] as const
/** Scroll offsets must stay inside 0..1 (Motion hands them to the browser's scroll timeline). */
const k = (...o: number[]) => o.map(v => Math.min(1, Math.max(0, Math.round(v * 1000) / 1000)))

function Step({ i, p, children }: { i: number; p: MotionValue<number>; children: ReactNode }) {
  const [a, b] = seg(i)
  const opacity = useTransform(p, k(a - 0.04, a + 0.02, b - 0.02, b + 0.04), [i === 0 ? 1 : 0.28, 1, 1, i === 3 ? 1 : 0.28])
  const x = useTransform(p, k(a - 0.04, a + 0.02, b - 0.02, b + 0.04), [0, 12, 12, i === 3 ? 12 : 0])
  return (
    <motion.li style={{ opacity, x }} className="relative">
      <span className="absolute -left-9 top-1 font-serif text-xl italic text-orange">0{i + 1}</span>
      {children}
    </motion.li>
  )
}

function ScreenLayer({ i, p, children }: { i: number; p: MotionValue<number>; children: ReactNode }) {
  const [a, b] = seg(i)
  const opacity = useTransform(p, k(a - 0.03, a + 0.02, b - 0.02, b + 0.03), [i === 0 ? 1 : 0, 1, 1, i === 3 ? 1 : 0])
  const y = useTransform(p, k(a - 0.03, a + 0.02, b - 0.02, b + 0.03), [i === 0 ? 0 : 50, 0, 0, i === 3 ? 0 : -50])
  return (
    <motion.div className="absolute inset-0" style={{ opacity, y }}>
      {children}
    </motion.div>
  )
}

function Numeral({ i, p }: { i: number; p: MotionValue<number> }) {
  const [a, b] = seg(i)
  const opacity = useTransform(p, k(a - 0.03, a + 0.03, b - 0.03, b + 0.03), [i === 0 ? 1 : 0, 1, 1, i === 3 ? 1 : 0])
  const scale = useTransform(p, k(a - 0.03, b + 0.03), [0.9, 1.08])
  return (
    <motion.div
      aria-hidden
      style={{ opacity, scale }}
      className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[42vh] font-extrabold leading-none tracking-[-0.08em] text-transparent [-webkit-text-stroke:1.5px_rgb(245_240_235/0.14)]"
    >
      0{i + 1}
    </motion.div>
  )
}

function Phone({ children, small }: { children: ReactNode; small?: boolean }) {
  return (
    <div className={small ? 'w-[272px]' : 'w-[300px]'}>
      <div className="rounded-[48px] bg-noir-3 p-2.5 shadow-[0_40px_100px_-30px_rgb(0_0_0/0.9),inset_0_0_0_1.5px_rgb(255_255_255/0.08)]">
        <div className="relative aspect-[9/18.5] overflow-hidden rounded-[40px] bg-paper text-ink">
          <div aria-hidden className="absolute left-1/2 top-2.5 z-10 h-6 w-24 -translate-x-1/2 rounded-full bg-noir" />
          {children}
        </div>
      </div>
    </div>
  )
}
