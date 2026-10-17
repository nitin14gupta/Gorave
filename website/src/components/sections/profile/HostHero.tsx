'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'motion/react'
import { BRAND } from '@/constants'
import type { Crumb } from '@/lib/seo'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'

const EASE = [0.2, 0.8, 0.2, 1] as const

export interface HostHeroData {
  name: string
  username: string
  avatar: string | null
  city: string | null
  badge: keyof typeof BRAND.badges | null
  hosted: number
  rating: number | null
  reviews: number
  upcoming: number
}

/**
 * The host's card: their photo drops onto the page like a taped polaroid,
 * the badge stamps on, and the numbers count up.
 */
export function HostHero({ host, crumbs }: { host: HostHeroData; crumbs: Crumb[] }) {
  const first = host.name.split(' ')[0]
  // Fall back to the initial if the photo is missing from storage.
  const [broken, setBroken] = useState(false)
  return (
    <section className="relative overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-20 md:pb-28">
      <Breadcrumbs crumbs={crumbs} />
      <div className="mx-auto mt-10 grid max-w-[1280px] items-center gap-14 md:grid-cols-[auto_1fr] md:gap-20">
        <motion.div
          initial={{ opacity: 0, y: -60, rotate: -14 }}
          animate={{ opacity: 1, y: 0, rotate: -4 }}
          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
          className="relative mx-auto w-[260px] bg-white p-3 pb-12 shadow-pop md:w-[320px]"
        >
          <span aria-hidden className="absolute -top-3 left-1/2 h-7 w-24 -translate-x-1/2 rotate-[-3deg] bg-gold/60" />
          <div className="relative aspect-square overflow-hidden bg-tile">
            {host.avatar && !broken ? (
              <Image src={host.avatar} alt={host.name} fill priority sizes="320px" className="object-cover" onError={() => setBroken(true)} />
            ) : (
              <div className="grid size-full place-items-center bg-brand font-display text-8xl font-extrabold text-white">{host.name[0]}</div>
            )}
          </div>
          <div className="absolute inset-x-4 bottom-3 font-serif text-xl italic text-ink-2">{first}, hosting{host.city ? ` in ${host.city}` : ''}</div>
          {host.badge && (
            <motion.div
              initial={{ opacity: 0, scale: 2.2, rotate: -30 }}
              animate={{ opacity: 1, scale: 1, rotate: 8 }}
              transition={{ delay: 0.7, type: 'spring', stiffness: 400, damping: 16 }}
              className="absolute -bottom-8 -right-8 size-28 md:size-32"
            >
              <Image src={BRAND.badges[host.badge]} alt={`${host.badge} host badge`} fill sizes="128px" className="object-contain drop-shadow-xl" />
            </motion.div>
          )}
        </motion.div>

        <div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE, delay: 0.2 }}>
            <div className="font-sans text-sm font-bold uppercase tracking-[0.18em] text-ink-3">Host on Gorave · @{host.username}</div>
            <h1 className="mt-3 font-display text-[clamp(56px,9vw,140px)] font-extrabold leading-[0.85] tracking-[-0.065em]">{host.name}</h1>
          </motion.div>

          <div className="mt-10 grid max-w-[640px] grid-cols-3 gap-3">
            <Stat value={host.hosted} label={host.hosted === 1 ? 'night hosted' : 'nights hosted'} />
            <Stat value={host.upcoming} label="coming up" />
            {host.reviews > 0 && host.rating ? (
              <Stat value={host.rating} decimals={1} label={`rating · ${host.reviews} review${host.reviews === 1 ? '' : 's'}`} />
            ) : (
              <div className="rounded-[22px] bg-white p-5 shadow-soft">
                <div className="font-serif text-[clamp(28px,3vw,40px)] italic leading-none text-orange">New</div>
                <div className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">no reviews yet</div>
              </div>
            )}
          </div>

          <div className="mt-9 flex flex-wrap gap-2.5">
            <Button href="#nights" size="lg">See {first}’s nights</Button>
            <Button href="/host" kind="ghost" size="lg">Host your own</Button>
          </div>
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label, decimals = 0 }: { value: number; label: string; decimals?: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  useEffect(() => {
    const el = ref.current
    if (!inView || !el) return
    const c = animate(0, value, { duration: 1.4, ease: EASE, onUpdate: v => { el.textContent = v.toFixed(decimals) } })
    return () => c.stop()
  }, [inView, value, decimals])
  return (
    <div className="rounded-[22px] bg-white p-5 shadow-soft">
      <div ref={ref} className="font-display text-[clamp(32px,3.6vw,52px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{value.toFixed(decimals)}</div>
      <div className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{label}</div>
    </div>
  )
}
