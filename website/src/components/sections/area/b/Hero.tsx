'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import { AREA_SCENES, cityStreet, type Area } from '@/lib/area'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { CARD_SHADOW, Grain, Postmark, Stamp, Tape, WAVES } from './kit'

/**
 * "Postcards from Bandra." The city's blue-hour street lands on the table as a
 * big postcard, a soft drop with a slight tilt, then follows the cursor in
 * gentle 3D. Stamp and postmark sit on separate layers so they drift more.
 */
export function Hero({ area, crumbs }: { area: Area; crumbs: Crumb[] }) {
  const { city, profile } = area
  const reduce = useReducedMotion()
  const ref = useRef<HTMLElement>(null)

  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 50, damping: 18 })
  const sy = useSpring(my, { stiffness: 50, damping: 18 })
  const rotY = useTransform(sx, [-0.5, 0.5], [-7, 7])
  const rotX = useTransform(sy, [-0.5, 0.5], [6, -6])
  const layerX = useTransform(sx, [-0.5, 0.5], [-18, 18])
  const layerY = useTransform(sy, [-0.5, 0.5], [-14, 14])
  const backX = useTransform(sx, [-0.5, 0.5], [10, -10])

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const cardY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 140])
  const cardR = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : 4])
  const markR = useTransform(scrollYProgress, [0, 1], [-14, reduce ? -14 : 70])
  const textY = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -60])

  function onMove(e: React.PointerEvent) {
    if (reduce || e.pointerType !== 'mouse') return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }
  function onLeave() {
    mx.set(0)
    my.set(0)
  }

  const drop = (delay: number, rotate: number) => ({
    initial: reduce ? false : { opacity: 0, y: -90, rotate: rotate - 9, scale: 1.05 },
    animate: { opacity: 1, y: 0, rotate, scale: 1 },
    transition: { type: 'spring' as const, stiffness: 42, damping: 13, mass: 1.1, delay },
  })

  return (
    <section ref={ref} onPointerMove={onMove} onPointerLeave={onLeave} className="relative overflow-hidden bg-paper">
      <Grain />
      <div className="relative mx-auto grid min-h-[100svh] max-w-[1400px] items-center gap-14 px-6 pb-20 pt-28 md:px-12 lg:grid-cols-[1fr_1.12fr] lg:gap-10 lg:px-20">
        <motion.div style={{ y: textY }} className="relative z-10">
          <Breadcrumbs crumbs={crumbs} />
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
          >
            <div className="mt-10 font-serif text-2xl italic text-ink-2">Greetings, and</div>
            <h1 className="mt-1 font-display text-[clamp(54px,8vw,128px)] font-extrabold leading-[0.88] tracking-[-0.055em] text-ink">
              Postcards
              <br />
              from <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">{area.name}.</span>
            </h1>
            <p className="mt-7 max-w-[470px] font-sans text-xl leading-relaxed text-ink-2">
              {area.name}, {city.name}: {profile.line}. House parties, rooftops and long dinners, hosted by people who live here.
            </p>
            <div className="mt-9 flex flex-wrap gap-2.5">
              <Button href="#whats-on" size="lg">See what&apos;s on</Button>
              <Button href="/host" kind="ghost" size="lg">Host in {area.name}</Button>
            </div>
            <div className="mt-12 flex items-center gap-3 font-serif text-lg italic text-ink-3">
              <span className="h-px w-10 bg-ink/20" />
              {city.coords} · {city.name}, {city.state}
            </div>
          </motion.div>
        </motion.div>

        {/* The postcard pile */}
        <motion.div style={{ y: cardY, rotate: cardR }} className="relative mx-auto w-full max-w-[680px] [perspective:1400px]">
          {/* a polaroid tucked behind */}
          <motion.div style={{ x: backX }} className="absolute -bottom-10 -left-4 w-[38%] sm:-left-10">
            <motion.div {...drop(0.55, -8)} className={`bg-white p-2.5 pb-10 sm:p-3 sm:pb-12 ${CARD_SHADOW}`}>
              <div className="relative aspect-[3/4] overflow-hidden">
                <Image src={AREA_SCENES.building} alt="" fill sizes="(max-width: 1024px) 38vw, 260px" className="object-cover" />
              </div>
              <div className="absolute inset-x-0 bottom-2.5 text-center font-serif text-base italic text-ink-2 sm:bottom-3.5">lights on, upstairs</div>
            </motion.div>
          </motion.div>

          <motion.div {...drop(0.15, -3)}>
            <motion.div style={{ rotateX: rotX, rotateY: rotY, transformStyle: 'preserve-3d' }} className="relative">
              <div className={`relative bg-white p-3 pb-16 sm:p-4 sm:pb-20 ${CARD_SHADOW}`}>
                <div className="relative aspect-[16/10] overflow-hidden">
                  <Image src={cityStreet(city.slug)} alt={`A street in ${city.name} at blue hour`} fill priority sizes="(max-width: 1024px) 92vw, 680px" className="object-cover" />
                </div>
                <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4 sm:inset-x-5 sm:bottom-5">
                  <div className="font-serif text-[clamp(20px,2.4vw,30px)] italic leading-none text-ink">Wish you were here.</div>
                  <div className="hidden font-sans text-[11px] font-bold uppercase tracking-[0.18em] text-ink-3 sm:block">{area.name} · {city.name}</div>
                </div>
              </div>
              <Tape className="-left-5 top-5 -rotate-[32deg]" />
              <Tape className="-right-4 bottom-8 rotate-[28deg]" />

              {/* stamp + postmark ride a layer above the card */}
              <motion.div style={{ x: layerX, y: layerY, z: 40 }} className="absolute -right-3 -top-8 sm:-right-8 sm:-top-10">
                <motion.div {...drop(0.75, 5)}>
                  <Stamp className="w-[86px] sm:w-[112px]">
                    <div className="relative aspect-[4/5] overflow-hidden bg-sky">
                      <Image src={AREA_SCENES.rooftop} alt="" fill sizes="112px" className="object-cover" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-1.5 pb-1 pt-4 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-white">
                        Gorave · {city.name}
                      </div>
                    </div>
                  </Stamp>
                </motion.div>
              </motion.div>
              <motion.div style={{ x: layerX, y: layerY, z: 60 }} className="pointer-events-none absolute -top-6 right-14 w-[118px] text-ink/65 sm:right-24 sm:w-[150px]">
                <motion.div initial={reduce ? false : { opacity: 0, scale: 1.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 160, damping: 16, delay: 1.15 }}>
                  <motion.div style={{ rotate: markR }}>
                    <Postmark top={`${area.name} · ${city.name}`} bottom={city.coords} center={<>after<br />dark</>} className="w-full" />
                  </motion.div>
                  <svg viewBox="0 0 180 48" className="absolute left-[78%] top-[30%] w-[150%] text-ink/55" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    {WAVES.map(d => <path key={d} d={d} />)}
                  </svg>
                </motion.div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
      {/* <div className="pointer-events-none absolute inset-x-0 bottom-6 hidden text-center font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 md:block">
        Scroll for more postcards
      </div> */}
    </section>
  )
}
