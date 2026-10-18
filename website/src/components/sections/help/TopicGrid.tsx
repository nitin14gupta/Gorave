'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { helpHref, qId, type HelpTopic } from '@/lib/help'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Every topic as a quiet tile. Tiles rise in as they scroll into view;
 * hover one and it lifts to white while its line slides away and its top
 * three questions slide in, each a direct link to that answer.
 */
export function TopicGrid({ topics }: { topics: HelpTopic[] }) {
  const reduce = !!useReducedMotion()
  return (
    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {topics.map((t, i) => (
        <motion.li
          key={t.slug}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-8% 0px' }}
          transition={{ duration: 0.6, ease: EASE, delay: (i % 3) * 0.06 }}
        >
          <div className="group relative h-full rounded-[26px] bg-paper p-6 transition-[background-color,box-shadow,transform] duration-500 ease-out-expo hover:-translate-y-1 hover:bg-white hover:shadow-pop">
            <Link href={helpHref(t.slug)} className="block after:absolute after:inset-0 after:content-['']">
              <div className="flex items-baseline justify-between">
                <span className="font-serif text-lg italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                <span className="font-sans text-xs font-bold text-ink-3">{t.questions.length} answers</span>
              </div>
              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.04em]">{t.title}</div>
                <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ink/5 text-lg transition-[transform,background-color,color] duration-500 ease-out-expo group-hover:-rotate-45 group-hover:bg-ink group-hover:text-cream">→</span>
              </div>
            </Link>
            {/* Same size on hover: the line slides away and the top questions slide in */}
            <div className="relative mt-3 h-[52px] overflow-hidden md:h-[96px]">
              <p className="font-sans text-[15px] leading-relaxed text-ink-2 transition-[opacity,transform] duration-500 ease-out-expo md:group-hover:-translate-y-4 md:group-hover:opacity-0">{t.line}</p>
              <ul className="pointer-events-none absolute inset-0 z-[1] hidden translate-y-4 opacity-0 transition-[opacity,transform] duration-500 ease-out-expo md:block md:group-hover:pointer-events-auto md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
                {t.questions.slice(0, 3).map(x => (
                  <li key={x.q}>
                    <Link href={`${helpHref(t.slug)}#${qId(x.q)}`} className="flex items-baseline gap-2 truncate py-1 font-sans text-[14px] font-bold text-ink-2 transition-colors hover:text-orange">
                      <span aria-hidden className="text-ink-3">↳</span>
                      <span className="truncate">{x.q}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.li>
      ))}
    </ul>
  )
}
