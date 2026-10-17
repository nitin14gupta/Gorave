import type { ReactNode } from 'react'
import type { SampleEvent } from '@/constants'
import type { TimeContent } from '@/lib/time'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Shared bits for variant A of the time page ("the countdown").

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** "01", "02"... for editorial numbering. */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
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
      <div className="max-w-[880px]">
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
      {aside && <div className="max-w-[360px] font-sans text-lg leading-relaxed text-ink-2">{aside}</div>}
    </div>
  )
}

// ── Time helpers (pure, server-safe) ────────────────────────────────

/** "tonight", "this weekend" */
export const lower = (t: TimeContent) => t.label.toLowerCase()

/** "4 nights start tonight." / "18 nights to pick from this weekend." */
export function countLine(t: TimeContent, n: number) {
  if (n <= 0) return `Nothing listed for ${lower(t)}, yet.`
  const nights = n === 1 ? 'night' : 'nights'
  if (t.slug === 'tonight' || t.slug === 'tomorrow') return `${n} ${nights} ${n === 1 ? 'starts' : 'start'} ${lower(t)}.`
  return `${n} ${nights} to pick from ${lower(t)}.`
}

/** "21:30" to { t: "9:30", ap: "PM" }. Falls back to null for listings without a clock. */
export function clock12(clock?: string) {
  if (!clock) return null
  const [hs, ms = '00'] = clock.split(':')
  const h = Number(hs) % 24
  if (Number.isNaN(h)) return null
  return { t: `${h % 12 || 12}:${ms.padStart(2, '0')}`, ap: h < 12 ? 'AM' : 'PM' }
}

/** Start of an event in epoch ms (its date and clock are IST), or null. */
export function startAt(e: SampleEvent) {
  if (!e.date || !e.clock) return null
  const [h = '0', m = '0'] = e.clock.split(':')
  const ms = Date.parse(`${e.date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00+05:30`)
  return Number.isNaN(ms) ? null : ms
}

/** "2h 05m", "45m", "3d 4h" between two epoch ms (b after a). */
export function span(ms: number) {
  const mins = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${pad(m)}m`
  return `${m}m`
}

/** IST wall clock parts for an epoch second (0 means "not on the client yet"). */
export function istParts(sec: number) {
  const d = new Date((sec + 19800) * 1000)
  const h = d.getUTCHours()
  const m = d.getUTCMinutes()
  const s = d.getUTCSeconds()
  return { h, m, s, hm: `${h % 12 || 12}:${pad(m)}`, ss: pad(s), ap: h < 12 ? 'AM' : 'PM' }
}

/** The next event that hasn't started yet, relative to `nowMs`. */
export function nextUp(events: SampleEvent[], nowMs: number) {
  let best: { e: SampleEvent; at: number } | null = null
  for (const e of events) {
    const at = startAt(e)
    if (at !== null && at > nowMs && (!best || at < best.at)) best = { e, at }
  }
  return best
}
