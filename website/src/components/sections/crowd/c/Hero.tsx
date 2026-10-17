'use client'

import { useId, useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Chip } from '@/components/ui/atoms'

/** Split the label into mask lines. Narrow screens also break after hyphens. */
function lines(label: string, narrow: boolean) {
  const words = label.toUpperCase().split(' ')
  return narrow ? words.flatMap(w => w.replace(/-/g, '-\n').split('\n')) : words
}

/** Font size (as a CSS min()) that fits the longest line across the screen. */
function fit(ls: string[], vw: number, vh: number) {
  const longest = Math.max(...ls.map(l => l.length))
  const w = Math.round((vw / (longest * 0.66)) * 10) / 10
  const h = Math.round((vh / (ls.length * 0.86)) * 10) / 10
  return `min(${w}vw, ${h}vh)`
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

/**
 * The crowd label set huge in noir, with the crowd photo showing through the
 * letters. Scroll and the letters rush toward you until the photo fills the
 * screen, then the headline lands on it.
 */
export function Hero({ crowd, place, total, crumbs }: Pick<CrowdViewProps, 'crowd' | 'place' | 'total' | 'crumbs'>) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const id = useId().replace(/:/g, '')
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const maskScale = useTransform(p, [0, 0.22, 0.56], [1, reduce ? 1 : 1.7, reduce ? 1 : 14])
  const maskOpacity = useTransform(p, [0.28, 0.54], [1, 0])
  const photoScale = useTransform(p, [0, 0.6], [reduce ? 1 : 1.28, 1])
  const introOpacity = useTransform(p, [0, 0.14], [1, 0])
  const introY = useTransform(p, [0, 0.14], [0, reduce ? 0 : -30])
  const shade = useTransform(p, [0.42, 0.66], [0, 1])
  const headOpacity = useTransform(p, [0.52, 0.72], [0, 1])
  const headY = useTransform(p, [0.52, 0.72], [reduce ? 0 : 70, 0])
  const headEvents = useTransform(p, v => (v > 0.56 ? 'auto' : 'none'))

  const wide = lines(crowd.label, false)
  const narrow = lines(crowd.label, true)

  return (
    <section ref={ref} className="relative h-[230vh] bg-noir text-noir-ink md:h-[300vh]">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* The photo, behind everything */}
        <motion.div aria-hidden className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${crowd.image})`, scale: photoScale }} />

        {/* Noir sheet with the label cut out of it */}
        <motion.svg aria-hidden className="absolute inset-0 size-full" style={{ scale: maskScale, opacity: maskOpacity }}>
          <defs>
            <mask id={`m${id}`}>
              <rect width="100%" height="100%" fill="#fff" />
              <Letters ls={wide} size={fit(wide, 90, 66)} className="hidden md:inline" />
              <Letters ls={narrow} size={fit(narrow, 86, 50)} className="md:hidden" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="#111111" mask={`url(#m${id})`} />
        </motion.svg>

        {/* Before the zoom: where you are and a nudge to scroll */}
        <motion.div style={{ opacity: introOpacity, y: introY }} className="pointer-events-none absolute inset-0 flex flex-col px-6 pb-8 pt-28 md:px-20 md:pb-10">
          <div className="pointer-events-auto">
            <Breadcrumbs crumbs={crumbs} className="text-noir-ink-2 [&_[aria-current]]:text-noir-ink [&_a:hover]:text-noir-ink" />
          </div>
          <div className="mt-auto flex items-end justify-between gap-6 font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2">
            <span>
              <span className="font-serif text-xl normal-case italic tracking-normal text-orange">{place.name}</span>
              <span className="ml-3">{crowd.promise}</span>
            </span>
            <span className="hidden md:inline">Scroll to step inside ↓</span>
          </div>
        </motion.div>

        {/* After the zoom: the headline sits on the photo */}
        <motion.div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/55 to-noir/20" style={{ opacity: shade }} />
        <motion.div
          style={{ opacity: headOpacity, y: headY, pointerEvents: headEvents }}
          className="absolute inset-x-0 bottom-0 px-6 pb-12 md:px-20 md:pb-16"
        >
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-wrap gap-2">
              <Chip className="bg-white/12 text-noir-ink backdrop-blur">{crowd.label}</Chip>
              {total > 0 && <Chip className="bg-white/12 text-noir-ink backdrop-blur">{total} upcoming</Chip>}
            </div>
            <h1 className="mt-5 font-display text-[clamp(52px,9.5vw,156px)] font-extrabold leading-[0.86] tracking-[-0.06em]">
              {cap(crowd.nights)}
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">in {place.name}.</span>
            </h1>
            <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
              <p className="max-w-[500px] font-sans text-lg leading-relaxed text-noir-ink/85 md:text-xl">{crowd.promise}. You see the area now and get the address once you&apos;re in.</p>
              <div className="flex flex-wrap gap-2.5">
                <Button href="#whats-on" size="lg">See what&apos;s on</Button>
                <Button href="/host" kind="ghost" dark size="lg">Host one</Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Letters({ ls, size, className }: { ls: string[]; size: string; className: string }) {
  const lh = 0.86
  return (
    <text
      className={className}
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      fill="#000"
      style={{ fontFamily: 'var(--font-cabinet), sans-serif', fontWeight: 800, fontSize: size, letterSpacing: '-0.02em' }}
    >
      {ls.map((l, i) => (
        <tspan key={i} x="50%" dy={`${i === 0 ? r((-(ls.length - 1) / 2) * lh) : lh}em`}>
          {l}
        </tspan>
      ))}
    </text>
  )
}

const r = (n: number) => Math.round(n * 100) / 100
