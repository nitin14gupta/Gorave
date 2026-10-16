'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { POSTERS } from '@/constants'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Poster } from '@/components/ui/Poster'
import { SplitWords } from '@/components/motion/Reveal'
import type { HeroProps } from './types'

const EASE = [0.2, 0.8, 0.2, 1] as const
const SWIPE_MS = 2600
const DEPTH = 4

/** A deck of tonight's flyers that swipes itself — tap to swipe faster. */
export function HeroDeck({ city, crumbs }: HeroProps) {
  const [top, setTop] = useState(0)
  const [dir, setDir] = useState(1)

  const next = () => { setDir(d => -d); setTop(t => (t + 1) % POSTERS.length) }
  useEffect(() => {
    const id = setInterval(next, SWIPE_MS)
    return () => clearInterval(id)
  }, [])

  const cards = Array.from({ length: DEPTH }, (_, k) => (top + k) % POSTERS.length)

  return (
    <section className="relative overflow-hidden bg-sky px-6 pb-20 pt-28 md:px-20">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mx-auto mt-6 grid max-w-[1280px] items-center gap-12 lg:grid-cols-[1fr_520px]">
        <div>
          <h1 className="font-display text-[clamp(56px,7.5vw,112px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-sky-ink">
            <SplitWords text="Swipe through" />
            <br />
            <SplitWords text={`${city.name}.`} delay={0.15} className="text-brand" />
          </h1>
          <p className="mb-8 mt-6 max-w-[460px] font-sans text-xl leading-relaxed text-sky-ink/75">
            A new flyer every few seconds. When one feels right, request to join.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button href="#tonight" size="lg">See tonight</Button>
            <Button href="/host" kind="ink" size="lg">Host in {city.name}</Button>
          </div>
        </div>

        <button type="button" onClick={next} aria-label="Next flyer" className="relative mx-auto hidden h-[520px] w-[400px] lg:block">
          <AnimatePresence initial={false} custom={dir}>
            {cards.slice().reverse().map(idx => {
              const depth = cards.indexOf(idx)
              return (
                <motion.div
                  key={idx}
                  custom={dir}
                  className="absolute left-1/2 top-1/2"
                  initial={{ opacity: 0, scale: 0.85, x: '-50%', y: '-40%' }}
                  animate={{ opacity: 1, scale: 1 - depth * 0.05, x: '-50%', y: `calc(-50% + ${depth * 18}px)`, rotate: depth === 0 ? 0 : (depth % 2 ? 4 : -4) }}
                  exit={{ x: dir > 0 ? '60%' : '-160%', rotate: dir > 0 ? 22 : -22, opacity: 0, transition: { duration: 0.6, ease: EASE } }}
                  transition={{ duration: 0.5, ease: EASE }}
                  style={{ zIndex: DEPTH - depth }}
                >
                  <Poster poster={POSTERS[idx]} area={city.areas[idx % city.areas.length]} width={330} height={440} radius={24} className="shadow-pop" />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </button>
      </div>
    </section>
  )
}
