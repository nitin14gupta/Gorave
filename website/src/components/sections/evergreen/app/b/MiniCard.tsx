import Image from 'next/image'
import { PHOTOS, type SampleEvent } from '@/constants'
import { Chip } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

/** A real event as a flat card for the fanned stacks (decorative, not a link). */
export function MiniCard({ event, width = 220, className }: { event: SampleEvent; width?: number; className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-[24px] bg-white shadow-pop', className)} style={{ width }}>
      <div className="relative overflow-hidden" style={{ height: Math.round(width * 0.82) }}>
        <Image src={event.image ?? PHOTOS[event.photo]} alt="" fill sizes={`${width * 2}px`} className="object-cover" />
        <div className="absolute left-2.5 top-2.5 flex gap-1">
          <Chip className="bg-white/90 !px-2.5 !py-1 text-[11px] text-ink">{event.when}</Chip>
        </div>
      </div>
      <div className="p-3.5">
        <div className="line-clamp-1 font-display text-[17px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{event.title}</div>
        <div className="mt-0.5 line-clamp-1 font-sans text-[12px] text-ink-3">{event.area} · {event.price}</div>
      </div>
    </div>
  )
}
