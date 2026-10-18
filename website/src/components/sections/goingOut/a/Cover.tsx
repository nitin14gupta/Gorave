'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { GUIDES_HUB_CRUMBS, outGuideHref, type OutGuide } from '@/lib/goingOut'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EASE, guidePhoto } from '../kit'

/**
 * Hero, the cover. A magazine cover: masthead on the left, a cover photo on
 * the right with cover lines printed over it. Hover a cover line and the
 * cover photo changes to that story; click to read it.
 */
export function Cover({ guides, total }: { guides: OutGuide[]; total: number }) {
  const reduce = !!useReducedMotion()
  const lines = guides.slice(0, 4)
  const [on, setOn] = useState(0)
  const g = lines[on]

  return (
    <section className="bg-cream px-6 pb-20 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <Breadcrumbs crumbs={GUIDES_HUB_CRUMBS} />
        <div className="mt-8 grid items-end gap-10 lg:grid-cols-[1fr_1.05fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <div className="flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">
              <span>The Gorave field guide</span>
              <span className="h-px w-10 bg-ink/25" />
              <span>{total} guides</span>
            </div>
            <h1 className="mt-5 font-display text-[clamp(64px,10vw,168px)] font-extrabold leading-[0.82] tracking-[-0.07em]">
              Going
              <br />
              out<span className="font-serif font-normal italic tracking-[-0.03em] text-orange">, well.</span>
            </h1>
            <p className="mt-7 max-w-[460px] font-sans text-xl leading-relaxed text-ink-2">
              How to pick a night, get in, have a good time in a stranger’s living room, and get home safe. Written for first-timers and regulars.
            </p>
          </motion.div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-[36px] bg-tile shadow-pop">
            <AnimatePresence initial={false}>
              <motion.div
                key={g.slug}
                initial={reduce ? false : { opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease: EASE }}
                className="absolute inset-0"
              >
                <Image src={guidePhoto(g)} alt="" fill priority sizes="(min-width: 1024px) 620px, 100vw" className="object-cover" />
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/10 to-black/75" />
            <div className="absolute inset-x-6 top-6 flex items-baseline justify-between text-white">
              <span className="font-display text-[28px] font-extrabold tracking-[-0.05em]">gorave</span>
              <span className="font-sans text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">Field guide · India</span>
            </div>
            <ul className="absolute inset-x-6 bottom-6 space-y-3 text-white" onMouseLeave={() => setOn(0)}>
              {lines.map((l, i) => (
                <li key={l.slug}>
                  <Link href={outGuideHref(l)} onMouseEnter={() => setOn(i)} onFocus={() => setOn(i)} className="group block">
                    <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] opacity-70">{l.category}</span>
                    <span
                      className="block font-display text-[clamp(20px,2vw,28px)] font-extrabold leading-tight tracking-[-0.035em] transition-[opacity,transform] duration-500"
                      style={{ opacity: on === i ? 1 : 0.55, transform: on === i ? 'translateX(8px)' : 'none' }}
                    >
                      {l.title} <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
