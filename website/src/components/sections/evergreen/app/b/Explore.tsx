'use client'

import Link from 'next/link'
import { useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { Chapter } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { DiscoverScreen, PayScreen, TicketScreen } from '@/components/ui/AppScreens'
import { cn } from '@/lib/cn'
import { CrowdScreen, HostScreen, ProfileScreen, RequestScreen, SosScreen } from '../screens'
import { EASE } from '../data'

interface Row { title: string; detail: string; screen: ReactNode; href?: string }

const ROWS: Row[] = [
  { title: 'Closest first', detail: 'Your city, nearest nights on top. Filter by free, tonight, weekend or vibe.', screen: <DiscoverScreen /> },
  { title: 'Request to join', detail: 'Free events: you ask, the host approves.', screen: <RequestScreen index={1} /> },
  { title: 'UPI, booked', detail: 'Paid events book instantly with UPI or the Gorave Wallet. Flat ₹50 fee.', screen: <PayScreen /> },
  { title: 'QR at the door', detail: 'Your ticket, plus the exact address once you are confirmed.', screen: <TicketScreen /> },
  { title: 'The crowd, set', detail: 'Hosts pick a crowd mix like women-only or 50:50, and an age gate.', screen: <CrowdScreen /> },
  { title: 'One-tap SOS', detail: 'Live location to up to 5 emergency contacts.', screen: <SosScreen /> },
  { title: 'A voice, not a bio', detail: 'Photos and a 30-second voice intro. Vibers follow you, you are Vibing them.', screen: <ProfileScreen /> },
  { title: 'Host, keep 90%', detail: 'Free to list, 2 free-entry events a month, paid tickets from ₹99.', screen: <HostScreen />, href: '/host' },
]

const PW = 230

/**
 * Chapter 02, what's inside. A list of the features in big type; hover a
 * row and a phone showing that exact screen follows your cursor, swapping as
 * you move down. On phones, tap a row to open its screen in place.
 */
export function Explore() {
  const reduce = useReducedMotion() ?? false
  const [hover, setHover] = useState<number | null>(null)
  const [open, setOpen] = useState<number | null>(0)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const x = useSpring(mx, { stiffness: 220, damping: 26 })
  const y = useSpring(my, { stiffness: 220, damping: 26 })
  const tilt = useTransform(mx, [0, 1440], [-6, 6])

  const onMove = (e: React.MouseEvent) => {
    // Viewport coordinates: the follower is position: fixed, so it stays under the cursor while you scroll.
    mx.set(Math.round(Math.min(e.clientX + 28, window.innerWidth - PW - 24)))
    my.set(Math.round(Math.max(16, Math.min(e.clientY - PW, window.innerHeight - PW * 2.05 - 16))))
  }

  return (
    <section className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div>
            <Chapter n="04" title="What's inside" />
            <h2 className="mt-4 font-display text-[clamp(46px,6vw,88px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Hover around.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">It&apos;s all real.</span>
            </h2>
          </div>
          <p className="max-w-[340px] font-sans text-lg leading-relaxed text-ink-2">Eight things the app does today. Each one is the actual screen.</p>
        </div>

        <div className="relative mt-14" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
          {ROWS.map((r, i) => {
            const on = hover === i
            const dim = hover !== null && !on
            const body = (
              <>
                <span className="w-10 shrink-0 font-serif text-xl italic text-orange md:w-16 md:text-2xl">0{i + 1}</span>
                <span
                  className="flex-1 font-display text-[clamp(32px,5.2vw,76px)] font-extrabold leading-none tracking-[-0.05em] transition-[transform,opacity] duration-500 ease-out-expo"
                  style={{ transform: on ? 'translateX(14px)' : undefined, opacity: dim ? 0.25 : 1 }}
                >
                  {r.title}{r.href && <span className="text-orange"> ↗</span>}
                </span>
                <span className={cn('hidden max-w-[300px] text-right font-sans text-[15px] leading-snug text-ink-2 transition-opacity duration-500 md:block', dim && 'opacity-30')}>{r.detail}</span>
              </>
            )
            const cls = 'relative z-10 flex w-full items-center gap-3 border-t-[1.5px] border-ink py-5 text-left text-ink md:gap-6 md:py-6'
            return (
              <div key={r.title} onMouseEnter={() => setHover(i)}>
                {r.href ? (
                  <Link href={r.href} className={cls}>{body}</Link>
                ) : (
                  <button type="button" onClick={() => setOpen(open === i ? null : i)} className={cls} aria-expanded={open === i}>{body}</button>
                )}
                {/* Phones: the screen opens in place */}
                <AnimatePresence initial={false}>
                  {open === i && !r.href && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.5, ease: EASE }}
                      className="overflow-hidden md:hidden"
                    >
                      <p className="pb-5 pl-[52px] font-sans text-[15px] leading-relaxed text-ink-2">{r.detail}</p>
                      <div className="flex justify-center pb-8"><Phone width={210}>{r.screen}</Phone></div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {r.href && <p className="-mt-2 pb-5 pl-[52px] font-sans text-[15px] text-ink-2 md:hidden">{r.detail}</p>}
              </div>
            )
          })}
          <div className="border-t-[1.5px] border-ink" />

          {/* The follower */}
          <motion.div
            aria-hidden
            className="pointer-events-none fixed left-0 top-0 z-30 hidden md:block"
            style={{ x, y, rotate: reduce ? 0 : tilt }}
            animate={{ opacity: hover === null ? 0 : 1, scale: hover === null ? 0.8 : 1 }}
            transition={{ duration: 0.3 }}
          >
            <Phone width={PW}>
              <AnimatePresence initial={false}>
                {hover !== null && (
                  <motion.div key={hover} className="absolute inset-0" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.35, ease: EASE }}>
                    {ROWS[hover].screen}
                  </motion.div>
                )}
              </AnimatePresence>
            </Phone>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
