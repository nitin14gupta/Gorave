'use client'

import { useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { DEMO_REQUESTS } from '@/lib/safety'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

const EASE = [0.2, 0.8, 0.2, 1] as const
type Verdict = 'in' | 'out'
type Req = (typeof DEMO_REQUESTS)[number]
const SEATS = 4 // per side, 50:50 demo

/**
 * Chapter 05, the door list, from the host's side. A stack of join
 * requests: drag the top card right to accept or left to decline (or use
 * the buttons). Declined cards are stamped, they can't ask again.
 */
export function RequestsB() {
  const [verdicts, setVerdicts] = useState<Record<string, Verdict>>({})
  const [lastOut, setLastOut] = useState<Verdict>('in')
  const queue = DEMO_REQUESTS.filter(r => !verdicts[r.name])
  const accepted = DEMO_REQUESTS.filter(r => verdicts[r.name] === 'in')
  const declined = DEMO_REQUESTS.filter(r => verdicts[r.name] === 'out')
  const women = accepted.filter(r => r.gender === 'Woman').length
  const men = accepted.length - women

  function decide(name: string, v: Verdict) {
    setLastOut(v)
    setVerdicts(prev => ({ ...prev, [name]: v }))
  }

  return (
    <section className="overflow-hidden bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-16 lg:grid-cols-[1fr_1fr]">
        <div>
          <Chapter n="05" title="The door list" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Hosts choose<br /><span className="font-serif font-normal italic tracking-[-0.03em] text-brand">who comes.</span>
          </h2>
          <p className="mt-5 max-w-[460px] font-sans text-lg leading-relaxed text-noir-ink-2">
            For free events, nobody just turns up. Hosts see each person&apos;s profile before they accept, and a declined request can&apos;t be sent again. Try it, you&apos;re the host.
          </p>

          <div className="mt-9 grid max-w-[460px] grid-cols-2 gap-3">
            <Tally label="Women" n={women} color="bg-coral" />
            <Tally label="Men" n={men} color="bg-orange" />
          </div>
          <div className="mt-3 font-sans text-xs font-bold uppercase tracking-[0.16em] text-noir-ink-2">Crowd mix · 50:50</div>
        </div>

        <div className="relative mx-auto h-[440px] w-full max-w-[380px]">
          <AnimatePresence custom={lastOut}>
            {queue.slice(0, 3).reverse().map((r, idx, arr) => {
              const depth = arr.length - 1 - idx
              return <Card key={r.name} r={r} depth={depth} top={depth === 0} onDecide={v => decide(r.name, v)} />
            })}
          </AnimatePresence>

          {queue.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 grid place-items-center rounded-[28px] border border-dashed border-white/15 p-8 text-center">
              <div>
                <div className="font-display text-2xl font-extrabold tracking-[-0.03em]">Room sorted.</div>
                <div className="mt-1 font-sans text-sm text-noir-ink-2">{accepted.length} accepted · {declined.length} declined</div>
                {declined.length > 0 && <div className="mt-3 font-sans text-xs text-noir-ink-2">Declined: {declined.map(d => d.name).join(', ')}, can&apos;t re-request</div>}
                <button type="button" onClick={() => setVerdicts({})} className="mt-5 rounded-full bg-noir-3 px-4 py-2 font-sans text-sm font-bold transition-colors hover:bg-noir-2">↺ Start over</button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}

function Tally({ label, n, color }: { label: string; n: number; color: string }) {
  return (
    <div className="rounded-2xl bg-noir-2 p-4">
      <div className="flex items-baseline justify-between font-sans text-sm font-bold">
        {label}<span className="tabular-nums text-noir-ink-2">{n}/{SEATS}</span>
      </div>
      <div className="mt-3 flex gap-1.5">
        {Array.from({ length: SEATS }, (_, i) => (
          <motion.span key={i} className={cn('h-2 flex-1 rounded-full', i < n ? color : 'bg-white/10')} animate={{ scaleY: i < n ? [1, 1.8, 1] : 1 }} transition={{ duration: 0.4 }} />
        ))}
      </div>
    </div>
  )
}

function Card({ r, depth, top, onDecide }: { r: Req; depth: number; top: boolean; onDecide: (v: Verdict) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-14, 14])
  const yes = useTransform(x, [20, 110], [0, 1])
  const no = useTransform(x, [-110, -20], [1, 0])

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > 110) onDecide('in')
    else if (info.offset.x < -110) onDecide('out')
  }

  return (
    <motion.div
      className={cn('absolute inset-x-0 top-0 rounded-[28px] bg-noir-ink p-6 text-ink shadow-pop', top ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none')}
      style={{ x, rotate, zIndex: 10 - depth }}
      drag={top ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      initial={{ scale: 0.9, y: 40, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 18, opacity: depth > 1 ? 0.6 : 1 }}
      exit="gone"
      variants={{ gone: (v: Verdict) => ({ x: v === 'in' ? 420 : -420, opacity: 0, transition: { duration: 0.45, ease: EASE } }) }}
      transition={{ duration: 0.45, ease: EASE }}
      whileHover={top ? { y: -4 } : undefined}
    >
      <motion.div style={{ opacity: yes }} className="absolute right-6 top-6 rotate-6 rounded-xl border-[3px] border-green px-3 py-1 font-display text-xl font-extrabold uppercase text-green">Accept</motion.div>
      <motion.div style={{ opacity: no }} className="absolute left-6 top-6 -rotate-6 rounded-xl border-[3px] border-coral px-3 py-1 font-display text-xl font-extrabold uppercase text-coral">Decline</motion.div>

      <div className="grid size-20 place-items-center rounded-full bg-brand font-display text-3xl font-extrabold text-white">{r.name[0]}</div>
      <div className="mt-5 font-display text-3xl font-extrabold tracking-[-0.04em]">{r.name}, {r.age}</div>
      <div className="mt-2 flex flex-wrap gap-1.5 font-sans text-xs font-bold">
        <span className="rounded-full bg-green/15 px-2.5 py-1 text-[#00865f]">✓ Phone verified</span>
        <span className="rounded-full bg-ink/5 px-2.5 py-1 text-ink-2">{r.gender}</span>
        {r.mutuals > 0 && <span className="rounded-full bg-ink/5 px-2.5 py-1 text-ink-2">{r.mutuals} mutuals</span>}
      </div>
      <p className="mt-4 font-sans text-[15px] text-ink-2">{r.note}</p>
      <div className="mt-6 flex gap-2">
        <button type="button" disabled={!top} onClick={() => onDecide('out')} className="flex-1 rounded-full bg-ink/5 py-3 font-sans text-sm font-bold text-ink transition-colors hover:bg-ink/10">Decline</button>
        <button type="button" disabled={!top} onClick={() => onDecide('in')} className="flex-1 rounded-full bg-ink py-3 font-sans text-sm font-bold text-cream transition-transform hover:-translate-y-px">Accept</button>
      </div>
      <div className="mt-3 text-center font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Demo · drag or tap</div>
    </motion.div>
  )
}
