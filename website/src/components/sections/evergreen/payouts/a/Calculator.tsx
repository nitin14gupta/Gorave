'use client'

import { useEffect, useState } from 'react'
import { motion, useSpring, useTransform } from 'motion/react'
import { HOST_FEES, inr } from '@/lib/host'
import { cn } from '@/lib/cn'
import { LINKS, paise, rs } from '../data'
import { ArrowLink, Head, r2 } from '../kit'

const MAX_GUESTS = 60
const PRESETS = [99, 299, 499, 999]

/**
 * Chapter 02, your numbers. Two sliders; one ribbon shows the whole night's
 * money split three ways: yours, Gorave's 10%, and the guests' own fee on
 * top. Clearly an example, never a forecast.
 */
export function Calculator() {
  const [ticket, setTicket] = useState(499)
  const [guests, setGuests] = useState(20)
  const gross = ticket * guests
  const mine = paise(gross * HOST_FEES.hostShare)
  const cut = paise(gross - mine)
  const fees = HOST_FEES.platformFee * guests
  const total = gross + fees
  const w = (n: number) => `${r2((n / total) * 100)}%`

  return (
    <section className="relative overflow-hidden bg-cream px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Head
          n="03"
          label="Your numbers"
          title="Price the night,"
          serif="see your share."
          aside={<>Move the sliders. Tickets start at {inr(HOST_FEES.minTicket)}, and the {inr(HOST_FEES.platformFee)} guest fee is always on top of your price.</>}
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="grid gap-9 rounded-[32px] bg-white/60 p-6 md:p-8">
            <Slider id="pay-ticket" label="Ticket price" value={ticket} min={HOST_FEES.minTicket} max={HOST_FEES.calcMaxTicket} onChange={setTicket} display={inr(ticket)} />
            <div className="-mt-5 flex flex-wrap gap-2">
              {PRESETS.map(v => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTicket(v)}
                  className={cn(
                    'rounded-full px-3.5 py-1.5 font-sans text-[13px] font-bold transition-colors',
                    ticket === v ? 'bg-ink text-cream' : 'bg-white text-ink-2 hover:text-ink',
                  )}
                >
                  {inr(v)}
                </button>
              ))}
            </div>
            <Slider id="pay-guests" label="Guests" value={guests} min={1} max={MAX_GUESTS} onChange={setGuests} display={`${guests}`} />
            <ArrowLink href={LINKS.pricing}>How to price your first night</ArrowLink>
          </div>

          <div className="rounded-[36px] bg-white p-6 shadow-pop md:p-10">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-gold px-3 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink">Example</span>
              <span className="font-sans text-xs text-ink-3">Illustration only, not a forecast</span>
            </div>
            <div className="mt-6 font-sans text-sm font-bold uppercase tracking-[0.16em] text-ink-3">Your payout, after the event</div>
            <Rolling value={mine} />
            <div className="mt-1 font-sans text-sm text-ink-2">
              {inr(ticket)} × {guests} {guests === 1 ? 'guest' : 'guests'} × 90%
            </div>

            {/* The ribbon: everything guests pay, split by who it's for */}
            <div className="mt-9">
              <div className="flex justify-between font-sans text-xs font-bold text-ink-3">
                <span>Guests pay in total</span>
                <span className="tabular-nums">{rs(total)}</span>
              </div>
              <div className="mt-2 flex h-14 overflow-hidden rounded-2xl" aria-hidden>
                <Seg width={w(mine)} className="bg-brand text-white" label="You" />
                <Seg width={w(cut)} className="bg-cream-deep text-ink" label="10%" />
                <Seg width={w(fees)} className="bg-sky text-sky-ink [background-image:repeating-linear-gradient(135deg,transparent_0_6px,rgb(255_255_255/0.5)_6px_9px)]" label="Fee" />
              </div>
            </div>

            <dl className="mt-7 grid gap-3 font-sans text-sm sm:grid-cols-3">
              <Stat dot="bg-brand" k="You keep" v={rs(mine)} note="90% of tickets" />
              <Stat dot="bg-cream-deep" k="Gorave's 10%" v={rs(cut)} note="Our commission" />
              <Stat dot="bg-sky" k="Guest fees" v={rs(fees)} note={`${inr(HOST_FEES.platformFee)} each, paid by them`} />
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}

function Seg({ width, className, label }: { width: string; className: string; label: string }) {
  return (
    <div className={cn('grid min-w-0 place-items-center overflow-hidden font-sans text-xs font-bold transition-[width] duration-500 ease-out-expo', className)} style={{ width }}>
      <span className="truncate px-1">{label}</span>
    </div>
  )
}

function Stat({ dot, k, v, note }: { dot: string; k: string; v: string; note: string }) {
  return (
    <div className="rounded-2xl bg-paper p-4">
      <dt className="flex items-center gap-2 text-ink-2"><span className={cn('size-2.5 rounded-full', dot)} />{k}</dt>
      <dd className="mt-1 font-display text-xl font-extrabold tracking-[-0.03em] tabular-nums">{v}</dd>
      <dd className="text-xs text-ink-3">{note}</dd>
    </div>
  )
}

/** The payout rolls to its new value like a meter. */
function Rolling({ value }: { value: number }) {
  const spring = useSpring(value, { stiffness: 90, damping: 20 })
  const text = useTransform(spring, v => rs(v))
  useEffect(() => {
    spring.set(value)
  }, [spring, value])
  return (
    <motion.div aria-live="polite" className="mt-1 font-display text-[clamp(44px,5.6vw,88px)] font-extrabold leading-none tracking-[-0.06em] tabular-nums">
      {text}
    </motion.div>
  )
}

function Slider({ id, label, value, min, max, display, onChange }: {
  id: string
  label: string
  value: number
  min: number
  max: number
  display: string
  onChange: (v: number) => void
}) {
  const at = r2(((value - min) / (max - min)) * 100)
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{label}</label>
        <span className="font-display text-3xl font-extrabold tracking-[-0.04em] tabular-nums">{display}</span>
      </div>
      <div className="relative mt-3 h-10">
        <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-ink/10" />
        <div className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-brand" style={{ width: `${at}%` }} />
        <div className="pointer-events-none absolute top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-coral shadow-soft" style={{ left: `${at}%` }} />
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
    </div>
  )
}
