'use client'

import Image from 'next/image'
import { useMemo, useRef, useState } from 'react'
import { AVATARS, type City } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

const H = 620
const COUNT = 46
const TINTS = ['#FF6B35', '#FF3864', '#FFB830', '#00C48C', '#DCE6F2', '#F4D9DF']
const INITIALS = ['RS', 'AK', 'DP', 'NM', 'KJ', 'TV', 'SG', 'AR']

/**
 * Chapter 08, the people. A crowd of faces that drifts away from your
 * cursor, with the safety promise at its centre.
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
      avatar: i % 3 === 0 ? AVATARS[i % AVATARS.length] : null,
      tint: TINTS[i % TINTS.length],
      initials: INITIALS[i % INITIALS.length],
    }
  }), [])

  return (
    <section className="relative overflow-hidden bg-noir text-noir-ink">
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
              className="absolute flex items-center justify-center overflow-hidden rounded-full font-display font-extrabold text-ink"
              style={{
                left: `${p.x}%`, top: p.y, width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2,
                background: p.tint, fontSize: p.size * 0.32,
                transform: `translate(${dx}px, ${dy}px)`, transition: 'transform .5s cubic-bezier(.2,.8,.2,1)',
              }}
            >
              {p.avatar ? <Image src={p.avatar} alt="" fill sizes="120px" className="object-cover" /> : p.initials}
            </div>
          )
        })}

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="pointer-events-auto max-w-[520px] rounded-[36px] bg-noir/85 p-10 text-center backdrop-blur-md">
            <Chapter n="08" title="The people" dark className="justify-center" />
            <h2 className="mt-4 font-display text-[clamp(40px,4.6vw,64px)] font-extrabold leading-[0.95] tracking-[-0.05em]">
              Every face here<br />is <span className="text-brand">real.</span>
            </h2>
            <p className="mt-4 font-sans text-lg text-noir-ink-2">
              Phone-verified, 18+ only, reviewed after every night. The exact address only goes to confirmed guests in {city.name}.
            </p>
            <div className="mt-7 flex justify-center"><Button href="/safety" kind="ghost" dark>How we keep it safe</Button></div>
          </div>
        </div>
      </div>
    </section>
  )
}
