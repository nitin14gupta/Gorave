'use client'

import { useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from 'motion/react'
import { cn } from '@/lib/cn'
import { Eyebrow, H2 } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { DiscoverScreen, EventDetailScreen, PayScreen, TicketScreen } from '@/components/ui/AppScreens'

const EASE = [0.2, 0.8, 0.2, 1] as const

const STEPS: { title: string; body: string; screen: ReactNode }[] = [
  { title: 'Discover', body: 'Everything in your city, closest first. Filter by vibe, date, price or crowd.', screen: <DiscoverScreen /> },
  {
    title: 'Request',
    body: 'Free events are host-approved. The crowd stays right, every time.',
    screen: (
      <EventDetailScreen
        cta="Requested"
        status={<div className="mt-3 rounded-2xl bg-white/8 p-3 font-sans text-xs text-noir-ink">Request sent. We&apos;ll let you know when the host decides.</div>}
      />
    ),
  },
  { title: 'Pay with UPI', body: 'GPay, PhonePe or your Gorave Wallet. If the host cancels, refunds land in your wallet.', screen: <PayScreen /> },
  { title: 'Walk in', body: "The exact address unlocks once you're in. Your QR ticket opens the door.", screen: <TicketScreen /> },
]

/**
 * Pinned walkthrough: the section is STEPS.length screens tall, its content
 * sticks to the viewport, and scroll progress picks the active step, the
 * phone swaps screens as each step scrolls past.
 */
export function GroupChat() {
  const ref = useRef<HTMLElement>(null)
  const [active, setActive] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(scrollYProgress, 'change', v => {
    setActive(Math.min(STEPS.length - 1, Math.max(0, Math.floor(v * STEPS.length))))
  })

  return (
    <section ref={ref} className="relative bg-paper" style={{ height: `${STEPS.length * 85}vh` }}>
      <div className="sticky top-0 flex h-screen items-center px-6 md:px-20">
        <div className="mx-auto grid w-full max-w-[1280px] items-center gap-10 lg:grid-cols-[1fr_360px_1fr] lg:gap-16">
          <div>
            <Eyebrow>How it works</Eyebrow>
            <H2 className="mt-3.5 !text-[clamp(40px,5vw,72px)]">From group chat to guest list.</H2>
            <div className="mt-8 hidden h-1 w-full max-w-[280px] overflow-hidden rounded-full bg-line lg:block">
              <motion.div className="h-full origin-left bg-brand" style={{ scaleX: scrollYProgress }} />
            </div>
          </div>

          <div className="hidden justify-center lg:flex">
            <Phone width={330}>
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={active}
                  initial={{ opacity: 0, y: 30, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -30, scale: 0.98 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  className="absolute inset-0"
                >
                  {STEPS[active].screen}
                </motion.div>
              </AnimatePresence>
            </Phone>
          </div>

          <ol className="flex flex-col gap-6">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                className={cn('border-l-[3px] pl-5.5 transition-[opacity,border-color] duration-500', i === active ? 'border-orange opacity-100' : 'border-line opacity-45')}
              >
                <div className="font-sans text-[13px] font-bold text-ink-3">0{i + 1}</div>
                <h3 className="font-display text-[28px] font-extrabold tracking-[-0.03em]">{s.title}</h3>
                <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
