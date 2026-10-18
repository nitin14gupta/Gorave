import type { ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Chapter } from '@/components/ui/atoms'
import { StoreBadges } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'
/** Rounding for anything that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100

/** "2 on now" / "nothing yet" */
export const countLabel = (n: number) => (n > 0 ? `${n} on now` : 'nothing listed yet')

/** Chapter + display title with a serif tail + optional aside. */
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
    <div className={cn(center && 'text-center', className)}>
      <Chapter n={n} title={label} className={center ? 'justify-center' : undefined} />
      <h2 className="mt-4 font-display text-[clamp(40px,5.6vw,88px)] font-extrabold leading-[0.92] tracking-[-0.055em]">
        {title}
        {serif && <> <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{serif}</span></>}
      </h2>
      {aside && <p className={cn('mt-4 max-w-[520px] font-sans text-lg leading-relaxed text-ink-2', center && 'mx-auto')}>{aside}</p>}
    </div>
  )
}

/** Get the app + Host your own. */
export function Ctas({ className, badges = true }: { className?: string; badges?: boolean }) {
  return (
    <div className={cn('flex flex-col gap-5', className)}>
      <div className="flex flex-wrap gap-2.5">
        <Button href="/app" size="lg">Get the app</Button>
        <Button href="/host" kind="ghost" size="lg">Host your own</Button>
      </div>
      {badges && <StoreBadges height={44} />}
    </div>
  )
}
