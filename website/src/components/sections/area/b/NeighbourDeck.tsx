'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, useReducedMotion, type PanInfo } from 'motion/react'
import { AREA_SCENES, cityStreet, type Area } from '@/lib/area'
import { areaSlug } from '@/lib/city'
import { CARD_SHADOW, Deckle, Grain, SectionHead, Stamp } from './kit'

const TILTS = [-3, 4, -6, 5, -2, 6, -4]

/**
 * Chapter 07, next door. The other neighbourhoods in the city as a deck of
 * postcards. Drag (or swipe) the top card away to send it to the back, or
 * hover a name in the list to pull its card to the top. Click to visit.
 */
export function NeighbourDeck({ area }: { area: Area }) {
  const { city, neighbours } = area
  const reduce = useReducedMotion()
  const [order, setOrder] = useState(() => neighbours.map((_, i) => i))
  const dragged = useRef(false)
  const scenes = [cityStreet(city.slug), AREA_SCENES.rooftop, AREA_SCENES.chai, AREA_SCENES.livingroom, AREA_SCENES.latebite, AREA_SCENES.building]

  if (neighbours.length === 0) return null

  const next = () => setOrder(o => [...o.slice(1), o[0]])
  const bringToTop = (idx: number) => setOrder(o => (o[0] === idx ? o : [idx, ...o.filter(x => x !== idx)]))

  function onDragEnd(_: unknown, info: PanInfo) {
    if (Math.abs(info.offset.x) > 110 || Math.abs(info.velocity.x) > 600) next()
    // let the click that ends a drag be swallowed
    window.setTimeout(() => { dragged.current = false }, 0)
  }

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-28 md:px-20 md:py-36">
      <Deckle from="paper" seed={4} />
      <Grain />
      <div className="relative mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <SectionHead n="07" label="Next door" title="Postcards from" serif="the neighbours." />
          <p className="mt-4 max-w-[420px] font-sans text-lg leading-relaxed text-ink-2">
            {city.name} doesn&apos;t stop at {area.name}. Drag the top card to flip through, or pick a name.
          </p>
          <ul className="mt-9 max-w-[420px]">
            {neighbours.map((n, i) => (
              <li key={n} onMouseEnter={() => bringToTop(i)} onFocus={() => bringToTop(i)}>
                <Link
                  href={`/${city.slug}/${areaSlug(n)}`}
                  className="group flex items-baseline justify-between border-b border-ink/15 py-3 transition-colors hover:border-ink/40"
                >
                  <span className="font-serif text-[26px] italic leading-none text-ink-2 transition-[color,transform] duration-500 ease-out-expo group-hover:translate-x-2 group-hover:text-ink">{n}</span>
                  <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3 transition-colors group-hover:text-orange">{city.name} →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative mx-auto w-full max-w-[640px] pb-20">
          <div aria-hidden className="aspect-[3/2]" />
          {neighbours.map((n, i) => {
            const pos = order.indexOf(i)
            const top = pos === 0
            const visible = pos < 4
            const tilt = TILTS[i % TILTS.length]
            return (
              <motion.div
                key={n}
                drag={top && !reduce ? 'x' : false}
                dragSnapToOrigin
                dragElastic={0.6}
                onDragStart={() => { dragged.current = true }}
                onDragEnd={onDragEnd}
                initial={false}
                animate={{
                  rotate: top ? tilt * 0.35 : tilt,
                  y: pos * 14,
                  x: pos * 10,
                  scale: 1 - pos * 0.035,
                  opacity: visible ? 1 : 0,
                }}
                whileHover={top && !reduce ? { y: -8, rotate: 0, scale: 1.015 } : undefined}
                whileDrag={{ scale: 1.03, rotate: 0, cursor: 'grabbing' }}
                transition={{ type: 'spring', stiffness: 120, damping: 18 }}
                className="absolute inset-x-0 top-0 touch-pan-y"
                style={{ zIndex: neighbours.length - pos, cursor: top ? 'grab' : 'default', pointerEvents: visible ? 'auto' : 'none' }}
              >
                <Link
                  href={`/${city.slug}/${areaSlug(n)}`}
                  draggable={false}
                  tabIndex={top ? 0 : -1}
                  aria-hidden={!top}
                  onClick={e => { if (dragged.current || !top) { e.preventDefault(); if (!top) bringToTop(i) } }}
                  className={`grid aspect-[3/2] select-none grid-cols-[1.1fr_1fr] gap-4 bg-white p-3 ${CARD_SHADOW} sm:gap-6 sm:p-4`}
                >
                  <div className="relative overflow-hidden bg-tile">
                    <Image src={scenes[i % scenes.length]} alt="" fill sizes="(max-width: 1024px) 50vw, 340px" draggable={false} className="object-cover" />
                  </div>
                  <div className="relative flex min-w-0 flex-col py-1 pr-1">
                    <Stamp className="ml-auto w-[46px] rotate-3 sm:w-[58px]" innerClassName="!bg-cream">
                      <div className="grid aspect-[4/5] place-items-center bg-brand font-serif text-lg italic text-white">{n[0]}</div>
                    </Stamp>
                    <div className="mt-auto">
                      <div className="font-serif text-base italic text-ink-3 sm:text-lg">Greetings from</div>
                      <div className="truncate font-display text-[clamp(24px,3.2vw,40px)] font-extrabold leading-[0.95] tracking-[-0.045em] text-ink">{n}</div>
                      <div className="mt-3 space-y-2.5 sm:mt-4">
                        <div className="border-b border-ink/15 pb-1 font-serif text-sm italic text-ink-2 sm:text-base">{city.name}, {city.state}</div>
                        <div className="flex items-center justify-between border-b border-ink/15 pb-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">
                          Open postcard <span className="text-orange">→</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            )
          })}
          {neighbours.length > 1 && (
            <button
              type="button"
              onClick={next}
              className="absolute bottom-0 right-0 rounded-full bg-ink px-4 py-2.5 font-sans text-[13px] font-bold text-cream shadow-soft transition-transform duration-300 ease-out-expo hover:-translate-y-0.5"
            >
              Next card →
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
