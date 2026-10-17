'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from 'motion/react'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { HOST_FEES } from '@/lib/host'
import { ONE, PAYOUT_CRUMBS, rs } from './data'
import { CtaRow, EASE } from './kit'

const SHARE = Math.round(HOST_FEES.hostShare * 100)
const FACTS = ['Free to list', `Tickets from ₹${HOST_FEES.minTicket}`, `You keep ${SHARE}%`, 'Paid after the event']

/**
 * Hero: "90%" set huge with real event photos showing through the digits; the
 * cursor drifts the photo inside the letters. An example payout notice tilts
 * toward the cursor and counts up to what a ₹499 ticket pays you.
 */
export function HeroNinety({ proof, image }: { proof: string | null; image: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const mx = useMotionValue(0.5)
  const my = useMotionValue(0.5)
  const sx = useSpring(mx, { stiffness: 80, damping: 20 })
  const sy = useSpring(my, { stiffness: 80, damping: 20 })
  const bgPos = useMotionTemplate`${useTransform(sx, v => Math.round(v * 100))}% ${useTransform(sy, v => Math.round(v * 100))}%`
  const rotateY = useTransform(sx, [0, 1], [-10, 10])
  const rotateX = useTransform(sy, [0, 1], [8, -8])

  // Count the example payout up once on mount.
  const [amount, setAmount] = useState(reduce ? ONE.host : 0)
  useEffect(() => {
    if (reduce) return
    const c = animate(0, ONE.host, { duration: 1.6, delay: 0.5, ease: EASE, onUpdate: v => setAmount(v) })
    return () => c.stop()
  }, [reduce])

  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect()
    if (!r || e.pointerType !== 'mouse') return
    mx.set((e.clientX - r.left) / r.width)
    my.set((e.clientY - r.top) / r.height)
  }

  return (
    <section ref={ref} onPointerMove={onMove} className="relative overflow-hidden bg-cream px-6 pb-20 pt-28 md:px-20 md:pb-28">
      <Breadcrumbs crumbs={PAYOUT_CRUMBS} />
      <div className="mx-auto mt-8 grid max-w-[1280px] items-center gap-12 lg:grid-cols-[1fr_1.1fr]">
        <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: EASE }}>
          <h1 className="font-display text-[clamp(52px,7vw,104px)] font-extrabold leading-[0.9] tracking-[-0.06em]">
            You throw the night.<br />
            <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">We handle the money.</span>
          </h1>
          <p className="mt-6 max-w-[480px] font-sans text-xl leading-relaxed text-ink-2">
            Guests pay in the app. After the night, your {SHARE}% lands in your UPI or bank account. No chasing anyone for money.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {FACTS.map((f, i) => (
              <motion.span
                key={f}
                initial={reduce ? false : { opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.07, ease: EASE }}
                className="rounded-full bg-white px-4 py-2 font-sans text-sm font-bold shadow-soft"
              >
                {f}
              </motion.span>
            ))}
          </div>
          <CtaRow className="mt-8" />
          {proof && <p className="mt-5 font-sans text-sm font-bold text-ink-3">{proof}</p>}
        </motion.div>

        <div className="relative" style={{ perspective: 1200 }}>
          <motion.div
            aria-hidden
            initial={reduce ? false : { opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: EASE }}
            className="select-none bg-clip-text text-center font-display text-[clamp(140px,19vw,300px)] font-extrabold leading-[0.82] tracking-[-0.07em] text-transparent"
            style={{ backgroundImage: `url(${image})`, backgroundSize: '160% auto', backgroundPosition: bgPos }}
          >
            90%
          </motion.div>

          <motion.div
            initial={reduce ? false : { opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: EASE }}
            style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
            className="relative mx-auto -mt-6 w-[min(360px,92%)] rounded-[24px] bg-white p-5 shadow-pop md:-mt-10"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-cream px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-2">Example payout</span>
              <span className="font-sans text-xs font-bold text-ink-3">after the event</span>
            </div>
            <div className="mt-4 font-display text-[44px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{rs(amount)}</div>
            <div className="mt-1 font-sans text-sm text-ink-2">sent to yourname@upi</div>
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-ink/10 pt-3 font-sans text-[12px]">
              <div><div className="font-bold">{rs(ONE.ticket)}</div><div className="text-ink-3">ticket</div></div>
              <div><div className="font-bold">−{rs(ONE.commission)}</div><div className="text-ink-3">Gorave 10%</div></div>
              <div><div className="font-bold text-orange">{rs(ONE.host)}</div><div className="text-ink-3">yours</div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
