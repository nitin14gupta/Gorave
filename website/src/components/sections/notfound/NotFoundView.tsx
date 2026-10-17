'use client'

import Link from 'next/link'
import { useEffect, useRef } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from 'motion/react'
import { CITIES, POSTERS } from '@/constants'

// Only the app's real invite templates hide in the dark — no made-up event flyers.
const FLYERS = POSTERS.filter(p => p.kind === 'template')
import { Button } from '@/components/ui/Button'
import { Poster } from '@/components/ui/Poster'
import { TicketCard } from '@/components/ui/TicketCard'

const EASE = [0.2, 0.8, 0.2, 1] as const

// Flyers hidden in the dark — only the torch finds them. [left %, top %, rotate, poster index]
const HIDDEN: [number, number, number, number][] = [
  [6, 14, -9, 4], [24, 62, 7, 1], [44, 10, -4, 5], [63, 58, 10, 7], [80, 16, -7, 10], [88, 64, 5, 2],
]

/**
 * 404 — the lights are off and the bouncer can't find your name. A torch
 * follows the cursor and reveals the party hiding in the dark, while your
 * ticket gets scanned and stamped "not on the list".
 */
export function NotFoundView() {
  const ref = useRef<HTMLElement>(null)
  const mx = useMotionValue(50)
  const my = useMotionValue(45)
  const x = useSpring(mx, { stiffness: 110, damping: 20 })
  const y = useSpring(my, { stiffness: 110, damping: 20 })
  const mask = useMotionTemplate`radial-gradient(circle 240px at ${x}% ${y}%, #000 0%, #000 30%, transparent 100%)`
  const glowX = useTransform(x, v => `${v}%`)
  const glowY = useTransform(y, v => `${v}%`)

  // Touch screens: the torch sweeps the room by itself.
  useEffect(() => {
    if (window.matchMedia('(hover: hover)').matches) return
    const a = animate(mx, [50, 18, 70, 88, 35, 50], { duration: 14, repeat: Infinity, ease: 'easeInOut' })
    const b = animate(my, [45, 25, 70, 30, 60, 45], { duration: 14, repeat: Infinity, ease: 'easeInOut' })
    return () => { a.stop(); b.stop() }
  }, [mx, my])

  function onMove(e: React.PointerEvent) {
    const r = ref.current?.getBoundingClientRect()
    if (!r || e.pointerType !== 'mouse') return
    mx.set(((e.clientX - r.left) / r.width) * 100)
    my.set(((e.clientY - r.top) / r.height) * 100)
  }

  return (
    <main ref={ref} onPointerMove={onMove} className="relative min-h-[100svh] cursor-crosshair overflow-hidden bg-noir text-noir-ink">
      {/* The dark room: just the outline of a giant 404 */}
      <Giant404 className="text-transparent [-webkit-text-stroke:1.5px_rgb(245_240_235/0.1)]" />

      {/* What the torch sees: the filled 404 and the flyers hidden around the room */}
      <motion.div aria-hidden className="pointer-events-none absolute inset-0" style={{ maskImage: mask, WebkitMaskImage: mask }}>
        <Giant404 className="text-brand" />
        {HIDDEN.map(([l, t, r, p]) => (
          <div key={p} className="absolute hidden md:block" style={{ left: `${l}%`, top: `${t}%`, rotate: `${r}deg` }}>
            <Poster poster={FLYERS[p % FLYERS.length]} width={150} height={200} radius={12} />
          </div>
        ))}
      </motion.div>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute size-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange/10 blur-3xl"
        style={{ left: glowX, top: glowY }}
      />

      <div className="relative z-10 mx-auto grid min-h-[100svh] max-w-[1280px] items-end gap-12 px-6 pb-16 pt-32 md:px-20 lg:grid-cols-[1.25fr_1fr] lg:items-center">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, ease: EASE, delay: 0.2 }}>
          <div className="flex items-center gap-3 font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2">
            <span className="font-serif text-xl normal-case italic tracking-normal text-orange">404</span>
            <span className="h-px w-10 bg-noir-ink/25" />
            Wrong address
          </div>
          <h1 className="mt-5 font-display text-[clamp(52px,7.6vw,116px)] font-extrabold leading-[0.88] tracking-[-0.06em]">
            Your name&apos;s<br />not on <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">the list.</span>
          </h1>
          <p className="mt-6 max-w-[460px] font-sans text-xl leading-relaxed text-noir-ink-2">
            This page doesn&apos;t exist — or the host moved the party. The lights are off in here, but the night is still on somewhere.
          </p>

          <div className="mt-9 flex flex-wrap gap-2.5">
            <Button href="/" size="lg">Take me home</Button>
            <Button href="/host" kind="ghost" dark size="lg">Throw your own</Button>
          </div>

          <div className="mt-10 font-sans text-xs font-bold uppercase tracking-[0.18em] text-noir-ink-2">Or find the party in</div>
          <div className="mt-3 flex max-w-[560px] flex-wrap gap-2">
            {CITIES.map((c, i) => (
              <motion.div key={c.slug} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE, delay: 0.6 + i * 0.05 }}>
                <Link
                  href={`/${c.slug}`}
                  className="block rounded-full bg-white/[0.06] px-4 py-2 font-sans text-sm font-bold text-noir-ink transition-[background-color,transform] duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-brand"
                >
                  {c.name}
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <ScanDesk />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-5 z-10 hidden text-center font-sans text-xs font-bold uppercase tracking-[0.2em] text-noir-ink-2/60 md:block">
        Lights are off — move your torch around
      </div>
    </main>
  )
}

