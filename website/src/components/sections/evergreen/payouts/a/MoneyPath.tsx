'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { HOST_FEES, inr } from '@/lib/host'
import { ONE, rs } from '../data'
import { Head, r2, Tick } from '../kit'

// Stage is 1200×520 board units; stations and the path share that space.
const W = 1200
const H = 520
type Pt = readonly [number, number]
const GUEST: Pt = [150, 330]
const HUB: Pt = [600, 110]
const HOST: Pt = [1050, 330]
const SEG1 = [GUEST, [380, 330], [380, 110], HUB] as const
const SEG2 = [HUB, [820, 110], [820, 330], HOST] as const
const D1 = `M${GUEST} C${SEG1[1]} ${SEG1[2]} ${HUB}`
const D2 = `M${HUB} C${SEG2[1]} ${SEG2[2]} ${HOST}`

/** Point on a cubic Bézier, so the coin rides exactly on the drawn line. */
function bez(s: readonly (readonly [number, number])[], t: number): Pt {
  const u = 1 - t
  const a = u * u * u, b = 3 * u * u * t, c = 3 * u * t * t, d = t * t * t
  return [a * s[0][0] + b * s[1][0] + c * s[2][0] + d * s[3][0], a * s[0][1] + b * s[1][1] + c * s[2][1] + d * s[3][1]]
}

// Scroll phases: ride to Gorave, split, ride to the host, land.
const RIDE1 = [0.06, 0.38]
const SPLIT = [0.4, 0.54]
const RIDE2 = [0.56, 0.86]
const LAND = [0.86, 0.94]

function coinAt(v: number): Pt {
  if (v <= RIDE1[1]) return bez(SEG1, Math.max(0, (v - RIDE1[0]) / (RIDE1[1] - RIDE1[0])))
  if (v < RIDE2[0]) return HUB
  return bez(SEG2, Math.min(1, (v - RIDE2[0]) / (RIDE2[1] - RIDE2[0])))
}

const pct = (n: number, of: number) => `${r2((n / of) * 100)}%`

const STEPS = [
  { n: '01', title: 'The guest taps pay', body: `${rs(ONE.ticket)} ticket plus the ${inr(HOST_FEES.platformFee)} platform fee, with UPI (GPay, PhonePe and so on) or their Gorave Wallet.`, at: [0, 0.4] },
  { n: '02', title: 'Gorave holds it', body: `We collect the full ticket price. Our 10% (${rs(ONE.commission)}) and the guest's ${inr(HOST_FEES.platformFee)} fee stay here. That's all we take.`, at: [0.4, 0.56] },
  { n: '03', title: 'You get your 90%', body: `After the event, ${rs(ONE.host)} goes to your UPI ID or bank account, automatically.`, at: [0.56, 1.01] },
] as const

/**
 * Chapter 01, the route. Pinned on desktop: one ₹499 ticket rides a drawn
 * line from the guest's phone, through Gorave, to the host's bank. At the
 * hub the fee and the 10% peel off; the rest lands. Steps stack on phones.
 */
export function MoneyPath({ cover }: { cover: string }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })

  const head = (
    <Head
      n="01"
      label="The route"
      title="One ticket,"
      serif="three stops."
      aside={<>Here&apos;s exactly where a {inr(ONE.ticket)} ticket goes. No hidden cuts, nothing taken from you upfront.</>}
    />
  )

  return (
    <>
      <section ref={ref} className="relative hidden bg-paper motion-safe:lg:block motion-safe:lg:h-[420vh]">
        <div className="sticky top-0 flex h-screen flex-col justify-center-safe overflow-hidden pt-24 px-20 pb-16">
          <div className="mx-auto w-full max-w-[1180px]">{head}</div>
          <Stage p={p} cover={cover} />
          <div className="mx-auto mt-6 grid w-full max-w-[1180px] grid-cols-3 gap-10">
            {STEPS.map(s => <Caption key={s.n} step={s} p={p} />)}
          </div>
        </div>
      </section>

      {/* Phones, tablets and reduced motion */}
      <section className="bg-paper px-6 py-24 md:px-12 motion-safe:lg:hidden">
        <div className="mx-auto max-w-[1180px]">
          {head}
          <ol className="relative mt-12 grid gap-6 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <motion.li
                key={s.n}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="rounded-[28px] bg-white p-5 shadow-soft"
              >
                <div className="mb-5 flex justify-center">
                  {i === 0 ? <GuestCard cover={cover} /> : i === 1 ? <HubCard /> : <HostCard />}
                </div>
                <div className="font-serif text-xl italic text-orange">{s.n}</div>
                <div className="font-display text-2xl font-extrabold tracking-[-0.03em]">{s.title}</div>
                <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{s.body}</p>
              </motion.li>
            ))}
          </ol>
        </div>
      </section>
    </>
  )
}

