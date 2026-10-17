'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, type ReactNode } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { AREA_SCENES, type Area } from '@/lib/area'
import { cn } from '@/lib/cn'
import { CARD_SHADOW, Deckle, Grain, SectionHead, Tape } from './kit'

const FLOORS = 7
const pad = (n: number) => String(n).padStart(2, '0')

function Copy({ area, count, counter }: { area: Area; count: number; counter: ReactNode }) {
  return (
    <div>
      <SectionHead n="03" label="Lights on" title="Every lit window" serif="is somebody's night." />
      <p className="mt-6 max-w-[440px] font-sans text-lg leading-relaxed text-ink-2">
        {count > 0 ? (
          <>
            <span className="font-bold text-ink">{count} upcoming {count === 1 ? 'night' : 'nights'}</span> listed in and around {area.name}. Each one is somebody&apos;s living room, roof or dinner table.
          </>
        ) : (
          <>
            Nothing listed in {area.name} just yet.{' '}
            <Link href="/host" className="font-bold text-ink underline decoration-orange/60 underline-offset-4 transition-colors hover:text-orange">Be the first window to light up.</Link>
          </>
        )}
      </p>
      <div className="mt-8 flex items-baseline gap-3 font-serif text-2xl italic text-ink-3">
        <span className="h-px w-10 self-center bg-ink/20" />
        floors lit {counter}
      </div>
    </div>
  )
}

/** The building photo as a framed print. */
function Print({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn('relative bg-white p-3 pb-12 sm:p-4 sm:pb-14', CARD_SHADOW, className)}>
      <Tape className="-top-3 left-1/2 -translate-x-1/2 rotate-2" />
      <div className="relative aspect-[3/4] overflow-hidden bg-noir">{children}</div>
      <div className="absolute inset-x-4 bottom-3.5 font-serif text-lg italic text-ink-2 sm:bottom-4">upstairs, after dark</div>
    </div>
  )
}

/**
 * Chapter 03, lights on. The building at night as a framed print on the
 * paper. The section pins and the windows come on floor by floor from the
 * ground, each step sprung so it feels switched on rather than wiped.
 */
export function LightsOn({ area, count }: { area: Area; count: number }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const stepped = useTransform(scrollYProgress, v => (reduce ? FLOORS : Math.min(FLOORS, Math.floor((Math.max(0, v - 0.04) / 0.78) * (FLOORS + 0.999)))))
  const floor = useSpring(stepped, { stiffness: 70, damping: 18 })
  const edge = useTransform(floor, f => (f / FLOORS) * 112 - 12)
  const mask = useMotionTemplate`linear-gradient(to top, #000 ${edge}%, transparent calc(${edge}% + 10%))`
  const glow = useTransform(floor, [0, FLOORS], [0, 1])
  const label = useTransform(stepped, f => `${pad(f)} / ${pad(FLOORS)}`)
  const counter = <motion.span className="tabular-nums text-orange">{label}</motion.span>

  return (
    <>
      {/* Desktop: pinned */}
      <section ref={ref} className="relative hidden h-[230vh] bg-cream md:block">
        <Deckle from="paper" seed={1} />
        <div className="sticky top-0 flex h-[100svh] items-center overflow-hidden px-12 lg:px-20">
          <Grain />
          <div className="relative mx-auto grid w-full max-w-[1240px] grid-cols-[1fr_auto] items-center gap-16">
            <Copy area={area} count={count} counter={counter} />
            <div className="relative">
              <motion.div aria-hidden style={{ opacity: glow }} className="absolute -inset-24 bg-[radial-gradient(circle,rgb(255_184_48/0.22),transparent_62%)]" />
              <Print className="w-[min(430px,calc((100svh-150px)*0.75))] rotate-[1.5deg]">
                <Image src={AREA_SCENES.building} alt={`An apartment building at night in ${area.name}, its windows lighting up one floor at a time`} fill sizes="430px" className="object-cover brightness-[0.3] saturate-[0.4]" />
                <motion.div aria-hidden className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
                  <Image src={AREA_SCENES.building} alt="" fill sizes="430px" className="object-cover" />
                </motion.div>
              </Print>
            </div>
          </div>
        </div>
      </section>

      {/* Phones: the lights fade up once, in view */}
      <section className="relative bg-cream px-6 py-24 md:hidden">
        <Deckle from="paper" seed={1} />
        <Grain />
        <div className="relative">
          <Copy area={area} count={count} counter={<span className="tabular-nums text-orange">{pad(FLOORS)} / {pad(FLOORS)}</span>} />
          <Print className="mx-auto mt-12 w-[86%] rotate-[1.5deg]">
            <Image src={AREA_SCENES.building} alt={`An apartment building at night in ${area.name}`} fill sizes="86vw" className="object-cover" />
            {!reduce && <motion.div
              aria-hidden
              className="absolute inset-0 bg-[#0b0d1c]/75"
              initial={{ opacity: 1 }}
              whileInView={{ opacity: 0 }}
              viewport={{ once: true, margin: '0px 0px -30% 0px' }}
              transition={{ duration: 2, ease: [0.2, 0.8, 0.2, 1] }}
            />}
          </Print>
        </div>
      </section>
    </>
  )
}
