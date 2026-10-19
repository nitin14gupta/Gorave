'use client'

import type { OccasionProps } from '@/lib/occasion'
import { HoverPop, HoverPopGroup } from '@/components/ui/HoverPop'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 01, what it is. A big sentence of the occasion's signature
 * things, each a hover word that pops its photo and line; then what it
 * looks like on Gorave, in two short paragraphs.
 */
export function WhatItIs({ occasion: o }: OccasionProps) {
  const s = o.signatures
  return (
    <section className="bg-paper px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1180px]">
        <Chapter n="01" title={`What ${o.name} is, here`} />
        <HoverPopGroup size="lg">
          <p className="mt-8 font-display text-[clamp(40px,5.6vw,92px)] font-extrabold leading-[1] tracking-[-0.055em]">
            Think{' '}
            {s.map((x, i) => (
              <span key={x.word}>
                <HoverPop image={x.image} caption={x.line} className="cursor-default text-orange underline decoration-orange/30 decoration-[5px] underline-offset-[10px] transition-colors hover:decoration-orange">
                  {x.word}
                </HoverPop>
                {i < s.length - 2 ? ', ' : i === s.length - 2 ? ' and ' : '.'}
              </span>
            ))}
          </p>
        </HoverPopGroup>
        <div className="mt-14 grid gap-8 md:grid-cols-2">
          {o.what.map(w => (
            <p key={w.slice(0, 30)} className="font-sans text-[18px] leading-[1.75] text-ink-2">{w}</p>
          ))}
        </div>
      </div>
    </section>
  )
}
