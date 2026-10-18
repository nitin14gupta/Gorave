'use client'

import Image from 'next/image'
import { AVATARS, PHOTOS } from '@/constants'
import { EventDetailScreen } from '@/components/ui/AppScreens'
import { useLiveEvent } from '@/components/ui/LiveEvents'
import { cn } from '@/lib/cn'

// Extra app screens for the download page, drawn in the same noir UI as
// components/ui/AppScreens. Labels only, no made-up names or numbers.

/** Event detail with the free-event "request sent" state. */
export function RequestScreen({ index = 0 }: { index?: number }) {
  const event = useLiveEvent(index)
  return (
    <EventDetailScreen
      event={event}
      cta="Request to join"
      status={
        <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-green/15 px-3 py-2 text-[11px] font-bold text-green">
          <span className="flex size-4 items-center justify-center rounded-full bg-green text-[9px] text-noir">✓</span>
          Request sent. The host reviews it.
        </div>
      }
    />
  )
}

const WAVE = [6, 12, 18, 10, 22, 14, 26, 16, 9, 20, 28, 18, 12, 24, 15, 8, 19, 25, 13, 7, 17, 11]

export function SosScreen() {
  return (
    <div className="flex h-full flex-col px-4 pt-12 font-sans text-noir-ink">
      <div className="font-display text-xl font-extrabold">Safety</div>
      <div className="text-[11px] text-noir-ink-2">Only you can see this</div>
      <div className="mt-7 flex flex-col items-center">
        <div className="relative flex size-[156px] items-center justify-center rounded-full bg-coral/10">
          <div className="absolute inset-[14px] rounded-full bg-coral/15" />
          <div className="relative flex size-[100px] items-center justify-center rounded-full bg-coral font-display text-[30px] font-extrabold tracking-[-0.03em] text-white shadow-[0_18px_40px_-12px_rgb(255_56_100/0.7)]">
            SOS
          </div>
        </div>
        <div className="mt-4 text-center text-[12px] font-bold">Tap to send your location</div>
        <div className="mt-0.5 text-center text-[11px] text-noir-ink-2">Texted to your emergency contacts</div>
      </div>
      <div className="mt-6 rounded-2xl bg-noir-2 p-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold">Emergency contacts</span>
          <span className="text-noir-ink-2">up to 5</span>
        </div>
        <div className="mt-2.5 flex gap-2">
          {[0, 1, 2, 3, 4].map(i => (
            i < 3 ? (
              <Image key={i} src={AVATARS[i + 1]} alt="" width={34} height={34} sizes="68px" className="size-[34px] rounded-full object-cover ring-2 ring-coral/70" />
            ) : (
              <span key={i} className="flex size-[34px] items-center justify-center rounded-full border border-dashed border-white/25 text-sm text-noir-ink-2">+</span>
            )
          ))}
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-noir-2 p-3 text-[11px]">
        <span className="flex size-6 items-center justify-center rounded-full bg-green/20 text-green">●</span>
        <span><span className="font-bold">Phone-verified · 18+</span><span className="text-noir-ink-2"> · every guest</span></span>
      </div>
    </div>
  )
}

