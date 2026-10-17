'use client'

import Image from 'next/image'
import { useRef, type ReactNode } from 'react'
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from 'motion/react'
import type { SampleEvent } from '@/constants'
import { HOST_FEES } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { EASE, ProofLink, eventImage } from '../shared'

// A fixed 9×9 pattern: looks like a QR code, encodes nothing.
const QR = ['111101111', '100101001', '101100101', '000011000', '110101011', '001010100', '111100101', '100101110', '111101011']

/**
 * Chapter 04, how it works. Three steps from the couch to someone's place,
 * joined by a thread that draws itself as you scroll. Then the other way
 * in: hosting your own.
 */
export function HowItWorks({ events }: { events: SampleEvent[] }) {
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.8', 'end 0.6'] })
  const pathLength = useSpring(useTransform(scrollYProgress, [0, 1], [0, 1]), { stiffness: 80, damping: 24 })
  const ev = events[0]

  const steps: { n: string; title: string; body: string; link: { href: string; label: string }; art: ReactNode }[] = [
    {
      n: '1',
      title: 'Find a night',
      body: 'Browse what’s on tonight or this weekend near you. You see the vibe, the price and the area. Never the flat.',
      link: { href: '/tonight', label: 'See tonight' },
      art: ev ? (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-2.5 shadow-soft">
          <div className="relative size-14 shrink-0 overflow-hidden rounded-xl">
            <Image src={eventImage(ev)} alt="" fill sizes="56px" className="object-cover" />
          </div>
          <div className="min-w-0">
            <div className="truncate font-display text-[17px] font-extrabold tracking-[-0.03em]">{ev.title}</div>
            <div className="truncate font-sans text-xs font-bold text-ink-3">{ev.area} · {ev.when}</div>
          </div>
          <div className="ml-auto shrink-0 rounded-full bg-cream px-2.5 py-1 font-sans text-xs font-bold">{ev.price}</div>
        </div>
      ) : (
        <Chip>House party · Rooftop · Game night</Chip>
      ),
    },
    {
      n: '2',
      title: 'Request or book',
      body: 'Ask to join a free night, or book a paid one in the app with UPI. Once you’re confirmed, the exact address unlocks.',
      link: { href: '/safety', label: 'How addresses stay private' },
      art: (
        <div className="flex flex-col items-start gap-2">
          <Chip>Request sent</Chip>
          <Chip tone="ink" className="ml-6">You’re in ✓</Chip>
          <Chip tone="brand" className="ml-12">Address unlocked</Chip>
        </div>
      ),
    },
    {
      n: '3',
      title: 'Show up, scan in',
      body: 'Your ticket is a QR code. The host scans it at the door, so the room is the people who were confirmed.',
      link: { href: '/app', label: 'Get the app' },
      art: (
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
          <svg viewBox="0 0 9 9" className="size-14 shrink-0" shapeRendering="crispEdges" aria-hidden>
            {QR.flatMap((row, y) => [...row].map((c, x) => (c === '1' ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="#171310" /> : null)))}
          </svg>
          <div>
            <div className="font-display text-[17px] font-extrabold tracking-[-0.03em]">Your ticket</div>
            <div className="font-sans text-xs font-bold text-ink-3">Scanned at the door</div>
          </div>
        </div>
      ),
    },
  ]

  return (
    <section className="overflow-x-clip bg-cream px-6 py-28 md:px-20 md:py-36">
      <div className="mx-auto max-w-[1280px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <Chapter n="04" title="How it works" />
            <h2 className="mt-4 font-display text-[clamp(44px,6vw,92px)] font-extrabold leading-[0.9] tracking-[-0.055em]">
              Three steps to <br className="hidden md:block" />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">someone’s place.</span>
            </h2>
          </div>
          <p className="max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">The whole night lives in the app, from finding it to getting through the door.</p>
        </div>

        <div ref={ref} className="relative mt-16 md:mt-24">
          {/* the thread */}
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 top-0 hidden h-[120px] w-full md:block" aria-hidden>
            <motion.path
              d="M40 60 C 220 -10, 330 130, 440 60 S 700 -10, 800 60 S 1060 130, 1160 60"
              fill="none"
              stroke="#FF6B35"
              strokeWidth={2}
              strokeDasharray="6 8"
              vectorEffect="non-scaling-stroke"
              style={{ pathLength: reduce ? 1 : pathLength }}
            />
          </svg>
          <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
            {steps.map((s, i) => (
              <motion.li
                key={s.n}
                initial={reduce ? false : { opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-12% 0px' }}
                transition={{ duration: 0.9, ease: EASE, delay: i * 0.12 }}
                className="group min-w-0"
              >
                <div className="grid place-items-start md:h-[120px] md:place-items-center">
                  <div className="grid size-16 place-items-center rounded-full bg-paper font-serif text-4xl md:size-[92px] md:text-5xl italic text-orange shadow-soft transition-transform duration-500 ease-out-expo group-hover:-rotate-6 group-hover:scale-105">
                    {s.n}
                  </div>
                </div>
                <div className="mt-4 rounded-[28px] bg-paper p-6 md:mt-6 transition-transform duration-500 ease-out-expo group-hover:-translate-y-1.5 md:p-7">
                  <div className="flex min-h-[132px] items-center rounded-[20px] bg-cream p-4">
                    <div className="w-full">{s.art}</div>
                  </div>
                  <h3 className="mt-6 font-display text-[32px] font-extrabold leading-none tracking-[-0.045em]">{s.title}</h3>
                  <p className="mt-3 font-sans text-[16.5px] leading-relaxed text-ink-2">{s.body}</p>
                  <ProofLink href={s.link.href} className="mt-5">{s.link.label}</ProofLink>
                </div>
              </motion.li>
            ))}
          </ol>
        </div>

        {/* the other way in */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="mt-10 flex flex-col gap-6 rounded-[28px] bg-blush p-7 md:mt-14 md:flex-row md:items-center md:justify-between md:p-10"
        >
          <div>
            <div className="font-serif text-2xl italic text-blush-ink/70">Or, open your door.</div>
            <div className="mt-1 font-display text-[clamp(30px,3.4vw,48px)] font-extrabold leading-[0.95] tracking-[-0.045em] text-blush-ink">
              List free. Set the room. Keep {Math.round(HOST_FEES.hostShare * 100)}%.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
            <Button href="/host" size="lg">Host your own</Button>
            <ProofLink href="/host/guides">Read the host guides</ProofLink>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

const TONES = { white: 'bg-white text-ink', ink: 'bg-ink text-cream', brand: 'bg-brand text-white' }

function Chip({ children, className, tone = 'white' }: { children: ReactNode; className?: string; tone?: keyof typeof TONES }) {
  return <span className={cn('inline-flex rounded-full px-3.5 py-2 font-sans text-[13px] font-bold shadow-soft', TONES[tone], className)}>{children}</span>
}
