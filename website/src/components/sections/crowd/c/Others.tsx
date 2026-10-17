'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 08, the other crowds. On desktop the cards arrive as one stacked
 * hand and fan out into a row as you scroll; hover lifts one and opens its promise.
 */
export function Others({ others, place, chapter = '08' }: Pick<CrowdViewProps, 'others' | 'place'> & { chapter?: string }) {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'center center'] })

  return (
    <section ref={ref} className="bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n={chapter} title="Other crowds" dark />
        <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          Same {place.citySlug ? place.name : 'country'},
          <br />
          <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">a different room.</span>
        </h2>

        <div className="mt-14 hidden grid-cols-3 gap-6 md:grid" style={{ perspective: 1400 }}>
          {others.map((o, i) => (
            <Fan key={o.slug} i={i} n={others.length} p={scrollYProgress}>
              <Card o={o} />
            </Fan>
          ))}
        </div>
        <div className="mt-10 grid gap-4 md:hidden">
          {others.map(o => <Card key={o.slug} o={o} />)}
        </div>
      </div>
    </section>
  )
}

function Fan({ i, n, p, children }: { i: number; n: number; p: MotionValue<number>; children: React.ReactNode }) {
  const reduce = useReducedMotion()
  const mid = (n - 1) / 2
  const off = i - mid
  const x = useTransform(p, [0.15, 1], [`${reduce ? 0 : -off * 104}%`, '0%'])
  const rotate = useTransform(p, [0.15, 1], [reduce ? 0 : off * 7, 0])
  const y = useTransform(p, [0.15, 1], [reduce ? 0 : Math.abs(off) * 30, 0])
  return (
    <motion.div style={{ x, rotate, y, zIndex: n - Math.round(Math.abs(off) * 2) }} className="relative">
      {children}
    </motion.div>
  )
}

function Card({ o }: { o: CrowdViewProps['others'][number] }) {
  return (
    <Link
      href={o.href}
      className="group relative block aspect-[4/5] overflow-hidden rounded-[30px] bg-noir-2 shadow-pop outline-none transition-transform duration-500 ease-out-expo hover:-translate-y-3 focus-visible:-translate-y-3 max-md:aspect-[5/4]"
    >
      <Image src={o.image} alt="" fill sizes="(max-width: 768px) 100vw, 420px" className="object-cover transition-transform duration-[1100ms] ease-out-expo group-hover:scale-[1.08]" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-noir via-noir/35 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-7">
        <div className="font-display text-[clamp(34px,3.4vw,52px)] font-extrabold leading-none tracking-[-0.05em]">{o.label}</div>
        <div className="grid grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out-expo md:grid-rows-[0fr] md:group-hover:grid-rows-[1fr] md:group-focus-visible:grid-rows-[1fr]">
          <div className="overflow-hidden">
            <p className="pt-2 font-sans text-base text-noir-ink/85">{o.promise}</p>
          </div>
        </div>
        <div className="mt-4 inline-flex items-center gap-2 font-sans text-sm font-bold text-noir-ink">
          See {o.label.toLowerCase()} nights
          <span className="transition-transform duration-500 ease-out-expo group-hover:translate-x-1.5">→</span>
        </div>
      </div>
    </Link>
  )
}
