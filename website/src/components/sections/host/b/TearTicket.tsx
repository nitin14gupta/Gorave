'use client'

import { useRef } from 'react'
import { motion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { HOST_FEES, inr } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { TicketCard } from '@/components/ui/TicketCard'

const EXAMPLE = 500

/**
 * TicketCard's perforation sits 260 design-px down its 260px-wide layout, so
 * at any width it's at `width` px. The tear follows it with a zigzag edge.
 */
function tear(w: number, half: 'top' | 'bottom') {
  const teeth = 18
  const zig = Array.from({ length: teeth + 1 }, (_, k) => {
    const x = (k / teeth) * w
    return `${x.toFixed(1)}px ${w + (k % 2 ? 6 : -6)}px`
  })
  return half === 'top'
    ? `polygon(0 0, ${w}px 0, ${zig.reverse().join(', ')})`
    : `polygon(${zig.join(', ')}, ${w}px 3000px, 0 3000px)`
}

/**
 * Chapter 02 — the split. One giant ticket. Scroll and it tears along the
 * perforation: the big half is yours, the stub is Gorave's 10%. The ₹50
 * platform fee arrives separately — it's the guest's, not yours.
 */
export function TearTicket() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.75', 'end 0.85'] })
  const p = useSpring(useTransform(scrollYProgress, [0.15, 0.6], [0, 1]), { stiffness: 120, damping: 18 })
  const labels = useTransform(p, [0.55, 1], [0, 1])

  return (
    <section ref={ref} className="relative bg-noir-2 text-noir-ink md:h-[240vh]">
      <div className="grid items-center gap-12 overflow-hidden px-6 py-24 md:sticky md:top-0 md:h-screen md:grid-cols-[1fr_1fr] md:px-20 md:py-0">
        <div className="mx-auto w-full max-w-[540px]">
          <Chapter n="02" title="The split" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Tear it.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">Keep the big half.</span>
          </h2>
          <p className="mt-4 max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Paid tickets start at {inr(HOST_FEES.minTicket)} and book instantly with UPI or wallet. You keep 90% of the ticket price. The {inr(HOST_FEES.platformFee)} platform fee is added on the guest&apos;s side, never taken from yours.
          </p>
          <div className="mt-8 max-w-[440px] rounded-2xl bg-noir-3 p-5 font-sans text-sm">
            <div className="mb-3 inline-block rounded-full bg-gold px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-ink">Example</div>
            <Line k="Ticket price" v={inr(EXAMPLE)} />
            <Line k="You keep (90%)" v={inr(EXAMPLE * HOST_FEES.hostShare)} strong />
            <Line k="Gorave commission (10%)" v={inr(EXAMPLE * (1 - HOST_FEES.hostShare))} />
            <Line k="Guest pays" v={`${inr(EXAMPLE)} + ${inr(HOST_FEES.platformFee)} fee`} />
          </div>
        </div>

        <div className="relative flex justify-center py-10">
          <div className="hidden md:block"><Torn w={360} p={p} labels={labels} /></div>
          <div className="md:hidden"><Torn w={260} p={p} labels={labels} /></div>
        </div>
      </div>
    </section>
  )
}

function Line({ k, v, strong }: { k: string; v: string; strong?: boolean }) {
  return (
    <div className="flex justify-between border-b border-white/5 py-1.5 last:border-0">
      <span className="text-noir-ink-2">{k}</span>
      <span className={strong ? 'font-bold text-green' : 'font-bold'}>{v}</span>
    </div>
  )
}

function Torn({ w, p, labels }: { w: number; p: MotionValue<number>; labels: MotionValue<number> }) {
  const topY = useTransform(p, [0, 1], [0, -w * 0.12])
  const topX = useTransform(p, [0, 1], [0, -w * 0.08])
  const topR = useTransform(p, [0, 1], [0, -7])
  const botY = useTransform(p, [0, 1], [0, w * 0.32])
  const botX = useTransform(p, [0, 1], [0, w * 0.14])
  const botR = useTransform(p, [0, 1], [0, 9])
  const feeY = useTransform(labels, [0, 1], [-40, 0])
  const ticket = (
    <TicketCard width={w} title="Your night, your door" admission={`General Admission · ${inr(EXAMPLE)}`} date="Saturday" time="9:00 PM IST" backdrop="var(--color-noir-2)" />
  )
  return (
    <div className="relative" style={{ width: w }}>
      <motion.div style={{ x: topX, y: topY, rotate: topR, clipPath: tear(w, 'top'), transformOrigin: '20% 100%' }} className="relative z-10">
        {ticket}
        <motion.div style={{ opacity: labels }} className="absolute left-4 top-4 rounded-full bg-green px-3.5 py-1.5 font-sans text-sm font-bold text-noir shadow-pop">
          90% · yours
        </motion.div>
      </motion.div>
      <motion.div style={{ x: botX, y: botY, rotate: botR, clipPath: tear(w, 'bottom'), transformOrigin: '80% 0%' }} className="absolute inset-x-0 top-0" aria-hidden>
        {ticket}
        <motion.div style={{ opacity: labels }} className="absolute -bottom-12 right-2 rounded-full bg-noir-ink px-3.5 py-1.5 font-sans text-sm font-bold text-ink shadow-pop">
          10% · Gorave
        </motion.div>
      </motion.div>
      <motion.div style={{ opacity: labels, y: feeY }} className="absolute -right-6 -top-10 z-20 rotate-6 rounded-xl border border-dashed border-gold/60 bg-noir px-3 py-2 font-sans text-xs font-bold text-gold">
        + {inr(HOST_FEES.platformFee)} fee · paid by the guest
      </motion.div>
    </div>
  )
}
