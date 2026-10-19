'use client'

import { useState } from 'react'
import type { PriceProps } from '@/lib/price'
import { Head } from '@/components/sections/areaType/kit'
import { cn } from '@/lib/cn'

/**
 * Chapter 03, the questions people ask first. Each card is a question;
 * hover (or tap) and it flips over to the answer.
 */
export function FlipCards({ tier }: PriceProps) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Head n="03" label="Fair questions" title="Sounds too good?" serif="Flip one." />
        <ul className="mt-12 grid gap-4 md:grid-cols-3">
          {tier.cards.map((c, i) => {
            const on = open === i
            return (
              <li key={c.q} style={{ perspective: 1200 }}>
                <button
                  type="button"
                  onClick={() => setOpen(on ? null : i)}
                  onMouseEnter={() => setOpen(i)}
                  onMouseLeave={() => setOpen(null)}
                  aria-expanded={on}
                  className="group relative block h-[280px] w-full text-left [transform-style:preserve-3d] transition-transform duration-700 ease-out-expo"
                  style={{ transform: on ? 'rotateY(180deg)' : 'none' }}
                >
                  <span className="absolute inset-0 flex flex-col justify-between rounded-[30px] bg-white p-7 shadow-soft [backface-visibility:hidden]">
                    <span className="font-serif text-xl italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-display text-[clamp(28px,2.8vw,38px)] font-extrabold leading-[1.02] tracking-[-0.045em]">{c.q}</span>
                    <span className="font-sans text-sm font-bold text-ink-3">Hover to flip ↻</span>
                  </span>
                  <span className={cn('absolute inset-0 flex flex-col justify-center rounded-[30px] bg-brand p-7 text-white shadow-pop [backface-visibility:hidden] [transform:rotateY(180deg)]')}>
                    <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-white/75">{c.q}</span>
                    <span className="mt-4 font-display text-[clamp(20px,1.9vw,25px)] font-extrabold leading-snug tracking-[-0.025em]">{c.a}</span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
