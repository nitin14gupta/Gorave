import type { ReactNode } from 'react'
import { Chapter } from '@/components/ui/atoms'
import { AREA_SCENES } from '@/lib/area'
import { cn } from '@/lib/cn'

// Shared bits for variant C, "The golden hour".

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** The sky the page scrolls through: cream, apricot, blush, soft coral. Never dark. */
export const SKY = ['#F1E9D8', '#F6DFC6', '#F5D8D2', '#F6D0C4', '#F4C9BC'] as const

/** "01", "02"... for editorial numbering. */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100

/** "Tonight" -> "tonight", "This weekend" -> "this weekend". */
export const lower = (label: string) => label.toLowerCase()

/** "21:30" -> "9:30 PM". Deterministic, no Date. */
export function clock12(clock?: string) {
  if (!clock) return null
  const [h, m] = clock.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  const hh = h % 12 === 0 ? 12 : h % 12
  return `${hh}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'AM' : 'PM'}`
}

/** Scenes from a night out, cycled wherever a section needs more pictures. */
export const SCENES = [AREA_SCENES.livingroom, AREA_SCENES.rooftop, AREA_SCENES.doorway, AREA_SCENES.chai, AREA_SCENES.latebite, AREA_SCENES.building]

/** Chapter opener + heading, one rhythm for every section. */
export function Head({ n, label, title, serif, aside, center, className }: {
  n: string
  label: string
  title: ReactNode
  serif?: ReactNode
  aside?: ReactNode
  center?: boolean
  className?: string
}) {
  return (
    <div className={cn('flex gap-x-10 gap-y-5', center ? 'flex-col items-center text-center' : 'flex-wrap items-end justify-between', className)}>
      <div className="max-w-[880px]">
        <Chapter n={n} title={label} className={center ? 'justify-center' : undefined} />
        <h2 className="mt-4 font-display text-[clamp(40px,5.6vw,84px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
          {title}
          {serif && (
            <>
              {' '}
              <span className="font-serif font-normal italic tracking-[-0.03em] text-brand">{serif}</span>
            </>
          )}
        </h2>
      </div>
      {aside && <div className="max-w-[360px] font-sans text-lg leading-relaxed text-ink-2">{aside}</div>}
    </div>
  )
}
