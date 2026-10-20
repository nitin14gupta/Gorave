import Image from 'next/image'
import Link from 'next/link'
import { PHOTOS, type SampleEvent } from '@/constants'
import { cn } from '@/lib/cn'
import { AvatarStack, Chip } from './atoms'

/** Fixed `width` for rails; omit it to fill a grid cell. */
export function EventCard({ event, width }: { event: SampleEvent; width?: number }) {
  return (
    <Link
      href={`/e/${event.id}`}
      draggable={false}
      className={cn(
        'group block overflow-hidden rounded-[28px] bg-white shadow-soft transition-[transform,box-shadow] duration-500 ease-out-expo hover:-translate-y-1.5 hover:-rotate-[0.6deg] hover:shadow-pop',
        width ? 'shrink-0' : 'w-full',
      )}
      style={width ? { width } : undefined}
    >
      <div className="relative aspect-[4/5] overflow-hidden">
        <Image
          src={event.image ?? PHOTOS[event.photo]}
          alt={event.title}
          fill
          sizes={width ? `${width * 2}px` : '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw'}
          draggable={false}
          className="object-cover transition-transform duration-[900ms] ease-out-expo group-hover:scale-[1.06]"
        />
        <div className="absolute left-3 top-3 flex gap-1.5">
          <Chip className="bg-white/90 text-ink">{event.when}</Chip>
          {event.request && <Chip className="bg-white/90 text-ink">Request to join</Chip>}
        </div>
      </div>
      <div className="p-4">
        <div className="font-display text-[19px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{event.title}</div>
        <div className="mt-1 font-sans text-[13px] text-ink-3">{event.area} · {event.price}</div>
        <div className="mt-3 flex items-center gap-2">
          <AvatarStack n={3} size={22} ringClass="ring-white" />
          <span className="font-sans text-xs font-bold text-ink-2">{event.going} going</span>
        </div>
      </div>
    </Link>
  )
}
