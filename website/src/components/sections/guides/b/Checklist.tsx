'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { HOST_CHECKLIST, guideHref, type HostGuide } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'

/**
 * Chapter 03 — the night before. A checklist on a clipboard; as you scroll
 * down it, each line gets ticked and struck through, and the counter beside
 * it climbs. Nothing is pinned, so it reads the same on a phone.
 */
export function Checklist({ guides }: { guides: HostGuide[] }) {
  const ref = useRef<HTMLOListElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 65%', 'end 55%'] })
  const n = HOST_CHECKLIST.length
  const done = useTransform(scrollYProgress, v => Math.min(n, Math.floor(v * n + 0.15)))
  const doneText = useTransform(done, v => String(v).padStart(2, '0'))
  const allDone = useTransform(done, v => (v === n ? 1 : 0))
  const titleOf = (slug: string) => guides.find(g => g.slug === slug)?.title ?? ''

  return (
    <section className="relative bg-noir-2 px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] gap-14 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Chapter n="03" title="The night before" dark />
          <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Tick it off,<br />
            <span className="font-serif font-normal italic tracking-[-0.02em] text-brand">then relax.</span>
          </h2>
          <p className="mt-4 max-w-[400px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Everything the six plays ask of you, as one list. Each line links to the guide that explains it.
          </p>
          <div className="mt-10 flex items-center gap-6">
            <div className="relative size-[132px]">
              <svg viewBox="0 0 120 120" className="size-full -rotate-90">
                <circle cx="60" cy="60" r="52" fill="none" stroke="rgb(245 240 235 / 0.12)" strokeWidth="8" />
                <motion.circle cx="60" cy="60" r="52" fill="none" stroke="url(#guides-b-ring)" strokeWidth="8" strokeLinecap="round" style={{ pathLength: scrollYProgress }} />
                <defs>
                  <linearGradient id="guides-b-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#FF3864" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 grid place-items-center text-center">
                <div>
                  <motion.div className="font-display text-4xl font-extrabold tracking-[-0.04em]">{doneText}</motion.div>
                  <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">of {String(n).padStart(2, '0')}</div>
                </div>
              </div>
            </div>
            <motion.div style={{ opacity: allDone }} className="font-serif text-3xl italic text-gold">Doors at nine.</motion.div>
          </div>
        </div>

        <ol ref={ref} className="relative rounded-[28px] bg-noir-3 p-3 md:p-5">
          {HOST_CHECKLIST.map((c, i) => (
            <Item key={c.item} i={i} n={n} text={c.item} href={guideHref(c.slug)} guide={titleOf(c.slug)} progress={scrollYProgress} />
          ))}
        </ol>
      </div>
    </section>
  )
}

function Item({ i, n, text, href, guide, progress }: { i: number; n: number; text: string; href: string; guide: string; progress: MotionValue<number> }) {
  const at = (i + 0.85) / n
  const lit = useTransform(progress, [at - 0.06, at], [0, 1])
  const box = useTransform(lit, v => (v > 0.5 ? '#00C48C' : 'rgba(245,240,235,0)'))
  const border = useTransform(lit, v => (v > 0.5 ? '#00C48C' : 'rgba(245,240,235,0.3)'))
  const textOpacity = useTransform(lit, [0, 1], [1, 0.5])
  const pop = useTransform(lit, [0, 0.6, 1], [1, 1.18, 1])

  return (
    <li className="flex items-start gap-4 border-b border-noir-ink/10 px-3 py-5 last:border-b-0 md:gap-5 md:px-4">
      <motion.span style={{ backgroundColor: box, borderColor: border, scale: pop }} className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-[10px] border-2">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <motion.path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#111" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" style={{ pathLength: lit }} />
        </svg>
      </motion.span>
      <div className="min-w-0 flex-1">
        <motion.div style={{ opacity: textOpacity }} className="relative inline font-display text-[clamp(20px,2vw,26px)] font-extrabold leading-tight tracking-[-0.03em]">
          {text}
          <motion.span aria-hidden style={{ scaleX: lit }} className="absolute left-0 right-0 top-1/2 h-[2px] origin-left bg-noir-ink/70" />
        </motion.div>
        <Link href={href} className="mt-1.5 block font-sans text-sm font-bold text-noir-ink-2 transition-colors hover:text-orange">
          → {guide}
        </Link>
      </div>
    </li>
  )
}
