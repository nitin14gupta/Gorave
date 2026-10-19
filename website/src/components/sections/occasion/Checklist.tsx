'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import type { OccasionProps } from '@/lib/occasion'
import { Head } from '@/components/sections/areaType/kit'
import { cn } from '@/lib/cn'

/**
 * Chapter 04, before you go. A checklist you can actually tick: each item
 * strikes through with a little bounce, and the bar fills as you pack.
 */
export function Checklist({ occasion: o }: OccasionProps) {
  const [done, setDone] = useState<Set<number>>(new Set())
  const toggle = (i: number) => setDone(s => { const n = new Set(s); if (n.has(i)) n.delete(i); else n.add(i); return n })
  const pct = (done.size / o.checklist.length) * 100
  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1180px] gap-14 lg:grid-cols-[1fr_1.2fr]">
        <Head n="04" label="Before you go" title="Packed?" serif="Tick it off." aside={`${done.size} of ${o.checklist.length} sorted.`} />
        <div className="rounded-[32px] bg-white p-3 shadow-pop">
          <div className="mx-3 mt-3 h-1.5 overflow-hidden rounded-full bg-ink/8">
            <motion.div animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 160, damping: 22 }} className="h-full rounded-full bg-brand" />
          </div>
          <ul className="mt-2">
            {o.checklist.map((c, i) => {
              const on = done.has(i)
              return (
                <li key={c}>
                  <button type="button" onClick={() => toggle(i)} aria-pressed={on} className="group flex w-full items-center gap-4 rounded-2xl px-4 py-4 text-left transition-colors hover:bg-cream">
                    <motion.span
                      animate={{ scale: on ? [1, 1.25, 1] : 1 }}
                      transition={{ duration: 0.35 }}
                      className={cn('grid size-8 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors duration-300', on ? 'border-transparent bg-brand text-white' : 'border-ink/20 text-transparent group-hover:border-orange')}
                    >
                      ✓
                    </motion.span>
                    <span className="relative font-display text-[clamp(20px,2vw,26px)] font-extrabold tracking-[-0.03em] transition-colors duration-300" style={{ color: on ? 'rgb(23 19 16 / .35)' : undefined }}>
                      {c}
                      <motion.span aria-hidden initial={false} animate={{ scaleX: on ? 1 : 0 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }} className="absolute left-0 right-0 top-1/2 h-[3px] origin-left rounded-full bg-orange" />
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
          {done.size === o.checklist.length && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="m-3 rounded-2xl bg-brand px-5 py-4 font-display text-xl font-extrabold tracking-[-0.03em] text-white">
              {o.emoji} All set. See you there.
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}
