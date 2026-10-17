'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState } from 'react'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, useVelocity } from 'motion/react'
import { AREA_SCENES } from '@/lib/area'
import type { CrowdContent } from '@/lib/crowd'
import { Chapter } from '@/components/ui/atoms'
import { EASE_CSS, pad } from './kit'

interface Props {
  crowd: CrowdContent
  place: { name: string; citySlug: string | null }
  places: { label: string; href: string; count: number; image: string }[]
  chapter?: string
}

// On a city page every neighbourhood shares the city's street photo, so mix in
// scenes from a night in to give each row its own picture.
const SCENES = [AREA_SCENES.rooftop, AREA_SCENES.livingroom, AREA_SCENES.chai, AREA_SCENES.doorway, AREA_SCENES.latebite, AREA_SCENES.building]

/**
 * Chapter 04, the index. Places set like the contents page of a magazine,
 * each with its live count. Hover a row and its photo follows the cursor,
 * leaning into the direction you move; leave and it tucks away.
 */
export function PlacesIndex({ crowd, place, places, chapter = '04' }: Props) {
  const reduce = useReducedMotion()
  const box = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState<number | null>(null)
  const hub = !place.citySlug
  const images = places.map((p, i) => (hub || i === 0 ? p.image : SCENES[(i - 1) % SCENES.length]))

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 26, mass: 0.6 })
  const sy = useSpring(my, { stiffness: 220, damping: 26, mass: 0.6 })
  const vx = useVelocity(sx)
  const rotate = useTransform(vx, [-1600, 0, 1600], reduce ? [0, 0, 0] : [-12, 0, 12], { clamp: true })

  function onMove(e: React.PointerEvent) {
    if (e.pointerType !== 'mouse') return
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    mx.set(Math.round(e.clientX - r.left))
    my.set(Math.round(e.clientY - r.top))
  }
  /** First hover: jump the photo to the cursor instead of flying in from the corner. */
  function onEnter(e: React.PointerEvent, i: number) {
    if (e.pointerType !== 'mouse') return
    const r = box.current?.getBoundingClientRect()
    if (r && active === null) {
      const x = Math.round(e.clientX - r.left)
      const y = Math.round(e.clientY - r.top)
      mx.jump(x)
      my.jump(y)
      sx.jump(x)
      sy.jump(y)
    }
    setActive(i)
  }

  const on = active !== null

  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-36 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n={chapter} title={hub ? 'The cities' : 'The neighbourhoods'} />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              {hub ? 'Pick a city' : 'Pick your corner'}
              <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">{hub ? '.' : ` of ${place.name}.`}</span>
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg text-ink-2">
            {hub ? `Upcoming ${crowd.nights}, city by city.` : `Upcoming ${crowd.nights} near you, area by area.`}
          </p>
        </div>

        <div ref={box} onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="relative mt-14 md:mt-20">
          {/* Cursor-following photo (desktop, mouse only) */}
          <motion.div
            aria-hidden
            style={{ x: sx, y: sy, rotate }}
            className="pointer-events-none absolute left-0 top-0 z-0 hidden md:block"
          >
            <div
              style={{
                opacity: on ? 1 : 0,
                transform: `translate(-50%, -50%) scale(${on ? 1 : 0.6})`,
                transition: `opacity .35s ${EASE_CSS}, transform .5s ${EASE_CSS}`,
              }}
            >
              <div className="relative h-[340px] w-[270px] overflow-hidden rounded-[22px] shadow-pop">
                {images.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt=""
                    fill
                    sizes="300px"
                    className="object-cover"
                    style={{
                      opacity: active === i ? 1 : 0,
                      transform: `scale(${active === i ? 1 : 1.18})`,
                      transition: `opacity .4s ${EASE_CSS}, transform .8s ${EASE_CSS}`,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          <ul className="border-t border-ink/15">
            {places.map((p, i) => {
              const isOn = active === i
              const dim = on && !isOn
              return (
                <li key={p.href} className="border-b border-ink/15">
                  <Link
                    href={p.href}
                    onPointerEnter={e => onEnter(e, i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    className="relative z-10 flex items-center gap-4 py-5 md:gap-8 md:py-7"
                  >
                    <span className="w-8 shrink-0 font-serif text-lg italic text-orange md:w-12 md:text-2xl">{pad(i + 1)}</span>
                    <span
                      className="min-w-0 flex-1 truncate font-display text-[clamp(34px,6.4vw,104px)] leading-[0.95] tracking-[-0.05em] text-ink"
                      style={{
                        fontWeight: isOn ? 800 : 500,
                        opacity: dim ? 0.22 : 1,
                        transform: `translateX(${isOn ? 18 : 0}px)`,
                        transition: `opacity .45s ${EASE_CSS}, transform .6s ${EASE_CSS}, font-weight .45s ${EASE_CSS}`,
                      }}
                    >
                      {p.label}
                    </span>
                    <span className="relative size-14 shrink-0 overflow-hidden rounded-xl md:hidden">
                      <Image src={images[i]} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span
                      className="hidden shrink-0 text-right md:block"
                      style={{ opacity: dim ? 0.3 : 1, transition: `opacity .45s ${EASE_CSS}` }}
                    >
                      <span className="block font-display text-3xl font-extrabold tracking-[-0.04em] text-ink">{p.count}</span>
                      <span className="block font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">upcoming</span>
                    </span>
                    <span
                      aria-hidden
                      className="hidden font-display text-4xl text-ink md:block"
                      style={{ transform: `translateX(${isOn ? 0 : -10}px) rotate(${isOn ? 0 : -45}deg)`, opacity: isOn ? 1 : 0.25, transition: `all .5s ${EASE_CSS}` }}
                    >
                      →
                    </span>
                  </Link>
                  <div className="-mt-3 pb-4 pl-12 font-sans text-sm font-bold text-ink-3 md:hidden">
                    {p.count} upcoming
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </section>
  )
}
