'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { FACES, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

const H = 620
const COUNT = 46

/**
 * Chapter 08, the people. A crowd of real faces (every circle a photo)
 * that drifts away from your cursor, with the safety promise at its centre.
 */
export function Crowd({ city }: { city: City }) {
  const ref = useRef<HTMLDivElement>(null)
  const [cursor, setCursor] = useState<{ x: number; y: number; w: number } | null>(null)

  const people = useMemo(() => Array.from({ length: COUNT }, (_, i) => {
    const ang = i * 2.399963 // golden angle spiral
    const r = 120 + Math.sqrt(i / COUNT) * 520
    return {
      // Rounded so the server and client render identical positions.
      x: Math.round((50 + (Math.cos(ang) * r) / 14) * 100) / 100,
      y: Math.round(H / 2 + Math.sin(ang) * r * 0.42),
      size: 44 + ((i * 37) % 5) * 10,
      // Step through the faces with a stride so neighbours are never the same person.
      face: FACES[(i * 7) % FACES.length],
    }
  }), [])

  return (
    <section className="relative overflow-hidden bg-paper text-ink">
      <div
        ref={ref}
        className="relative mx-auto max-w-[1440px]"
        style={{ height: H }}
        onMouseMove={e => { const r = ref.current!.getBoundingClientRect(); setCursor({ x: e.clientX - r.left, y: e.clientY - r.top, w: r.width }) }}
        onMouseLeave={() => setCursor(null)}
      >
        {people.map((p, i) => {
          let dx = 0
          let dy = 0
          if (cursor) {
            const px = (p.x / 100) * cursor.w
            const vx = px - cursor.x
            const vy = p.y - cursor.y
            const d = Math.max(1, Math.hypot(vx, vy))
            const push = Math.max(0, 160 - d) / 160
            dx = (vx / d) * push * 120
            dy = (vy / d) * push * 120
          }
          return (
            <div
              key={i}
              aria-hidden
              className="absolute overflow-hidden rounded-full bg-tile ring-2 ring-paper"
              style={{
                left: `${p.x}%`, top: p.y, width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2,
                transform: `translate(${dx}px, ${dy}px)`, transition: 'transform .5s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              <Image src={`${p.face}?w=200&h=200&fit=crop&crop=faces&q=70`} alt="" fill sizes="120px" className="object-cover" />
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto max-w-[520px] rounded-[36px] bg-paper/85 p-10 text-center backdrop-blur-md">
            <Chapter n="08" title="The people" className="justify-center" />
            <h2 className="mt-4 font-display text-[clamp(40px,4.6vw,64px)] font-extrabold leading-[0.95] tracking-[-0.05em]">
              Every face here<br />is <span className="text-brand">real.</span>
            </h2>
            <p className="mt-4 font-sans text-lg text-ink-2">
              Phone-verified, 18+ only, reviewed after every night. The exact address only goes to confirmed guests in {city.name}.
            </p>
            <div className="mt-7 flex justify-center"><Button href="/safety" kind="ghost">How we keep it safe</Button></div>
          </div>
        </div>
      </div>
    </section>
  )
}
