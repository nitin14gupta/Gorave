'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import {
  AnimatePresence,
  animate,
  motion,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  useTransform,
  type MotionValue,
} from 'motion/react'
import type { BadgeTier } from '@/lib/pagesData'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { Button } from '@/components/ui/Button'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'
import { BADGE_CRUMBS, BadgeArt, EASE, Push, TIER_LOOK, r2 } from '../kit'

// The mountain is drawn in a 720×680 board; the trail is straight segments so
// the walker's position can be interpolated exactly alongside pathLength.
const W = 720
const H = 680
const TRAIL: [number, number][] = [
  [64, 652],
  [262, 578], // Rising
  [136, 486],
  [414, 404], // Established
  [262, 312],
  [530, 238], // Elite
  [372, 150],
  [566, 66], // Legend
]
const LANDING = [1, 3, 5, 7]
const SEG = TRAIL.slice(1).map((p, i) => Math.hypot(p[0] - TRAIL[i][0], p[1] - TRAIL[i][1]))
const TOTAL = SEG.reduce((a, b) => a + b, 0)
const CUM = TRAIL.map((_, i) => r2(SEG.slice(0, i).reduce((a, b) => a + b, 0) / TOTAL))
const TRAIL_D = 'M' + TRAIL.map(p => p.join(' ')).join(' L')

// Progress t (0..1): each badge gets an equal stretch.
const T_STOPS = [0, 0.25, 0.5, 0.75, 1]
const FRAC_STOPS = [0, ...LANDING.map(i => CUM[i])]
const COUNT_STOPS = [0, 2, 10, 25, 75]

// Ridges are drawn in a board padded by half its width each side (it bleeds).
const RIDGE_PAD = 360
const RIDGE_BACK = '-360,680 -360,520 -240,470 -120,500 0,420 90,360 170,400 300,250 380,290 470,170 560,40 650,150 760,110 880,200 1000,170 1080,260 1080,680'
const RIDGE_MID = '-360,680 -360,600 -200,560 -60,590 0,540 120,470 210,500 330,370 410,390 520,250 600,300 720,230 860,290 980,260 1080,330 1080,680'
const RIDGE_FRONT = '-360,680 -360,650 -180,620 0,610 140,560 260,600 400,500 520,560 640,470 760,520 900,480 1080,540 1080,680'

const mql = '(min-width: 1024px)'
const subscribe = (cb: () => void) => {
  const m = window.matchMedia(mql)
  m.addEventListener('change', cb)
  return () => m.removeEventListener('change', cb)
}
const useDesktop = () => useSyncExternalStore(subscribe, () => window.matchMedia(mql).matches, () => false)

/**
 * The cover. A mountain with the four real badges on its switchback trail at
 * 2, 10, 25 and 75 nights. Desktop pins it: scroll and the walker climbs, the
 * count ticks up and each badge stamps on as it's reached. Phones get the
 * same mountain, climbed once when it comes into view.
 */
