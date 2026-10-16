'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { AVATARS, PHOTOS, templateImage } from '@/constants'
import { HOST_TEMPLATES, SAMPLE_REQUESTS, type BuildKey } from '@/lib/host'
import { TicketCard } from '@/components/ui/TicketCard'
import { cn } from '@/lib/cn'

// Host-side app screens for the sticky phone. Each takes `t` (0–1): how far
// through its step the reader has scrolled, so the screen fills in as you go.

const EVENT_NAME = 'Rooftop Sundowner'

export function BuildScreen({ step, t }: { step: BuildKey; t: number }) {
  if (step === 'create') return <CreateScreen t={t} />
  if (step === 'invite') return <InviteScreen t={t} />
  if (step === 'requests') return <RequestsScreen t={t} />
  return <DoorScreen t={t} />
}

function Header({ title, sub }: { title: string; sub: string }) {
  return (
    <div className="px-4 pt-12">
      <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-noir-ink-2">{sub}</div>
      <div className="font-display text-[22px] font-extrabold leading-tight">{title}</div>
    </div>
  )
}

function Field({ label, value, on }: { label: string; value: string; on: boolean }) {
  return (
    <div className={cn('rounded-2xl px-3.5 py-2.5 transition-colors duration-300', on ? 'bg-noir-3' : 'bg-noir-2')}>
      <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-noir-ink-2">{label}</div>
      <div className={cn('mt-0.5 min-h-[18px] text-[13px] font-bold transition-opacity duration-300', on ? 'opacity-100' : 'opacity-0')}>{value}</div>
    </div>
  )
}

function CreateScreen({ t }: { t: number }) {
  const typed = EVENT_NAME.slice(0, Math.round(Math.min(1, t / 0.45) * EVENT_NAME.length))
  const photos = [PHOTOS.roof1, PHOTOS.roof4, PHOTOS.drinks]
  return (
    <div className="h-full font-sans text-noir-ink">
      <Header sub="New event" title="Let's set it up" />
      <div className="mt-3 grid grid-cols-3 gap-1.5 px-4">
        {photos.map((src, i) => (
          <div key={src} className="relative aspect-square overflow-hidden rounded-xl bg-noir-2">
            <motion.div className="absolute inset-0" animate={{ opacity: t > i * 0.08 ? 1 : 0, scale: t > i * 0.08 ? 1 : 0.8 }} transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
              <Image src={src} alt="" fill sizes="100px" className="object-cover" />
            </motion.div>
          </div>
        ))}
      </div>
      <div className="mt-3 grid gap-2 px-4">
        <div className="rounded-2xl bg-noir-3 px-3.5 py-2.5">
          <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-noir-ink-2">Name</div>
          <div className="mt-0.5 min-h-[18px] text-[15px] font-bold">
            {typed}
            <span className="ml-px inline-block h-[14px] w-[2px] translate-y-[2px] bg-orange" />
          </div>
        </div>
        <Field label="Date" value="Sat, 18 Oct · 6 PM" on={t > 0.5} />
        <Field label="Area" value="Bandra West, Mumbai" on={t > 0.62} />
        <div className="flex items-center justify-between rounded-2xl bg-noir-2 px-3.5 py-2.5">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-noir-ink-2">Capacity</div>
            <div className="text-[13px] font-bold tabular-nums">{t > 0.74 ? 24 : '—'} guests</div>
          </div>
          <div className="flex gap-1.5">
            {['−', '+'].map(s => <span key={s} className="grid size-7 place-items-center rounded-full bg-noir-3 text-sm font-bold">{s}</span>)}
          </div>
        </div>
      </div>
      <div className="absolute inset-x-4 bottom-5">
        <div className={cn('rounded-2xl py-3 text-center text-[13px] font-bold transition-all duration-500', t > 0.86 ? 'bg-brand text-white' : 'bg-noir-3 text-noir-ink-2')}>
          Next: the invite
        </div>
      </div>
    </div>
  )
}

