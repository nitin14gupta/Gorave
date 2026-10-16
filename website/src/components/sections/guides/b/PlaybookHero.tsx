'use client'

import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from 'motion/react'
import { guideHref, type HostGuide } from '@/lib/hostGuides'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Eyebrow } from '@/components/ui/atoms'
import { IndexCard } from './IndexCard'

const EASE = [0.2, 0.8, 0.2, 1] as const

// Three cards on the table, at three depths — the nearer the card, the more it follows the cursor.
const TABLE = [
  { i: 2, x: '8%', y: '18%', rotate: -11, depth: 0.5 },
  { i: 1, x: '40%', y: '4%', rotate: 7, depth: 0.8 },
  { i: 0, x: '22%', y: '34%', rotate: -2, depth: 1.25 },
] as const

/**
 * The playbook, opened. Noir table, three index cards dealt across it that
 * shift in depth with the cursor; the headline rises line by line. A strip
 * of every play runs along the bottom edge.
 */
export function PlaybookHero({ crumbs, guides }: { crumbs: Crumb[]; guides: HostGuide[] }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 90, damping: 20 })
  const sy = useSpring(my, { stiffness: 90, damping: 20 })

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <section onPointerMove={onMove} className="relative overflow-hidden bg-noir text-noir-ink">
      <div aria-hidden className="pointer-events-none absolute -right-40 top-10 size-[620px] rounded-full bg-coral/20 blur-[140px]" />
      <div className="relative grid min-h-[100svh] gap-10 px-6 pb-28 pt-28 md:px-20 lg:grid-cols-[1.05fr_1fr]">
        <div className="flex flex-col">
          <Breadcrumbs crumbs={crumbs} className="text-noir-ink-2 [&_[aria-current]]:text-noir-ink [&_a:hover]:text-noir-ink" />
          <div className="mt-auto pt-16">
            <Eyebrow dark>Hosting guides</Eyebrow>
            <h1 className="mt-5 font-display text-[clamp(64px,10vw,168px)] font-extrabold leading-[0.84] tracking-[-0.065em]">
              <Line delay={0.05}>The host&apos;s</Line>
              <Line delay={0.18} className="font-serif font-normal italic tracking-[-0.03em] text-brand">playbook.</Line>
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.45 }}
              className="mt-7 max-w-[480px] font-sans text-xl leading-relaxed text-noir-ink-2"
            >
              {guides.length} plays for running a night in your own place, from the first request to the last goodbye in the corridor.
            </motion.p>
          </div>
        </div>

        <div className="relative hidden min-h-[520px] lg:block">
          {TABLE.map((c, k) => (
            <TableCard key={c.i} guide={guides[c.i]} spot={c} k={k} sx={sx} sy={sy} />
          ))}
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 overflow-hidden border-t border-noir-ink/10 py-4">
        <div className="flex w-max animate-[marquee_45s_linear_infinite] gap-10 whitespace-nowrap font-display text-lg font-extrabold tracking-[-0.02em] text-noir-ink-2">
          {[0, 1].map(dup => (
            <div key={dup} aria-hidden={dup === 1} className="flex gap-10">
              {guides.map((g, i) => (
                <Link key={g.slug} href={guideHref(g.slug)} tabIndex={dup ? -1 : undefined} className="transition-colors hover:text-noir-ink">
                  <span className="mr-3 font-serif font-normal italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                  {g.title}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Line({ children, delay, className }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.06em]">
      <motion.span className={`block ${className ?? ''}`} initial={{ y: '105%' }} animate={{ y: 0 }} transition={{ duration: 1, ease: EASE, delay }}>
        {children}
      </motion.span>
    </span>
  )
}

function TableCard({ guide, spot, k, sx, sy }: { guide: HostGuide; spot: (typeof TABLE)[number]; k: number; sx: MotionValue<number>; sy: MotionValue<number> }) {
  const x = useTransform(sx, v => v * 90 * spot.depth)
  const y = useTransform(sy, v => v * 70 * spot.depth)
  const rotate = useTransform(sx, v => spot.rotate + v * 8 * spot.depth)
  return (
    <motion.div
      className="absolute"
      style={{ left: spot.x, top: spot.y, zIndex: k + 1 }}
      initial={{ opacity: 0, y: 120, rotate: 0 }}
      animate={{ opacity: 1, y: 0, rotate: 0 }}
      transition={{ duration: 1.1, ease: EASE, delay: 0.25 + k * 0.12 }}
    >
      <motion.div style={{ x, y, rotate }}>
        <Link href={guideHref(guide.slug)} className="block transition-transform duration-500 ease-out-expo hover:-translate-y-3 hover:scale-[1.03]">
          <IndexCard guide={guide} n={spot.i + 1} preload className="h-[360px] w-[270px]" />
        </Link>
      </motion.div>
    </motion.div>
  )
}
