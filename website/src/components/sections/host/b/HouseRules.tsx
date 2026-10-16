'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { HOUSE_RULES } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { Poster } from '@/components/ui/Poster'

const TILTS = [-4, 3, -2, 5, -5, 2, -3, 4]
const W = 230
const H = 300

/**
 * Chapter 04 — house rules. Flyers pasted on the backstage wall. Hover (or
 * tap) one and it peels up from its tape to show the rule underneath —
 * every one is something the app actually enforces.
 */
export function HouseRules() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section className="relative overflow-hidden bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div aria-hidden className="absolute inset-0 opacity-[0.05] [background-image:repeating-linear-gradient(0deg,#fff_0_1px,transparent_1px_46px),repeating-linear-gradient(90deg,#fff_0_1px,transparent_1px_92px)]" />
      <div className="relative mx-auto max-w-[1280px]">
        <div className="grid items-end gap-6 lg:grid-cols-[1fr_1fr]">
          <div>
            <Chapter n="04" title="House rules" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              Pinned to<br />the wall.
            </h2>
          </div>
          <p className="max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            The rules that come with every Gorave event — you don&apos;t have to write them, or enforce them at the door. Lift a flyer to read it.
          </p>
        </div>

        <div className="mt-14 flex flex-wrap justify-center gap-x-8 gap-y-12">
          {HOUSE_RULES.map((r, i) => {
            const lifted = open === i
            return (
              <motion.div
                key={r.title}
                initial={{ opacity: 0, y: -60, rotate: TILTS[i] * 3 }}
                whileInView={{ opacity: 1, y: 0, rotate: TILTS[i] }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ type: 'spring', stiffness: 160, damping: 14, delay: (i % 4) * 0.08 }}
                className="relative"
                style={{ width: W, height: H }}
                onHoverStart={() => setOpen(i)}
                onHoverEnd={() => setOpen(o => (o === i ? null : o))}
              >
                {/* The rule underneath */}
                <div className="absolute inset-0 flex flex-col justify-end rounded-[16px] bg-noir-3 p-5 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                  <div className="font-serif text-2xl italic text-orange">Rule {String(i + 1).padStart(2, '0')}</div>
                  <p className="mt-2 font-sans text-[15px] font-bold leading-snug">{r.rule}</p>
                </div>

                {/* The flyer, taped at the top — peels up on hover */}
                <button
                  type="button"
                  onClick={() => setOpen(o => (o === i ? null : i))}
                  aria-expanded={lifted}
                  aria-label={`${r.title.replace('|', ' ')} — ${r.rule}`}
                  className="absolute inset-0 block text-left [perspective:900px]"
                >
                  <motion.div
                    className="size-full origin-top"
                    animate={lifted ? { rotateX: 62, y: -14, scale: 0.98 } : { rotateX: 0, y: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 220, damping: 18 }}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    <Poster poster={{ kind: 'type', bg: r.bg, ink: r.ink, title: r.title, when: 'House rule' }} width={W} height={H} radius={16} className="shadow-pop" />
                    <motion.div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 rounded-[16px] bg-gradient-to-b from-black/0 to-black/50"
                      animate={{ opacity: lifted ? 1 : 0 }}
                    />
                  </motion.div>
                </button>
                <span aria-hidden className="absolute -top-3 left-1/2 z-10 h-6 w-16 -translate-x-1/2 rotate-[-3deg] bg-white/35 backdrop-blur-sm" />
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
