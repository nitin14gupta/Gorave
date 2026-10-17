'use client'

import Image from 'next/image'
import { useRef, type CSSProperties } from 'react'
import { motion, useMotionTemplate, useReducedMotion, useScroll, useTransform } from 'motion/react'
import type { CrowdContent } from '@/lib/crowd'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Chapter } from '@/components/ui/atoms'
import { EASE } from './kit'

interface Props {
  crowd: CrowdContent
  place: { name: string; citySlug: string | null }
  total: number
  crumbs: Crumb[]
}

/**
 * The cover. Huge editorial type over a small portrait window of the crowd
 * photo; scroll and the window widens (clip-path) until the photo is full
 * bleed, the type lifts away and the crowd's promise lands on the picture.
 * Desktop pins for the reveal; mobile gets a stacked cover with a soft unclip.
 */
export function Hero({ crowd, place, total, crumbs }: Props) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const t = useTransform(p, [0.02, 0.62], [0, 1])
  const top = useTransform(t, [0, 1], [47, 0])
  const side = useTransform(t, [0, 1], [37.5, 0])
  const bottom = useTransform(t, [0, 1], [5, 0])
  const round = useTransform(t, [0, 1], [28, 0])
  const clip = useMotionTemplate`inset(${top}% ${side}% ${bottom}% ${side}% round ${round}px)`
  const imgScale = useTransform(t, [0, 1], [reduce ? 1 : 1.3, 1])
  const imgY = useTransform(t, [0, 1], ['22%', '0%'])
  const headY = useTransform(p, [0, 0.45], [0, reduce ? 0 : -170])
  const headO = useTransform(p, [0.08, 0.4], [1, 0])
  const sideO = useTransform(p, [0, 0.18], [1, 0])
  const sideY = useTransform(p, [0, 0.18], [0, reduce ? 0 : 40])
  const shade = useTransform(p, [0.5, 0.8], [0, 1])
  const quoteY = useTransform(p, [0.58, 0.88], [reduce ? 0 : 60, 0])

  const rise = (delay: number) => ({
    initial: reduce ? false : { y: '105%' },
    animate: { y: '0%' },
    transition: { duration: 1.1, ease: EASE, delay },
  })
  const fade = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, ease: EASE, delay },
  })

  const lede = crowd.heroLine
  const ctas = (
    <div className="flex flex-wrap gap-2.5">
      <Button href="#events" size="lg">See what&apos;s on</Button>
      <Button href="/host" kind="ghost" size="lg">Host one</Button>
    </div>
  )
  const count = total > 0 && (
    <div className="font-sans text-sm font-bold text-ink-2">
      <span className="font-display text-2xl font-extrabold tracking-[-0.04em] text-ink">{total}</span> upcoming right now
    </div>
  )

  return (
    <section ref={ref} className="relative bg-paper md:h-[260vh]">
      <div className="relative md:sticky md:top-0 md:h-screen md:overflow-hidden">
        {/* Masthead row */}
        <div className="relative z-20 mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-6 pt-28 md:px-12 md:pt-24">
          <motion.div style={{ opacity: sideO }}>
            <Breadcrumbs crumbs={crumbs} />
          </motion.div>
          <motion.div style={{ opacity: sideO }} className="hidden md:block">
            <Chapter n="00" title={`The crowd issue · ${place.name}`} />
          </motion.div>
        </div>

        {/* Headline */}
        <motion.div
          style={{ '--hy': headY, '--ho': headO } as unknown as CSSProperties}
          className="relative z-0 px-6 pt-10 text-center md:absolute md:inset-x-0 md:top-[13vh] md:px-12 md:pt-0 md:[opacity:var(--ho)] md:[transform:translateY(calc(var(--hy)*1px))]"
        >
          <h1 className="font-display font-extrabold leading-[0.86] tracking-[-0.055em] text-ink">
            <span className="block overflow-hidden pb-[0.06em]">
              <motion.span {...rise(0.05)} className="block text-[clamp(64px,min(13vw,19vh),220px)]">
                {crowd.label}
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span {...rise(0.16)} className="block font-serif text-[clamp(36px,min(6.4vw,9.5vh),112px)] font-normal italic tracking-[-0.03em] text-brand">
                nights in {place.name}.
              </motion.span>
            </span>
          </h1>
        </motion.div>

        {/* Desktop side columns, wiped away by the widening photo */}
        <motion.div style={{ opacity: sideO, y: sideY }} className="absolute left-[5%] top-[56%] z-0 hidden w-[27%] max-w-[380px] md:block">
          <motion.p {...fade(0.4)} className="font-sans text-[19px] leading-relaxed text-ink-2">{lede}</motion.p>
        </motion.div>
        <motion.div style={{ opacity: sideO, y: sideY }} className="absolute right-[5%] top-[56%] z-0 hidden w-[27%] max-w-[380px] md:block">
          <motion.div {...fade(0.5)} className="flex flex-col items-end gap-5 text-right">
            {ctas}
            {count}
          </motion.div>
        </motion.div>

        {/* Desktop photo: a window that widens to full bleed */}
        <motion.div aria-hidden style={{ clipPath: clip }} className="absolute inset-0 z-10 hidden md:block">
          <motion.div style={{ scale: imgScale, y: imgY }} className="absolute inset-0">
            <Image src={crowd.image} alt="" fill priority sizes="100vw" className="object-cover" />
          </motion.div>
          <motion.div style={{ opacity: shade }} className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/25 to-ink/10" />
          <motion.div style={{ opacity: shade, y: quoteY }} className="absolute inset-x-0 bottom-0 mx-auto max-w-[1400px] px-12 pb-16">
            <Chapter n="✓" title="The promise" dark className="!text-cream/80" />
            <div className="mt-4 max-w-[980px] font-display text-[clamp(56px,7vw,120px)] font-extrabold leading-[0.9] tracking-[-0.055em] text-cream">
              {crowd.promise}.
            </div>
          </motion.div>
        </motion.div>

        {/* Mobile cover */}
        <div className="px-6 pb-16 pt-6 md:hidden">
          <p className="mx-auto max-w-[460px] text-center font-sans text-lg leading-relaxed text-ink-2">{lede}</p>
          <div className="mt-7 flex flex-col items-center gap-4">
            {ctas}
            {count}
          </div>
          <motion.div
            initial={reduce ? false : { clipPath: 'inset(12% 14% 12% 14% round 28px)' }}
            whileInView={{ clipPath: 'inset(0% 0% 0% 0% round 28px)' }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 1.2, ease: EASE }}
            className="relative mt-10 aspect-[4/5] overflow-hidden rounded-[28px]"
          >
            <Image src={crowd.image} alt={`${crowd.nights} in ${place.name}`} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink/75 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6 font-display text-4xl font-extrabold leading-[0.95] tracking-[-0.05em] text-cream">
              {crowd.promise}.
            </div>
          </motion.div>
        </div>

        {/* Desktop scroll cue (static) */}
        <motion.div
          style={{ opacity: sideO }}
          className="absolute bottom-6 left-1/2 z-20 hidden -translate-x-1/2 items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 md:flex"
        >
          <span className="h-px w-8 bg-ink/25" /> Scroll to open <span className="h-px w-8 bg-ink/25" />
        </motion.div>
      </div>
    </section>
  )
}
