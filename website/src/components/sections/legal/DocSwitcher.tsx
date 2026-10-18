'use client'

import Link from 'next/link'
import { useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * Tabs across the legal documents. A pill sits under the current one and
 * glides to whichever tab you hover, then settles back.
 */
export function DocSwitcher({ docs, current }: { docs: { slug: string; title: string }[]; current: string }) {
  const [hover, setHover] = useState<string | null>(null)
  const lit = hover ?? current
  return (
    <nav aria-label="Legal documents" className="-mx-6 overflow-x-auto px-6 md:mx-0 md:px-0">
      <ul className="inline-flex gap-1 rounded-full bg-paper p-1.5" onMouseLeave={() => setHover(null)}>
        {docs.map(d => (
          <li key={d.slug}>
            <Link
              href={`/${d.slug}`}
              aria-current={d.slug === current ? 'page' : undefined}
              onMouseEnter={() => setHover(d.slug)}
              className="relative block whitespace-nowrap rounded-full px-4 py-2 font-sans text-sm font-bold"
            >
              {lit === d.slug && <motion.span layoutId="legal-tab" className="absolute inset-0 rounded-full bg-white shadow-soft" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span className={cn('relative transition-colors', d.slug === current ? 'text-ink' : 'text-ink-2')}>{d.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  )
}
