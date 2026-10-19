'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { TEAM, founderHref } from '@/lib/founders'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'

const EASE = [0.2, 0.8, 0.2, 1] as const
const CRUMBS = [{ label: 'Home', href: '/' }, { label: 'About', href: '/about' }, { label: 'Founders', href: '/founders' }]

/**
 * Hero. The line, then the two of them as a pair of polaroids leaning on
 * each other; hover one and it straightens and steps forward with their
 * name, the other leans away. Each one opens their own page.
 */
export function FoundersHero() {
  const reduce = !!useReducedMotion()
  const [on, setOn] = useState<string | null>(null)

  return (
    <section className="overflow-hidden bg-cream px-6 pb-24 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Breadcrumbs crumbs={CRUMBS} />
        <div className="mt-10 grid items-center gap-16 lg:grid-cols-[1.1fr_1fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <div className="font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">The founders</div>
            <h1 className="mt-5 font-display text-[clamp(52px,7.6vw,128px)] font-extrabold leading-[0.86] tracking-[-0.07em]">
              It started with
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> an empty apartment.</span>
            </h1>
            <p className="mt-7 max-w-[460px] font-sans text-xl leading-relaxed text-ink-2">
              And a party where nobody talked. This is how two friends ended up building a better way to meet people.
            </p>
          </motion.div>

          <div className="relative mx-auto h-[440px] w-full max-w-[460px] md:h-[500px]" onMouseLeave={() => setOn(null)}>
            {TEAM.map((f, i) => {
              const me = on === f.key
              const other = on !== null && !me
              const base = i === 0 ? { x: -70, rotate: -7 } : { x: 70, rotate: 6 }
              return (
                <motion.div
                  key={f.key}
                  initial={reduce ? false : { opacity: 0, y: 60, rotate: 0 }}
                  animate={{
                    opacity: 1,
                    x: base.x + (other ? (i === 0 ? -40 : 40) : 0),
                    y: me ? -16 : 0,
                    rotate: me ? 0 : base.rotate + (other ? (i === 0 ? -5 : 5) : 0),
                    scale: me ? 1.05 : other ? 0.94 : 1,
                  }}
                  transition={{ type: 'spring', stiffness: 160, damping: 20, delay: reduce ? 0 : on === null ? 0.2 + i * 0.12 : 0 }}
                  className="absolute left-1/2 top-4 -ml-[130px] w-[260px] md:-ml-[150px] md:w-[300px]"
                  style={{ zIndex: me ? 3 : i === 0 ? 2 : 1 }}
                >
                  <Link href={founderHref(f)} onMouseEnter={() => setOn(f.key)} onFocus={() => setOn(f.key)} className="block bg-white p-3 pb-16 shadow-pop">
                    <div className="relative aspect-[4/5] overflow-hidden bg-tile">
                      <Image src={f.photo} alt={`${f.name}, ${f.role} of Gorave`} fill priority sizes="300px" className="object-cover" style={{ objectPosition: f.pos }} />
                    </div>
                    <div className="absolute inset-x-3 bottom-4 flex items-baseline justify-between">
                      <span className="font-serif text-[24px] italic leading-none">{f.first} <span className="text-orange">{f.verb}</span></span>
                      <span aria-hidden className="font-sans text-sm font-bold transition-opacity" style={{ opacity: me ? 1 : 0 }}>→</span>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
