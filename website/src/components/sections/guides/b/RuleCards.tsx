'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { HOST_FACTS } from '@/lib/hostGuides'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

/**
 * Chapter 04, the rules of the game. The app's terms, dealt face up from one
 * pile as the section arrives; hover (or tap) a card to flip it and read the
 * small print on the back.
 */
export function RuleCards() {
  const [flipped, setFlipped] = useState<number[]>([])
  const toggle = (i: number) => setFlipped(f => (f.includes(i) ? f.filter(x => x !== i) : [...f, i]))

  return (
    <section className="bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="04" title="The rules of the game" dark />
            <h2 className="mt-4 font-display text-[clamp(40px,5vw,72px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              The house<br />always tells you.
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg text-noir-ink-2">Eight numbers worth knowing before you list. Flip a card for the detail.</p>
        </div>

        <motion.ul
          className="mt-14 grid grid-cols-2 gap-4 md:gap-5 lg:grid-cols-4"
          initial="pile"
          whileInView="dealt"
          viewport={{ once: true, margin: '-120px' }}
        >
          {HOST_FACTS.map((f, i) => {
            const col = i % 4
            const row = Math.floor(i / 4)
            const on = flipped.includes(i)
            return (
              <motion.li
                key={f.label}
                variants={{
                  pile: { x: `${(1.5 - col) * 100}%`, y: `${(0.5 - row) * 100}%`, rotate: (i % 3) * 4 - 4, opacity: 0 },
                  dealt: { x: 0, y: 0, rotate: 0, opacity: 1, transition: { duration: 0.9, ease: EASE, delay: i * 0.07 } },
                }}
                className="[perspective:1200px]"
              >
                <button
                  type="button"
                  aria-pressed={on}
                  aria-label={`${f.big} ${f.label}: ${f.detail}`}
                  onPointerUp={e => { if (e.pointerType !== 'mouse') toggle(i) }}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i) } }}
                  className="group block aspect-[3/4] w-full text-left"
                >
                  <span
                    className={cn(
                      'relative block size-full transition-transform duration-700 ease-out-expo [transform-style:preserve-3d]',
                      '[@media(hover:hover)]:group-hover:[transform:rotateY(180deg)]',
                      on && '[transform:rotateY(180deg)]',
                    )}
                  >
                    <span className="absolute inset-0 flex flex-col justify-between rounded-[22px] bg-noir-3 p-5 [backface-visibility:hidden] md:p-6">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-noir-ink-2">Rule {String(i + 1).padStart(2, '0')}</span>
                      <span>
                        <span className="block font-display text-[clamp(48px,6vw,84px)] font-extrabold leading-[0.85] tracking-[-0.06em] text-brand">{f.big}</span>
                        <span className="mt-2 block font-display text-lg font-extrabold leading-tight tracking-[-0.02em] md:text-xl">{f.label}</span>
                      </span>
                      <span className="font-sans text-xs font-bold text-noir-ink-2">Flip ↻</span>
                    </span>
                    <span className="absolute inset-0 flex flex-col justify-between rounded-[22px] bg-paper p-5 text-ink [backface-visibility:hidden] [transform:rotateY(180deg)] md:p-6">
                      <span className="font-serif text-3xl italic text-orange">{f.big}</span>
                      <span className="font-sans text-[15px] font-medium leading-relaxed md:text-base">{f.detail}</span>
                    </span>
                  </span>
                </button>
              </motion.li>
            )
          })}
        </motion.ul>
      </div>
    </section>
  )
}
