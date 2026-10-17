'use client'

import { useRef, useState } from 'react'
import { motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { HOST_FEES, inr } from '@/lib/host'
import { cn } from '@/lib/cn'
import { ONE, rs } from '../data'
import { EASE, Head } from '../kit'
import { Teeth } from './Teeth'

// The receipt's lines, in print order, each with the scroll point it prints at.
const LINES = [
  { at: 0.1, k: 'Ticket price', note: 'You set it, from ₹99', v: rs(ONE.ticket) },
  { at: 0.2, k: 'Platform fee', note: 'Added for the guest, on top', v: `+${rs(ONE.fee)}` },
  { at: 0.3, k: 'Guest pays', note: 'UPI or Gorave Wallet', v: rs(ONE.guestPays), total: true },
  { at: 0.42, k: 'Platform fee', note: "The guest's, not yours", v: `-${rs(ONE.fee)}` },
  { at: 0.52, k: 'Gorave commission', note: '10% of the ticket', v: `-${rs(ONE.commission)}` },
] as const

const TEAR = [0.72, 0.84]
const STAMP = [0.84, 0.92]

const STEPS = [
  { at: 0, title: 'You set the price', body: `Paid tickets start at ${inr(HOST_FEES.minTicket)}. This example is ${inr(ONE.ticket)}.` },
  { at: 0.2, title: 'The guest adds the fee', body: `A flat ${inr(HOST_FEES.platformFee)} platform fee goes on top at checkout. Guests pay with UPI (GPay, PhonePe and so on) or their Gorave Wallet.` },
  { at: 0.42, title: 'Gorave takes 10%', body: `Our commission is ${rs(ONE.commission)} on this ticket. The guest's fee comes off too, since it was never part of your price.` },
  { at: 0.6, title: 'You keep 90%', body: `${rs(ONE.host)}, every time someone books at this price.` },
  { at: 0.84, title: 'Paid after the event', body: 'Gorave transfers your share to your UPI ID or bank account automatically, once the night is done.' },
]

/**
 * Chapter 01, the receipt. Pinned on desktop: a giant paper slip feeds out
 * of the printer as you scroll, one line at a time, then the "you keep"
 * stub tears off and gets stamped. On phones it prints as it comes into view.
 */
export function ReceiptPrint() {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [on, setOn] = useState(0)
  useMotionValueEvent(p, 'change', v => setOn(STEPS.filter(s => v >= s.at).length - 1))
  const done = useMotionValue(1)

  const head = <Head n="02" label="The receipt" title="One ticket," serif="itemised." />

  return (
    <div id="receipt">
      <section ref={ref} className="relative hidden bg-cream motion-safe:lg:block motion-safe:lg:h-[460vh]">
        <div className="sticky top-0 flex h-screen items-center overflow-hidden px-20">
          <div className="mx-auto grid w-full max-w-[1280px] grid-cols-[1fr_minmax(0,1fr)] items-center gap-16">
            <div>
              {head}
              <ol className="mt-12 grid gap-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="grid grid-cols-[48px_1fr] items-start gap-3">
                    <span className={cn('mt-3 h-[2px] rounded-full transition-all duration-500', i === on ? 'w-12 bg-brand' : i < on ? 'w-6 bg-ink' : 'w-6 bg-ink/15')} />
                    <div>
                      <div className={cn('font-display text-[22px] font-extrabold tracking-[-0.03em] transition-colors duration-500', i === on ? 'text-ink' : 'text-ink-3/70')}>{s.title}</div>
                      <div
                        className="grid font-sans text-[15px] leading-relaxed text-ink-2 transition-[grid-template-rows,opacity] duration-500 ease-out-expo"
                        style={{ gridTemplateRows: i === on ? '1fr' : '0fr', opacity: i === on ? 1 : 0 }}
                      >
                        <p className="overflow-hidden">{s.body}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <Printer p={p} />
          </div>
        </div>
      </section>

      {/* Phones, tablets and reduced motion: the whole slip, printing in view */}
      <section className="bg-cream px-6 py-24 md:px-12 motion-safe:lg:hidden">
        <div className="mx-auto max-w-[680px]">
          {head}
          <motion.div initial={reduce ? false : 'hide'} whileInView="show" viewport={{ once: true, margin: '-80px' }} className="mx-auto mt-10 max-w-[420px]">
            <motion.div
              variants={{ hide: { clipPath: 'inset(-20px -40px 100% -40px)' }, show: { clipPath: 'inset(-20px -40px -20% -40px)' } }}
              transition={{ duration: 1.4, ease: EASE }}
            >
              <Slip p={done} still />
            </motion.div>
          </motion.div>
          <ol className="mt-10 grid gap-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="font-serif text-xl italic text-orange">0{i + 1}</span>
                <div>
                  <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{s.title}</div>
                  <p className="font-sans text-[15px] leading-relaxed text-ink-2">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  )
}

function Printer({ p }: { p: MotionValue<number> }) {
  const feed = useTransform(p, [0.02, 0.66], [-30, 0])
  const clip = useTransform(p, [0.02, 0.66], [94, -24], { clamp: true })
  const clipPath = useTransform(clip, v => `inset(-30px -60px ${Math.round(v * 10) / 10}% -60px)`)
  return (
    <div className="relative mx-auto w-[min(34vw,440px)]">
      <div className="relative z-10 rounded-[30px] bg-white px-7 pb-5 pt-6 shadow-pop">
        <div className="flex items-center justify-between">
          <span className="font-display text-xl font-extrabold tracking-[-0.03em]">Gorave</span>
          <span className="rounded-full bg-gold px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-ink">Example</span>
        </div>
        <div className="mt-5 h-3.5 rounded-full bg-ink/85 shadow-[inset_0_2px_4px_rgb(0_0_0/0.4)]" />
      </div>
      <motion.div className="relative -mt-3 px-6" style={{ clipPath, y: feed }}>
        <Slip p={p} />
      </motion.div>
    </div>
  )
}

/** The paper itself. Lines ink in as `p` passes them; the stub tears at the end. */
function Slip({ p, still }: { p: MotionValue<number>; still?: boolean }) {
  const tearY = useTransform(p, TEAR, [0, 36])
  const tearR = useTransform(p, TEAR, [0, 4])
  const tearX = useTransform(p, TEAR, [0, 14])
  const stampS = useTransform(p, STAMP, [1.8, 1])
  const stampO = useTransform(p, [STAMP[0], STAMP[0] + 0.03], [0, 1])

  return (
    <div className="font-mono text-ink">
      <div className="bg-white px-6 pb-3 pt-7 shadow-soft">
        <div className="text-center">
          <div className="font-display text-2xl font-extrabold tracking-[-0.04em]">GORAVE</div>
          <div className="mt-1 text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3">Example night · 1 ticket</div>
        </div>
        <div className="my-3 border-t border-dashed border-ink/30" />
        {LINES.map((l, i) => (
          <Line key={i} p={p} at={l.at} still={still}>
            <div className={cn('flex items-baseline justify-between gap-4 py-1.5', 'total' in l && 'mt-1 border-t border-dashed border-ink/30 pt-2.5 font-bold')}>
              <div>
                <div className="text-[14px]">{l.k}</div>
                <div className="font-sans text-[12px] text-ink-3">{l.note}</div>
              </div>
              <div className="text-[15px] tabular-nums">{l.v}</div>
            </div>
          </Line>
        ))}
        <div className="mt-3 border-t-2 border-double border-ink/40" />
        <div className="mt-3 text-center text-[11px] uppercase tracking-[0.2em] text-ink-3">- - - tear here - - -</div>
      </div>

      {/* The stub that tears off */}
      <motion.div style={still ? { rotate: 2, y: 10 } : { y: tearY, rotate: tearR, x: tearX }} className="relative origin-top-left">
        <Teeth flip className="-mb-px text-white" />
        <div className="relative bg-white px-6 pb-5 pt-3 shadow-pop">
          <div className="text-[12px] font-bold uppercase tracking-[0.2em] text-ink-3">You keep · 90%</div>
          <div className="mt-1 font-display text-[clamp(40px,4vw,56px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{rs(ONE.host)}</div>
          <div className="mt-2 font-sans text-[13px] text-ink-2">To your UPI ID or bank, after the event</div>
          <div className="mt-4 flex h-8 gap-[3px] opacity-70" aria-hidden>
            {BARS.map((w, i) => <span key={i} className="h-full bg-ink" style={{ width: w }} />)}
          </div>
          <motion.div
            style={still ? undefined : { scale: stampS, opacity: stampO }}
            className="absolute bottom-4 right-5 -rotate-12 rounded-xl bg-white/80 border-[3px] border-coral px-3 py-1.5 text-center font-sans text-[11px] font-extrabold uppercase leading-tight tracking-[0.14em] text-coral"
          >
            Paid out
            <br />
            after the event
          </motion.div>
        </div>
        <Teeth className="text-white" />
      </motion.div>
    </div>
  )
}

// A fixed barcode, so server and client agree.
const BARS = [2, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 2, 3, 1, 1, 2, 1, 3, 2, 1, 2, 1, 3, 1, 2, 2, 1, 1, 3, 1, 2, 1]

function Line({ p, at, still, children }: { p: MotionValue<number>; at: number; still?: boolean; children: React.ReactNode }) {
  const opacity = useTransform(p, [at - 0.04, at], [0, 1])
  const x = useTransform(p, [at - 0.04, at], [-8, 0])
  return <motion.div style={still ? undefined : { opacity, x }}>{children}</motion.div>
}
