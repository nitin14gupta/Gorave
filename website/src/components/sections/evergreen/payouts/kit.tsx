import Link from 'next/link'
import type { ReactNode } from 'react'
import { Chapter, StoreBadges } from '@/components/ui/atoms'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { LINKS } from './data'

// Small shared pieces for both payouts variants. Server-safe.

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** Display-safe rounding for any number that lands in an inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100

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
      <div className="max-w-[860px]">
        <Chapter n={n} title={label} className={center ? 'justify-center' : undefined} />
        <h2 className="mt-4 font-display text-[clamp(40px,5.4vw,80px)] font-extrabold leading-[0.92] tracking-[-0.055em] text-ink">
          {title}
          {serif && (
            <>
              <br />
              <span className="font-serif font-normal italic tracking-[-0.03em] text-orange">{serif}</span>
            </>
          )}
        </h2>
      </div>
      {aside && <div className="max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">{aside}</div>}
    </div>
  )
}

/** The one conversion move: Start hosting + the store badges. */
export function CtaRow({ center, className }: { center?: boolean; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-4', center && 'justify-center', className)}>
      <Button href={LINKS.start} size="lg">Start hosting</Button>
      <StoreBadges height={46} />
    </div>
  )
}

/** Inline secondary link with a nudging arrow. */
export function ArrowLink({ href, children, className }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn('group inline-flex items-center gap-1.5 font-sans text-[15px] font-bold text-ink underline decoration-ink/20 underline-offset-4 transition-colors hover:decoration-coral', className)}>
      {children}
      <span aria-hidden className="transition-transform duration-300 ease-out-expo group-hover:translate-x-1">→</span>
    </Link>
  )
}

/** Small round check, for "verified" rows. */
export function Tick({ className }: { className?: string }) {
  return (
    <span className={cn('grid size-5 shrink-0 place-items-center rounded-full bg-green text-white', className)} aria-hidden>
      <svg viewBox="0 0 12 12" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 6.2 5 8.5 9.5 3.5" />
      </svg>
    </span>
  )
}

/** Padlock glyph for the "encrypted" bits. */
export function Lock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn('size-5', className)} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}
