'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { outGuideHref, questionOf, type OutGuide } from '@/lib/goingOut'
import { Chapter } from '@/components/ui/atoms'
import { EASE, guidePhoto } from './kit'

const TRY = ['going alone', 'what to wear', 'getting home', 'women-only', 'leave early', 'introvert']

const words = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter(w => w.length > 2)

/**
 * Chapter 02, ask anything. Not a search results page: type a question and
 * the one guide that answers it comes back as a reply, its short version
 * written out, with the full guide one tap away.
 */
export function AskAnything({ all }: { all: OutGuide[] }) {
  const [q, setQ] = useState('')
  const index = useMemo(
    () => all.map(g => ({ g, text: [questionOf(g), g.title, g.dek, g.category, ...g.takeaways, ...g.body.map(s => s.heading)].join(' ').toLowerCase() })),
    [all],
  )
  const terms = words(q)
  // Best match: most terms found, ties broken by matches in the question and title.
  const best = terms.length
    ? index
        .map(({ g, text }) => ({ g, score: terms.reduce((n, t) => n + (text.includes(t) ? 1 : 0) + ((questionOf(g) + g.title).toLowerCase().includes(t) ? 1 : 0), 0) }))
        .sort((a, b) => b.score - a.score)[0]
    : null
  const answer = best && best.score > 0 ? best.g : null

  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[980px]">
        <Chapter n="02" title="Ask anything" />
        <h2 className="mt-4 font-display text-[clamp(40px,5.6vw,88px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
          Still wondering?
          <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> Just ask.</span>
        </h2>

        <div className="mt-10 rounded-[32px] bg-white p-3 shadow-pop">
          <label className="flex items-center gap-3 rounded-[24px] bg-cream px-5 py-4">
            <span className="sr-only">Your question</span>
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Can I leave early without it being awkward?"
              className="w-full bg-transparent font-display text-[clamp(20px,2.4vw,30px)] font-extrabold tracking-[-0.035em] text-ink outline-none placeholder:text-ink/25"
            />
            {q && (
              <button type="button" onClick={() => setQ('')} className="shrink-0 rounded-full bg-white px-3 py-1.5 font-sans text-xs font-bold shadow-soft">
                Clear
              </button>
            )}
          </label>

          <AnimatePresence mode="wait" initial={false}>
            {answer ? (
              <motion.div
                key={answer.slug}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="grid gap-6 p-5 md:grid-cols-[200px_1fr] md:p-6"
              >
                <div className="relative hidden aspect-[4/5] overflow-hidden rounded-[22px] md:block">
                  <Image src={guidePhoto(answer)} alt="" fill sizes="200px" className="object-cover" />
                </div>
                <div>
                  <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-orange">{questionOf(answer)}</div>
                  <ol className="mt-4 space-y-3">
                    {answer.takeaways.map((t, i) => (
                      <motion.li
                        key={t.slice(0, 30)}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4, ease: EASE, delay: 0.1 + i * 0.08 }}
                        className="flex gap-4"
                      >
                        <span className="font-serif text-xl italic text-orange">{i + 1}</span>
                        <span className="font-display text-[20px] font-extrabold leading-snug tracking-[-0.025em]">{t}</span>
                      </motion.li>
                    ))}
                  </ol>
                  <Link href={outGuideHref(answer)} className="group mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-3 font-sans text-sm font-bold text-cream">
                    Read the full guide · {answer.readMinutes} min
                    <span className="transition-transform duration-500 group-hover:translate-x-1">→</span>
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div key="try" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-wrap items-center gap-2 p-5 md:p-6">
                <span className="mr-1 font-sans text-sm font-bold text-ink-3">{q ? 'Nothing on that yet. Try' : 'Try'}</span>
                {TRY.map(t => (
                  <button key={t} type="button" onClick={() => setQ(t)} className="rounded-full bg-cream px-4 py-2 font-sans text-sm font-bold transition-colors hover:bg-ink hover:text-cream">
                    {t}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
