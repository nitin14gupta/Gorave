'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'motion/react'
import { GUEST_TIPS, HOST_BADGES, HOST_TIPS, SAFETY_LINKS, type Tip } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'

const EASE = [0.2, 0.8, 0.2, 1] as const

/** Moves the card's spotlight to the cursor via CSS variables — no re-render. */
function spot(e: React.PointerEvent<HTMLElement>) {
  const r = e.currentTarget.getBoundingClientRect()
  e.currentTarget.style.setProperty('--x', `${e.clientX - r.left}px`)
  e.currentTarget.style.setProperty('--y', `${e.clientY - r.top}px`)
}

/**
 * Chapter 06 — your part. Two columns of habits, guests and hosts, on dark
 * cards that a soft torch follows under the cursor. Above them, the host
 * badges you can check before you go; each lifts and spins a little on hover.
 */
export function HabitsB() {
  return (
    <section className="bg-noir-2 px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto max-w-[1280px]">
        <Chapter n="06" title="Your part" dark />
        <div className="mt-4 grid gap-10 lg:grid-cols-[1fr_1fr] lg:items-end">
          <h2 className="font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Good nights<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">take two sides.</span>
          </h2>
          <div>
            <div className="font-sans text-xs font-bold uppercase tracking-[0.16em] text-noir-ink-2">Check the host’s badge before you go</div>
            <div className="mt-4 flex flex-wrap gap-5">
              {HOST_BADGES.map((b, i) => (
                <motion.div
                  key={b.key}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, ease: EASE, delay: i * 0.08 }}
                  whileHover={{ y: -6, rotate: -6, scale: 1.08 }}
                  className="text-center"
                  title={b.line}
                >
                  <Image src={b.src} alt={`${b.label} host badge`} width={64} height={64} className="mx-auto size-16 object-contain" />
                  <div className="mt-1 font-sans text-xs font-bold text-noir-ink-2">{b.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-16 grid gap-10 lg:grid-cols-2">
          <Column title="When you go" tips={GUEST_TIPS} />
          <Column title="When you host" tips={HOST_TIPS} />
        </div>

        <div className="mt-14 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/10 pt-8 font-sans text-[15px] text-noir-ink-2">
          <span>Paid events: UPI or wallet in the app, no cash at the door. <Link href={SAFETY_LINKS.refunds} className="font-bold text-noir-ink underline decoration-orange underline-offset-4">Refund policy</Link></span>
          <span>Something off? Report or block in the app. <Link href={SAFETY_LINKS.guidelines} className="font-bold text-noir-ink underline decoration-orange underline-offset-4">Guidelines</Link></span>
        </div>
      </div>
    </section>
  )
}

function Column({ title, tips }: { title: string; tips: Tip[] }) {
  return (
    <div>
      <div className="font-serif text-3xl italic text-orange">{title}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {tips.map((t, i) => (
          <motion.div
            key={t.title}
            onPointerMove={spot}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.6, ease: EASE, delay: (i % 2) * 0.08 }}
            className="group relative overflow-hidden rounded-[22px] bg-noir-3 p-6 shadow-[0_0_0_1px_rgb(255_255_255/0.05)]"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: 'radial-gradient(240px circle at var(--x, 50%) var(--y, 50%), rgb(0 196 140 / 0.16), transparent 70%)' }}
            />
            <div className="relative">
              <div className="font-display text-xl font-extrabold tracking-[-0.03em] transition-colors duration-300 group-hover:text-green">{t.title}</div>
              <p className="mt-1.5 font-sans text-[15px] leading-relaxed text-noir-ink-2">{t.body}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
