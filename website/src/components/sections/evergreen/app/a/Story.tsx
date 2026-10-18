'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from 'motion/react'
import { useLenis } from 'lenis/react'
import { Chapter } from '@/components/ui/atoms'
import { Phone } from '@/components/ui/Phone'
import { DiscoverScreen, PayScreen, TicketScreen } from '@/components/ui/AppScreens'
import { cn } from '@/lib/cn'
import { RequestScreen, SosScreen } from '../screens'
import { EASE } from '../data'

// Board is W×H; the phone, the dots and the notes are in board units so the
// callout lines land on the right bit of UI at any size (the board scales).
const W = 1180
const H = 640
const PW = 290
const PX = (W - PW) / 2
const PY = 22
const SX = PX + 10 // screen origin inside the frame
const SY = PY + 10
const NOTE_X = 820

interface Note { title: string; body: string; dot: [number, number]; y: number }
interface Step { key: string; label: string; title: ReactNode; body: string; screen: ReactNode; notes: [Note, Note] }

const STEPS: Step[] = [
  {
    key: 'discover', label: 'Discover',
    title: <>Find one<br />near you.</>,
    body: 'House parties, rooftops, game nights, dinners and music nights in your city, the closest ones first.',
    screen: <DiscoverScreen />,
    notes: [
      { title: 'Filter in a tap', body: 'Free, tonight, this weekend, or by vibe.', dot: [206, 115], y: 70 },
      { title: 'Closest first', body: 'Pick your city and the nearest nights rise to the top.', dot: [200, 186], y: 250 },
    ],
  },
  {
    key: 'request', label: 'Request',
    title: <>Ask to<br />get in.</>,
    body: 'Free events are request-to-join. The host sees your profile, then says yes.',
    screen: <RequestScreen />,
    notes: [
      { title: 'Area now, address later', body: 'The exact address unlocks once you are confirmed.', dot: [250, 372], y: 250 },
      { title: 'Request to join', body: 'One tap. The host approves every guest.', dot: [150, 544], y: 470 },
    ],
  },
  {
    key: 'pay', label: 'Pay with UPI',
    title: <>Or just<br />book it.</>,
    body: 'Paid events book instantly. No back and forth, no screenshots of payments.',
    screen: <PayScreen />,
    notes: [
      { title: 'Flat ₹50 platform fee', body: 'The ticket price plus ₹50. That is the whole fee.', dot: [182, 393], y: 250 },
      { title: 'UPI or Gorave Wallet', body: 'GPay, PhonePe, Paytm or your wallet balance.', dot: [89, 485], y: 450 },
    ],
  },
  {
    key: 'ticket', label: 'QR at the door',
    title: <>Walk in<br />with a QR.</>,
    body: 'You are in. Your ticket lives in the app, and so does the address.',
    screen: <TicketScreen />,
    notes: [
      { title: 'Address unlocked', body: 'The exact place shows up the moment you are confirmed.', dot: [135, 86], y: 40 },
      { title: 'Your QR ticket', body: 'The host scans it at the door. No list, no guesswork.', dot: [196, 262], y: 300 },
    ],
  },
  {
    key: 'sos', label: 'SOS',
    title: <>Safe, all<br />night.</>,
    body: 'Every guest is phone-verified and 18+. And help is one tap away.',
    screen: <SosScreen />,
    notes: [
      { title: 'One-tap SOS', body: 'Texts your location to your emergency contacts.', dot: [184, 152], y: 110 },
      { title: 'Up to 5 contacts', body: 'Your emergency contacts all get it at once.', dot: [92, 398], y: 380 },
    ],
  },
]
const N = STEPS.length

/**
 * Chapter 01, the night in the app. The section pins; one phone, five
 * screens. As you scroll, each screen swaps in and two callouts draw
 * themselves from the exact bit of UI out to a note, Anatomy style.
 */
