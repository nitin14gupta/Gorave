'use client'

import { useState } from 'react'
import { motion } from 'motion/react'
import { DEMO_EVENT } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const

// Deterministic gibberish of the same shape as the real text (no hydration drift).
function glyph(ch: string, i: number) {
  if (!/[a-z0-9]/i.test(ch)) return ch
  if (/[0-9]/.test(ch)) return String((ch.charCodeAt(0) * 3 + i * 7) % 10)
  const c = String.fromCharCode(97 + ((ch.charCodeAt(0) * 7 + i * 13) % 26))
  return ch === ch.toUpperCase() ? c.toUpperCase() : c
}

/** One line of the address: scrambled and blurred while locked, resolving letter by letter when it opens. */
function Resolve({ text, open, delay = 0, className }: { text: string; open: boolean; delay?: number; className?: string }) {
  return (
    <div className={className} aria-label={open ? text : 'Hidden until you’re confirmed'}>
      {Array.from(text).map((ch, i) => {
        const t = { duration: 0.35, ease: EASE, delay: open ? delay + i * 0.022 : i * 0.006 }
        return (
          <span key={i} aria-hidden className="relative inline-block whitespace-pre">
            <motion.span className="inline-block" initial={false} animate={{ opacity: open ? 1 : 0, filter: open ? 'blur(0px)' : 'blur(6px)' }} transition={t}>
              {ch}
            </motion.span>
            <motion.span className="absolute left-0 top-0 inline-block" initial={false} animate={{ opacity: open ? 0 : 0.55, filter: open ? 'blur(4px)' : 'blur(3.5px)' }} transition={t}>
              {glyph(ch, i)}
            </motion.span>
          </span>
        )
      })}
    </div>
  )
}

const STREETS = [
  'M0 70 C80 60 160 90 240 76 S360 60 400 66',
  'M0 176 C90 186 170 160 260 172 S360 196 400 186',
  'M120 0 C126 60 110 140 128 260',
  'M286 0 C280 70 300 150 290 260',
  'M0 240 L400 214',
  'M40 0 L70 260',
]

/**
 * Chapter 02 — the address. A demo event card: to the public the map is a
 * wide circle and the address is noise. Flip it to "confirmed" and the
 * circle closes onto a pin while the address resolves, letter by letter.
 */
export function AddressA() {
  const [open, setOpen] = useState(false)

  return (
    <section className="overflow-hidden bg-paper px-6 py-24 md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1fr_1.1fr]">
        <div>
          <Chapter n="02" title="The address" />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            The flat number<br />is for <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">guests.</span>
          </h2>
          <p className="mt-5 max-w-[460px] font-sans text-lg leading-relaxed text-ink-2">
            Anyone browsing sees the area and a rough circle on the map, about a kilometre across. The exact address and flat number unlock only once you&apos;re confirmed.
          </p>

          <div role="radiogroup" aria-label="Demo state" className="relative mt-9 inline-flex rounded-full bg-cream p-1.5">
            {[false, true].map(v => (
              <button
                key={String(v)}
                type="button"
                role="radio"
                aria-checked={open === v}
                onClick={() => setOpen(v)}
                className={cn('relative rounded-full px-5 py-3 font-sans text-sm font-bold transition-colors', open === v ? 'text-cream' : 'text-ink-2 hover:text-ink')}
              >
                {open === v && <motion.span layoutId="addr-a-pill" className="absolute inset-0 rounded-full bg-ink" transition={{ type: 'spring', stiffness: 380, damping: 32 }} />}
                <span className="relative">{v ? 'Request accepted' : 'Just browsing'}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">Demo · tap to switch</div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 40, rotate: 2 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="overflow-hidden rounded-[32px] bg-white shadow-pop"
        >
          <div className="relative aspect-[400/260] bg-[#efe7d6]">
            <svg viewBox="0 0 400 260" className="absolute inset-0 size-full" aria-hidden>
              <rect x={150} y={96} width={110} height={56} rx={6} fill="#dce8d6" />
              <path d="M330 0 C350 80 340 180 400 260 L400 0 Z" fill="#dce6f2" />
              {STREETS.map(d => <path key={d} d={d} fill="none" stroke="#fff" strokeWidth={7} strokeLinecap="round" />)}
              <motion.circle
                initial={false}
                animate={open ? { r: 16, cx: 236, cy: 118, fillOpacity: 0 } : { r: 92, cx: 196, cy: 126, fillOpacity: 0.18 }}
                transition={{ duration: 0.9, ease: EASE }}
                fill="#FF6B35" stroke="#FF6B35" strokeWidth={2} strokeDasharray="5 5"
              />
              <motion.g initial={false} animate={{ opacity: open ? 1 : 0, y: open ? 0 : -30 }} transition={{ duration: 0.5, ease: EASE, delay: open ? 0.6 : 0 }}>
                <path d="M236 118 C226 106 222 98 222 92 A14 14 0 0 1 250 92 C250 98 246 106 236 118 Z" fill="#FF3864" />
                <circle cx={236} cy={92} r={5} fill="#fff" />
              </motion.g>
            </svg>
            <motion.div
              initial={false}
              animate={{ opacity: open ? 0 : 1 }}
              className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 font-sans text-xs font-bold text-ink shadow-soft backdrop-blur"
            >
              Approximate area · ~1 km
            </motion.div>
          </div>

          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">{DEMO_EVENT.when}</div>
                <div className="mt-1 font-display text-2xl font-extrabold tracking-[-0.03em]">{DEMO_EVENT.title}</div>
                <div className="font-sans text-[15px] text-ink-2">{DEMO_EVENT.area}</div>
              </div>
              <Lock open={open} />
            </div>

            <div className="mt-5 rounded-2xl bg-cream p-4 font-sans">
              <Resolve text={DEMO_EVENT.address} open={open} className="font-display text-xl font-extrabold tracking-[-0.02em]" />
              <Resolve text={DEMO_EVENT.flat} open={open} delay={0.3} className="mt-0.5 text-[15px] font-bold text-ink-2" />
              <Resolve text={DEMO_EVENT.street} open={open} delay={0.55} className="text-[15px] text-ink-2" />
            </div>
            <div className="relative mt-3 h-5 font-sans text-sm font-bold">
              <motion.span initial={false} animate={{ opacity: open ? 1 : 0 }} className="absolute text-[#00865f]">✓ You&apos;re confirmed — address unlocked</motion.span>
              <motion.span initial={false} animate={{ opacity: open ? 0 : 1 }} className="text-ink-3">Exact address after you&apos;re in</motion.span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

function Lock({ open }: { open: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ backgroundColor: open ? '#00C48C' : '#171310' }}
      className="grid size-12 shrink-0 place-items-center rounded-2xl"
    >
      <svg viewBox="0 0 24 24" className="size-6 overflow-visible" aria-hidden>
        <motion.path
          d="M8 11 V8 a4 4 0 0 1 8 0 V11"
          fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"
          initial={false}
          animate={{ y: open ? -4 : 0, rotate: open ? -18 : 0 }}
          style={{ originX: 1, originY: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 16 }}
        />
        <rect x={5.5} y={11} width={13} height={9} rx={2.4} fill="#fff" />
      </svg>
    </motion.div>
  )
}
