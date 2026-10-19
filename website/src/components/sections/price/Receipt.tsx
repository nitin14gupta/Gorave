'use client'

import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import type { PriceProps } from '@/lib/price'
import { Head } from '@/components/sections/areaType/kit'

/**
 * Chapter 02, the receipt. The paper feeds out of a printer slot as you
 * scroll, one line at a time, and the total gets stamped at the end.
 */
export function Receipt({ tier }: PriceProps) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start 75%', 'end 75%'] })
  const feed = useTransform(p, [0, 0.8], [reduce ? '0%' : '-100%', '0%'])
  const stamp = useTransform(p, [0.75, 0.85], [reduce ? 1 : 0, 1])
  const stampScale = useTransform(p, [0.75, 0.85], [reduce ? 1 : 2.2, 1])
  const n = tier.receipt.length

  return (
    <section ref={ref} className="bg-cream px-6 py-24 md:px-12 md:py-32 lg:px-20">
      <div className="mx-auto grid max-w-[1180px] items-start gap-14 lg:grid-cols-[1fr_440px]">
        <Head
          n="02"
          label="The receipt"
          title={tier.slug === 'free-events' ? 'Nothing to pay.' : 'No surprises.'}
          serif={tier.slug === 'free-events' ? 'Really.' : 'Ever.'}
          aside={tier.slug === 'free-events' ? 'Here’s the whole bill for a free night on Gorave. Scroll to print it.' : 'Every rupee, before you pay. Scroll to print it.'}
          className="lg:sticky lg:top-32"
        />
        <div className="relative mx-auto w-full max-w-[400px]">
          {/* The printer */}
          <div className="relative z-10 h-14 rounded-[18px] bg-ink shadow-pop">
            <div className="absolute inset-x-6 bottom-3 h-2 rounded-full bg-black/60" />
          </div>
          <div className="-mt-3 overflow-hidden px-4">
            <motion.div style={{ y: feed }} className="relative bg-white px-7 pb-10 pt-8 shadow-soft" >
              <div className="text-center font-mono text-[12px] font-bold uppercase tracking-[0.2em] text-ink-3">gorave · {tier.label}</div>
              <div className="my-5 border-t border-dashed border-ink/20" />
              <ul className="space-y-4 font-mono text-[15px]">
                {tier.receipt.map((r, i) => <Line key={r.k} r={r} p={p} at={0.1 + (i / n) * 0.55} />)}
              </ul>
              <div className="my-5 border-t border-dashed border-ink/20" />
              <div className="relative flex items-baseline justify-between font-mono text-lg font-bold">
                <span>{tier.total.k}</span>
                <span>{tier.total.v}</span>
                <motion.span
                  style={{ opacity: stamp, scale: stampScale, rotate: -10 }}
                  className="absolute -bottom-14 right-0 rounded-lg border-[3px] border-orange px-3 py-1 font-display text-2xl font-extrabold tracking-[-0.02em] text-orange"
                >
                  {tier.slug === 'free-events' ? 'FREE' : 'PAID IN APP'}
                </motion.span>
              </div>
              <div className="mt-16 text-center font-mono text-[11px] text-ink-3">No cash at the door. See you there.</div>
              {/* Torn edge */}
              <div aria-hidden className="absolute inset-x-0 -bottom-2 h-3 bg-[radial-gradient(circle_at_6px_0,transparent_6px,white_6.5px)] bg-[length:12px_12px]" />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}

function Line({ r, p, at }: { r: { k: string; v: string; note?: string }; p: MotionValue<number>; at: number }) {
  const opacity = useTransform(p, [at, at + 0.08], [0, 1])
  const x = useTransform(p, [at, at + 0.08], [-8, 0])
  return (
    <motion.li style={{ opacity, x }}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-ink-2">{r.k}</span>
        <span className="font-bold">{r.v}</span>
      </div>
      {r.note && <div className="mt-0.5 text-[12px] text-ink-3">{r.note}</div>}
    </motion.li>
  )
}