function Stage({ p, cover }: { p: MotionValue<number>; cover: string }) {
  const len1 = useTransform(p, RIDE1, [0, 1])
  const len2 = useTransform(p, RIDE2, [0, 1])
  const left = useTransform(p, v => pct(coinAt(v)[0], W))
  const top = useTransform(p, v => pct(coinAt(v)[1], H))
  const coinIn = useTransform(p, [RIDE1[0] - 0.03, RIDE1[0]], [0, 1])
  const coinOut = useTransform(p, [LAND[0], LAND[1]], [1, 0])
  const coinOpacity = useTransform([coinIn, coinOut], ([a, b]: number[]) => Math.min(a, b))
  const before = useTransform(p, [0.46, 0.5], [1, 0])
  const after = useTransform(p, [0.46, 0.5], [0, 1])

  const feeY = useTransform(p, SPLIT, [0, -86])
  const feeX = useTransform(p, SPLIT, [0, -150])
  const cutY = useTransform(p, SPLIT, [0, -86])
  const cutX = useTransform(p, SPLIT, [0, 150])
  const chips = useTransform(p, [SPLIT[0], SPLIT[0] + 0.04], [0, 1])

  const landed = useTransform(p, LAND, [0, 1])
  const hostScale = useTransform(p, LAND, [0.96, 1.04])
  const guestOn = useTransform(p, [0, 0.06], [0.6, 1])

  return (
    <div className="relative mx-auto mt-6 w-full max-w-[min(1180px,calc((100vh-420px)*2.3))]" style={{ aspectRatio: `${W}/${H}` }}>
      <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
        <defs>
          <linearGradient id="pay-line" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#FF6B35" />
            <stop offset="1" stopColor="#FF3864" />
          </linearGradient>
        </defs>
        <path d={D1} fill="none" stroke="#171310" strokeOpacity={0.14} strokeWidth={2} strokeDasharray="4 8" />
        <path d={D2} fill="none" stroke="#171310" strokeOpacity={0.14} strokeWidth={2} strokeDasharray="4 8" />
        <motion.path d={D1} fill="none" stroke="url(#pay-line)" strokeWidth={4} strokeLinecap="round" style={{ pathLength: len1 }} />
        <motion.path d={D2} fill="none" stroke="url(#pay-line)" strokeWidth={4} strokeLinecap="round" style={{ pathLength: len2 }} />
      </svg>

      {/* Stations */}
      <motion.div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(GUEST[0], W), top: pct(GUEST[1], H), opacity: guestOn }}>
        <GuestCard cover={cover} />
      </motion.div>
      <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(HUB[0], W), top: pct(HUB[1], H) }}>
        <div className="relative">
          <motion.div style={{ x: feeX, y: feeY, opacity: chips }} className="absolute left-1/2 top-1/2 -ml-[70px] -mt-4 w-[140px] text-center">
            <span className="inline-block rounded-full bg-sky px-3 py-1.5 font-sans text-xs font-bold text-sky-ink shadow-soft">{inr(HOST_FEES.platformFee)} fee · guest&apos;s</span>
          </motion.div>
          <motion.div style={{ x: cutX, y: cutY, opacity: chips }} className="absolute left-1/2 top-1/2 -ml-[70px] -mt-4 w-[140px] text-center">
            <span className="inline-block rounded-full bg-cream-deep px-3 py-1.5 font-sans text-xs font-bold text-ink shadow-soft">{rs(ONE.commission)} · 10%</span>
          </motion.div>
          <HubCard />
        </div>
      </div>
      <motion.div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(HOST[0], W), top: pct(HOST[1], H), scale: hostScale }}>
        <HostCard landed={landed} />
      </motion.div>

      {/* The coin */}
      <motion.div className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left, top, opacity: coinOpacity }}>
        <div className="relative grid h-14 min-w-14 place-items-center rounded-full bg-brand px-3 font-display text-[15px] font-extrabold text-white shadow-[0_14px_30px_-10px_rgb(255_56_100/0.7)] ring-4 ring-white">
          <motion.span style={{ opacity: before }} className="col-start-1 row-start-1 tabular-nums">{rs(ONE.guestPays)}</motion.span>
          <motion.span style={{ opacity: after }} className="col-start-1 row-start-1 tabular-nums">{rs(ONE.host)}</motion.span>
        </div>
      </motion.div>
    </div>
  )
}

