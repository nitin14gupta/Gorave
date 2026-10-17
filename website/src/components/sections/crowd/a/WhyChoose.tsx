'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import type { CrowdViewProps } from '../types'
import { cn } from '@/lib/cn'
import { EASE, EASE_CSS, Head } from './kit'

// Four close-ups from inside the same room: each panel crops a different corner of the photo.
const CROPS = ['18% 62%', '82% 55%', '50% 85%', '55% 28%']

/**
 * Chapter 05, why people choose it. Four tall panels cut from the same
 * photo; hover one and it widens to show the whole reason while the others
 * narrow. Panels rise in one after another as the row scrolls into view.
 */
export function WhyChoose({ crowd, place }: Pick<CrowdViewProps, 'crowd' | 'place'>) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(0)

  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head n="05" label="Why this room" title="Why people" serif="choose it." aside={`What ${crowd.nights} in ${place.name} are like from the inside.`} />

        <div className="mt-14 hidden h-[560px] gap-3 md:flex">
          {crowd.why.map((w, i) => {
            const on = active === i
            return (
              <motion.button
                key={w.title}
                type="button"
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
                initial={reduce ? false : { opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: EASE }}
                className="group relative min-w-0 overflow-hidden rounded-[28px] text-left text-white"
                style={{ flexGrow: on ? 2.6 : 1, flexBasis: 0, transition: `flex-grow .7s ${EASE_CSS}` }}
              >
                <Image
                  src={crowd.image}
                  alt=""
                  fill
                  sizes="(max-width: 1280px) 50vw, 640px"
                  className="object-cover"
                  style={{ objectPosition: CROPS[i], transform: `scale(${on ? 1.35 : 1.6})`, transition: `transform 1s ${EASE_CSS}` }}
                />
                <div className={cn('absolute inset-0 bg-gradient-to-t transition-opacity duration-500', on ? 'from-black/85 via-black/25 to-transparent' : 'from-black/80 via-black/50 to-black/30')} />
                <div className="absolute left-6 top-6 font-serif text-3xl italic text-white/90">0{i + 1}</div>
                <div className="absolute inset-x-0 bottom-0 p-6">
                  <div className="font-display text-[clamp(22px,2.2vw,32px)] font-extrabold leading-[1.05] tracking-[-0.035em]">{w.title}</div>
                  <div className="grid transition-[grid-template-rows] duration-700" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                    <p className="overflow-hidden">
                      <span
                        className="block max-w-[420px] pt-2 font-sans text-[17px] leading-relaxed text-white/80"
                        style={{ opacity: on ? 1 : 0, transition: `opacity .5s ${EASE_CSS} ${on ? '.2s' : '0s'}` }}
                      >
                        {w.body}
                      </span>
                    </p>
                  </div>
                </div>
              </motion.button>
            )
          })}
        </div>

        <div className="mt-10 grid gap-4 md:hidden">
          {crowd.why.map((w, i) => (
            <motion.div
              key={w.title}
              initial={reduce ? false : { opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, ease: EASE }}
              className="overflow-hidden rounded-[24px] bg-white shadow-soft"
            >
              <div className="relative h-[180px] overflow-hidden">
                <Image src={crowd.image} alt="" fill sizes="92vw" className="scale-[1.4] object-cover" style={{ objectPosition: CROPS[i] }} />
                <div className="absolute left-4 top-3 font-serif text-2xl italic text-white">0{i + 1}</div>
              </div>
              <div className="p-5">
                <div className="font-display text-2xl font-extrabold tracking-[-0.035em]">{w.title}</div>
                <p className="mt-1 font-sans text-base leading-relaxed text-ink-2">{w.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
