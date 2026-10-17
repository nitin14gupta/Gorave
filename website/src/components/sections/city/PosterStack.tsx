'use client'

import { useRef, useState, type ReactNode } from 'react'
import { motion, useScroll, useSpring, useTransform } from 'motion/react'
import { type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'
import { useCityKit } from './CityKit'

const EASE = 'cubic-bezier(.2,.8,.2,1)'
const STEP = 118
const W = 230
const H = 300

/**
 * Chapter 01 — the reasons. Flyers stand in a 3D perspective line that slides
 * as you scroll; hovering one lifts it out to face you and spreads the rest.
 */
interface Props {
  city: City
  chapter?: string
  chapterTitle?: string
  title?: ReactNode
  subtitle?: string
}

export function PosterStack({ city, chapter = '01', chapterTitle = 'The reasons', title, subtitle }: Props) {
  const { posters } = useCityKit()
  const ref = useRef<HTMLElement>(null)
  const [hover, setHover] = useState<number | null>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const x = useSpring(useTransform(scrollYProgress, [0, 1], [360, -560]), { stiffness: 90, damping: 24 })

  return (
    <section ref={ref} className="relative h-[860px] overflow-hidden bg-paper">
      <div className="pointer-events-none absolute left-6 top-24 z-40 max-w-[540px] md:left-20 md:top-32">
        <Chapter n={chapter} title={chapterTitle} />
        <h2 className="mt-4 font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          {title ?? <>A million reasons<br />to go out.</>}
        </h2>
        <p className="mt-3.5 font-sans text-[19px] text-ink-2">{subtitle ?? `Hover a flyer. Every one is a night in ${city.name}.`}</p>
      </div>

      <div className="absolute inset-0" style={{ perspective: 1500, perspectiveOrigin: '30% 40%' }}>
        <motion.div className="absolute left-0 top-0" style={{ x, transformStyle: 'preserve-3d' }}>
          {posters.map((poster, i) => {
            const isHover = hover === i
            const spread = hover !== null && i > hover ? 150 : 0
            return (
              <div
                key={i}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                className="absolute cursor-pointer rounded-2xl"
                style={{
                  left: i * STEP + spread,
                  top: 470 - i * 24,
                  width: W,
                  height: H,
                  zIndex: isHover ? 100 : i,
                  transformStyle: 'preserve-3d',
                  transform: isHover
                    ? 'translateZ(160px) translateY(-110px) rotateY(-4deg) rotateZ(-3deg) scale(1.12)'
                    : 'rotateY(-42deg) rotateX(4deg)',
                  transition: `transform .55s ${EASE}, left .55s ${EASE}, box-shadow .55s`,
                  boxShadow: isHover ? '0 50px 80px -30px rgb(23 19 16 / .6)' : '0 20px 40px -24px rgb(23 19 16 / .45)',
                }}
              >
                <Poster poster={poster} area={city.areas[i % city.areas.length]} width={W} height={H} />
                <div
                  className="absolute inset-x-0 -bottom-11 text-center font-sans text-[13px] font-bold"
                  style={{ opacity: isHover ? 1 : 0, transform: `translateY(${isHover ? 0 : -8}px)`, transition: `all .4s ${EASE}` }}
                >
                  Request to join →
                </div>
              </div>
            )
          })}
        </motion.div>
      </div>
    </section>
  )
}
