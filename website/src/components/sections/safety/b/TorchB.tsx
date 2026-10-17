'use client'

import Image from 'next/image'
import { useState } from 'react'
import { motion, useMotionTemplate, useMotionValue, useSpring } from 'motion/react'
import { DEMO_EVENT } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

/**
 * Chapter 02, two views. One event card, two audiences. The card shows what a
 * stranger sees; move the torch over it (or tap, on touch) and the guest's
 * view shows through inside the beam. "Light it all" swaps the whole card.
 */
export function TorchB() {
  const mx = useMotionValue(30)
  const my = useMotionValue(55)
  const x = useSpring(mx, { stiffness: 160, damping: 24 })
  const y = useSpring(my, { stiffness: 160, damping: 24 })
  const [full, setFull] = useState(false)
  const radius = useSpring(150, { stiffness: 90, damping: 20 })
  const mask = useMotionTemplate`radial-gradient(circle ${radius}px at ${x}% ${y}%, #000 0%, #000 55%, transparent 100%)`

  function onMove(e: React.PointerEvent<HTMLDivElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set(((e.clientX - r.left) / r.width) * 100)
    my.set(((e.clientY - r.top) / r.height) * 100)
  }
  function toggle() {
    const next = !full
    setFull(next)
    radius.set(next ? 1400 : 150)
  }

  return (
    <section className="relative overflow-hidden bg-noir-2 px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid gap-8 lg:grid-cols-[1fr_1fr] lg:items-end">
          <div>
            <Chapter n="02" title="Two views" dark />
            <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
              What strangers see.<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">What guests see.</span>
            </h2>
          </div>
          <div>
            <p className="max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
              The public listing stops at the area. Shine the torch on the card to see what unlocks once a host accepts you, or once you book.
            </p>
            <button
              type="button"
              aria-pressed={full}
              onClick={toggle}
              className={cn('mt-6 rounded-full px-5 py-3 font-sans text-sm font-bold transition-colors', full ? 'bg-green text-noir' : 'bg-noir-3 text-noir-ink hover:bg-noir')}
            >
              {full ? '✓ Showing the guest view' : 'Light it all'}
            </button>
          </div>
        </div>

        <div
          onPointerMove={onMove}
          onPointerDown={onMove}
          className="relative mx-auto mt-14 max-w-[880px] cursor-crosshair select-none overflow-hidden rounded-[32px]"
        >
          <Card guest={false} />
          <motion.div className="absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }} aria-hidden>
            <Card guest />
          </motion.div>
        </div>
        <div className="mt-4 text-center font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2/70">
          <span className="hidden md:inline">Move your cursor over the card</span>
          <span className="md:hidden">Tap the card to move the torch</span>
        </div>
      </div>
    </section>
  )
}

function Row({ label, value, locked, guest }: { label: string; value: string; locked?: boolean; guest: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-t border-white/10 py-4">
      <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-noir-ink-2">{label}</div>
      <div className={cn('text-right font-sans text-[15px] font-bold md:text-lg', locked && !guest && 'text-noir-ink-2', locked && guest && 'text-green')}>{value}</div>
    </div>
  )
}

function Card({ guest }: { guest: boolean }) {
  return (
    <div className={cn('grid gap-8 p-7 md:grid-cols-[1fr_1.1fr] md:p-10', guest ? 'bg-[#0f1f19]' : 'bg-noir-3')}>
      <div className="flex flex-col">
        <div className={cn('inline-flex w-fit rounded-full px-3 py-1.5 font-sans text-[11px] font-bold uppercase tracking-[0.16em]', guest ? 'bg-green text-noir' : 'bg-white/10 text-noir-ink-2')}>
          {guest ? 'Guest view · confirmed' : 'Stranger view · public'}
        </div>
        <div className="mt-5 font-display text-[clamp(28px,3.4vw,44px)] font-extrabold leading-[0.95] tracking-[-0.04em]">{DEMO_EVENT.title}</div>
        <div className="mt-2 font-sans text-noir-ink-2">{DEMO_EVENT.when} · Rooftop · 50:50 · 21+</div>
        <div className="mt-auto pt-8">
          {guest ? (
            <div className="flex items-center gap-4">
              <div className="grid size-[92px] place-items-center rounded-2xl bg-[#F7F3EC] p-2">
                <Image src="/img/ticket-qr.svg" alt="" width={80} height={80} unoptimized className="size-full" />
              </div>
              <div className="font-sans text-sm text-noir-ink-2">
                <div className="font-bold text-noir-ink">Your ticket</div>
                The host scans this at the door.
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-white/20 p-4 font-sans text-sm text-noir-ink-2">
              Request to join to see more. The host checks your profile first.
            </div>
          )}
        </div>
      </div>
      <div>
        <Row guest={guest} label="Area" value={DEMO_EVENT.area} />
        <Row guest={guest} locked label="Address" value={guest ? DEMO_EVENT.address : 'Hidden'} />
        <Row guest={guest} locked label="Flat" value={guest ? DEMO_EVENT.flat : 'Hidden'} />
        <Row guest={guest} locked label="Street" value={guest ? DEMO_EVENT.street : '~1 km circle on the map'} />
        <Row guest={guest} locked label="Entry" value={guest ? 'QR check-in' : 'Confirmed guests only'} />
      </div>
    </div>
  )
}
