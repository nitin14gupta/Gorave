'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { AreaTypeProps } from '@/lib/areaType'
import { AREA_SCENES, cityStreet } from '@/lib/area'
import { Chapter } from '@/components/ui/atoms'

type Bit = { word: string } | { photo: string }

/**
 * Chapter 02, the feeling. Three giant lines of words slide in opposite
 * directions as you scroll, with little photo pills set into the type.
 * Hover a word to light it, hover a pill and it opens wider. Then the
 * neighbourhood's vibe in one sentence.
 */
export function Feeling({ area, story, events }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const live = events.map(e => e.image).filter((s): s is string => !!s)
  const pics = [...live, PHOTOS[story.heroPhoto], AREA_SCENES.rooftop, cityStreet(area.city.slug), AREA_SCENES.chai, AREA_SCENES.livingroom, AREA_SCENES.latebite, ...story.night.map(n => PHOTOS[n.photo])]
  const [m1, m2, m3] = area.profile.moods
  const [k1, k2, k3] = area.profile.knownFor
  const pic = (i: number): Bit => ({ photo: pics[i % pics.length] })
  const rows: Bit[][] = [
    [{ word: area.name }, pic(0), { word: m1 }, pic(1), { word: story.plural.toLowerCase() }, pic(2), { word: m2 }],
    [{ word: k1.toLowerCase() }, pic(3), { word: m3 }, pic(4), { word: k2.toLowerCase() }, pic(5)],
    [{ word: k3.toLowerCase() }, pic(6), { word: area.city.name }, pic(7), { word: 'after dark' }, pic(8), { word: area.name }],
  ]

  return (
    <section ref={ref} className="overflow-hidden bg-paper py-24 md:py-32">
      <div className="px-6 md:px-12 lg:px-20">
        <div className="mx-auto max-w-[1180px]">
          <Chapter n="02" title={`The ${area.name} feeling`} />
        </div>
      </div>
      <div className="mt-10 space-y-2 md:space-y-4">
        {rows.map((row, i) => (
          <Line key={i} row={row} p={p} dir={i % 2 ? 1 : -1} reduce={reduce} />
        ))}
      </div>
      <div className="mt-16 px-6 md:px-12 lg:px-20">
        <p className="mx-auto max-w-[760px] text-center font-serif text-[clamp(24px,2.6vw,36px)] italic leading-snug text-ink-2">
          “{area.profile.vibe}”
        </p>
      </div>
    </section>
  )
}

function Line({ row, p, dir, reduce }: { row: Bit[]; p: MotionValue<number>; dir: 1 | -1; reduce: boolean }) {
  const x = useTransform(p, [0, 1], reduce ? ['0%', '0%'] : dir === -1 ? ['4%', '-34%'] : ['-34%', '4%'])
  // Twice over so the line never runs out while it slides.
  const bits = [...row, ...row]
  return (
    <motion.div style={{ x }} className="flex w-max items-center gap-[0.25em] whitespace-nowrap font-display text-[clamp(56px,9vw,150px)] font-extrabold leading-[1.02] tracking-[-0.06em]">
      {bits.map((b, i) =>
        'word' in b ? (
          <span key={i} className="cursor-default text-ink transition-colors duration-300 hover:text-orange">{b.word}</span>
        ) : (
          <span key={i} aria-hidden className="relative inline-block h-[0.72em] w-[1.5em] overflow-hidden rounded-full bg-tile align-middle transition-[width] duration-700 ease-out-expo hover:w-[2.8em]">
            <Image src={b.photo} alt="" fill sizes="240px" className="object-cover" />
          </span>
        ),
      )}
    </motion.div>
  )
}
