'use client'

import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { qId, type HelpQA } from '@/lib/help'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * A topic's answers. Several can be open at once; the first starts open.
 * Every question has its own link (#question-slug): arriving on one opens
 * it and glides it into view, and opening one updates the address bar so
 * it can be shared. A small "copy link" appears on hover.
 */
export function QAList({ items }: { items: HelpQA[] }) {
  const reduce = !!useReducedMotion()
  const [open, setOpen] = useState<Set<string>>(() => new Set(items[0] ? [qId(items[0].q)] : []))
  const [copied, setCopied] = useState<string | null>(null)

  // Open (and scroll to) the question in the URL hash, now and on hash changes.
  useEffect(() => {
    const go = () => {
      const id = decodeURIComponent(window.location.hash.slice(1))
      if (!id || !items.some(x => qId(x.q) === id)) return
      setOpen(s => new Set(s).add(id))
      requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' }))
    }
    go()
    window.addEventListener('hashchange', go)
    return () => window.removeEventListener('hashchange', go)
  }, [items, reduce])

  function toggle(id: string) {
    setOpen(s => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else {
        n.add(id)
        history.replaceState(null, '', `#${id}`)
      }
      return n
    })
  }

  function copy(id: string) {
    const url = `${window.location.origin}${window.location.pathname}#${id}`
    navigator.clipboard?.writeText(url).then(() => {
      setCopied(id)
      window.setTimeout(() => setCopied(c => (c === id ? null : c)), 1600)
    })
  }

  return (
    <ol className="border-t border-ink/12">
      {items.map((x, i) => {
        const id = qId(x.q)
        const on = open.has(id)
        return (
          <motion.li
            key={id}
            id={id}
            initial={reduce ? false : { opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-6% 0px' }}
            transition={{ duration: 0.5, ease: EASE, delay: Math.min(i, 6) * 0.04 }}
            className="group scroll-mt-28 border-b border-ink/12"
          >
            <div className="flex items-start gap-4">
              <button type="button" onClick={() => toggle(id)} aria-expanded={on} aria-controls={`${id}-a`} className="flex flex-1 items-start gap-5 py-6 text-left">
                <span className="mt-1 w-7 shrink-0 font-serif text-lg italic text-orange">{String(i + 1).padStart(2, '0')}</span>
                <span className={cn('flex-1 font-display text-[clamp(20px,2vw,26px)] font-extrabold leading-snug tracking-[-0.03em] transition-colors duration-300', !on && 'group-hover:text-orange')}>{x.q}</span>
                <span aria-hidden className={cn('mt-0.5 grid size-9 shrink-0 place-items-center rounded-full text-xl transition-[transform,background-color,color] duration-500 ease-out-expo', on ? 'rotate-45 bg-brand text-white' : 'bg-ink/5 group-hover:bg-ink group-hover:text-cream')}>+</span>
              </button>
            </div>
            <div id={`${id}-a`} className="grid transition-[grid-template-rows] duration-500 ease-out-expo" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
              <div className="overflow-hidden">
                <div className="pb-7 pl-12 pr-14">
                  <p className="max-w-[640px] font-sans text-[17px] leading-[1.7] text-ink-2">{x.a}</p>
                  <button type="button" onClick={() => copy(id)} className="mt-4 font-sans text-xs font-bold text-ink-3 transition-colors hover:text-ink">
                    {copied === id ? 'Link copied ✓' : 'Copy link to this answer'}
                  </button>
                </div>
              </div>
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
