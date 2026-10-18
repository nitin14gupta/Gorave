'use client'

import { useEffect, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/cn'

/**
 * The contents list beside a legal document. It follows your reading: the
 * section you're in gets a marker that slides along the rail.
 */
export function LegalToc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id)

  useEffect(() => {
    const els = items.map(i => document.getElementById(i.id)).filter((e): e is HTMLElement => !!e)
    const io = new IntersectionObserver(
      entries => {
        const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-20% 0px -65% 0px' },
    )
    els.forEach(e => io.observe(e))
    return () => io.disconnect()
  }, [items])

  return (
    <nav aria-label="On this page" className="sticky top-28">
      <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">On this page</div>
      <ol className="relative mt-4 border-l-[1.5px] border-ink/10">
        {items.map((t, i) => {
          const on = t.id === active
          return (
            <li key={t.id} className="relative">
              {on && <motion.span layoutId="legal-toc" className="absolute -left-[1.5px] top-0 h-full w-[3px] rounded-full bg-brand" transition={{ type: 'spring', stiffness: 380, damping: 34 }} />}
              <a href={`#${t.id}`} className={cn('flex gap-3 py-1.5 pl-4 font-sans text-[14px] leading-snug transition-colors', on ? 'font-bold text-ink' : 'text-ink-3 hover:text-ink')}>
                <span className="w-5 shrink-0 tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {t.label}
              </a>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
