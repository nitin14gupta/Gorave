'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { POSTERS } from '@/constants'
import { areaSlug } from '@/lib/city'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Poster } from '@/components/ui/Poster'
import { SplitWords } from '@/components/motion/Reveal'
import type { HeroProps } from './types'

const EASE = [0.2, 0.8, 0.2, 1] as const
const W = 640
const H = 560

// Deterministic pseudo-random so server and client draw the same map.
const rand = (n: number) => { const x = Math.sin(n * 9301 + 49297) * 233280; return x - Math.floor(x) }

/** A stylised dot-matrix "city" blob — not geography, a mood. */
function useDots(seed: number) {
  return useMemo(() => {
    const dots: { x: number; y: number; o: number }[] = []
    for (let gx = 0; gx < W; gx += 14) {
      for (let gy = 0; gy < H; gy += 14) {
        const nx = (gx - W / 2) / (W / 2)
        const ny = (gy - H / 2) / (H / 2)
        const wobble = 0.82 + 0.16 * Math.sin(Math.atan2(ny, nx) * 3 + seed) + 0.06 * Math.cos(Math.atan2(ny, nx) * 7)
        const d = Math.sqrt(nx * nx * 1.1 + ny * ny)
        if (d < wobble) dots.push({ x: gx, y: gy, o: 0.18 + rand(gx * 31 + gy + seed) * 0.35 })
      }
    }
    return dots
  }, [seed])
}

export function HeroMap({ city, crumbs }: HeroProps) {
  const [active, setActive] = useState<number | null>(null)
  const dots = useDots(city.name.length)
  const pins = city.areas.map((a, i) => {
    const ang = (i / city.areas.length) * Math.PI * 2 + 0.6
    const r = 0.28 + rand(i + 7) * 0.32
    return { area: a, x: W / 2 + Math.cos(ang) * r * W * 0.5, y: H / 2 + Math.sin(ang) * r * H * 0.5 }
  })

  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-20">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mx-auto mt-6 grid max-w-[1280px] items-center gap-10 lg:grid-cols-[1fr_640px]">
        <div>
          <h1 className="font-display text-[clamp(56px,7.5vw,112px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            <SplitWords text={`${city.name},`} />
            <br />
            <SplitWords text="tonight." delay={0.15} className="text-brand" />
          </h1>
          <p className="mb-8 mt-6 max-w-[460px] font-sans text-xl leading-relaxed text-ink-2">
            Every dot is a street. Every glow is a night out. Hover the map to peek inside {city.name}.
          </p>
          <div className="flex flex-wrap gap-2.5">
            <Button href="#tonight" size="lg">See tonight</Button>
            <Button href="/host" kind="ghost" size="lg">Host in {city.name}</Button>
          </div>
        </div>

        <div className="relative hidden lg:block" style={{ width: W, height: H }} onMouseLeave={() => setActive(null)}>
          <svg width={W} height={H} className="absolute inset-0" aria-hidden>
            {dots.map((d, i) => <circle key={i} cx={d.x} cy={d.y} r={2.2} fill="var(--color-ink)" opacity={d.o} />)}
          </svg>
          {pins.map((p, i) => (
            <Link
              key={p.area}
              href={`/${city.slug}/${areaSlug(p.area)}`}
              onMouseEnter={() => setActive(i)}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: p.x, top: p.y }}
            >
              <span className="relative flex size-4 items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-coral" style={{ animation: `ping-soft 2.4s ${i * 0.3}s infinite` }} />
                <span className="relative size-3 rounded-full bg-brand ring-4 ring-cream" />
              </span>
              <span className={`absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap font-display text-sm font-extrabold transition-colors ${active === i ? 'text-orange' : 'text-ink'}`}>{p.area}</span>
            </Link>
          ))}
          <AnimatePresence>
            {active !== null && (
              <motion.div
                key={active}
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="pointer-events-none absolute z-10"
                style={{ left: Math.min(pins[active].x + 24, W - 190), top: Math.max(pins[active].y - 250, 0), rotate: 4 }}
              >
                <Poster poster={POSTERS[(active * 5) % POSTERS.length]} area={pins[active].area} width={170} height={225} className="shadow-pop" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
