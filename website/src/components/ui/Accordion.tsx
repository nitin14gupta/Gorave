'use client'

import { useId, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

export interface AccordionItem {
  q: string
  a: string
}

/** Single-open accordion with animated height; used for FAQs site-wide. */
export function Accordion({ items, dark }: { items: AccordionItem[]; dark?: boolean }) {
  const [open, setOpen] = useState<number | null>(0)
  const baseId = useId()

  return (
    <div className={cn('border-t-[1.5px]', dark ? 'border-noir-ink/20' : 'border-ink')}>
      {items.map((item, i) => {
        const isOpen = open === i
        const panelId = `${baseId}-panel-${i}`
        return (
          <div key={item.q} className={cn('border-b-[1.5px]', dark ? 'border-noir-ink/20' : 'border-ink')}>
            <button
              type="button"
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpen(isOpen ? null : i)}
              className="flex w-full items-center justify-between gap-6 py-6 text-left"
            >
              <span className={cn('font-display text-[clamp(20px,2.2vw,26px)] font-extrabold tracking-[-0.02em]', dark ? 'text-noir-ink' : 'text-ink')}>{item.q}</span>
              <motion.span
                aria-hidden
                animate={{ rotate: isOpen ? 45 : 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className={cn('flex size-9 shrink-0 items-center justify-center rounded-full text-xl', isOpen ? 'bg-brand text-white' : dark ? 'bg-noir-3 text-noir-ink' : 'bg-ink/5 text-ink')}
              >
                +
              </motion.span>
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  id={panelId}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="overflow-hidden"
                >
                  <p className={cn('max-w-[760px] pb-6 font-sans text-[17px] leading-relaxed', dark ? 'text-noir-ink-2' : 'text-ink-2')}>{item.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )
      })}
    </div>
  )
}
