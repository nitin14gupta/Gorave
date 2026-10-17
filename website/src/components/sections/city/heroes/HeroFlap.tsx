'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import type { HeroProps } from './types'
import { useCityKit } from '../CityKit'

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789:·'
const CYCLE_MS = 3600

/** One split-flap row: letters scramble before landing, left to right. */
function FlapRow({ text, length, size = 64 }: { text: string; length: number; size?: number }) {
  const target = text.toUpperCase().padEnd(length).slice(0, length)
  const [shown, setShown] = useState(target)

  useEffect(() => {
    let frame = 0
    const id = setInterval(() => {
      frame++
      setShown(
        target.split('').map((ch, i) => {
          const settleAt = 6 + i * 1.6
          if (ch === ' ' || frame >= settleAt) return ch
          return CHARS[Math.floor(Math.random() * CHARS.length)]
        }).join(''),
      )
      if (frame > 8 + length * 1.6) clearInterval(id)
    }, 45)
    return () => clearInterval(id)
  }, [target, length])

  return (
    <div className="flex gap-1">
      {shown.split('').map((ch, i) => (
        <span
          key={i}
          className="relative flex items-center justify-center overflow-hidden rounded-md bg-noir-3 font-display font-extrabold text-noir-ink shadow-[inset_0_-2px_0_rgb(0_0_0/0.4)]"
          style={{ width: size * 0.72, height: size, fontSize: size * 0.7 }}
        >
          {ch === ' ' ? '' : ch}
          <span className="absolute inset-x-0 top-1/2 h-px bg-black/60" />
        </span>
      ))}
    </div>
  )
}

/** Airport departure board, tonight's nights, flipping into place. */
export function HeroFlap({ city, crumbs }: HeroProps) {
  const { slots } = useCityKit()
  const [i, setI] = useState(0)
  const count = slots.length
  useEffect(() => {
    const id = setInterval(() => setI(n => (n + 1) % count), CYCLE_MS)
    return () => clearInterval(id)
  }, [count])

  const slot = slots[i]
  const area = slot.area ?? city.areas[i % city.areas.length]
  const time = `${String(slot.hour % 24).padStart(2, '0')}:00`

  return (
    <section className="relative overflow-hidden bg-noir px-6 pb-24 pt-28 text-noir-ink md:px-20">
      <div className="[&_a]:text-noir-ink-2 [&_span]:text-noir-ink-2"><Breadcrumbs crumbs={crumbs} /></div>
      <div className="mx-auto mt-12 max-w-[1280px]">
        <div className="mb-6 flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.2em] text-noir-ink-2">
          <span className="size-2 rounded-full bg-coral" /> Departures · {city.name}
        </div>
        <div className="flex flex-col gap-2 overflow-x-auto">
          <FlapRow text={slot.vibe} length={12} size={74} />
          <FlapRow text={area} length={12} size={74} />
          <div className="flex items-center gap-6">
            <FlapRow text={time} length={5} size={74} />
            <span className={`font-display text-3xl font-extrabold ${slot.status === 'Few left' ? 'text-coral' : 'text-green'}`}>{slot.status.toUpperCase()}</span>
          </div>
        </div>
        <div className="mt-12 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <h1 className="font-display text-[clamp(44px,5.6vw,80px)] font-extrabold leading-[0.95] tracking-[-0.055em]">
            Tonight in <span className="text-brand">{city.name}.</span>
          </h1>
          <div className="flex flex-wrap gap-2.5">
            <Button href="#tonight" size="lg">See all departures</Button>
            <Button href="/host" kind="ghost" dark size="lg">Host in {city.name}</Button>
          </div>
        </div>
      </div>
    </section>
  )
}
