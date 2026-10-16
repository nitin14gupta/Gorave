'use client'

import Link from 'next/link'
import { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { GUEST_TIPS, HOST_TIPS, SAFETY_LINKS } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const TABS = [
  { key: 'guests', label: 'Going out', tips: GUEST_TIPS },
  { key: 'hosts', label: 'Hosting', tips: HOST_TIPS },
] as const
const TILT = [-2.2, 1.4, -1, 2, -1.6, 1.1]

/**
 * Chapter 05 — the habits. Features do half the job; this is the other half.
 * Tips are pinned up like notes, slightly crooked — hover one and it
 * straightens and lifts. Switch tabs and the board deals a new set.
 */
export function TipsA() {
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('guests')
  const current = TABS.find(t => t.key === tab)!

  return (
    <section className="overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Chapter n="05" title="The habits" />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              The app helps.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">So do you.</span>
            </h2>
          </div>
          <div className="relative inline-flex rounded-full bg-cream p-1.5">
            {TABS.map(t => (
              <button
                key={t.key}
                type="button"
                aria-pressed={t.key === tab}
                onClick={() => setTab(t.key)}
                className={cn('relative rounded-full px-5 py-3 font-sans text-sm font-bold transition-colors', t.key === tab ? 'text-cream' : 'text-ink-2 hover:text-ink')}
              >
                {t.key === tab && <motion.span layoutId="tips-a-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="relative">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
            initial="hidden"
            whileInView="show"
            exit="exit"
            viewport={{ once: true, margin: '-60px' }}
            transition={{ staggerChildren: 0.06 }}
          >
            {current.tips.map((t, i) => (
              <motion.div
                key={t.title}
                variants={{
                  hidden: { opacity: 0, y: 50, rotate: TILT[i] * 3 },
                  show: { opacity: 1, y: 0, rotate: TILT[i] },
                  exit: { opacity: 0, y: -24, transition: { duration: 0.2 } },
                }}
                transition={{ duration: 0.7, ease: EASE }}
                whileHover={{ rotate: 0, y: -8, transition: { duration: 0.35, ease: EASE } }}
                className="group relative rounded-[26px] bg-white p-7 shadow-soft"
              >
                <span aria-hidden className="absolute left-1/2 top-3 size-2.5 -translate-x-1/2 rounded-full bg-ink/15" />
                <div className="font-serif text-4xl italic leading-none text-ink-3 transition-colors duration-300 group-hover:text-orange">0{i + 1}</div>
                <div className="mt-5 font-display text-2xl font-extrabold tracking-[-0.03em]">{t.title}</div>
                <span className="mt-2 block h-[3px] w-0 rounded-full bg-green transition-all duration-500 ease-out-expo group-hover:w-14" />
                <p className="mt-3 font-sans text-[15px] leading-relaxed text-ink-2">{t.body}</p>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        <p className="mt-12 font-sans text-base text-ink-2">
          The full rules of the house are in our{' '}
          <Link href={SAFETY_LINKS.guidelines} className="font-bold text-ink underline decoration-orange decoration-2 underline-offset-4">community guidelines</Link>.
        </p>
      </div>
    </section>
  )
}
