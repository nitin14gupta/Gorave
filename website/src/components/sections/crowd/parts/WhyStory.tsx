'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { pad } from './kit'

// Four "camera" frames for the sticky picture: two framings of the crowd photo,
// then two scenes from a night in. Each frame drifts while its reason is on screen.
const frames = (img: string) => [
  { src: img, from: 1.04, to: 1.14, origin: '50% 55%', x: [0, -12] },
  { src: img, from: 1.75, to: 1.9, origin: '18% 62%', x: [10, -10] },
  { src: AREA_SCENES.doorway, from: 1.08, to: 1.2, origin: '50% 40%', x: [0, 14] },
  { src: AREA_SCENES.building, from: 1.1, to: 1.22, origin: '50% 50%', x: [-8, 8] },
]

/**
 * Chapter 01, the reasons. A split screen: the picture on the left is pinned
 * and cuts, reframes and slowly pushes in as each reason scrolls past on the
 * right. Mobile drops the pin and gives every reason its own picture.
 */
export function WhyStory({ crowd, chapter = '01' }: { crowd: CrowdContent; chapter?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start center', 'end center'] })
  const list = frames(crowd.image)
  const n = crowd.why.length
  const bar = useTransform(p, [0, 1], [0, 1])

  return (
    <section className="bg-paper px-6 pb-24 pt-24 md:px-12 md:pb-10 md:pt-36 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="grid gap-6 md:grid-cols-[1fr_1fr] md:items-end">
          <div>
            <Chapter n={chapter} title="The reasons" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Why <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">{crowd.nights}</span>.
            </h2>
          </div>
          <p className="max-w-[420px] font-sans text-lg leading-relaxed text-ink-2 md:justify-self-end">
            {n} reasons people pick this crowd, and what the app does to keep it that way.
          </p>
        </div>

        <div ref={ref} className="relative mt-14 md:mt-6 md:grid md:grid-cols-[1.05fr_1fr] md:gap-16 lg:gap-24">
          {/* Sticky picture (desktop) */}
          <div className="hidden md:block">
            <div className="sticky top-0 flex h-screen items-center">
              <div className="relative h-[78vh] w-full overflow-hidden rounded-[32px] bg-ink shadow-pop">
                {list.slice(0, n).map((f, i) => (
                  <Frame key={i} i={i} n={n} frame={f} p={p} alt={crowd.why[i]?.title ?? ''} />
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/55 via-transparent to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-7">
                  <div className="relative h-[1.2em] flex-1 overflow-hidden font-sans text-sm font-bold uppercase tracking-[0.16em] text-cream/85">
                    {crowd.why.map((w, i) => (
                      <Caption key={w.title} i={i} n={n} p={p} text={w.title} />
                    ))}
                  </div>
                  <div className="flex items-baseline gap-1 font-serif text-cream">
                    <Counter n={n} p={p} />
                    <span className="text-xl italic text-cream/60">/ {pad(n)}</span>
                  </div>
                </div>
                <div className="absolute inset-x-7 top-7 h-[2px] overflow-hidden rounded-full bg-cream/25">
                  <motion.div style={{ scaleX: bar }} className="h-full origin-left bg-cream" />
                </div>
              </div>
            </div>
          </div>

          {/* The reasons */}
          <ol>
            {crowd.why.map((w, i) => (
              <Reason key={w.title} i={i} item={w} src={i === 1 ? AREA_SCENES.livingroom : list[i % list.length].src} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

function windowFor(i: number, n: number) {
  const s = i / n
  const e = (i + 1) / n
  return { s, e, w: 0.035 }
}

function Frame({ i, n, frame, p, alt }: { i: number; n: number; frame: ReturnType<typeof frames>[number]; p: MotionValue<number>; alt: string }) {
  const reduce = useReducedMotion()
  const { s, e, w } = windowFor(i, n)
  const first = i === 0
  const last = i === n - 1
  const opacity = useTransform(
    p,
    first ? [0, e - w, e + w] : last ? [s - w, s + w, 1] : [s - w, s + w, e - w, e + w],
    first ? [1, 1, 0] : last ? [0, 1, 1] : [0, 1, 1, 0],
  )
  const scale = useTransform(p, [Math.max(0, s - w), Math.min(1, e + w)], reduce ? [frame.from, frame.from] : [frame.from, frame.to])
  const x = useTransform(p, [Math.max(0, s - w), Math.min(1, e + w)], reduce ? [0, 0] : frame.x)
  return (
    <motion.div style={{ opacity }} className="absolute inset-0">
      <motion.div style={{ scale, x, transformOrigin: frame.origin }} className="absolute inset-0">
        <Image src={frame.src} alt={alt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" />
      </motion.div>
    </motion.div>
  )
}

function Caption({ i, n, p, text }: { i: number; n: number; p: MotionValue<number>; text: string }) {
  const { s, e, w } = windowFor(i, n)
  const first = i === 0
  const last = i === n - 1
  const y = useTransform(
    p,
    first ? [0, e - w, e + w] : last ? [s - w, s + w, 1] : [s - w, s + w, e - w, e + w],
    first ? ['0%', '0%', '-110%'] : last ? ['110%', '0%', '0%'] : ['110%', '0%', '0%', '-110%'],
  )
  return (
    <motion.div style={{ y }} className="absolute inset-0 truncate">
      Fig. {pad(i + 1)} · {text}
    </motion.div>
  )
}

/** "01" rolling to "04" as the reasons pass. */
function Counter({ n, p }: { n: number; p: MotionValue<number> }) {
  const step = useTransform(p, v => Math.min(n - 1, Math.max(0, Math.floor(v * n))))
  const smooth = useSpring(step, { stiffness: 180, damping: 24 })
  const y = useTransform(smooth, v => `${-Math.round(v * 1000) / 1000}em`)
  return (
    <span className="relative inline-block h-[1em] overflow-hidden text-5xl leading-none">
      <motion.span style={{ y }} className="block">
        {Array.from({ length: n }, (_, i) => (
          <span key={i} className="block h-[1em]">{pad(i + 1)}</span>
        ))}
      </motion.span>
    </span>
  )
}

function Reason({ i, item, src }: { i: number; item: { title: string; body: string }; src: string }) {
  const ref = useRef<HTMLLIElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const opacity = useTransform(scrollYProgress, [0.2, 0.42, 0.58, 0.8], [0.18, 1, 1, 0.18])
  const x = useTransform(scrollYProgress, [0.2, 0.42], [reduce ? 0 : 28, 0])

  return (
    <li ref={ref} className="border-t border-ink/10 py-10 first:border-t-0 md:flex md:min-h-[82vh] md:items-center md:border-t-0 md:py-0">
      {/* Mobile picture */}
      <div className="relative mb-6 aspect-[5/4] overflow-hidden rounded-[24px] md:hidden">
        <Image src={src} alt="" fill sizes="100vw" className="object-cover" />
      </div>
      <motion.div style={{ opacity, x }} className="max-md:!opacity-100 max-md:!transform-none">
        <div className="font-serif text-[clamp(48px,6vw,96px)] italic leading-none text-orange">{pad(i + 1)}</div>
        <h3 className="mt-4 font-display text-[clamp(32px,3.6vw,56px)] font-extrabold leading-[0.95] tracking-[-0.045em]">{item.title}</h3>
        <p className="mt-4 max-w-[460px] font-sans text-xl leading-relaxed text-ink-2">{item.body}</p>
      </motion.div>
    </li>
  )
}
