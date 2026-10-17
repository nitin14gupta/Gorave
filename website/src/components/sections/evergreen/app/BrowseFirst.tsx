import Link from 'next/link'
import { cn } from '@/lib/cn'
import { BROWSE } from './data'

/** "Browse on the web first": five real pages, as big tappable chips. */
export function BrowseFirst({ className, title = 'Not ready to download? Browse on the web first.' }: { className?: string; title?: string }) {
  return (
    <div className={className}>
      <div className="font-sans text-sm font-bold text-ink-2">{title}</div>
      <div className="mt-4 flex flex-wrap gap-2.5">
        {BROWSE.map(b => (
          <Link
            key={b.href}
            href={b.href}
            className={cn(
              'group inline-flex items-center gap-3 rounded-full bg-white/80 py-2.5 pl-5 pr-3 shadow-[inset_0_0_0_1.5px_rgb(23_19_16/0.08)]',
              'transition-[transform,background-color] duration-300 ease-out-expo hover:-translate-y-0.5 hover:bg-white',
            )}
          >
            <span className="font-display text-[17px] font-extrabold tracking-[-0.02em] text-ink">{b.label}</span>
            <span className="hidden font-sans text-xs text-ink-3 sm:inline">{b.note}</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-cream text-sm text-ink transition-transform duration-300 group-hover:translate-x-0.5 group-hover:bg-brand group-hover:text-white">→</span>
          </Link>
        ))}
      </div>
    </div>
  )
}
