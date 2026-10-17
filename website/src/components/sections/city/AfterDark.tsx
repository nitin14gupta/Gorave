'use client'

import { useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const EASE = [0.2, 0.8, 0.2, 1] as const
const START = 18 // 6 PM
const END = 27 // 3 AM

const fmtHour = (h: number) => {
  const hh = Math.floor(h) % 24
  const mm = Math.floor((h % 1) * 60 / 15) * 15
  const ap = hh >= 12 ? 'PM' : 'AM'
  return `${hh % 12 || 12}:${String(mm).padStart(2, '0')} ${ap}`
}

/**
 * Chapter 02, the night. A pinned scroll story: the clock runs from 6 PM to
 * 3 AM, the sky goes sunset → night, and that hour's event swaps in.
 */
export function AfterDark({ city }: { city: City }) {
  const { slots, posters } = useCityKit()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [hour, setHour] = useState(START)
  useMotionValueEvent(scrollYProgress, 'change', v => setHour(START + v * (END - START)))

  const bg = useTransform(scrollYProgress, [0, 0.3, 0.6, 1], ['#FF9A62', '#FF3864', '#3B1840', '#111111'])
  const stars = useTransform(scrollYProgress, [0.45, 0.8], [0, 1])
  const sunY = useTransform(scrollYProgress, [0, 0.45], ['0%', '140%'])

  const slot = useMemo(() => {
    let pick = slots[0]
    for (const s of slots) if (hour >= s.hour) pick = s
    return pick
  }, [hour, slots])
  const area = slot.area ?? city.areas[slots.indexOf(slot) % city.areas.length]

  // Rounded so the server and client render identical positions.
  const starDots = useMemo(() => Array.from({ length: 70 }, (_, i) => ({
    x: Math.round(((Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) % 1) * 10000) / 100,
    y: Math.round(((Math.sin(i * 78.233) * 12345.678 % 1 + 1) % 1) * 6000) / 100,
    o: 0.35 + (i % 5) * 0.13,
  })), [])

  return (
    <section ref={ref} className="relative h-[320vh]">
      <motion.div style={{ backgroundColor: bg }} className="sticky top-0 flex h-screen items-center overflow-hidden px-6 text-white md:px-20">
        <motion.div style={{ opacity: stars }} className="pointer-events-none absolute inset-0">
          {starDots.map((s, i) => (
            <span key={i} className="absolute size-[3px] rounded-full bg-white" style={{ left: `${s.x}%`, top: `${s.y}%`, opacity: s.o }} />
          ))}
        </motion.div>
        <motion.div style={{ y: sunY }} className="pointer-events-none absolute -bottom-40 left-1/2 size-[520px] -translate-x-1/2 rounded-full bg-gradient-to-b from-[#FFD27A] to-[#FF6B35] opacity-70 blur-[2px]" />

        <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <Chapter n="02" title="The night" className="!text-white/70" />
            <div className="mt-6 font-display text-[clamp(72px,12vw,180px)] font-extrabold leading-[0.85] tracking-[-0.06em] tabular-nums">
              {fmtHour(hour)}
            </div>
            <p className="mt-6 max-w-[460px] font-sans text-xl leading-relaxed text-white/80">
              {city.name} doesn&apos;t sleep, it changes plans. Scroll through one night and see what&apos;s on at every hour.
            </p>
          </div>
          <div className="relative hidden h-[440px] lg:block">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={slot.href ?? slot.title}
                initial={{ opacity: 0, y: 60, rotate: 8 }}
                animate={{ opacity: 1, y: 0, rotate: -3 }}
                exit={{ opacity: 0, y: -60, rotate: -10 }}
                transition={{ duration: 0.55, ease: EASE }}
                className="absolute inset-0 flex flex-col items-center"
              >
                <Poster poster={posters[slot.poster]} area={area} width={280} height={360} radius={22} className="shadow-pop" />
                <div className="mt-5 text-center">
                  <div className="font-display text-2xl font-extrabold">{slot.title}</div>
                  <div className="font-sans text-sm text-white/75">{area} · {slot.price} · {slot.status}</div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