function InviteScreen({ t }: { t: number }) {
  const idx = Math.min(HOST_TEMPLATES.length - 1, Math.floor(t * HOST_TEMPLATES.length))
  const tpl = HOST_TEMPLATES[idx]
  return (
    <div className="h-full font-sans text-noir-ink">
      <Header sub="Step 2 of 3" title="Pick a look" />
      <div className="relative mx-4 mt-3 aspect-[3/4] overflow-hidden rounded-[20px]">
        <motion.div key={tpl} initial={{ opacity: 0, scale: 1.1 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.45 }} className="absolute inset-0">
          <Image src={templateImage(tpl)} alt="" fill sizes="300px" className="object-cover" />
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
        <div className="absolute inset-x-3 bottom-3">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/70">You&apos;re invited</div>
          <div className="font-display text-xl font-extrabold leading-none">{EVENT_NAME}</div>
          <div className="mt-1 text-[10px] font-bold text-white/80">Sat 6 PM · Bandra West</div>
        </div>
      </div>
      <div className="mt-2.5 flex justify-center gap-1.5 px-4">
        {HOST_TEMPLATES.map((name, i) => (
          <div key={name} className={cn('relative h-10 w-[30px] overflow-hidden rounded-md transition-all', i === idx ? 'ring-2 ring-orange' : 'opacity-50')}>
            <Image src={templateImage(name)} alt="" fill sizes="60px" className="object-cover" />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-4 bottom-5 rounded-2xl bg-brand py-3 text-center text-[13px] font-bold text-white">Share invite link</div>
    </div>
  )
}

// Which of the sample requests the demo host accepts — one is declined.
const DECISIONS = [true, true, false, true] as const

function RequestsScreen({ t }: { t: number }) {
  const reqs = SAMPLE_REQUESTS.slice(0, 4)
  const decided = (i: number) => t > 0.15 + i * 0.2
  const going = reqs.filter((_, i) => decided(i) && DECISIONS[i]).length
  return (
    <div className="h-full font-sans text-noir-ink">
      <Header sub={EVENT_NAME} title="Requests" />
      <div className="mx-4 mt-2 flex items-center justify-between rounded-2xl bg-noir-2 px-3.5 py-2 text-[11px] font-bold">
        <span className="text-noir-ink-2">Mix 50:50 · 10% open</span>
        <span className="tabular-nums">{12 + going}/24 going</span>
      </div>
      <div className="mt-2.5 grid gap-2 px-4">
        {reqs.map((r, i) => {
          const done = decided(i)
          const ok = DECISIONS[i]
          return (
            <motion.div key={r.name} layout className={cn('rounded-2xl bg-noir-2 p-2.5 transition-opacity', done && !ok && 'opacity-45')}>
              <div className="flex items-center gap-2.5">
                <Image src={AVATARS[r.avatar]} alt="" width={34} height={34} className="size-[34px] rounded-full object-cover" />
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold">{r.name}, {r.age}</div>
                  <div className="truncate text-[10px] text-noir-ink-2">{r.meta}</div>
                </div>
              </div>
              <div className="mt-2 h-7">
                {done ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn('grid h-7 place-items-center rounded-xl text-[11px] font-bold', ok ? 'bg-green/20 text-green' : 'bg-white/5 text-noir-ink-2')}
                  >
                    {ok ? 'Accepted — ticket sent' : 'Declined · can’t re-request'}
                  </motion.div>
                ) : (
                  <div className="grid h-7 grid-cols-2 gap-1.5 text-[11px] font-bold">
                    <span className="grid place-items-center rounded-xl bg-noir-3 text-noir-ink-2">Decline</span>
                    <span className="grid place-items-center rounded-xl bg-brand text-white">Accept</span>
                  </div>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function DoorScreen({ t }: { t: number }) {
  const scanned = t > 0.45
  return (
    <div className="relative h-full font-sans text-noir-ink">
      <Header sub="Doors open" title="Scan tickets" />
      <div className="relative mx-4 mt-3 grid h-[56%] place-items-center overflow-hidden rounded-[22px] bg-black">
        <motion.div animate={{ scale: scanned ? 0.92 : 1, rotate: scanned ? 0 : -4 }} transition={{ type: 'spring', stiffness: 160, damping: 18 }}>
          <TicketCard width={150} title={EVENT_NAME} date="Saturday, 18 October" time="6:00 PM IST" backdrop="#000" className="!shadow-none" />
        </motion.div>
        {/* viewfinder corners */}
        {['left-3 top-3 border-l-2 border-t-2', 'right-3 top-3 border-r-2 border-t-2', 'bottom-3 left-3 border-b-2 border-l-2', 'bottom-3 right-3 border-b-2 border-r-2'].map(c => (
          <span key={c} className={cn('absolute size-6 rounded-[4px] border-white/80', c)} />
        ))}
        {!scanned && (
          <motion.div
            className="absolute inset-x-5 h-[2px] bg-coral shadow-[0_0_16px_4px_rgb(255_56_100/0.6)]"
            animate={{ top: ['12%', '88%', '12%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {scanned && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 grid place-items-center bg-green/25 backdrop-blur-[2px]">
            <motion.div initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 14 }} className="grid size-16 place-items-center rounded-full bg-green text-3xl font-bold text-noir">
              ✓
            </motion.div>
          </motion.div>
        )}
      </div>
      <div className="mx-4 mt-3 rounded-2xl bg-noir-2 p-3">
        <div className="flex items-center justify-between text-[12px] font-bold">
          <span>{scanned ? 'Riya · checked in' : 'Point at a guest’s QR'}</span>
          <span className="tabular-nums text-noir-ink-2">{scanned ? 1 + Math.round((t - 0.45) * 20) : 0}/16 in</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-noir-3">
          <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${scanned ? ((1 + Math.round((t - 0.45) * 20)) / 16) * 100 : 0}%` }} />
        </div>
      </div>
    </div>
  )
}
