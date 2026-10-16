import Image from 'next/image'
import { PHOTOS, type SampleEvent } from '@/constants'
import { AvatarStack, Chip } from './atoms'

/** The Gorave link preview — what a shared event looks like in a chat. */
export function InviteCard({ event, width = 270, tilt = 0 }: { event: SampleEvent; width?: number; tilt?: number }) {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-pop" style={{ width, rotate: `${tilt}deg` }}>
      <div className="relative" style={{ height: width * 0.62 }}>
        <Image src={event.image ?? PHOTOS[event.photo]} alt={event.title} fill sizes={`${width * 2}px`} className="object-cover" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Chip className="bg-white/90 text-ink">{event.when}</Chip>
          {event.mix && <Chip className="bg-white/90 text-ink">{event.mix}</Chip>}
        </div>
      </div>
      <div className="px-3.5 pb-3.5 pt-3">
        <div className="font-display text-lg font-extrabold tracking-[-0.02em] text-ink">{event.title}</div>
        <div className="mt-0.5 font-sans text-[13px] text-ink-3">{event.area}, {event.city} · {event.price}</div>
        <div className="mt-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AvatarStack n={3} size={22} ringClass="ring-white" />
            <span className="font-sans text-xs font-bold text-ink-2">{event.going} going</span>
          </div>
          <span className="rounded-full bg-ink px-3 py-1.5 font-sans text-xs font-bold text-cream">
            {event.request ? 'Request' : 'RSVP'}
          </span>
        </div>
      </div>
    </div>
  )
}