export function ClimbHero({ tiers }: { tiers: BadgeTier[] }) {
  const ref = useRef<HTMLElement>(null)
  const board = useRef<HTMLDivElement>(null)
  const reduce = !!useReducedMotion()
  const desktop = useDesktop()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const scrollT = useTransform(p, [0.05, 0.84], [0, 1], { clamp: true })
  const auto = useMotionValue(0)
  const inView = useInView(board, { once: true, margin: '-15% 0px' })

  useEffect(() => {
    if (desktop || !inView) return
    const c = animate(auto, 1, { duration: reduce ? 0 : 3.6, ease: [0.4, 0, 0.2, 1], delay: 0.2 })
    return () => c.stop()
  }, [desktop, inView, auto, reduce])

  const t = desktop ? scrollT : auto
  const count = useTransform(t, T_STOPS, COUNT_STOPS)
  const [n, setN] = useState(0)
  useMotionValueEvent(count, 'change', v => setN(Math.round(v)))

  const next = tiers.find(x => n < x.at)
  const current = [...tiers].reverse().find(x => n >= x.at)

  const ridgeBack = useTransform(p, [0, 1], [0, reduce ? 0 : -40])
  const ridgeMid = useTransform(p, [0, 1], [0, reduce ? 0 : -18])

  return (
    <section ref={ref} className="relative bg-paper lg:h-[440vh]">
      <div className="relative overflow-hidden lg:sticky lg:top-0 lg:h-screen">
        {/* Soft sun, sits behind everything */}
        <div aria-hidden className="pointer-events-none absolute -right-[10vw] top-[8vh] size-[46vw] max-w-[720px] rounded-full bg-[radial-gradient(circle,rgb(255_184_48/0.28),transparent_62%)]" />

        <div className="relative mx-auto grid h-full max-w-[1440px] gap-8 px-6 pb-16 pt-28 md:px-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:items-center lg:gap-6 lg:pb-0 lg:pt-16">
          {/* Copy */}
          <div className="relative z-10">
            <Breadcrumbs crumbs={BADGE_CRUMBS} />
            <Chapter n="00" title="Host badges" className="mt-8" />
            <h1 className="mt-5 font-display font-extrabold leading-[0.86] tracking-[-0.06em] text-ink">
              <span className="block overflow-hidden pb-[0.05em]">
                <motion.span
                  initial={reduce ? false : { y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.1, ease: EASE }}
                  className="block text-[clamp(60px,min(8.4vw,13vh),136px)]"
                >
                  Every night
                </motion.span>
              </span>
              <span className="block overflow-hidden pb-[0.1em]">
                <motion.span
                  initial={reduce ? false : { y: '105%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
                  className="block font-serif text-[clamp(52px,min(7.4vw,11.5vh),122px)] font-normal italic tracking-[-0.035em] text-brand"
                >
                  takes you higher.
                </motion.span>
              </span>
            </h1>
            <motion.p
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.35 }}
              className="mt-6 max-w-[470px] font-sans text-[19px] leading-relaxed text-ink-2"
            >
              Four badges, earned one hosted event at a time. Gorave counts them for you, and guests see your badge on your events and your profile.
            </motion.p>
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 0.45 }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <Button href="/host" size="lg">Start hosting</Button>
              <StoreBadges height={46} />
            </motion.div>
            <div className="mt-10 hidden items-center gap-3 font-sans text-[11px] font-bold uppercase tracking-[0.2em] text-ink-3 lg:flex">
              <span className="h-px w-8 bg-ink/25" /> Scroll to climb
            </div>
          </div>

          {/* The mountain */}
          <div className="relative mx-auto w-full max-w-[min(100%,calc(82vh*720/680))] lg:max-w-[min(100%,calc(80vh*720/680))]">
              {/* Count, top-left of the board */}
              <div className="relative z-10 mb-10 lg:absolute lg:left-0 lg:top-[2%] lg:mb-0">
                <div className="font-display text-[clamp(72px,min(9vw,15vh),156px)] font-extrabold leading-[0.8] tracking-[-0.07em] text-ink tabular-nums">
                  {n}
                  {n >= 75 && <span className="text-[0.5em]">+</span>}
                </div>
                <div className="mt-2 font-sans text-xs font-bold uppercase tracking-[0.18em] text-ink-3">events hosted</div>
                <div className="mt-3 h-6 font-serif text-xl italic text-ink-2">
                  {next ? (
                    <>
                      {next.at - n} more to <span className="text-orange">{next.name}</span>
                    </>
                  ) : (
                    <span className="text-orange">Legend. The summit.</span>
                  )}
                </div>
              </div>
          <div ref={board} className="relative mt-16 w-full lg:mt-0" style={{ aspectRatio: `${W}/${H}` }}>
            {/* Ridges bleed past the board and fade out at the edges */}
            <svg
              viewBox={`${-RIDGE_PAD} 0 ${W + RIDGE_PAD * 2} ${H}`}
              preserveAspectRatio="none"
              className="pointer-events-none absolute inset-y-0 left-[-50%] h-full w-[200%] [mask-image:linear-gradient(to_right,transparent_8%,black_34%,black_80%,transparent_98%),linear-gradient(to_bottom,black_72%,transparent)] [mask-composite:intersect]"
              aria-hidden
            >
              <motion.polygon points={RIDGE_BACK} fill="#EDE3D0" style={{ y: ridgeBack }} />
              <motion.polygon points={RIDGE_MID} fill="#E4D5B8" style={{ y: ridgeMid }} />
              <polygon points={RIDGE_FRONT} fill="#D9C7A6" opacity={0.55} />
            </svg>
            <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 size-full overflow-visible" aria-hidden>
              <defs>
                <linearGradient id="bdg-trail" x1="0" y1="1" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF6B35" />
                  <stop offset="100%" stopColor="#FF3864" />
                </linearGradient>
              </defs>
              {/* Trail: dotted track, then the climbed part in brand */}
              <path d={TRAIL_D} fill="none" stroke="#171310" strokeOpacity={0.22} strokeWidth={2.5} strokeDasharray="2 9" strokeLinecap="round" strokeLinejoin="round" />
              <Climbed t={t} />
              {LANDING.map(i => (
                <circle key={i} cx={TRAIL[i][0]} cy={TRAIL[i][1]} r={6} fill="#fbf7ef" stroke="#171310" strokeOpacity={0.35} strokeWidth={2} />
              ))}
              <Walker t={t} />
            </svg>

            {/* The four badges on their landings */}
            {tiers.map((tier, i) => (
              <Station key={tier.key} tier={tier} i={i} lit={n >= tier.at} current={current?.key === tier.key} reduce={reduce} />
            ))}

            {/* The app's real push, when Rising lands */}
            <div className="pointer-events-none absolute right-0 top-[28%] w-[min(330px,62%)] max-lg:hidden">
              <AnimatePresence>
                {n >= 2 && n < 10 && (
                  <motion.div
                    initial={reduce ? { opacity: 0 } : { opacity: 0, y: -24, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.55, ease: EASE }}
                  >
                    <Push />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          </div>

          {/* Phones: the push, shown once the climb starts */}
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: EASE, delay: 1 }}
            className="lg:hidden"
          >
            <div className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.16em] text-ink-3">At 2 events, your phone says</div>
            <Push />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function Climbed({ t }: { t: MotionValue<number> }) {
  const pathLength = useTransform(t, T_STOPS, FRAC_STOPS)
  return (
    <motion.path
      d={TRAIL_D}
      fill="none"
      stroke="url(#bdg-trail)"
      strokeWidth={5}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ pathLength }}
    />
  )
}

