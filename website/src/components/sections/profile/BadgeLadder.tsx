'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { BRAND } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

export const BADGE_TIERS = [
  { key: 'rising', name: 'Rising', at: 2 },
  { key: 'established', name: 'Established', at: 10 },
  { key: 'elite', name: 'Elite', at: 25 },
  { key: 'legend', name: 'Legend', at: 75 },
] as const

/**
 * Chapter 02, the climb. The four host badges on one track; the line fills
 * up to this host's count and the badges they've earned light up.
 */
export function BadgeLadder({ name, hosted }: { name: string; hosted: number }) {
  const next = BADGE_TIERS.find(t => hosted < t.at)
  // Position along the track: each tier is an equal step.
  const idx = BADGE_TIERS.findIndex(t => hosted < t.at)
  const reached = idx === -1 ? BADGE_TIERS.length : idx
  const prevAt = reached === 0 ? 0 : BADGE_TIERS[reached - 1].at
  const part = next ? (hosted - prevAt) / (next.at - prevAt) : 0
  const fill = Math.min(1, (reached - 1 + part) / (BADGE_TIERS.length - 1))

  return (
    <section className="bg-paper px-6 py-24 md:px-20 md:py-28">
      <div className="mx-auto max-w-[1100px]">
        <Chapter n="03" title="The climb" />
        <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          {next ? <>{next.at - hosted} more {next.at - hosted === 1 ? 'night' : 'nights'} to <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{next.name}.</span></> : <>{name} is a <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">Legend.</span></>}
        </h2>
        <p className="mt-3 max-w-[520px] font-sans text-lg text-ink-2">Hosts earn badges as they host, and guests see them on every event.</p>

        <div className="relative mt-16">
          <div className="absolute left-[12.5%] right-[12.5%] top-12 h-1 rounded-full bg-ink/10 md:top-16">
            <motion.div
              className="h-full origin-left rounded-full bg-brand"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: Math.max(0, fill) }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 1.6, ease: [0.2, 0.8, 0.2, 1] }}
            />
          </div>
          <div className="relative grid grid-cols-4">
            {BADGE_TIERS.map((t, i) => {
              const earned = hosted >= t.at
              return (
                <motion.div
                  key={t.key}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.7, delay: 0.3 + i * 0.15 }}
                  className="flex flex-col items-center text-center"
                >
                  <div className={cn('relative size-24 transition-[filter,opacity] md:size-32', !earned && 'opacity-40 grayscale')}>
                    <Image src={BRAND.badges[t.key]} alt={`${t.name} badge`} fill sizes="128px" className="object-contain" />
                  </div>
                  <div className="mt-3 font-display text-lg font-extrabold tracking-[-0.03em] md:text-xl">{t.name}</div>
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{earned ? 'earned' : `${t.at}+ nights`}</div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
