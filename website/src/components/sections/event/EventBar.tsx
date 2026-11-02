'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { cn } from '@/lib/cn'

/** Stays in reach once the booking details scroll away; leaves at the footer. */
export function EventBar({ title, price, action, className, showAfter = 620 }: { title: string; price: string; action: string; className?: string; showAfter?: number }) {
  const [past, setPast] = useState(false)
  const [atEnd, setAtEnd] = useState(false)

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > showAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    // The ring section sits just above the footer and asks the same thing.
    const end = document.getElementById('site-footer')?.previousElementSibling
    const io = end ? new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting)) : null
    if (end && io) io.observe(end)
    return () => { window.removeEventListener('scroll', onScroll); io?.disconnect() }
  }, [showAfter])

  return (
    <AnimatePresence>
      {past && !atEnd && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className={cn('fixed inset-x-0 bottom-5 z-40 flex justify-center px-4', className)}
        >
          <div className="flex w-full max-w-[620px] items-center gap-4 rounded-full bg-ink py-2 pl-6 pr-2 text-cream shadow-pop">
            <div className="min-w-0 flex-1">
              <div className="truncate font-sans text-sm font-bold">{title}</div>
              <div className="font-sans text-xs text-noir-ink-2">{price}</div>
            </div>
            <Link href="/app" className="shrink-0 rounded-full bg-cream px-5 py-3 font-sans text-sm font-bold text-ink">{action}</Link>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
