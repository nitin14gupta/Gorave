import type { ReactNode } from 'react'
import type { SampleEvent } from '@/constants'
import { Chapter } from '@/components/ui/atoms'
import { cn } from '@/lib/cn'

// Shared bits for variant B ("The calendar"): one heading rhythm, easing,
// and pure date helpers that work on IST "YYYY-MM-DD" keys (no Date.now here).

export const EASE = [0.2, 0.8, 0.2, 1] as const
export const EASE_CSS = 'cubic-bezier(.2,.8,.2,1)'

/** "01", "02"... */
export const pad = (n: number) => String(n).padStart(2, '0')

/** Display-safe rounding for any number that ends up in an SSR'd inline style. */
export const r2 = (n: number) => Math.round(n * 100) / 100

export const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`

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
      {aside && <div className="max-w-[380px] font-sans text-lg leading-relaxed text-ink-2">{aside}</div>}
    </div>
  )
}

// ── Dates (IST keys) ────────────────────────────────────────────────────

const DOW = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const MON = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

export interface DayParts {
  key: string
  day: number
  dow: number
  weekday: string
  wd: string
  month: string
  mon: string
  year: number
}

/** Break an IST "YYYY-MM-DD" key into display parts. Deterministic on server and client. */
export function keyParts(key: string): DayParts | null {
  const [y, m, d] = key.split('-').map(Number)
  if (!y || !m || !d) return null
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return { key, day: d, dow, weekday: DOW[dow], wd: DOW[dow].slice(0, 3), month: MON[m - 1], mon: MON[m - 1].slice(0, 3), year: y }
}

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`
}

const isWeekend = (key: string) => {
  const dow = keyParts(key)?.dow
  return dow === 5 || dow === 6 || dow === 0
}

/** The calendar days a window covers, starting from IST `today`. */
export function windowKeys(slug: string, today: string): string[] {
  if (slug === 'tonight') return [today]
  if (slug === 'tomorrow') return [addDays(today, 1)]
  const week = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  if (slug === 'this-week') return week
  // The weekend: the first run of Fri / Sat / Sun in the next seven days.
  const start = week.findIndex(isWeekend)
  if (start < 0) return []
  const run: string[] = []
  for (let i = start; i < week.length && isWeekend(week[i]); i++) run.push(week[i])
  return run
}

/** "Sat 17 to Sun 18 Oct", "Saturday 17 October" for one day. */
export function rangeLabel(keys: string[]) {
  const a = keyParts(keys[0] ?? '')
  const b = keyParts(keys[keys.length - 1] ?? '')
  if (!a || !b) return ''
  if (a.key === b.key) return `${a.weekday} ${a.day} ${a.month}`
  return a.mon === b.mon ? `${a.wd} ${a.day} to ${b.wd} ${b.day} ${b.mon}` : `${a.wd} ${a.day} ${a.mon} to ${b.wd} ${b.day} ${b.mon}`
}

// ── Hours ───────────────────────────────────────────────────────────────

/** Start hour of an event (after-midnight as 24+), from `hour` or `clock`. */
export function eventHour(e: SampleEvent): number | null {
  // The clock carries the minutes; `hour` carries after-midnight as 24+.
  const base = typeof e.hour === 'number' ? Math.floor(e.hour) : null
  if (e.clock) {
    const [h, m] = e.clock.split(':').map(Number)
    if (Number.isFinite(h)) {
      const mins = (m || 0) / 60
      return base !== null && base >= 24 && h < 24 ? h + 24 + mins : h + mins
    }
  }
  return typeof e.hour === 'number' ? e.hour : null
}

/** 21 -> "9 PM", 24.5 -> "12:30 AM". */
export function hourLabel(h: number) {
  const whole = Math.floor(h)
  const mins = Math.round((h - whole) * 60)
  const hh = ((whole % 24) + 24) % 24
  const ap = hh < 12 ? 'AM' : 'PM'
  const h12 = hh % 12 || 12
  return mins ? `${h12}:${pad(mins)} ${ap}` : `${h12} ${ap}`
}

/** The time line on a card: real clock if we have it, else the API's "when". */
export function eventTime(e: SampleEvent) {
  const h = eventHour(e)
  return h === null ? e.when : hourLabel(h)
}
