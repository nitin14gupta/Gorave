'use client'

import Image from 'next/image'
import { useState } from 'react'
import { AnimatePresence, motion, useMotionValue, useTransform, type PanInfo } from 'motion/react'
import { AVATARS } from '@/constants'
import { SAMPLE_REQUESTS } from '@/lib/host'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

type Req = (typeof SAMPLE_REQUESTS)[number]
type Verdict = 'in' | 'out'

const THRESHOLD = 110

// Exit direction comes from AnimatePresence's `custom`the verdict just made.
const EXIT = {
  gone: (dir: Verdict) => ({ x: dir === 'in' ? 420 : -420, rotate: dir === 'in' ? 24 : -24, opacity: 0, transition: { duration: 0.4 } }),
}

/**
 * Chapter 03, the door list. A stack of join requests: drag right to let
 * someone in, left to pass (or use the buttons). Accepted guests land on the
 * list; declined ones are stamped, they can't ask again.
 */
export function RequestInbox() {
  const [decided, setDecided] = useState<{ req: Req; v: Verdict }[]>([])
  const [exitDir, setExitDir] = useState<Verdict>('in')
  const left = SAMPLE_REQUESTS.filter(r => !decided.some(d => d.req.name === r.name))
  const accepted = decided.filter(d => d.v === 'in')
  const declined = decided.filter(d => d.v === 'out')

  function decide(req: Req, v: Verdict) {
    setExitDir(v)
    setDecided(d => [...d, { req, v }])
  }

  return (
    <section className="overflow-hidden bg-noir px-6 py-24 text-noir-ink md:px-20 md:py-32">
      <div className="mx-auto grid max-w-[1280px] items-center gap-14 lg:grid-cols-[1fr_auto_0.9fr]">
        <div>
          <Chapter n="03" title="The door list" dark />
          <h2 className="mt-4 font-display text-[clamp(44px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
            Who&apos;s on<br />the list?
          </h2>
          <p className="mt-4 max-w-[420px] font-sans text-lg leading-relaxed text-noir-ink-2">
            Free events are request-to-join. Requests come in as pushes; you see each profile and decide. Paid events book instantly, and when it&apos;s full, there&apos;s a waitlist.
          </p>
          <p className="mt-6 font-sans text-xs font-bold uppercase tracking-[0.16em] text-noir-ink-2/70">Try it: drag a card or tap the buttons</p>
        </div>

        <div className="relative mx-auto h-[440px] w-[300px]">
          <AnimatePresence custom={exitDir}>
            {left
              .slice(0, 3)
              .reverse()
              .map((r, idx, arr) => {
                const depth = arr.length - 1 - idx
                return <RequestCard key={r.name} req={r} depth={depth} onDecide={v => decide(r, v)} />
              })}
          </AnimatePresence>
          {left.length === 0 && (
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 grid place-items-center rounded-[30px] border-2 border-dashed border-noir-ink/15 text-center">
              <div>
                <div className="font-display text-3xl font-extrabold">List&apos;s done.</div>
                <button type="button" onClick={() => setDecided([])} className="mt-4 rounded-full bg-noir-ink px-5 py-2.5 font-sans text-sm font-bold text-ink">
                  Run it again
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <div className="grid gap-6">
          <Column title="On the list" count={accepted.length} tone="in">
            {accepted.map(d => (
              <motion.li key={d.req.name} layout initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl bg-noir-2 p-2.5 pr-4">
                <Image src={AVATARS[d.req.avatar]} alt="" width={32} height={32} className="size-8 rounded-full object-cover" />
                <span className="flex-1 font-sans text-sm font-bold">{d.req.name}</span>
                <span className="font-sans text-xs font-bold text-green">Ticket sent</span>
              </motion.li>
            ))}
          </Column>
          <Column title="Passed" count={declined.length} tone="out">
            {declined.map(d => (
              <motion.li key={d.req.name} layout initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 rounded-2xl bg-noir-2/60 p-2.5 pr-4 opacity-70">
                <Image src={AVATARS[d.req.avatar]} alt="" width={32} height={32} className="size-8 rounded-full object-cover grayscale" />
                <span className="flex-1 font-sans text-sm font-bold line-through">{d.req.name}</span>
                <span className="font-sans text-xs font-bold text-noir-ink-2">Can&apos;t re-request</span>
              </motion.li>
            ))}
          </Column>
        </div>
      </div>
    </section>
  )
}

function Column({ title, count, tone, children }: { title: string; count: number; tone: Verdict; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between font-sans text-xs font-bold uppercase tracking-[0.16em]">
        <span className={tone === 'in' ? 'text-green' : 'text-noir-ink-2'}>{title}</span>
        <span className="tabular-nums text-noir-ink-2">{count}</span>
      </div>
      <ul className="mt-3 grid min-h-[52px] gap-2 rounded-[22px] border border-dashed border-noir-ink/10 p-2">{children}</ul>
    </div>
  )
}

function RequestCard({ req, depth, onDecide }: { req: Req; depth: number; onDecide: (v: Verdict) => void }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-220, 220], [-16, 16])
  const inOpacity = useTransform(x, [20, THRESHOLD], [0, 1])
  const outOpacity = useTransform(x, [-THRESHOLD, -20], [1, 0])
  const top = depth === 0

  function onDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x > THRESHOLD || info.velocity.x > 600) onDecide('in')
    else if (info.offset.x < -THRESHOLD || info.velocity.x < -600) onDecide('out')
  }

  return (
    <motion.div
      className={cn('absolute inset-0 touch-pan-y', top ? 'cursor-grab active:cursor-grabbing' : 'pointer-events-none')}
      style={{ x, rotate, zIndex: 10 - depth }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.05, y: depth * 18, opacity: 1 - depth * 0.25 }}
      variants={EXIT}
      exit="gone"
      transition={{ type: 'spring', stiffness: 300, damping: 26 }}
      drag={top ? 'x' : false}
      dragSnapToOrigin
      dragElastic={0.7}
      onDragEnd={onDragEnd}
      whileDrag={{ scale: 1.03 }}
    >
      <div className="relative flex h-full flex-col overflow-hidden rounded-[30px] bg-noir-2 shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.06)]">
        <div className="relative h-[230px]">
          <Image src={AVATARS[req.avatar]} alt="" fill sizes="300px" className="object-cover" draggable={false} />
          <div className="absolute inset-0 bg-gradient-to-t from-noir-2 to-transparent" />
          <motion.div style={{ opacity: inOpacity }} className="absolute left-5 top-5 rotate-[-12deg] rounded-lg border-[3px] border-green px-3 py-1 font-display text-2xl font-extrabold uppercase text-green">
            Let in
          </motion.div>
          <motion.div style={{ opacity: outOpacity }} className="absolute right-5 top-5 rotate-[12deg] rounded-lg border-[3px] border-coral px-3 py-1 font-display text-2xl font-extrabold uppercase text-coral">
            Pass
          </motion.div>
        </div>
        <div className="-mt-6 flex flex-1 flex-col px-5 pb-5">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-noir-ink-2">Wants to join</div>
          <div className="font-display text-[28px] font-extrabold leading-tight">{req.name}, {req.age}</div>
          <div className="font-sans text-xs text-noir-ink-2">{req.meta}</div>
          <div className="mt-2 font-serif text-lg italic text-noir-ink/85">&ldquo;{req.note}&rdquo;</div>
          <div className="mt-auto grid grid-cols-2 gap-2">
            <button type="button" disabled={!top} onClick={() => onDecide('out')} className="rounded-2xl bg-noir-3 py-3 font-sans text-sm font-bold text-noir-ink-2 transition-colors hover:text-noir-ink">
              Decline
            </button>
            <button type="button" disabled={!top} onClick={() => onDecide('in')} className="rounded-2xl bg-brand py-3 font-sans text-sm font-bold text-white">
              Accept
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
