'use client'

import Link from 'next/link'
import { motion } from 'motion/react'
import { helpHref, type HelpTopic } from '@/lib/help'
import { cn } from '@/lib/cn'

const GROUPS: HelpTopic['group'][] = ['Going out', 'Money', 'Safety', 'Hosting', 'Account']

/**
 * The sticky list of every topic beside the answers, grouped. The current
 * topic sits on a pill that glides between rows as you hover the others,
 * then settles back when the cursor leaves.
 */
export function TopicRail({ topics, current }: { topics: HelpTopic[]; current: string }) {
  return (
    <nav aria-label="Help topics" className="sticky top-28">
      {GROUPS.map(g => {
        const list = topics.filter(t => t.group === g)
        if (!list.length) return null
        return (
          <div key={g} className="mb-6">
            <div className="px-3 font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">{g}</div>
            <ul className="mt-2">
              {list.map(t => {
                const on = t.slug === current
                return (
                  <li key={t.slug}>
                    <Link href={helpHref(t.slug)} aria-current={on ? 'page' : undefined} className="relative block rounded-xl px-3 py-1.5">
                      {on && <motion.span layoutId="help-rail" className="absolute inset-0 rounded-xl bg-white shadow-soft" transition={{ type: 'spring', stiffness: 400, damping: 34 }} />}
                      <span className={cn('relative font-sans text-[15px] font-bold transition-colors', on ? 'text-ink' : 'text-ink-2 hover:text-ink')}>{t.title}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        )
      })}
    </nav>
  )
}
