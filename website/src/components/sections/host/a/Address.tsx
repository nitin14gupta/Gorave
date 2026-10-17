'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useScroll, useTransform } from 'motion/react'
import { PHOTOS } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EXACT = 'Terrace, Sea Breeze Apts, Carter Rd'
const GLYPHS = '#%&@$*+=?/<>{}[]'

/** Deterministic scramble, characters past the reveal point cycle through glyphs. */
function scramble(text: string, reveal: number, tick: number) {
  const cut = Math.floor(reveal * text.length)
  return text
    .split('')
    .map((ch, i) => (ch === ' ' || ch === ',' || i < cut ? ch : GLYPHS[(i * 7 + tick) % GLYPHS.length]))
    .join('')
}

/**
 * Chapter 04, the address. Everyone browsing sees the area; scroll to
 * "confirm" a guest and the exact address decodes letter by letter while the
 * map's blurry circle tightens into a pin.
 */
export function Address() {
  const ref = useRef<HTMLElement>(null)
  const [p, setP] = useState(0)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.6', 'end 1'] })
  useMotionValueEvent(scrollYProgress, 'change', v => setP(Math.round(v * 120) / 120))
  const radius = useTransform(scrollYProgress, [0.15, 0.7], [150, 14])
  const blur = useTransform(scrollYProgress, [0.15, 0.7], [10, 0])
  const filter = useTransform(blur, b => `blur(${b}px) saturate(${1 - b / 20})`)

  const reveal = Math.min(1, Math.max(0, (p - 0.3) / 0.45))
  const confirmed = reveal >= 1
  const tick = Math.floor(p * 60)

  return (
    <section ref={ref} className="relative bg-noir text-noir-ink md:h-[230vh]">
      <div className="grid items-center gap-14 px-6 py-24 md:sticky md:top-0 md:h-screen md:grid-cols-[1fr_1fr] md:px-20 md:py-0">
        <div className="mx-auto w-full max-w-[560px]">
          <Chapter n="04" title="The address" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Your address<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">stays yours.</span>
          </h2>
          <p className="mt-4 max-w-[440px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Anyone browsing sees the area. Only guests you&apos;ve confirmed get the exact address, and every one of them is phone-verified and 18+.
          </p>
          <div className="mt-8 flex gap-2 font-sans text-sm font-bold">
            <span className={cn('rounded-full px-4 py-2 transition-colors duration-500', !confirmed ? 'bg-noir-ink text-ink' : 'bg-noir-3 text-noir-ink-2')}>Browsing</span>
            <span className={cn('rounded-full px-4 py-2 transition-colors duration-500', confirmed ? 'bg-green text-noir' : 'bg-noir-3 text-noir-ink-2')}>Confirmed guest</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-[520px] overflow-hidden rounded-[32px] bg-noir-2 shadow-[0_0_0_1px_rgb(255_255_255/0.06)]">
          <div className="relative h-[300px] overflow-hidden md:h-[340px]">
            <motion.div className="absolute inset-0" style={{ filter }}>
              <Image src={PHOTOS.roof2} alt="" fill sizes="520px" className="scale-110 object-cover opacity-60" />
            </motion.div>
            <svg className="absolute inset-0 size-full" viewBox="0 0 520 340" preserveAspectRatio="xMidYMid slice" aria-hidden>
              <defs>
                <pattern id="host-grid" width="26" height="26" patternUnits="userSpaceOnUse">
                  <path d="M26 0H0V26" fill="none" stroke="white" strokeOpacity="0.08" />
                </pattern>
              </defs>
              <rect width="520" height="340" fill="url(#host-grid)" />
              <motion.circle cx={260} cy={170} r={radius} fill="#FF3864" fillOpacity={0.18} stroke="#FF3864" strokeOpacity={0.6} strokeWidth={1.5} strokeDasharray="6 6" />
            </svg>
            <AnimatePresence>
              {confirmed && (
                <motion.div
                  initial={{ y: -60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -30, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 380, damping: 16 }}
                  className="absolute left-1/2 top-1/2 -ml-4 -mt-10"
                >
                  <svg width="32" height="42" viewBox="0 0 32 42" aria-hidden>
                    <path d="M16 0C7 0 0 7 0 16c0 12 16 26 16 26s16-14 16-26C32 7 25 0 16 0Z" fill="#FF3864" />
                    <circle cx="16" cy="16" r="6" fill="white" />
                  </svg>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="p-6 font-sans">
            <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Where</div>
            <div className="mt-1 font-display text-2xl font-extrabold">Bandra West, Mumbai</div>
            <div className={cn('mt-2 font-mono text-[15px] transition-colors', confirmed ? 'text-noir-ink' : 'text-noir-ink-2')} aria-label={confirmed ? EXACT : 'Exact address hidden until you are confirmed'}>
              {scramble(EXACT, reveal, tick)}
            </div>
            <div className="mt-4 rounded-2xl bg-noir-3 px-4 py-3 text-[13px] text-noir-ink-2">
              {confirmed ? 'Unlocked with the QR ticket, scan in at the door.' : 'Exact address after the host confirms you.'}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
