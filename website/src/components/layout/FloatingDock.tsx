'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { AvatarStack } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'

/**
 * Bottom CTA pill: slides up once the hero is behind you, and gets out of
 * the way when the footer (which has its own store badges) comes into view.
 */
export function FloatingDock({ showAfter = 720, footerId = 'site-footer' }: { showAfter?: number; footerId?: string }) {
  const [pastHero, setPastHero] = useState(false)
  const [footerInView, setFooterInView] = useState(false)

  useEffect(() => {
    const onScroll = () => setPastHero(window.scrollY > showAfter)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    const footer = document.getElementById(footerId)
    const io = footer ? new IntersectionObserver(([e]) => setFooterInView(e.isIntersecting), { rootMargin: '0px 0px -10% 0px' }) : null
    if (footer && io) io.observe(footer)
    return () => { window.removeEventListener('scroll', onScroll); io?.disconnect() }
  }, [showAfter, footerId])

  const show = pastHero && !footerInView

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
          className="fixed inset-x-0 bottom-5 z-40 flex justify-center px-4"
        >
          <div className="flex items-center gap-3.5 rounded-full bg-ink py-2 pl-4.5 pr-2 text-cream shadow-[0_24px_50px_-20px_rgb(23_19_16/0.6)]">
            <span className="hidden sm:block"><AvatarStack n={3} size={26} ringClass="ring-ink" /></span>
            <span className="font-sans text-sm font-bold">Your next Saturday is on Gorave</span>
            <Button href="/app" size="sm">Get the app</Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
