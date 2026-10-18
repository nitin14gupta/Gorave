'use client'

import Link from 'next/link'
import { motion, useReducedMotion } from 'motion/react'
import { GUIDES_HUB_CRUMBS, NIGHT_STAGES, outGuideHref, questionOf, type OutGuide } from '@/lib/goingOut'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EASE } from './kit'

/**
 * Hero. The page is a friend you can ask: a short chat plays once on load,
 * each question a real guide and each reply a link into it. Under it, the
 * night in five stops, which the rest of the page walks through.
 */
export function GuidesHero({ chat, total }: { chat: OutGuide[]; total: number }) {
  const reduce = !!useReducedMotion()
  const appear = (i: number) => ({
    initial: reduce ? false : { opacity: 0, y: 14, scale: 0.96 },
    animate: { opacity: 1, y: 0, scale: 1 },
    transition: { duration: 0.5, ease: EASE, delay: 0.5 + i * 0.45 },
  })

  return (
    <section className="bg-cream px-6 pb-16 pt-28 md:px-12 lg:px-20">
      <div className="mx-auto max-w-[1280px]">
        <Breadcrumbs crumbs={GUIDES_HUB_CRUMBS} />
        <div className="mt-10 grid items-end gap-14 lg:grid-cols-[1.2fr_1fr]">
          <motion.div initial={reduce ? false : { opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE }}>
            <h1 className="font-display text-[clamp(52px,7.6vw,128px)] font-extrabold leading-[0.88] tracking-[-0.065em]">
              Everything you’d ask a friend
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> before going out.</span>
            </h1>
            <p className="mt-7 max-w-[480px] font-sans text-xl leading-relaxed text-ink-2">
              {total} short guides to house parties, rooftops, game nights and dinners at someone’s place. Plain answers, no fluff.
            </p>
          </motion.div>

          {/* The chat */}
          <div className="flex flex-col gap-3" aria-label="Questions people ask">
            {chat.slice(0, 3).map((g, i) => (
              <div key={g.slug} className="flex flex-col gap-3">
                <motion.div {...appear(i * 2)} className="max-w-[80%] self-end rounded-[22px] rounded-br-md bg-brand px-5 py-3 font-sans text-[17px] font-bold text-white shadow-soft">
                  {questionOf(g)}
                </motion.div>
                <motion.div {...appear(i * 2 + 1)} className="self-start">
                  <Link href={outGuideHref(g)} className="group block max-w-[340px] rounded-[22px] rounded-bl-md bg-white px-5 py-3 shadow-soft transition-transform duration-500 ease-out-expo hover:-translate-y-0.5">
                    <span className="block font-sans text-[15px] leading-snug text-ink-2">{g.takeaways[0]}</span>
                    <span className="mt-1.5 block font-sans text-sm font-bold text-ink">
                      Read it in {g.readMinutes} min <span className="inline-block transition-transform duration-500 group-hover:translate-x-1">→</span>
                    </span>
                  </Link>
                </motion.div>
              </div>
            ))}
          </div>
        </div>

        <nav aria-label="The night, stop by stop" className="relative mt-20">
          <div aria-hidden className="absolute left-0 right-0 top-[11px] h-px bg-ink/15" />
          <ol className="relative grid grid-cols-5 gap-2">
            {NIGHT_STAGES.map((s, i) => (
              <motion.li key={s.key} initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE, delay: 0.2 + i * 0.07 }}>
                <a
                  href="#night"
                  onClick={e => {
                    // Pinned (desktop) and stacked (phone) versions both mark their stops; go to the visible one.
                    const el = [...document.querySelectorAll<HTMLElement>(`[data-night="${s.key}"]`)].find(n => n.offsetParent !== null || n.closest('section')?.offsetParent !== null)
                    if (!el) return
                    e.preventDefault()
                    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + 2, behavior: reduce ? 'auto' : 'smooth' })
                  }}
                  className="group block"
                >
                  <span className="block size-[22px] rounded-full border-[5px] border-cream bg-orange shadow-soft transition-transform duration-300 group-hover:scale-125" />
                  <span className="mt-3 block font-sans text-xs font-bold uppercase tracking-[0.14em] text-ink-3">{s.time}</span>
                  <span className="mt-1 block font-display text-[clamp(14px,1.6vw,22px)] font-extrabold leading-tight tracking-[-0.03em] transition-colors group-hover:text-orange">{s.label}</span>
                </a>
              </motion.li>
            ))}
          </ol>
        </nav>
      </div>
    </section>
  )
}
