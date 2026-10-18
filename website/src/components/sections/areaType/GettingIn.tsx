'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import type { AreaTypeProps } from '@/lib/areaType'
import { Chapter } from '@/components/ui/atoms'

const GLYPHS = '#%&*+=?@ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'

/**
 * Chapter 05, getting in. Pinned; one invite card moves through the real
 * flow as you scroll: you ask, the host says yes, and the hidden address
 * scrambles itself into place while the QR ticket drops in.
 */
export function GettingIn({ area, story, events }: AreaTypeProps) {
  const ref = useRef<HTMLElement>(null)
  const [step, setStep] = useState(0)
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  useMotionValueEvent(p, 'change', v => setStep(v < 0.3 ? 0 : v < 0.62 ? 1 : 2))
  const event = events[0]
  const free = !event || event.price === 'Free'
  const steps = [
    { k: free ? 'You ask' : 'You book', d: free ? 'Free nights are request-to-join. Tap once, the host sees who’s asking.' : 'Paid nights book instantly with UPI, plus a flat ₹50 fee.' },
    { k: free ? 'They say yes' : 'You’re confirmed', d: free ? 'Hosts can set a crowd mix and an age gate, then pick their room.' : 'The spot is yours. The host sees you on the guest list.' },
    { k: 'The door opens', d: 'The exact address, flat number and your QR ticket unlock. Until now it was just the area.' },
  ]

  return (
    <section ref={ref} className="relative bg-cream md:h-[260vh]">
      <div className="flex min-h-screen items-center px-6 py-24 md:sticky md:top-0 md:h-screen md:px-12 md:py-0 lg:px-20">
        <div className="mx-auto grid w-full max-w-[1180px] items-center gap-14 md:grid-cols-[1fr_440px]">
          <div>
            <Chapter n="05" title="Getting in" />
            <h2 className="mt-4 font-display text-[clamp(40px,5.4vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              The address is a secret
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange"> until you’re in.</span>
            </h2>
            <ol className="mt-10 space-y-5">
              {steps.map((s, i) => (
                <li key={s.k} className="flex gap-5 transition-opacity duration-500" style={{ opacity: step >= i ? 1 : 0.3 }}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full font-sans text-sm font-bold transition-colors duration-500" style={{ background: step >= i ? 'var(--color-ink)' : 'rgb(23 19 16 / .08)', color: step >= i ? 'var(--color-cream)' : undefined }}>
                    {i + 1}
                  </span>
                  <div>
                    <div className="font-display text-2xl font-extrabold tracking-[-0.035em]">{s.k}</div>
                    <div className="mt-1 max-w-[420px] font-sans text-[15px] text-ink-2">{s.d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <Invite step={step} title={event?.title ?? `A ${story.singular}`} when={event?.when} area={area.name} city={area.city.name} free={free} price={event?.price} />
        </div>
      </div>
    </section>
  )
}

function Invite({ step, title, when, area, city, free, price }: { step: number; title: string; when?: string; area: string; city: string; free: boolean; price?: string }) {
  const status = step === 0 ? (free ? 'Requested · waiting for host' : 'Booking…') : step === 1 ? (free ? 'Host said yes' : 'Confirmed') : 'You’re in'
  return (
    <motion.div layout className="relative rounded-[32px] bg-white p-6 shadow-pop md:p-7">
      <div className="flex items-center justify-between">
        <span className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Your invite</span>
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={status}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-full px-3 py-1.5 font-sans text-xs font-bold"
            style={{ background: step === 2 ? 'var(--color-orange)' : 'var(--color-cream)', color: step === 2 ? '#fff' : undefined }}
          >
            {status}
          </motion.span>
        </AnimatePresence>
      </div>
      <div className="mt-5 font-display text-[30px] font-extrabold leading-tight tracking-[-0.04em]">{title}</div>
      <div className="mt-1 font-sans text-sm font-bold text-ink-3">{[when, free ? 'Free' : price].filter(Boolean).join(' · ')}</div>

      <div className="mt-6 rounded-2xl bg-cream p-4">
        <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">Where</div>
        <div className="mt-1 font-display text-xl font-extrabold tracking-[-0.03em]">{area}, {city}</div>
        <div className="mt-1 font-mono text-[15px] text-ink-2">
          <Scramble on={step === 2} from="Unlocks when you’re in" to="Exact address unlocked ✓" />
        </div>
      </div>

      <AnimatePresence>
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, y: -24, rotate: -6, height: 0 }}
            animate={{ opacity: 1, y: 0, rotate: 0, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20 }}
            className="overflow-hidden"
          >
            <div className="mt-5 flex items-center gap-4 border-t border-dashed border-ink/15 pt-5">
              <div className="relative size-24 shrink-0">
                <Image src="/img/ticket-qr.svg" alt="" fill className="object-contain" />
              </div>
              <div>
                <div className="font-display text-lg font-extrabold tracking-[-0.03em]">Your ticket</div>
                <div className="font-sans text-sm text-ink-2">Scanned at the door. Only confirmed guests get in.</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/** Text that scrambles through random glyphs on its way between two strings. */
function Scramble({ on, from, to }: { on: boolean; from: string; to: string }) {
  const reduce = useReducedMotion()
  const [text, setText] = useState(from)
  useEffect(() => {
    const target = on ? to : from
    if (reduce) return
    let frame = 0
    const total = 18
    const id = window.setInterval(() => {
      frame++
      const done = Math.floor((frame / total) * target.length)
      setText(
        target
          .split('')
          .map((ch, k) => (k < done || ch === ' ' ? ch : GLYPHS[(k * 7 + frame * 13) % GLYPHS.length]))
          .join(''),
      )
      if (frame >= total) {
        window.clearInterval(id)
        setText(target)
      }
    }, 40)
    return () => window.clearInterval(id)
  }, [on, from, to, reduce])
  return <span className={on ? 'font-bold text-orange' : undefined}>{reduce ? (on ? to : from) : text}</span>
}
