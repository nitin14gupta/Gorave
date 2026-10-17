'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useSpring, useTransform } from 'motion/react'
import { HOST_FEES, hostEarnings, inr } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'

const MAX_GUESTS = 60

/**
 * Chapter 02, the maths. Two sliders, one number. Every guest becomes a
 * little ticket that drops into the grid; the total rolls like a meter.
 * It's an example, not a forecast.
 */
export function Earnings() {
  const [ticket, setTicket] = useState(499)
  const [guests, setGuests] = useState(20)
  const take = hostEarnings(ticket, guests)
  const gross = ticket * guests

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-start gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Chapter n="02" title="The maths" />
          <h2 className="mt-4 font-display text-[clamp(44px,5.8vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Charge what<br />the night&apos;s worth.
          </h2>
          <p className="mt-4 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">
            Paid tickets start at {inr(HOST_FEES.minTicket)}. You keep 90% of the ticket price; guests pay a flat {inr(HOST_FEES.platformFee)} platform fee on top, so it never comes out of yours. Payouts go to your UPI ID or bank.
          </p>

          <div className="mt-10 grid max-w-[480px] gap-8">
            <Slider id="calc-ticket" label="Ticket price" value={ticket} min={HOST_FEES.minTicket} max={HOST_FEES.calcMaxTicket} step={1} onChange={setTicket} display={inr(ticket)} />
            <Slider id="calc-guests" label="Guests" value={guests} min={1} max={MAX_GUESTS} step={1} onChange={setGuests} display={`${guests}`} />
          </div>

          <p className="mt-8 max-w-[460px] rounded-2xl bg-white/60 p-4 font-sans text-sm leading-relaxed text-ink-2">
            Rather keep it free? You can run up to {HOST_FEES.freePerMonth} free-entry events a month (request-to-join, no ticketing).
          </p>
        </div>

        <div className="rounded-[36px] bg-ink p-7 text-cream shadow-pop md:p-10">
          <div className="flex items-center justify-between">
            <span className="rounded-full bg-gold px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink">Example</span>
            <span className="font-sans text-xs text-noir-ink-2">Illustration only, not a forecast</span>
          </div>
          <div className="mt-6 font-sans text-sm font-bold uppercase tracking-[0.16em] text-noir-ink-2">You&apos;d keep</div>
          <Rolling value={take} />
          <div className="mt-1 font-sans text-sm text-noir-ink-2">
            {inr(ticket)} × {guests} {guests === 1 ? 'guest' : 'guests'} × 90%
          </div>

          <div className="mt-7 flex h-3 overflow-hidden rounded-full bg-noir-3">
            <div className="h-full w-[90%] bg-brand" />
            <div className="h-full flex-1 bg-noir-ink-2/50" />
          </div>
          <div className="mt-2 flex justify-between font-sans text-xs text-noir-ink-2">
            <span>You · {inr(take)}</span>
            <span>Gorave 10% · {inr(gross - take)}</span>
          </div>

          <div className="mt-8 grid grid-cols-10 gap-1.5" aria-hidden>
            <AnimatePresence initial={false}>
              {Array.from({ length: guests }, (_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -24, rotate: -20, scale: 0.6 }}
                  animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 420, damping: 22, delay: Math.min(0.3, (i % 10) * 0.015) }}
                  className="relative flex h-6 overflow-hidden rounded-[5px]"
                >
                  <span className="h-full w-[90%] bg-brand" />
                  <span className="h-full flex-1 bg-noir-ink-2/60" />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="mt-8 grid gap-1.5 border-t border-white/10 pt-5 font-sans text-sm">
            <Row k="Each guest pays" v={`${inr(ticket)} + ${inr(HOST_FEES.platformFee)} fee`} />
            <Row k="Your share per ticket" v={inr(Math.round(ticket * HOST_FEES.hostShare))} />
            <Row k="Paid out to" v="Your UPI ID or bank" />
          </div>
        </div>
      </div>
    </section>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-noir-ink-2">{k}</span>
      <span className="font-bold">{v}</span>
    </div>
  )
}

/** The total spins up/down to its new value like a taxi meter. */
function Rolling({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20 })
  const text = useTransform(spring, v => inr(Math.round(v)))
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  return (
    <motion.div className="mt-1 font-display text-[clamp(56px,7vw,104px)] font-extrabold leading-none tracking-[-0.06em] tabular-nums">
      {text}
    </motion.div>
  )
}

interface SliderProps {
  id: string
  label: string
  value: number
  min: number
  max: number
  step: number
  display: string
  onChange: (v: number) => void
}

function Slider({ id, label, value, min, max, step, display, onChange }: SliderProps) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{label}</label>
        <span className="font-display text-3xl font-extrabold tracking-[-0.04em] tabular-nums">{display}</span>
      </div>
      <div className="relative mt-3 h-10">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/10" />
        <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand" style={{ width: `${pct}%` }} />
        <motion.div
          className="pointer-events-none absolute top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-coral shadow-soft"
          style={{ left: `${pct}%` }}
          whileTap={{ scale: 1.2 }}
        />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  )
}
