'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import type { BadgeTier } from '@/lib/pagesData'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { BadgeArt, EASE, HOST_LINKS } from '../kit'

/**
 * The last page. Two quick links for the practical bits, then an empty
 * cabinet: four slots, greyed, each lighting up as you hover it. The way in.
 */
export function ShelfCta({ tiers }: { tiers: BadgeTier[] }) {
  const reduce = !!useReducedMotion()
  return (
    <section className="bg-paper px-6 pb-24 pt-20 md:px-12 md:pb-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <div className="grid gap-3 md:grid-cols-2">
          {HOST_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="group flex items-center justify-between gap-6 rounded-[24px] bg-white px-6 py-5 shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1 hover:shadow-pop"
            >
              <div>
                <div className="font-display text-2xl font-extrabold tracking-[-0.03em]">{l.label}</div>
                <div className="mt-0.5 font-sans text-[15px] text-ink-2">{l.body}</div>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-cream text-lg transition-transform duration-500 ease-out-expo group-hover:rotate-45">↗</span>
            </Link>
          ))}
        </div>

        <div className="mt-24 text-center md:mt-32">
          <Chapter n="07" title="Start your shelf" className="justify-center" />
          <h2 className="mx-auto mt-5 max-w-[980px] font-display text-[clamp(50px,7.6vw,124px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            Your shelf is empty.
            <br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">For now.</span>
          </h2>

          <div className="mx-auto mt-12 grid max-w-[760px] grid-cols-4 gap-3 md:gap-5">
            {tiers.map((t, i) => (
              <motion.div
                key={t.key}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, ease: EASE, delay: i * 0.08 }}
                className="group relative aspect-[5/7] rounded-[18px] border-2 border-dashed border-ink/15 bg-white/40 transition-colors duration-500 hover:bg-white md:rounded-[22px]"
              >
                <div className="absolute inset-0 grid place-items-center">
                  <div className="w-[62%] opacity-25 grayscale transition-[filter,opacity,transform] duration-700 ease-out-expo group-hover:-translate-y-1 group-hover:scale-110 group-hover:opacity-100 group-hover:grayscale-0">
                    <BadgeArt tier={t.key} size={120} className="!h-auto !w-full" />
                  </div>
                </div>
                <div className="absolute inset-x-0 bottom-2 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-ink-3 md:bottom-3 md:text-xs">{t.at}+</div>
              </motion.div>
            ))}
          </div>

          <p className="mx-auto mt-10 max-w-[480px] font-sans text-lg text-ink-2">Host two events and the first slot fills itself. Gorave does the counting.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button href="/host" size="lg">Start hosting</Button>
            <StoreBadges height={48} />
          </div>
        </div>
      </div>
    </section>
  )
}
