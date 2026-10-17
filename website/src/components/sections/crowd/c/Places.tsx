'use client'

import Link from 'next/link'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { Chapter } from '@/components/ui/atoms'
import { EASE, EASE_CSS } from './kit'

/**
 * Chapter 05, where to go next. Huge place names; hover one and its street
 * photo fills the letters while a postcard of it trails the cursor. Touch
 * screens show the photo in the letters straight away.
 */
export function Places({ crowd, place, places, chapter = '05' }: Pick<CrowdViewProps, 'crowd' | 'place' | 'places'> & { chapter?: string }) {
  const hub = place.citySlug === null
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const [active, setActive] = useState<number | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 140, damping: 20, mass: 0.6 })
  const y = useSpring(my, { stiffness: 140, damping: 20, mass: 0.6 })

  function onMove(e: React.PointerEvent | React.MouseEvent) {
    if ('pointerType' in e && e.pointerType !== 'mouse') return
    const b = ref.current?.getBoundingClientRect()
    if (!b) return
    mx.set(e.clientX - b.left)
    my.set(e.clientY - b.top)
    // Nothing showing yet: start the postcard at the cursor instead of flying in from the corner.
    if (active === null) {
      x.jump(e.clientX - b.left)
      y.jump(e.clientY - b.top)
    }
  }

  const cur = active === null ? null : places[active]

  return (
    <section ref={ref} onPointerMove={onMove} className="relative overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n={chapter} title={hub ? 'The cities' : 'The neighbourhoods'} />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              {hub ? 'Pick a city.' : 'Pick a neighbourhood.'}
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg text-ink-2">
            {cap(crowd.nights)} {hub ? 'across India' : `around ${place.name}`}, with what&apos;s listed right now.
          </p>
        </div>

        <ul className="mt-14 border-b border-ink/12" onMouseLeave={() => setActive(null)}>
          {places.map((pl, i) => {
            const dim = active !== null && active !== i
            return (
              <motion.li
                key={pl.href}
                initial={reduce ? false : { opacity: 0, x: i % 2 ? 80 : -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-8% 0px' }}
                transition={{ duration: 1, ease: EASE, delay: (i % 3) * 0.05 }}
                className="border-t border-ink/12"
              >
                <Link
                  href={pl.href}
                  onMouseEnter={e => {
                    onMove(e)
                    setActive(i)
                  }}
                  onFocus={() => setActive(i)}
                  className="group flex items-center gap-4 py-3 outline-none md:gap-8 md:py-4"
                  style={{ opacity: dim ? 0.28 : 1, transition: `opacity .5s ${EASE_CSS}` }}
                >
                  <span className="w-8 shrink-0 font-serif text-lg italic text-orange md:w-12 md:text-2xl">{String(i + 1).padStart(2, '0')}</span>
                  <span
                    className="relative min-w-0 flex-1 font-display text-[clamp(38px,8.2vw,132px)] font-extrabold leading-[1] tracking-[-0.055em] transition-transform duration-700 ease-out-expo group-hover:translate-x-6 group-focus-visible:translate-x-6"
                  >
                    <span className="block truncate pb-[0.08em] text-ink transition-opacity duration-500 group-hover:opacity-0 group-focus-visible:opacity-0 [@media(hover:none)]:opacity-0">{pl.label}</span>
                    <span
                      aria-hidden
                      className="absolute inset-0 block truncate bg-clip-text brightness-[1.35] saturate-[1.2] pb-[0.08em] text-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
                      style={{ backgroundImage: `url(${pl.image})`, backgroundSize: 'max(100%, 860px) auto', backgroundPosition: `${(i * 29) % 100}% ${45 + ((i * 17) % 30)}%` }}
                    >
                      {pl.label}
                    </span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="block font-display text-2xl font-extrabold tracking-[-0.04em] text-ink md:text-4xl">{pl.count}</span>
                    <span className="block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{pl.count > 0 ? 'upcoming' : 'none yet'}</span>
                  </span>
                </Link>
              </motion.li>
            )
          })}
        </ul>
      </div>

      {/* The postcard that trails the cursor */}
      <motion.div aria-hidden className="pointer-events-none absolute left-0 top-0 z-20 hidden md:block" style={{ x, y }}>
        <AnimatePresence>
          {cur && (
            <motion.div
              key={cur.href}
              initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
              animate={{ opacity: 1, scale: 1, rotate: (active ?? 0) % 2 ? 5 : -5 }}
              exit={{ opacity: 0, scale: 0.7, rotate: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              className="absolute left-[36px] -top-[160px] h-[300px] w-[220px] overflow-hidden rounded-[22px] bg-noir shadow-pop ring-4 ring-white"
            >
              <div className="absolute inset-0 bg-cover" style={{ backgroundImage: `url(${cur.image})`, backgroundPosition: `${((active ?? 0) * 29) % 100}% 50%` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-noir/85 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-noir-ink">
                <div className="font-display text-xl font-extrabold leading-tight tracking-[-0.03em]">{cur.label}</div>
                <div className="mt-0.5 font-sans text-xs font-bold text-noir-ink/80">{cur.count > 0 ? `${cur.count} upcoming · ` : ''}{crowd.label}</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </section>
  )
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
