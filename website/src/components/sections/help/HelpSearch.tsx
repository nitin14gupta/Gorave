'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { helpHref, qId, type HelpTopic } from '@/lib/help'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
const TRY = ['refund', 'address', 'SOS', 'payout', 'request', 'wallet']
const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9₹\s-]/g, ' ').split(/\s+/).filter(w => w.length > 1)

/**
 * The search box. Answers, not links: matching questions show right under
 * the box and open in place, each with a way into its topic. Press / to
 * jump to the box from anywhere on the page.
 */
export function HelpSearch({ topics }: { topics: HelpTopic[] }) {
  const input = useRef<HTMLInputElement>(null)
  const [q, setQ] = useState('')
  const [open, setOpen] = useState<string | null>(null)
  const index = useMemo(
    () => topics.flatMap(t => t.questions.map(x => ({ t, x, text: `${x.q} ${x.a} ${t.title}`.toLowerCase(), head: x.q.toLowerCase() }))),
    [topics],
  )

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes(el.tagName)) {
        e.preventDefault()
        input.current?.focus()
      }
    }
    window.addEventListener('keydown', key)
    return () => window.removeEventListener('keydown', key)
  }, [])

  const terms = words(q)
  const hits = terms.length
    ? index
        .map(r => ({ ...r, score: terms.reduce((n, w) => n + (r.text.includes(w) ? 1 : 0) + (r.head.includes(w) ? 2 : 0), 0) }))
        .filter(r => r.score >= terms.length)
        .sort((a, b) => b.score - a.score)
        .slice(0, 6)
    : []

  return (
    <div className="relative">
      <div className="rounded-[30px] bg-white p-2.5 shadow-pop">
        <label className="flex items-center gap-4 rounded-[22px] bg-cream px-5 py-4 md:px-6 md:py-5">
          <svg aria-hidden viewBox="0 0 24 24" className="size-6 shrink-0 text-ink-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className="sr-only">Search help</span>
          <input
            ref={input}
            value={q}
            onChange={e => { setQ(e.target.value); setOpen(null) }}
            placeholder="Refunds, the address, SOS, payouts…"
            className="w-full bg-transparent font-display text-[clamp(20px,2.4vw,30px)] font-extrabold tracking-[-0.035em] text-ink outline-none placeholder:text-ink/25"
          />
          {q ? (
            <button type="button" onClick={() => setQ('')} className="shrink-0 rounded-full bg-white px-3 py-1.5 font-sans text-xs font-bold shadow-soft">Clear</button>
          ) : (
            <kbd className="hidden shrink-0 rounded-lg border border-ink/15 px-2 py-0.5 font-sans text-xs font-bold text-ink-3 md:block">/</kbd>
          )}
        </label>

        <AnimatePresence initial={false} mode="wait">
          {terms.length === 0 ? (
            <motion.div key="try" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 px-4 py-4">
              <span className="mr-1 font-sans text-sm font-bold text-ink-3">Popular</span>
              {TRY.map(t => (
                <button key={t} type="button" onClick={() => setQ(t)} className="rounded-full bg-cream px-3.5 py-1.5 font-sans text-sm font-bold transition-colors duration-300 hover:bg-ink hover:text-cream">
                  {t}
                </button>
              ))}
            </motion.div>
          ) : hits.length ? (
            <motion.ul key="hits" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-2 pb-2 pt-1">
              {hits.map((h, i) => {
                const id = `${h.t.slug}/${qId(h.x.q)}`
                const on = open === id
                return (
                  <motion.li key={id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE, delay: i * 0.03 }} className="border-b border-ink/8 last:border-0">
                    <button type="button" onClick={() => setOpen(on ? null : id)} aria-expanded={on} className="flex w-full items-center justify-between gap-4 rounded-2xl px-3 py-3.5 text-left transition-colors hover:bg-cream">
                      <span>
                        <span className="block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{h.t.title}</span>
                        <span className="mt-0.5 block font-display text-[19px] font-extrabold leading-snug tracking-[-0.025em]">{h.x.q}</span>
                      </span>
                      <span aria-hidden className={cn('grid size-8 shrink-0 place-items-center rounded-full text-lg transition-[transform,background-color,color] duration-300', on ? 'rotate-45 bg-brand text-white' : 'bg-ink/5')}>+</span>
                    </button>
                    <div className="grid transition-[grid-template-rows] duration-500 ease-out-expo" style={{ gridTemplateRows: on ? '1fr' : '0fr' }}>
                      <div className="overflow-hidden">
                        <p className="px-3 font-sans text-[16px] leading-relaxed text-ink-2">{h.x.a}</p>
                        <Link href={`${helpHref(h.t.slug)}#${qId(h.x.q)}`} className="mb-4 ml-3 mt-3 inline-block font-sans text-sm font-bold text-orange">
                          More in {h.t.title} →
                        </Link>
                      </div>
                    </div>
                  </motion.li>
                )
              })}
            </motion.ul>
          ) : (
            <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="px-5 py-5 font-sans text-[15px] text-ink-2">
              Nothing matches that yet. Try fewer words, or pick a topic below.
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
