'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { SAFETY_LINKS } from '@/lib/safety'
import { StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

const EASE = [0.2, 0.8, 0.2, 1] as const
const TINTS = ['#00C48C', '#5BC0EB', '#FFB830', '#FF6B35', '#FF3864', '#C77DFF']
const WORDS = ['See', 'you', 'inside.']

/**
 * Chapter 08 — see you inside. The six layer colours slide in as thin bars
 * and lock together into one line under the headline; every letter of the
 * headline lifts and lights when you run the cursor across it.
 */
export function CtaB({ chapter = '08' }: { chapter?: string }) {
  return (
    <section className="relative overflow-hidden bg-noir px-6 py-32 text-center text-noir-ink md:py-40">
      <div className="mb-6 font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2">
        <span className="font-serif text-xl normal-case italic tracking-normal text-orange">{chapter}</span> · Go out
      </div>
      <h2 className="font-display text-[clamp(64px,12vw,200px)] font-extrabold leading-[0.85] tracking-[-0.065em]">
        {WORDS.map((w, wi) => (
          <span key={w} className="inline-block whitespace-nowrap pr-[0.18em]">
            {Array.from(w).map((ch, i) => (
              <span
                key={i}
                className="inline-block transition-[transform,color] duration-300 ease-out-expo hover:-translate-y-[0.08em] hover:text-[var(--c)]"
                style={{ '--c': TINTS[(wi * 3 + i) % TINTS.length] } as React.CSSProperties}
              >
                {ch}
              </span>
            ))}
          </span>
        ))}
      </h2>

      <div className="mx-auto mt-10 flex h-2 w-full max-w-[560px] overflow-hidden rounded-full">
        {TINTS.map((t, i) => (
          <motion.span
            key={t}
            className="h-full flex-1"
            style={{ background: t }}
            initial={{ x: (i - 2.5) * 80, opacity: 0, scaleY: 3 }}
            whileInView={{ x: 0, opacity: 1, scaleY: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.9, ease: EASE, delay: 0.1 + i * 0.07 }}
          />
        ))}
      </div>

      <p className="mx-auto mt-8 max-w-[460px] font-sans text-lg text-noir-ink-2">
        Add your SOS contacts, check the host, and go find your people.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-2.5">
        <Button href="/app" size="lg">Get the app</Button>
        <Button href={SAFETY_LINKS.guidelines} kind="ghost" dark size="lg">Community guidelines</Button>
      </div>
      <div className="mt-8 flex justify-center"><StoreBadges /></div>
      <div className="mt-6 font-sans text-sm text-noir-ink-2">
        Paying for a ticket? Read the <Link href={SAFETY_LINKS.refunds} className="font-bold text-noir-ink underline decoration-white/30 underline-offset-4">refund policy</Link>.
      </div>
    </section>
  )
}
