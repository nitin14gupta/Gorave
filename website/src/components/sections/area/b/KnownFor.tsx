'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'motion/react'
import { AREA_SCENES, cityStreet, type Area } from '@/lib/area'
import { cn } from '@/lib/cn'
import { CARD_SHADOW, Deckle, Grain, Postmark, SectionHead, perforation, WAVES } from './kit'

// Duotone inks: multiply sets the highlight colour, screen lifts the blacks.
const INKS = [
  { light: '#ff9a6b', dark: '#3d1420', rotate: -3 },
  { light: '#8cc4a8', dark: '#0f2b22', rotate: 2.5 },
  { light: '#8fa9e0', dark: '#121d3d', rotate: -1.5 },
]

/**
 * Chapter 05, known for. A small sheet of collectible stamps: each a duotone
 * print with a denomination corner and a small-caps caption. They press down
 * one by one; hover one and it peels off the sheet, corner curling.
 */
export function KnownFor({ area }: { area: Area }) {
  const reduce = useReducedMotion()
  const { city, profile } = area
  const pictures = [
    { src: cityStreet(city.slug), pos: '18% 62%' },
    { src: AREA_SCENES.rooftop, pos: '50% 35%' },
    { src: AREA_SCENES.latebite, pos: '62% 55%' },
  ]

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-28 md:px-20 md:py-32">
      <Deckle from="paper" seed={3} />
      <Grain />
      <div className="relative mx-auto max-w-[1180px]">
        <SectionHead n="05" label="Known for" title="Three things" serif="everyone mentions." aside="Hover a stamp to peel it off the sheet." />

        <div className={cn('relative mx-auto mt-14 max-w-[860px] bg-[#fffdf8] px-5 pb-8 pt-5 sm:px-10 sm:pb-12', CARD_SHADOW)}>
          <div className="flex items-center justify-between border-b border-dashed border-ink/15 pb-3 font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-ink-3">
            <span>{area.name} series</span>
            <span className="hidden sm:inline">{city.name} · {city.coords}</span>
            <span>3 stamps</span>
          </div>

          {/* cancellation across the sheet */}
          <div aria-hidden className="pointer-events-none absolute -right-8 top-6 z-30 hidden w-[330px] items-center text-ink/45 md:flex">
            <Postmark top={`${area.name} · ${city.name}`} bottom="known for" center={profile.moods[0]} className="w-[104px] shrink-0 -rotate-12" />
            <svg viewBox="0 0 180 48" className="w-[210px]" fill="none" stroke="currentColor" strokeWidth="1.6">
              {WAVES.map((d, i) => (
                <motion.path
                  key={d}
                  d={d}
                  initial={reduce ? false : { pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.2, delay: 1 + i * 0.15, ease: [0.45, 0, 0.2, 1] }}
                />
              ))}
            </svg>
          </div>

          <ul className="mt-10 flex flex-wrap justify-center gap-x-4 gap-y-8 sm:gap-x-10">
            {profile.knownFor.map((thing, i) => {
              const ink = INKS[i]
              const pic = pictures[i]
              return (
                <li key={thing} className="w-[min(220px,35vw)] [perspective:900px]">
                  <motion.div
                    initial={reduce ? false : { opacity: 0, scale: 1.2, rotate: ink.rotate + 9, y: -16 }}
                    whileInView={{ opacity: 1, scale: 1, rotate: ink.rotate, y: 0 }}
                    whileHover={reduce ? undefined : { y: -16, rotate: 0, rotateX: 10, scale: 1.05 }}
                    viewport={{ once: true, margin: '0px 0px -15% 0px' }}
                    transition={{ type: 'spring', stiffness: 220, damping: 15, delay: i * 0.16 }}
                    className="group relative cursor-default drop-shadow-[0_8px_10px_rgb(23_19_16/0.16)] transition-[filter] duration-500 hover:drop-shadow-[0_30px_24px_rgb(23_19_16/0.24)]"
                    style={{ transformOrigin: '50% 100%' }}
                  >
                    <div className="relative bg-white" style={perforation(4, 12)}>
                      <div className="relative aspect-[4/5] overflow-hidden">
                        <Image src={pic.src} alt="" fill sizes="220px" className="object-cover contrast-[1.15] grayscale" style={{ objectPosition: pic.pos }} />
                        <div aria-hidden className="absolute inset-0 mix-blend-multiply" style={{ background: ink.light }} />
                        <div aria-hidden className="absolute inset-0 mix-blend-screen" style={{ background: ink.dark }} />
                        <div aria-hidden className="absolute inset-1.5 border border-white/45" />
                        <span className="absolute left-3 top-2 font-serif text-[28px] italic leading-none text-white drop-shadow-[0_1px_2px_rgb(0_0_0/0.3)]">₹0</span>
                        <span className="absolute right-3 top-3 font-sans text-[9px] font-bold uppercase tracking-[0.18em] text-white/90">No. {String(i + 1).padStart(2, '0')}</span>
                        <span className="absolute bottom-2.5 left-3 font-sans text-[8px] font-bold uppercase tracking-[0.22em] text-white/80">Gorave · {city.name}</span>
                      </div>
                      <div className="px-1 pb-1.5 pt-3 text-center">
                        <div className="font-sans text-[11px] font-bold uppercase leading-snug tracking-[0.16em] text-ink">{thing}</div>
                        <div className="mt-0.5 font-serif text-[15px] italic text-ink-3">{area.name}</div>
                      </div>
                      {/* the corner that curls up on hover */}
                      <div
                        aria-hidden
                        className="absolute bottom-0 right-0 size-12 origin-bottom-right scale-0 transition-transform duration-500 ease-out-expo group-hover:scale-100"
                        style={{ background: 'linear-gradient(315deg, #fffdf8 0 50%, #ffffff 50%, #e9e1cf 100%)', boxShadow: '-5px -5px 9px -6px rgb(23 19 16 / .3)' }}
                      />
                    </div>
                  </motion.div>
                </li>
              )
            })}
          </ul>
          <p className="mt-10 text-center font-serif text-lg italic text-ink-3">₹0: listing a night on Gorave is free.</p>
        </div>
      </div>
    </section>
  )
}
