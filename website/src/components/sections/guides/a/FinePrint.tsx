'use client'

import { useRef } from 'react'
import { motion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { HOST_FACTS } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const

// *word* = set in the brand gradient once it lights up.
const COPY =
  'Listing is *free.* You get *two* free-entry events a month. Paid tickets start at *₹99* and you keep *90%.* Guests pay a flat *₹50* platform fee. Your exact address goes only to guests you *confirm,* and every one of them is phone-verified and *18+.*'

const WORDS = COPY.split(' ').map(w => (w.startsWith('*') ? { text: w.replace(/\*/g, ''), accent: true } : { text: w, accent: false }))

/**
 * Chapter 04 — the fine print, read aloud. One paragraph of what the app does
 * for you, on a dark spread; it inks itself in word by word as you scroll, the numbers
 * in brand colour. Below, the same facts as margin notes.
 */
export function FinePrint() {
  const ref = useRef<HTMLParagraphElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 85%', 'end 45%'] })
  const n = WORDS.length

  return (
    <section className="bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-36">
      <div className="mx-auto max-w-[1180px]">
        <Chapter n="04" title="The fine print, in plain words" dark />
        <p ref={ref} className="mt-8 font-display text-[clamp(32px,4.6vw,68px)] font-extrabold leading-[1.02] tracking-[-0.045em]">
          {WORDS.map((w, i) => (
            <Word key={i} word={w} range={[i / (n + 1), (i + 1.5) / (n + 1)]} progress={scrollYProgress} />
          ))}
        </p>

        <motion.ul
          className="mt-20 grid gap-x-8 gap-y-10 border-t-[1.5px] border-noir-ink/20 pt-10 sm:grid-cols-2 lg:grid-cols-4"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          transition={{ staggerChildren: 0.06 }}
        >
          {HOST_FACTS.map(f => (
            <motion.li
              key={f.label}
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.7, ease: EASE }}
              className="group"
            >
              <div className="font-serif text-[52px] italic leading-none text-noir-ink transition-transform duration-500 ease-out-expo group-hover:-translate-y-1">{f.big}</div>
              <div className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-orange">{f.label}</div>
              <p className="mt-2 font-sans text-[15px] leading-relaxed text-noir-ink-2">{f.detail}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

function Word({ word, range, progress }: { word: { text: string; accent: boolean }; range: [number, number]; progress: MotionValue<number> }) {
  const opacity = useTransform(progress, range, [0.12, 1])
  return (
    <>
      <motion.span style={{ opacity }} className={word.accent ? 'text-brand' : undefined}>
        {word.text}
      </motion.span>{' '}
    </>
  )
}
