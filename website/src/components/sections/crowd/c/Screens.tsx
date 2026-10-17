import Image from 'next/image'
import { AVATARS } from '@/constants'
import type { CrowdContent } from '@/lib/crowd'
import { cn } from '@/lib/cn'
import type { CrowdKind } from './kit'

// The four phone states for "How it works", drawn as simple app UI. Only
// labels from the crowd copy, no names or numbers that aren't real.

interface ScreenProps {
  crowd: CrowdContent
  kind: CrowdKind
  title: string
}

function Bar({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 pb-3 pt-9">
      <span className="font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">{label}</span>
      <span className="size-6 rounded-full bg-brand" />
    </div>
  )
}

function Tick({ on = true }: { on?: boolean }) {
  return (
    <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-[13px] font-bold', on ? 'bg-green text-white' : 'bg-line text-ink-3')}>
      {on ? '✓' : ''}
    </span>
  )
}

function Toggle({ on }: { on: boolean }) {
  return (
    <span className={cn('relative h-6 w-10 shrink-0 rounded-full', on ? 'bg-brand' : 'bg-line')}>
      <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow', on ? 'left-[18px]' : 'left-0.5')} />
    </span>
  )
}

export function SetupScreen({ crowd, kind, title }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <Bar label="New event" />
      <div className="flex-1 space-y-4 p-5">
        <div>
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">Title</div>
          <div className="mt-1 font-display text-xl font-extrabold leading-tight tracking-[-0.03em] text-ink">{title}</div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-soft">
          <div className="font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-ink-3">{kind === 'age' ? 'Age gate' : kind === 'balanced' ? 'Crowd mix' : 'Who can join'}</div>
          {kind === 'women' && (
            <div className="mt-3 space-y-3">
              <div className="flex items-center justify-between font-sans text-[15px] font-bold text-ink-3">Everyone <Toggle on={false} /></div>
              <div className="flex items-center justify-between font-sans text-[15px] font-bold text-ink">Women-only <Toggle on /></div>
            </div>
          )}
          {kind === 'balanced' && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {['50:50', '60:40', '40:60', 'Custom'].map((m, i) => (
                <span key={m} className={cn('rounded-xl py-2.5 text-center font-sans text-sm font-bold', i === 0 ? 'bg-ink text-cream' : 'bg-tile text-ink-2')}>{m}</span>
              ))}
            </div>
          )}
          {kind === 'age' && (
            <div className="mt-3 flex gap-2">
              {['18+', '21+', '25+'].map(m => (
                <span key={m} className={cn('flex-1 rounded-xl py-2.5 text-center font-sans text-sm font-bold', m === crowd.label ? 'bg-ink text-cream' : 'bg-tile text-ink-2')}>{m}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="p-5"><div className="btn-shine rounded-full py-3.5 text-center font-sans text-[15px] font-bold text-white">Publish</div></div>
    </div>
  )
}

export function CheckScreen({ crowd, kind }: ScreenProps) {
  if (kind === 'balanced') {
    const rows = [
      { label: 'Women', fill: 0.45 },
      { label: 'Men', fill: 0.45 },
      { label: 'Open to anyone', fill: 0.1 },
    ]
    return (
      <div className="flex h-full flex-col">
        <Bar label="Seats" />
        <div className="flex-1 space-y-5 p-5">
          <div className="font-display text-xl font-extrabold leading-tight tracking-[-0.03em] text-ink">Held per side</div>
          {rows.map(r => (
            <div key={r.label}>
              <div className="font-sans text-sm font-bold text-ink-2">{r.label}</div>
              <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-tile">
                <div className="h-full origin-left rounded-full bg-brand" style={{ transform: `scaleX(${r.fill / 0.45})` }} />
              </div>
            </div>
          ))}
          <p className="font-sans text-[13px] leading-snug text-ink-3">{crowd.how[1].body}</p>
        </div>
      </div>
    )
  }
  const check = kind === 'women' ? 'Profile says woman' : `Profile age is ${crowd.label}`
  return (
    <div className="flex h-full flex-col">
      <Bar label="Your request" />
      <div className="flex-1 space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Image src={AVATARS[4]} alt="" width={52} height={52} className="size-[52px] rounded-full object-cover" />
          <div className="h-3 w-24 rounded-full bg-tile" />
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-soft">
          <div className="flex items-center justify-between gap-3 font-sans text-[15px] font-bold text-ink">{check} <Tick /></div>
          <div className="flex items-center justify-between gap-3 font-sans text-[15px] font-bold text-ink">Checked by the app <Tick /></div>
        </div>
        <p className="font-sans text-[13px] leading-snug text-ink-3">{crowd.how[1].body}</p>
      </div>
      <div className="p-5"><div className="rounded-full bg-ink py-3.5 text-center font-sans text-[15px] font-bold text-cream">Send request</div></div>
    </div>
  )
}

export function ApproveScreen({ kind }: ScreenProps) {
  // Women-only rooms only ever show women asking.
  const faces = kind === 'women' ? [0, 2, 4] : [0, 1, 3]
  return (
    <div className="flex h-full flex-col">
      <Bar label="Requests" />
      <div className="flex-1 space-y-3 p-5">
        {faces.map((a, i) => (
          <div key={a} className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-soft">
            <Image src={AVATARS[a]} alt="" width={40} height={40} className="size-10 rounded-full object-cover" />
            <div className="h-2.5 flex-1 rounded-full bg-tile" />
            {i === 0 ? (
              <span className="rounded-full bg-green px-3 py-1.5 font-sans text-xs font-bold text-white">Accepted</span>
            ) : (
              <span className="flex gap-1.5">
                <span className="rounded-full bg-tile px-2.5 py-1.5 font-sans text-xs font-bold text-ink-2">No</span>
                <span className="rounded-full bg-ink px-2.5 py-1.5 font-sans text-xs font-bold text-cream">Yes</span>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function DoorScreen({ crowd, kind, title }: ScreenProps) {
  if (kind === 'balanced') {
    return (
      <div className="flex h-full flex-col">
        <Bar label="Waitlist" />
        <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
          <svg viewBox="0 0 80 80" className="size-20" aria-hidden>
            <circle cx="40" cy="40" r="38" fill="#e9e1cf" />
            <circle cx="40" cy="40" r="22" fill="none" stroke="#171310" strokeWidth="4" />
            <path d="M40 28 V40 L48 46" fill="none" stroke="#ff6b35" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="mt-5 font-display text-2xl font-extrabold leading-tight tracking-[-0.03em] text-ink">{crowd.how[3].title}</div>
          <p className="mt-2 font-sans text-sm leading-snug text-ink-2">{crowd.how[3].body}</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex h-full flex-col">
      <Bar label="Your ticket" />
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="rounded-3xl bg-white p-4 shadow-soft">
          <Qr seed={crowd.slug} />
        </div>
        <div className="mt-5 font-display text-xl font-extrabold leading-tight tracking-[-0.03em] text-ink">{title}</div>
        <div className="mt-1 font-sans text-sm font-bold text-ink-3">Show this at the door</div>
      </div>
    </div>
  )
}

/** A decorative QR-like grid, deterministic from the seed. */
function Qr({ seed }: { seed: string }) {
  const N = 21
  let h = 2166136261
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619)
  const cells: [number, number][] = []
  const finder = (x: number, y: number) => (x < 8 && y < 8) || (x > N - 9 && y < 8) || (x < 8 && y > N - 9)
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      if (finder(x, y)) continue
      h = Math.imul(h ^ (x * 31 + y), 16777619)
      if (((h >>> 0) & 3) < 2) cells.push([x, y])
    }
  }
  const eye = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={7} height={7} fill="#171310" />
      <rect x={x + 1} y={y + 1} width={5} height={5} fill="#fff" />
      <rect x={x + 2} y={y + 2} width={3} height={3} fill="#171310" />
    </g>
  )
  return (
    <svg viewBox={`0 0 ${N} ${N}`} className="size-[150px]" shapeRendering="crispEdges" aria-hidden>
      {cells.map(([x, y]) => <rect key={`${x}.${y}`} x={x} y={y} width={1} height={1} fill="#171310" />)}
      {eye(0, 0)}
      {eye(N - 7, 0)}
      {eye(0, N - 7)}
    </svg>
  )
}
