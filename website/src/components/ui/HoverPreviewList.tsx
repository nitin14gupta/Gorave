'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useSpring } from 'motion/react'
import { cn } from '@/lib/cn'

export interface PreviewRow {
  key: string
  label: ReactNode
  href: string
  /** Small text on the right of the row */
  aside?: ReactNode
  /** Photo shown in the floating card while the row is hovered */
  image?: string
  /** Or custom content for the floating card (overrides image) */
  preview?: ReactNode
}

/**
 * Big link rows with a card that follows the cursor and swaps per row (the
 * homepage "Where's the party tonight?" list). Phones just get the rows.
 */
export function HoverPreviewList({ rows, cardClassName }: { rows: PreviewRow[]; cardClassName?: string }) {
  const listRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 260, damping: 26 })
  const y = useSpring(my, { stiffness: 260, damping: 26 })

  const onMove = (e: React.MouseEvent) => {
    const r = listRef.current?.getBoundingClientRect()
    if (!r) return
    mx.set(e.clientX - r.left - 115)
    my.set(e.clientY - r.top - 145)
  }
  const row = hovered === null ? null : rows[hovered]

  return (
    <div ref={listRef} className="relative" onMouseMove={onMove} onMouseLeave={() => setHovered(null)}>
      {rows.map((r, i) => (
        <Link
          key={r.key}
          href={r.href}
          onMouseEnter={() => setHovered(i)}
          className={cn(
            'relative z-10 flex items-center justify-between gap-4 border-t-[1.5px] border-ink py-5 transition-colors duration-300',
            hovered === i ? 'text-orange' : 'text-ink',
          )}
        >
          <span className="font-display text-[clamp(36px,4.4vw,52px)] font-extrabold tracking-[-0.04em] transition-transform duration-500 ease-out-expo" style={{ transform: hovered === i ? 'translateX(12px)' : undefined }}>
            {r.label}
          </span>
          {r.aside && <span className="hidden text-right font-sans text-[15px] font-bold opacity-70 sm:block">{r.aside}</span>}
        </Link>
      ))}

      <motion.div
        aria-hidden
        className={cn('pointer-events-none absolute left-0 top-0 z-20 hidden h-[290px] w-[230px] overflow-hidden rounded-[22px] shadow-pop md:block', cardClassName)}
        style={{ x, y, rotate: 5 }}
        animate={{ opacity: hovered === null ? 0 : 1, scale: hovered === null ? 0.85 : 1 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence initial={false}>
          {row && (
            <motion.div key={row.key} className="absolute inset-0" initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
              {row.preview ?? (row.image ? <Image src={row.image} alt="" fill sizes="460px" className="object-cover" /> : null)}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