export function ProfileScreen() {
  return (
    <div className="h-full font-sans text-noir-ink">
      <div className="relative h-[40%]">
        <Image src={AVATARS[2]} alt="" fill sizes="400px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-30% to-noir" />
      </div>
      <div className="relative -mt-10 px-4">
        <div className="font-display text-[22px] font-extrabold leading-tight">Your profile</div>
        <div className="mt-0.5 text-[11px] text-noir-ink-2">Phone-verified · 18+</div>
        <div className="mt-3 flex items-center gap-2.5 rounded-2xl bg-noir-2 p-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand text-[11px] text-white">▶</span>
          <div className="flex h-7 flex-1 items-center gap-[2px]">
            {WAVE.map((h, i) => (
              <span key={i} className={cn('w-[3px] rounded-full', i < 9 ? 'bg-orange' : 'bg-white/25')} style={{ height: h }} />
            ))}
          </div>
          <span className="text-[10px] font-bold text-noir-ink-2">0:30</span>
        </div>
        <div className="mt-1 text-[10px] text-noir-ink-2">Voice intro</div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-noir-ink py-2 text-center text-[12px] font-bold text-ink">Vibers</div>
          <div className="rounded-xl bg-noir-3 py-2 text-center text-[12px] font-bold text-noir-ink-2">Vibing</div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {(['fr1', 'roof1', 'game1'] as const).map(p => (
            <div key={p} className="relative aspect-square overflow-hidden rounded-lg">
              <Image src={PHOTOS[p]} alt="" fill sizes="120px" className="object-cover" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Seg({ items, on }: { items: string[]; on: number }) {
  return (
    <div className="mt-2 flex gap-1 rounded-xl bg-noir-3 p-1">
      {items.map((t, i) => (
        <span key={t} className={cn('flex-1 rounded-lg py-1.5 text-center text-[11px] font-bold', i === on ? 'bg-noir-ink text-ink' : 'text-noir-ink-2')}>{t}</span>
      ))}
    </div>
  )
}

/** Host-side settings: crowd mix and age gate. */
export function CrowdScreen() {
  return (
    <div className="h-full px-4 pt-12 font-sans text-noir-ink">
      <div className="font-display text-xl font-extrabold">Who&apos;s coming</div>
      <div className="text-[11px] text-noir-ink-2">Host settings</div>
      <div className="mt-4 rounded-2xl bg-noir-2 p-3">
        <div className="text-[12px] font-bold">Crowd mix</div>
        <Seg items={['Open', '50:50', 'Women-only']} on={1} />
      </div>
      <div className="mt-2.5 rounded-2xl bg-noir-2 p-3">
        <div className="text-[12px] font-bold">Age gate</div>
        <Seg items={['18+', '21+', '25+']} on={1} />
      </div>
      <div className="mt-2.5 rounded-2xl bg-noir-2 p-3">
        <div className="flex items-center justify-between text-[12px] font-bold">
          <span>Approve every request</span>
          <span className="flex h-5 w-9 items-center justify-end rounded-full bg-green p-0.5"><span className="size-4 rounded-full bg-white" /></span>
        </div>
        <div className="mt-3 flex flex-col gap-2">
          {[3, 4, 5].map(a => (
            <div key={a} className="flex items-center gap-2">
              <Image src={AVATARS[a]} alt="" width={28} height={28} sizes="56px" className="size-7 rounded-full object-cover" />
              <span className="h-2 flex-1 rounded-full bg-white/10" />
              <span className="flex size-6 items-center justify-center rounded-full bg-noir-ink text-[11px] text-ink">✓</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/** Host-side: the money rules, straight from the hosting terms. */
export function HostScreen() {
  return (
    <div className="h-full px-4 pt-12 font-sans text-noir-ink">
      <div className="font-display text-xl font-extrabold">New event</div>
      <div className="text-[11px] text-noir-ink-2">Listing is free</div>
      <div className="mt-4 rounded-2xl bg-noir-2 p-3">
        <div className="text-[12px] font-bold">Entry</div>
        <Seg items={['Free', 'Paid']} on={1} />
        <div className="mt-2 text-[10px] text-noir-ink-2">2 free-entry events a month</div>
      </div>
      <div className="mt-2.5 rounded-2xl bg-noir-2 p-3">
        <div className="text-[12px] font-bold">Ticket price</div>
        <div className="mt-2 flex items-baseline justify-between rounded-xl bg-noir-3 px-3 py-2">
          <span className="font-display text-xl font-extrabold">₹99</span>
          <span className="text-[10px] text-noir-ink-2">and up</span>
        </div>
      </div>
      <div className="mt-2.5 rounded-2xl bg-brand p-3 text-white">
        <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/80">You keep</div>
        <div className="font-display text-[40px] font-extrabold leading-none tracking-[-0.04em]">90%</div>
        <div className="mt-1 text-[11px] text-white/85">of every ticket you sell</div>
      </div>
    </div>
  )
}
