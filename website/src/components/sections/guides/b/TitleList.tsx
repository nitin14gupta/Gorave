'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useVelocity } from 'motion/react'
import { PHOTOS } from '@/constants'
import { guideHref, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const PW = 300
const PH = 380

/**
 * Chapter 02, every play, by name. A tall typographic list; hover a title
 * and a photo of that night trails the cursor, swinging with how fast you
 * move, its reel rolling to the right frame. Touch screens see thumbnails.
 */
export function TitleList({ guides }: { guides: HostGuide[] }) {
  const [active, setActive] = useState<number | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 28, mass: 0.6 })
  const y = useSpring(my, { stiffness: 260, damping: 28, mass: 0.6 })
  const vx = useVelocity(x)
  const rotate = useTransform(vx, [-2000, 0, 2000], [-14, 0, 14], { clamp: true })

  function onMove(e: React.PointerEvent<HTMLElement>) {
    if (e.pointerType !== 'mouse') return
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(e.clientX - r.left - PW / 2)
    my.set(e.clientY - r.top - PH / 2)
  }

  return (
    <section onPointerMove={onMove} onPointerLeave={() => setActive(null)} className="relative overflow-hidden bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="02" title="Every play" dark />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">The whole book,<br />by name.</h2>
          </div>
          <p className="max-w-[320px] font-sans text-lg text-noir-ink-2">No theory. Each one is something you&apos;ll actually deal with on the night.</p>
        </div>

        <ul className="mt-14 border-t border-noir-ink/15">
          {guides.map((g, i) => {
            const dim = active !== null && active !== i
            return (
              <li key={g.slug} className="border-b border-noir-ink/15">
                <Link
                  href={guideHref(g.slug)}
                  onPointerEnter={e => { if (e.pointerType === 'mouse') setActive(i) }}
                  className={cn('group relative z-10 flex items-center gap-5 py-6 transition-opacity duration-300 md:gap-10 md:py-8', dim && 'opacity-30')}
                >
                  <div className="relative size-16 shrink-0 overflow-hidden rounded-xl md:hidden">
                    <Image src={PHOTOS[g.hero]} alt="" fill sizes="64px" className="object-cover" />
                  </div>
                  <span className="hidden w-14 shrink-0 font-serif text-3xl italic text-orange md:block">{String(i + 1).padStart(2, '0')}</span>
                  <span className="flex-1 font-display text-[clamp(26px,4.6vw,72px)] font-extrabold leading-[0.96] tracking-[-0.05em] transition-transform duration-500 ease-out-expo group-hover:translate-x-4">
                    {g.title}
                  </span>
                  <span className="hidden shrink-0 text-right font-sans text-sm font-bold text-noir-ink-2 md:block">
                    {g.category}<br />{g.readMinutes} min
                  </span>
                  <span className="hidden size-12 shrink-0 place-items-center rounded-full border border-noir-ink/25 text-xl transition-all duration-500 ease-out-expo group-hover:rotate-[-45deg] group-hover:border-transparent group-hover:bg-brand md:grid">→</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* The trailing preview, only ever shown for a mouse */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-0 top-0 z-20 hidden overflow-hidden rounded-[22px] shadow-pop md:block"
        style={{ x, y, rotate, width: PW, height: PH }}
        initial={false}
        animate={{ opacity: active === null ? 0 : 1, scale: active === null ? 0.6 : 1 }}
        transition={{ duration: 0.35, ease: EASE }}
      >
        <motion.div animate={{ y: `${-(active ?? 0) * PH}px` }} transition={{ duration: 0.6, ease: EASE }}>
          {guides.map(g => (
            <div key={g.slug} className="relative" style={{ width: PW, height: PH }}>
              <Image src={PHOTOS[g.hero]} alt="" fill sizes={`${PW}px`} className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute inset-x-4 bottom-4 font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/85">{g.category} · {g.readMinutes} min</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}
