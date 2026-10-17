import Image from 'next/image'
import Link from 'next/link'
import { PHOTOS, type SampleEvent } from '@/constants'
import { EventCard } from '@/components/ui/EventCard'
import { cn } from '@/lib/cn'
import { eventTime } from './kit'

/** A slim diary line for an event: thumbnail, time, title, area and price. */
export function DiaryRow({ e, className }: { e: SampleEvent; className?: string }) {
  return (
    <Link
      href={`/e/${e.id}`}
      className={cn(
        'group flex items-center gap-3 rounded-2xl p-2 pr-3 transition-[background-color,transform,box-shadow] duration-500 ease-out-expo hover:translate-x-1 hover:bg-white hover:shadow-soft',
        className,
      )}
    >
      <span className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-tile">
        <Image src={e.image ?? PHOTOS[e.photo]} alt="" fill sizes="112px" className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-110" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-[11px] font-bold uppercase tracking-[0.14em] text-orange">{eventTime(e)}</span>
        <span className="block truncate font-display text-[16px] font-extrabold leading-tight tracking-[-0.02em] text-ink">{e.title}</span>
        <span className="block truncate font-sans text-[12px] text-ink-3">{e.area} · {e.price}</span>
      </span>
    </Link>
  )
}

export interface DayGroup {
  key: string
  /** "17", "9 PM" */
  big: string
  /** "Saturday", "Doors" */
  serif: string
  /** "October · 6 nights" */
  sub: string
  events: SampleEvent[]
}

/**
 * Phones: one block per day (or hour), its header sticks under the navbar
 * while you scroll through it, and its events swipe sideways.
 */
export function MobileDays({ groups, browse, browseLabel }: { groups: DayGroup[]; browse: string; browseLabel: string }) {
  return (
    <div className="md:hidden">
      {groups.map(g => (
        <div key={g.key} className="relative pb-8">
          <div className="sticky top-[84px] z-10 -mx-6 flex items-end gap-3 border-b border-ink/15 bg-cream/95 px-6 pb-3 pt-3 backdrop-blur">
            <span className="font-display text-[56px] font-extrabold leading-[0.8] tracking-[-0.06em] text-ink">{g.big}</span>
            <span className="pb-0.5">
              <span className="block font-serif text-2xl italic leading-none text-orange">{g.serif}</span>
              <span className="mt-1 block font-sans text-[11px] font-bold uppercase tracking-[0.16em] text-ink-3">{g.sub}</span>
            </span>
          </div>
          <div className="-mx-6 mt-5 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {g.events.slice(0, 8).map(e => (
              <div key={e.id} className="snap-start">
                <EventCard event={e} width={268} />
              </div>
            ))}
            {g.events.length > 8 && (
              <Link href={browse} className="flex w-[180px] shrink-0 snap-start flex-col justify-end rounded-[28px] bg-white p-6 shadow-soft">
                <span className="font-serif text-4xl italic text-orange">+{g.events.length - 8}</span>
                <span className="mt-2 font-display text-xl font-extrabold leading-tight tracking-[-0.03em]">{browseLabel} →</span>
              </Link>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