function Walker({ t }: { t: MotionValue<number> }) {
  const frac = useTransform(t, T_STOPS, FRAC_STOPS)
  const cx = useTransform(frac, CUM, TRAIL.map(p => p[0]))
  const cy = useTransform(frac, CUM, TRAIL.map(p => p[1]))
  return (
    <g>
      <motion.circle cx={cx} cy={cy} r={16} fill="#FF3864" fillOpacity={0.16} />
      <motion.circle cx={cx} cy={cy} r={8} fill="#FF3864" stroke="#fff" strokeWidth={3} />
    </g>
  )
}

function Station({ tier, i, lit, current, reduce }: { tier: BadgeTier; i: number; lit: boolean; current: boolean; reduce: boolean }) {
  const [x, y] = TRAIL[LANDING[i]]
  const look = TIER_LOOK[tier.key]
  // Labels sit on the open side of each landing.
  const labelLeft = i === 3
  return (
    <div
      className="absolute"
      style={{ left: `${r2((x / W) * 100)}%`, top: `${r2((y / H) * 100)}%`, width: 0, height: 0 }}
    >
      <div className="absolute bottom-[10px] left-0 -translate-x-1/2">
        <div className="relative">
          <motion.span
            aria-hidden
            className="absolute inset-0 rounded-full"
            style={{ border: `3px solid ${look.color}` }}
            initial={false}
            animate={lit && !reduce ? { scale: [0.6, 1.9], opacity: [0.7, 0] } : { scale: 0.6, opacity: 0 }}
            transition={{ duration: 0.9, ease: EASE }}
          />
          <motion.div
            initial={false}
            animate={
              lit
                ? { scale: 1, rotate: 0, opacity: 1, filter: 'grayscale(0) brightness(1)' }
                : { scale: 0.74, rotate: -14, opacity: 0.42, filter: 'grayscale(1) brightness(1.15)' }
            }
            transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 380, damping: 15 }}
            className="w-[clamp(58px,min(8vw,12vh),112px)] drop-shadow-[0_14px_18px_rgb(23_19_16/0.22)]"
          >
            <BadgeArt tier={tier.key} size={112} className="!w-full" priority={i === 0} />
          </motion.div>
        </div>
      </div>
      <div
        className={cn(
          'absolute top-[-6px] w-max -translate-y-full transition-opacity duration-500',
          labelLeft ? 'right-[calc(clamp(58px,min(8vw,12vh),112px)/2+14px)] text-right' : 'left-[calc(clamp(58px,min(8vw,12vh),112px)/2+14px)]',
          lit ? 'opacity-100' : 'opacity-45',
        )}
      >
        <div className="font-serif text-base italic leading-none text-orange md:text-lg">{tier.at}+ events</div>
        <div className="mt-1 font-display text-[clamp(20px,2vw,30px)] font-extrabold leading-none tracking-[-0.04em] text-ink">
          {tier.name}
          {current && <span className="ml-2 inline-block translate-y-[-3px] rounded-full bg-ink px-2 py-0.5 align-middle font-sans text-[10px] font-bold uppercase tracking-[0.14em] text-cream">You</span>}
        </div>
      </div>
    </div>
  )
}
