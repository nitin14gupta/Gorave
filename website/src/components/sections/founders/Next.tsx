'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'motion/react'
import { GALLERY } from '@/lib/founders'
import { Chapter } from '@/components/ui/atoms'

// The plan, as the founders put it. These are goals, not results.
const GOALS = [
  { big: 'Mumbai', small: 'first', line: 'Where the marketing starts.' },
  { big: '200', small: 'nights', line: 'The goal for the first three months.' },
  { big: 'App', small: 'soon', line: 'Every kind of night. House parties are the vibe.' },
]

/**
 * Chapter 04, what's next: three goal tiles, then a strip of photos that
 * slides sideways with the scroll (not on a loop).
 */
export function Next() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useTransform(p, [0, 1], ['4%', '-30%'])

  return (
    <section ref={ref} className="overflow-hidden bg-paper py-24 md:py-32">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1180px]">
          <Chapter n="04" title="What’s next" />
          <h2 className="mt-4 font-display text-[clamp(44px,6vw,96px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
            The plan,
            <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> out loud.</span>
          </h2>
          <ul className="mt-12 grid gap-3 md:grid-cols-3">
            {GOALS.map(g => (
              <li key={g.big} className="group rounded-[28px] bg-cream p-7 transition-[transform,background-color,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-soft">
                <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Goal</div>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="font-display text-[clamp(56px,6vw,88px)] font-extrabold leading-none tracking-[-0.06em] transition-colors duration-500 group-hover:text-orange">{g.big}</span>
                  <span className="font-serif text-2xl italic text-ink-2">{g.small}</span>
                </div>
                <p className="mt-4 font-sans text-[16px] text-ink-2">{g.line}</p>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <motion.div style={{ x }} className="mt-16 flex w-max gap-4 pl-6 md:pl-12 lg:pl-20">
        {GALLERY.map((src, i) => (
          <div key={src} className="group relative h-[260px] w-[200px] shrink-0 overflow-hidden rounded-[24px] bg-tile md:h-[320px] md:w-[250px]" style={{ transform: `rotate(${i % 2 ? 2 : -2}deg)` }}>
            <Image src={src} alt="" fill sizes="250px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110" />
          </div>
        ))}
      </motion.div>
    </section>
  )
}