function Caption({ step, p }: { step: (typeof STEPS)[number]; p: MotionValue<number> }) {
  const [a, b] = step.at
  const opacity = useTransform(p, [Math.max(0, a - 0.02), a + 0.02, Math.min(b, 1) - 0.02, Math.min(b + 0.02, 1)], [a === 0 ? 1 : 0.25, 1, 1, b > 1 ? 1 : 0.25])
  const bar = useTransform(p, [a, Math.min(b, 1)], [0, 1])
  return (
    <motion.div style={{ opacity }}>
      <div className="h-[2px] w-full overflow-hidden rounded-full bg-ink/10">
        <motion.div className="h-full origin-left bg-brand" style={{ scaleX: bar }} />
      </div>
      <div className="mt-4 flex items-baseline gap-3">
        <span className="font-serif text-xl italic text-orange">{step.n}</span>
        <span className="font-display text-[22px] font-extrabold tracking-[-0.03em]">{step.title}</span>
      </div>
      <p className="mt-1 font-sans text-[15px] leading-relaxed text-ink-2">{step.body}</p>
    </motion.div>
  )
}

function GuestCard({ cover }: { cover: string }) {
  return (
    <div className="w-[230px] overflow-hidden rounded-[26px] bg-white shadow-pop">
      <div className="relative h-[92px]">
        <Image src={cover} alt="" fill sizes="240px" className="object-cover" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.12em] text-ink">Guest checkout</span>
      </div>
      <div className="grid gap-1.5 p-4 font-sans text-[13px]">
        <div className="flex justify-between"><span className="text-ink-2">Ticket</span><span className="font-bold tabular-nums">{rs(ONE.ticket)}</span></div>
        <div className="flex justify-between"><span className="text-ink-2">Platform fee</span><span className="font-bold tabular-nums">{rs(ONE.fee)}</span></div>
        <div className="mt-2 grid place-items-center rounded-full bg-ink py-2.5 font-bold text-cream">Pay {rs(ONE.guestPays)}</div>
        <div className="mt-1 flex justify-center gap-1.5 text-[11px] font-bold text-ink-3">
          <span className="rounded-full bg-cream px-2 py-0.5">UPI</span>
          <span className="rounded-full bg-cream px-2 py-0.5">Gorave Wallet</span>
        </div>
      </div>
    </div>
  )
}

function HubCard() {
  return (
    <div className="relative w-[200px] rounded-[26px] bg-white p-4 text-center shadow-pop">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-brand font-display text-2xl font-extrabold text-white">G</div>
      <div className="mt-2 font-display text-lg font-extrabold tracking-[-0.03em]">Gorave</div>
      <div className="font-sans text-[12px] leading-snug text-ink-2">Holds the full ticket price until the night is done</div>
    </div>
  )
}

function HostCard({ landed }: { landed?: MotionValue<number> }) {
  return (
    <div className="relative w-[230px] overflow-hidden rounded-[26px] bg-white p-4 shadow-pop">
      <motion.div className="absolute inset-0 bg-sage" style={landed ? { opacity: landed } : undefined} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <span className="font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-ink-3">Your payout</span>
          <Tick />
        </div>
        <div className="mt-3 font-display text-[34px] font-extrabold leading-none tracking-[-0.05em] tabular-nums">{rs(ONE.host)}</div>
        <div className="mt-1 font-sans text-[12px] text-ink-2">90% of the ticket</div>
        <div className="mt-3 grid gap-1 border-t border-ink/10 pt-3 font-sans text-[12px]">
          <div className="flex justify-between"><span className="text-ink-2">To</span><span className="font-bold">UPI ID or bank</span></div>
          <div className="flex justify-between"><span className="text-ink-2">When</span><span className="font-bold">After the event</span></div>
        </div>
      </div>
    </div>
  )
}
