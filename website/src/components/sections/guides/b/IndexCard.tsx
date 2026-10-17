import Image from 'next/image'
import { PHOTOS } from '@/constants'
import type { HostGuide } from '@/lib/hostGuides'
import { cn } from '@/lib/cn'

// Ruled index-card paper: faint blue rules under a red margin line.
const RULED = {
  backgroundColor: '#fbf7ef',
  backgroundImage:
    'linear-gradient(to bottom, transparent 0 31px, rgb(255 56 100 / 0.55) 31px 33px, transparent 33px), repeating-linear-gradient(to bottom, transparent 0 25px, rgb(70 110 170 / 0.16) 25px 26px)',
} as const

/** A guide as a playbook card, photo on top, ruled paper below. Static, so any section can deal it. */
export function IndexCard({ guide, n, className, preload }: { guide: HostGuide; n: number; className?: string; preload?: boolean }) {
  return (
    <div className={cn('relative flex flex-col overflow-hidden rounded-[18px] text-ink shadow-[0_30px_60px_-24px_rgb(0_0_0/0.7)]', className)} style={{ backgroundColor: RULED.backgroundColor }}>
      <div className="relative h-[46%] shrink-0 overflow-hidden">
        <Image src={PHOTOS[guide.hero]} alt="" fill sizes="320px" preload={preload} className="object-cover" draggable={false} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-noir/80 px-2.5 py-1 font-sans text-[10px] font-bold uppercase tracking-[0.16em] text-noir-ink backdrop-blur">
          {guide.category}
        </span>
        <span className="absolute right-3 top-2 font-serif text-3xl italic text-white">{String(n).padStart(2, '0')}</span>
      </div>
      <div className="flex flex-1 flex-col px-5 pb-4 pt-3" style={RULED}>
        <div className="font-sans text-[10px] font-bold uppercase tracking-[0.2em] text-coral">Play {String(n).padStart(2, '0')}</div>
        <div className="mt-2.5 font-display text-[22px] font-extrabold leading-[1.04] tracking-[-0.035em]">{guide.title}</div>
        <div className="mt-auto flex items-center justify-between pt-3 font-sans text-xs font-bold text-ink-3">
          <span>{guide.readMinutes} min read</span>
          <span className="text-ink">Read →</span>
        </div>
      </div>
    </div>
  )
}