function Giant404({ className }: { className: string }) {
  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-0 flex select-none items-center justify-center font-display text-[46vw] font-extrabold leading-none tracking-[-0.08em] lg:text-[36vw] ${className}`}
    >
      404
    </div>
  )
}

/** The bouncer's desk: your ticket gets scanned, fails, and gets stamped. */
function ScanDesk() {
  return (
    <div className="relative mx-auto hidden h-[440px] w-[320px] sm:block" style={{ perspective: 1000 }}>
      <motion.div
        initial={{ opacity: 0, rotateX: 30, y: 60, rotate: -6 }}
        animate={{ opacity: 1, rotateX: 0, y: 0, rotate: [-6, -6, -4, -8, -5, -6] }}
        transition={{ opacity: { duration: 0.8, delay: 0.3 }, rotateX: { duration: 0.9, ease: EASE, delay: 0.3 }, y: { duration: 0.9, ease: EASE, delay: 0.3 }, rotate: { duration: 0.5, delay: 2.6 } }}
        className="absolute left-1/2 top-4 -translate-x-1/2"
      >
        <TicketCard title="The Party You Were Looking For" admission="Guest list · 1" date="Tonight, somewhere" time="404 PM IST" width={280} backdrop="var(--color-noir)" />

        {/* Laser sweeps the ticket three times */}
        <motion.div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-12px] h-[3px] rounded-full bg-coral shadow-[0_0_18px_4px_rgb(255_56_100/0.7)]"
          initial={{ top: '8%', opacity: 0 }}
          animate={{ top: ['8%', '92%', '8%', '92%', '8%', '92%'], opacity: [0, 1, 1, 1, 1, 0] }}
          transition={{ duration: 1.8, delay: 0.9, ease: 'easeInOut' }}
        />

        {/* Stamp slams in */}
        <motion.div
          initial={{ opacity: 0, scale: 2.6, rotate: -28 }}
          animate={{ opacity: 1, scale: 1, rotate: -14 }}
          transition={{ delay: 2.6, type: 'spring', stiffness: 520, damping: 18 }}
          className="absolute left-1/2 top-[42%] -translate-x-1/2 whitespace-nowrap rounded-xl border-[3px] border-coral px-4 py-2 text-center font-display text-[26px] font-extrabold uppercase leading-none tracking-[-0.02em] text-coral mix-blend-screen"
        >
          Not on the list
          <div className="mt-1 font-sans text-[10px] font-bold tracking-[0.24em]">Error 404 · Door scan</div>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3.1, duration: 0.6 }}
        className="absolute inset-x-0 bottom-0 text-center font-sans text-sm font-bold text-noir-ink-2"
      >
        Scan failed — ticket not found
      </motion.div>
    </div>
  )
}
