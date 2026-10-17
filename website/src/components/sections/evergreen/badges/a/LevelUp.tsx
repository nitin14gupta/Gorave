'use client'

import Image from 'next/image'
import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { PHOTOS } from '@/constants'
import type { PublicHostCard } from '@/lib/api'
import type { BadgeTier } from '@/lib/pagesData'
import { AvatarImage } from '@/components/ui/AvatarImage'
import { BadgeArt, Head, Push, hostName, r2, type TierKey } from '../kit'

// Board is 1180×640; every piece of the mock event and every dot is placed in
// board units so the callout lines land on the right thing at any width.
const W = 1180
const H = 640
const BOX = 270
const pct = (v: number, of: number) => `${r2((v / of) * 100)}%`

const POINTS = [
  { side: 'l', y: 60, dot: [470, 424], label: 'On every event', detail: 'Your badge sits right next to your name on each event you post.' },
  { side: 'l', y: 285, dot: [412, 452], label: 'Next to your rating', detail: 'Guests rate the events they go to. Your rating shows alongside the badge.' },
  { side: 'l', y: 510, dot: [436, 546], label: 'On your profile', detail: 'Tap through and it is there again, with how many nights you have hosted.' },
  { side: 'r', y: 120, dot: [866, 150], label: 'A push when it lands', detail: 'The app tells you the moment you reach a new badge.' },
  { side: 'r', y: 410, dot: [742, 486], label: 'Worked out for you', detail: 'Nothing to apply for. Gorave counts the events you hosted and skips cancelled ones.' },
] as const

/**
 * Chapter 02, what changes. A mock of your next event, pinned on desktop; as
 * you scroll five callout lines draw onto it, one per place the badge shows
 * up. Phones get the card and a numbered list.
 */