export function Story() {
  const ref = useRef<HTMLElement>(null)
  const boardWrap = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion() ?? false
  const lenis = useLenis()
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start start', 'end end'] })
  const [step, setStep] = useState(0)
  const [scale, setScale] = useState(1)

  useMotionValueEvent(p, 'change', v => setStep(Math.min(N - 1, Math.max(0, Math.floor(v * N)))))

  useEffect(() => {
    const el = boardWrap.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      setScale(Math.round(Math.min(1.08, width / W, height / H) * 1000) / 1000)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const jump = (i: number) => {
    const sec = ref.current
    if (!sec) return
    const dist = sec.offsetHeight - window.innerHeight
    const top = sec.getBoundingClientRect().top + window.scrollY + Math.round(((i + 0.5) / N) * dist)
    if (lenis) lenis.scrollTo(top)
    else window.scrollTo({ top, behavior: 'smooth' })
  }

  const s = STEPS[step]

  return (
    <section ref={ref} id="how" className="relative bg-paper md:h-[520vh]">
      <div className="md:sticky md:top-0 md:flex md:h-screen md:flex-col md:overflow-hidden md:pb-8 md:pt-[88px]">
        {/* Desktop: the board */}
        <div ref={boardWrap} className="relative mx-6 hidden flex-1 md:mx-12 md:block lg:mx-20">
          <div
            className="absolute left-1/2 top-1/2"
            style={{ width: W, height: H, transform: `translate(-50%, -50%) scale(${scale})` }}
          >
            {/* Left: the step */}
            <div className="absolute left-0 top-0 flex h-full w-[380px] flex-col">
              <Chapter n="01" title="A night, in the app" />
              <div className="relative mt-8 flex-1">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -40 }}
                    transition={{ duration: 0.55, ease: EASE }}
                    className="absolute inset-x-0 top-0"
                  >
                    <div className="font-serif text-[64px] italic leading-none text-orange">0{step + 1}</div>
                    <h2 className="mt-3 font-display text-[76px] font-extrabold leading-[0.9] tracking-[-0.055em] text-ink">{s.title}</h2>
                    <p className="mt-6 max-w-[330px] font-sans text-lg leading-relaxed text-ink-2">{s.body}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex flex-col gap-1.5">
                {STEPS.map((t, i) => (
                  <StepTab key={t.key} i={i} label={t.label} on={i === step} p={p} onClick={() => jump(i)} />
                ))}
              </div>
            </div>

            {/* The phone */}
            <div className="absolute" style={{ left: PX, top: PY }}>
              <Phone width={PW}>
                <AnimatePresence initial={false}>
                  <motion.div
                    key={s.key}
                    initial={{ opacity: 0, scale: 1.04 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="absolute inset-0"
                  >
                    {s.screen}
                  </motion.div>
                </AnimatePresence>
              </Phone>
            </div>

            {/* Lines */}
            <svg viewBox={`0 0 ${W} ${H}`} className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
              {STEPS.map((t, i) => t.notes.map((n, k) => <Line key={`${t.key}${k}`} i={i} k={k} note={n} p={p} reduce={reduce} />))}
            </svg>

            {/* Notes */}
            {STEPS.map((t, i) => t.notes.map((n, k) => <NoteCard key={`${t.key}${k}`} i={i} k={k} note={n} p={p} />))}
          </div>
        </div>

        {/* Phones: one card per step */}
        <div className="px-6 py-24 md:hidden">
          <Chapter n="01" title="A night, in the app" />
          <h2 className="mt-4 font-display text-[48px] font-extrabold leading-[0.9] tracking-[-0.055em]">Five taps,<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-orange">one good night.</span></h2>
          <ol className="mt-12 flex flex-col gap-16">
            {STEPS.map((t, i) => (
              <motion.li
                key={t.key}
                initial={reduce ? false : { opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.8, ease: EASE }}
              >
                <div className="font-serif text-4xl italic text-orange">0{i + 1}</div>
                <h3 className="mt-1 font-display text-[40px] font-extrabold leading-[0.92] tracking-[-0.05em]">{t.title}</h3>
                <p className="mt-3 font-sans text-[17px] leading-relaxed text-ink-2">{t.body}</p>
                <div className="mt-6 flex justify-center">
                  <div className="h-[533px] w-[260px]"><Phone width={260}>{t.screen}</Phone></div>
                </div>
                <div className="mt-6 grid gap-3">
                  {t.notes.map(n => (
                    <div key={n.title} className="flex gap-3 rounded-2xl bg-white p-4 shadow-soft">
                      <span className="mt-1.5 size-2.5 shrink-0 rounded-full bg-coral" />
                      <div>
                        <div className="font-display text-lg font-extrabold tracking-[-0.02em]">{n.title}</div>
                        <div className="font-sans text-[15px] text-ink-2">{n.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}

/** Scroll window for one callout: draws in, holds, and (except the last step) clears before the next screen. */
function useWindow(p: MotionValue<number>, i: number, k: number, from: number, to: number) {
  const a = (i + 0.06 + k * 0.14) / N
  const b = (i + 0.34 + k * 0.14) / N
  const c = (i + 0.9) / N
  const d = (i + 0.99) / N
  const last = i === N - 1
  return useTransform(p, last ? [a, b] : [a, b, c, d], last ? [from, to] : [from, to, to, from])
}

function Line({ i, k, note, p, reduce }: { i: number; k: number; note: Note; p: MotionValue<number>; reduce: boolean }) {
  const draw = useWindow(p, i, k, 0, 1)
  const pathLength = useTransform(draw, v => (reduce ? (v > 0.01 ? 1 : 0) : v))
  const dot = useTransform(draw, [0, 0.2], [0, 1])
  const dx = SX + note.dot[0]
  const dy = SY + note.dot[1]
  const ny = note.y + 18
  const elbow = NOTE_X - 46
  return (
    <g>
      <motion.circle cx={dx} cy={dy} r={13} fill="none" stroke="#FFF" strokeWidth={1.5} style={{ scale: dot, opacity: dot }} />
      <motion.circle cx={dx} cy={dy} r={5} fill="#FF3864" style={{ scale: dot, opacity: dot }} />
      <motion.path d={`M${dx} ${dy} L${elbow} ${ny} H${NOTE_X - 12}`} fill="none" stroke="#171310" strokeWidth={1.5} style={{ pathLength, opacity: dot }} />
    </g>
  )
}

function NoteCard({ i, k, note, p }: { i: number; k: number; note: Note; p: MotionValue<number> }) {
  const t = useWindow(p, i, k, 0, 1)
  const opacity = useTransform(t, [0.4, 1], [0, 1])
  const x = useTransform(t, [0.4, 1], [28, 0])
  return (
    <motion.div className="absolute" style={{ left: NOTE_X, top: note.y, width: W - NOTE_X, opacity, x }}>
      <div className="flex items-baseline gap-3">
        <span className="font-serif text-lg italic text-orange">{String.fromCharCode(97 + k)}.</span>
        <div>
          <div className="font-display text-[30px] font-extrabold leading-tight tracking-[-0.035em] text-ink">{note.title}</div>
          <div className="mt-1 max-w-[300px] font-sans text-[16px] leading-relaxed text-ink-2">{note.body}</div>
        </div>
      </div>
    </motion.div>
  )
}

function StepTab({ i, label, on, p, onClick }: { i: number; label: string; on: boolean; p: MotionValue<number>; onClick: () => void }) {
  const fill = useTransform(p, [i / N, (i + 1) / N], [0, 1])
  return (
    <button type="button" onClick={onClick} className="group flex items-center gap-3 text-left">
      <span className={cn('w-6 font-serif text-[15px] italic transition-colors', on ? 'text-orange' : 'text-ink-3')}>0{i + 1}</span>
      <span className="relative h-[2px] w-16 overflow-hidden rounded-full bg-ink/10">
        <motion.span style={{ scaleX: fill }} className="absolute inset-0 origin-left bg-ink" />
      </span>
      <span className={cn('font-sans text-sm font-bold transition-colors', on ? 'text-ink' : 'text-ink-3 group-hover:text-ink-2')}>{label}</span>
    </button>
  )
}
