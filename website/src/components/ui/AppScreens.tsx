import Image from 'next/image'
import type { ReactNode } from 'react'
import { PHOTOS, SAMPLE_EVENTS, type SampleEvent } from '@/constants'
import { cn } from '@/lib/cn'
import { TicketCard } from './TicketCard'

// App-accurate dark screens used inside <Phone>. They follow the app's real
// UI: noir surfaces, brand-gradient CTA, crowd-mix line, masked address.

function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('rounded-full bg-white/12 px-2.5 py-1 font-sans text-[11px] font-bold text-noir-ink', className)}>{children}</span>
}

function BottomBar({ left, cta }: { left: string; cta: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-noir/95 p-3.5">
      <div className="font-display text-lg font-bold text-noir-ink">{left}</div>
      <div className="rounded-xl bg-brand px-4 py-2.5 font-sans text-[13px] font-bold text-white">{cta}</div>
    </div>
  )
}

export function EventDetailScreen({ event = SAMPLE_EVENTS[0], cta = 'Book Now', status }: { event?: SampleEvent; cta?: string; status?: ReactNode }) {
  return (
    <div className="h-full font-sans text-noir-ink">
      <div className="relative h-[46%]">
        <Image src={PHOTOS[event.photo]} alt="" fill sizes="400px" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-40% to-noir" />
      </div>
      <div className="relative -mt-7 px-4">
        <div className="flex gap-1.5"><Pill>{event.type}</Pill><Pill>21+</Pill>{event.mix && <Pill>{event.mix}</Pill>}</div>
        <div className="mt-2.5 font-display text-[22px] font-extrabold leading-tight">{event.title}</div>
        <div className="mt-3 rounded-2xl bg-noir-2 p-3 text-xs leading-[1.9] text-noir-ink-2">
          <div>{event.when}, 18 Oct</div>
          <div>{event.area}, {event.city} · exact address after you&apos;re in</div>
          <div>{event.going} going · 4 for women · 3 for men</div>
        </div>
        {status}
      </div>
      <BottomBar left={event.price} cta={cta} />
    </div>
  )
}

export function DiscoverScreen() {
  return (
    <div className="h-full px-3.5 pt-12 font-sans text-noir-ink">
      <div className="font-display text-xl font-extrabold">Events</div>
      <div className="text-[11px] text-noir-ink-2">Mumbai ▾</div>
      <div className="mt-3 flex gap-1.5">
        {['All', 'Free', 'Tonight', 'Weekend'].map((c, i) => (
          <span key={c} className={cn('rounded-full px-2.5 py-1 text-[11px] font-bold', i === 0 ? 'bg-noir-ink text-ink' : 'bg-noir-3 text-noir-ink-2')}>{c}</span>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-2.5">
        {SAMPLE_EVENTS.slice(0, 3).map(e => (
          <div key={e.id} className="overflow-hidden rounded-2xl bg-noir-2">
            <div className="relative h-24"><Image src={PHOTOS[e.photo]} alt="" fill sizes="300px" className="object-cover" /></div>
            <div className="p-2.5">
              <div className="font-display text-sm font-extrabold">{e.title}</div>
              <div className="text-[11px] text-noir-ink-2">{e.area} · {e.price}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PayScreen() {
  return (
    <div className="relative h-full font-sans text-noir-ink">
      <div className="absolute inset-0 opacity-40"><EventDetailScreen /></div>
      <div className="absolute inset-x-0 bottom-0 rounded-t-[28px] bg-noir-3 p-4">
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />
        <div className="font-display text-lg font-extrabold">Confirm booking</div>
        <div className="mt-3 space-y-1.5 text-xs text-noir-ink-2">
          <div className="flex justify-between"><span>Ticket</span><span>₹799</span></div>
          <div className="flex justify-between"><span>Platform fee</span><span>₹50</span></div>
          <div className="flex justify-between"><span>Gorave Wallet</span><span>−₹0</span></div>
          <div className="flex justify-between border-t border-white/10 pt-1.5 font-bold text-noir-ink"><span>To pay</span><span>₹849</span></div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {['GPay', 'PhonePe', 'Paytm'].map(a => <div key={a} className="rounded-xl bg-noir-2 py-2 text-center text-[11px] font-bold">{a}</div>)}
        </div>
        <div className="mt-3 rounded-xl bg-brand py-3 text-center text-[13px] font-bold text-white">Pay ₹849</div>
      </div>
    </div>
  )
}

export function TicketScreen() {
  return (
    <div className="flex h-full flex-col items-center px-5 pt-12 text-center font-sans text-noir-ink">
      <div className="font-display text-xl font-extrabold">You&apos;re going!</div>
      <div className="mb-3 mt-0.5 text-[11px] text-noir-ink-2">Terrace, Sea Breeze Apts · Carter Rd, Bandra W</div>
      <TicketCard width={232} backdrop="var(--color-noir)" />
    </div>
  )
}