export function LevelUp({ tiers }: { tiers: BadgeTier[] }) {
  const ref = useRef<HTMLElement>(null)
  const reduce = !!useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const scale = useTransform(scrollYProgress, [0, 1], [reduce ? 1 : 0.95, 1])

  // A real host for the mock: the highest badge someone holds right now.
  const holder = [...tiers].reverse().find(t => t.hosts.length)
  const host = holder?.hosts[0] ?? null
  const tierKey: TierKey = holder?.key ?? 'rising'

  const head = (
    <Head
      n="02"
      label="What changes"
      title="Level up,"
      serif="and everyone can see it."
      aside="A badge isn't a trophy in a drawer. It travels with you, everywhere a guest decides whether to come."
    />
  )

  return (
    <section ref={ref} className="relative bg-paper md:h-[330vh]">
      <div className="flex flex-col justify-center px-6 py-24 md:sticky md:top-0 md:h-screen md:px-12 md:py-0 lg:px-20">
        <div className="mx-auto w-full max-w-[1180px]">{head}</div>

        {/* Desktop: drawn diagram */}
        <div className="relative mx-auto mt-6 hidden w-full max-w-[min(1180px,calc((100vh-300px)*1180/640))] [container-type:inline-size] md:block" style={{ aspectRatio: `${W}/${H}` }}>
          <motion.div className="absolute inset-0" style={{ scale }}>
            <MockEvent host={host} tierKey={tierKey} board />
          </motion.div>
          <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
            {POINTS.map((s, i) => (
              <Line key={i} i={i} spot={s} progress={scrollYProgress} />
            ))}
          </svg>
          {POINTS.map((s, i) => (
            <Callout key={i} i={i} spot={s} progress={scrollYProgress} />
          ))}
        </div>

        {/* Phones */}
        <div className="mt-10 md:hidden">
          <div className="relative mx-auto aspect-[400/600] w-full max-w-[360px]">
            <MockEvent host={host} tierKey={tierKey} />
          </div>
          <ol className="mt-8 grid gap-3">
            {POINTS.map((a, i) => (
              <motion.li
                key={a.label}
                initial={reduce ? false : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.6, delay: i * 0.05 }}
                className="flex gap-4 rounded-2xl bg-white p-5 shadow-soft"
              >
                <span className="font-serif text-2xl italic text-orange">{i + 1}</span>
                <div>
                  <div className="font-display text-xl font-extrabold tracking-[-0.03em]">{a.label}</div>
                  <div className="mt-0.5 font-sans text-[15px] text-ink-2">{a.detail}</div>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/**
 * The mock. In `board` mode the pieces sit at board coordinates (so the
 * dots line up); otherwise it's the same card laid out for a 400×600 frame.
 */
function MockEvent({ host, tierKey, board }: { host: PublicHostCard | null; tierKey: TierKey; board?: boolean }) {
  // Card frame in board units; on phones the frame is the whole box.
  const fx = board ? 390 : 0
  const fy = board ? 20 : 0
  const fw = board ? W : 400
  const fh = board ? H : 600
  const at = (x: number, y: number, w?: number, h?: number) => ({
    left: pct(fx + x, fw),
    top: pct(fy + y, fh),
    ...(w !== undefined ? { width: pct(w, fw) } : {}),
    ...(h !== undefined ? { height: pct(h, fh) } : {}),
  })
  const name = host ? hostName(host) : 'You'
  const rating = host && host.review_count > 0 && host.avg_rating ? host.avg_rating : null

  return (
    <div className="absolute inset-0 [container-type:inline-size]">
      <div className="absolute rounded-[28px] bg-white shadow-pop" style={at(0, 0, 400, 600)} />
      <div className="absolute overflow-hidden rounded-[20px]" style={at(16, 16, 368, 300)}>
        <Image src={PHOTOS.roof1} alt="" fill sizes="400px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 font-sans text-[11px] font-bold uppercase tracking-[0.12em] text-ink">Example</span>
        <div className="absolute inset-x-4 bottom-4 font-display text-[clamp(20px,2.4cqw,30px)] font-extrabold leading-none tracking-[-0.04em] text-cream" style={board ? undefined : { fontSize: 26 }}>
          Your next event
        </div>
      </div>

      {/* Host row */}
      <div className="absolute overflow-hidden rounded-full bg-tile" style={at(24, 340, 64, 64)}>
        {host ? <AvatarImage src={host.avatar} name={name} sizes="80px" initialClassName="text-xl" /> : <span className="grid size-full place-items-center bg-brand font-display text-xl font-extrabold text-white">Y</span>}
      </div>
      <div className="absolute" style={at(62, 368, 46)}>
        <BadgeArt tier={tierKey} size={46} className="!w-full drop-shadow-md" />
      </div>
      <div className="absolute" style={at(104, 344, 280)}>
        <div className="font-sans text-[clamp(10px,1cqw,12px)] font-bold uppercase tracking-[0.14em] text-ink-3" style={board ? undefined : { fontSize: 11 }}>Hosted by</div>
        <div className="truncate font-display text-[clamp(16px,1.9cqw,24px)] font-extrabold leading-tight tracking-[-0.03em]" style={board ? undefined : { fontSize: 21 }}>
          {name}
        </div>
      </div>

      {/* Rating pill */}
      <div className="absolute flex items-center" style={at(24, 422, 352, 40)}>
        <span className="rounded-full bg-cream px-3 py-1.5 font-sans text-[clamp(11px,1.15cqw,14px)] font-bold text-ink" style={board ? undefined : { fontSize: 13 }}>
          {rating ? <>★ {rating} · {host!.review_count} reviews</> : <>★ Rated by guests after each event</>}
        </span>
      </div>

      {/* Profile row */}
      <div className="absolute flex items-center justify-between border-t border-ink/10" style={at(24, 500, 352, 76)}>
        <span className="font-sans text-[clamp(12px,1.2cqw,15px)] font-bold text-ink" style={board ? undefined : { fontSize: 14 }}>View host profile ↗</span>
        <span className="text-right">
          <span className="block font-display text-[clamp(22px,2.6cqw,34px)] font-extrabold leading-none tracking-[-0.05em]" style={board ? undefined : { fontSize: 28 }}>
            {host ? host.hosted_count : 0}
          </span>
          <span className="font-sans text-[clamp(9px,0.9cqw,11px)] font-bold uppercase tracking-[0.12em] text-ink-3" style={board ? undefined : { fontSize: 10 }}>events hosted</span>
        </span>
      </div>

      {/* The push, overlapping the card's corner */}
      {board && (
        <div className="absolute" style={at(236, 104, 252)}>
          <Push className="!p-2.5 [&_div]:!text-[clamp(9px,1cqw,13px)]" />
        </div>
      )}
    </div>
  )
}

const range = (i: number) => [0.08 + i * 0.16, 0.2 + i * 0.16]

function Line({ i, spot, progress }: { i: number; spot: (typeof POINTS)[number]; progress: MotionValue<number> }) {
  const pathLength = useTransform(progress, range(i), [0, 1])
  const dot = useTransform(progress, [range(i)[1] - 0.02, range(i)[1]], [0, 1])
  const left = spot.side === 'l'
  const x1 = left ? BOX : W - BOX
  const y1 = spot.y + 34
  const [dx, dy] = spot.dot
  const mid = left ? x1 + 40 : x1 - 40
  return (
    <g>
      <motion.path d={`M${x1} ${y1} H${mid} L${dx} ${dy}`} fill="none" stroke="#171310" strokeWidth={1.5} strokeDasharray="0 1" style={{ pathLength }} />
      <motion.circle cx={dx} cy={dy} r={8} fill="#FF3864" style={{ scale: dot, opacity: dot }} />
      <motion.circle cx={dx} cy={dy} r={16} fill="none" stroke="#FFF" strokeWidth={2} style={{ scale: dot, opacity: dot }} />
    </g>
  )
}

function Callout({ i, spot, progress }: { i: number; spot: (typeof POINTS)[number]; progress: MotionValue<number> }) {
  const [a] = range(i)
  const left = spot.side === 'l'
  const opacity = useTransform(progress, [a - 0.04, a + 0.02], [0.15, 1])
  const x = useTransform(progress, [a - 0.04, a + 0.02], [left ? -24 : 24, 0])
  return (
    <motion.div
      className={`absolute ${left ? 'text-right' : 'text-left'}`}
      style={{ left: pct(left ? 0 : W - BOX, W), top: pct(spot.y, H), width: pct(BOX, W), opacity, x }}
    >
      <div className="font-serif text-[clamp(13px,1.5cqw,18px)] italic text-orange">0{i + 1}</div>
      <div className="font-display text-[clamp(15px,2.1cqw,26px)] font-extrabold leading-tight tracking-[-0.03em]">{spot.label}</div>
      <div className="mt-1 font-sans text-[clamp(11px,1.2cqw,15px)] leading-snug text-ink-2">{spot.detail}</div>
    </motion.div>
  )
}
