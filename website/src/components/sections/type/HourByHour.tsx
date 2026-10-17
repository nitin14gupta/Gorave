'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS, type City } from '@/constants'
import type { TypeContent } from '@/lib/eventType'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 05, one night, hour by hour. The section pins and the evening
 * slides past sideways; the sky behind it goes from dusk to midnight.
 * Small screens get the same night as a vertical list.
 */
export function HourByHour({ city, story, chapter = '05' }: { city: City; story: TypeContent; chapter?: string }) {
  return (
    <>
      <HourByHourPinned city={city} story={story} chapter={chapter} />
      <HourByHourList story={story} chapter={chapter} />
    </>
  )
}

function HourByHourPinned({ city, story, chapter }: { city: City; story: TypeContent; chapter: string }) {
  const ref = useRef<HTMLElement>(null)
  const track = useRef<HTMLDivElement>(null)
  const [dist, setDist] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const x = useTransform(scrollYProgress, [0.05, 0.95], [0, -dist])
  const bg = useTransform(scrollYProgress, [0, 0.5, 1], ['#3a1c12', '#1f1420', '#0b0b0d'])
  const n = story.night.length

  useEffect(() => {
    const el = track.current
    if (!el) return
    const measure = () => setDist(Math.max(0, el.scrollWidth - window.innerWidth))
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    window.addEventListener('resize', measure)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [])

  return (
    <motion.section ref={ref} style={{ backgroundColor: bg, height: `${(n + 1) * 90}vh` }} className="relative hidden text-noir-ink md:block">
      <div className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden">
        <motion.div ref={track} style={{ x }} className="flex w-max items-center gap-10 pl-20 pr-[12vw]">
          <div className="w-[34vw] shrink-0">
            <Chapter n={chapter} title="The night" dark />
            <h2 className="mt-4 font-display text-[clamp(48px,5.6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              One night,<br />hour by hour.
            </h2>
            <p className="mt-4 max-w-[380px] font-sans text-lg text-noir-ink-2">How {story.plural.toLowerCase()} in {city.name} usually go. Keep scrolling.</p>
          </div>
          {story.night.map((h, i) => (
            <div key={h.time} className="relative h-[62vh] w-[42vw] shrink-0 overflow-hidden rounded-[32px]">
              <Image src={PHOTOS[h.photo]} alt={h.title} fill sizes="45vw" className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-8">
                <div className="font-serif text-[clamp(40px,4vw,64px)] italic leading-none text-gold">{h.time}</div>
                <div className="mt-3 font-display text-[clamp(28px,2.6vw,40px)] font-extrabold leading-tight tracking-[-0.04em]">{h.title}</div>
                <div className="mt-1 font-sans text-lg text-white/75">{h.detail}</div>
              </div>
              <div className="absolute right-6 top-6 font-display text-sm font-extrabold text-white/60">0{i + 1} / 0{n}</div>
            </div>
          ))}
        </motion.div>

        <div className="absolute inset-x-20 bottom-12">
          <div className="relative h-px bg-noir-ink/20">
            <motion.div className="absolute left-0 top-[-0.5px] h-[2px] w-full origin-left bg-brand" style={{ scaleX: scrollYProgress }} />
            {story.night.map((h, i) => (
              <Dot key={h.time} at={(i + 0.6) / n} label={h.time} progress={scrollYProgress} />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

function Dot({ at, label, progress }: { at: number; label: string; progress: MotionValue<number> }) {
  const lit = useTransform(progress, [at - 0.04, at], [0, 1])
  const bg = useTransform(lit, v => (v > 0.5 ? '#FFB830' : '#3a3530'))
  const scale = useTransform(lit, [0, 1], [0.8, 1.2])
  return (
    <div className="absolute -top-[7px] flex -translate-x-1/2 flex-col items-center" style={{ left: `${at * 100}%` }}>
      <motion.div className="size-[14px] rounded-full" style={{ backgroundColor: bg, scale }} />
      <motion.div className="mt-3 whitespace-nowrap font-sans text-xs font-bold" style={{ opacity: useTransform(lit, [0, 1], [0.4, 1]) }}>
        {label}
      </motion.div>
    </div>
  )
}

function HourByHourList({ story, chapter }: { story: TypeContent; chapter: string }) {
  return (
    <section className="bg-noir px-6 py-20 text-noir-ink md:hidden">
      <Chapter n={chapter} title="The night" dark />
      <h2 className="mt-4 font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.055em]">One night,<br />hour by hour.</h2>
      <div className="mt-10 grid gap-5">
        {story.night.map(h => (
          <div key={h.time} className="relative h-[340px] overflow-hidden rounded-[28px]">
            <Image src={PHOTOS[h.photo]} alt={h.title} fill sizes="100vw" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <div className="font-serif text-4xl italic text-gold">{h.time}</div>
              <div className="mt-2 font-display text-2xl font-extrabold tracking-[-0.04em]">{h.title}</div>
              <div className="font-sans text-white/75">{h.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
