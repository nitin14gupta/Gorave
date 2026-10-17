import type { ReactNode } from 'react'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'
import type { CrowdContent } from '@/lib/crowd'

// Shared bits for the crowd page sections.

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

export const COLORS = { woman: '#FF3864', man: '#171310', open: '#FFB830', empty: '#E4D5B8' } as const

/** Which picture of the room this crowd gets. */
export type RoomKind = 'women' | 'balanced' | 'age'
export const roomKind = (c: CrowdContent): RoomKind => (c.query.women_only ? 'women' : c.query.balanced ? 'balanced' : 'age')

/** Chapter opener + heading, one rhythm for every section. */
export function Head({ n, label, title, serif, aside, dark, center, className }: {
  n: string
  label: string
  title: ReactNode
  serif?: ReactNode
  aside?: ReactNode
  dark?: boolean
  center?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex gap-x-10 gap-y-5', center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between', className)}>
      <div className="max-w-[860px]">
        <Chapter n={n} title={label} dark={dark} className={center ? 'justify-center' : undefined} />
        <h2 className={cn('mt-4 font-display text-[clamp(40px,5.4vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em]', dark ? 'text-noir-ink' : 'text-ink')}>
          {title}
          {serif && (
            <>
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{serif}</span>
            </>
          )}
        </h2>
      </div>
      {aside && <div className={cn('max-w-[360px] font-sans text-lg leading-relaxed', dark ? 'text-noir-ink-2' : 'text-ink-2')}>{aside}</div>}
    </div>
  )
}

/** "01", "02"... for editorial numbering. */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100
