import { parseServerDate } from '@/lib/dates'

const ADD_WINDOW_MS = 7 * 24 * 3600 * 1000
const LENGTH_FALLBACK_MS = 6 * 3600 * 1000

type Timed = { date_time: string; end_time?: string | null }

/** Same rule as the server: no end time means start + 6h. Lists only; the event page uses the server's `album`. */
function endedAt(e: Timed): number | null {
  const end = e.end_time ? parseServerDate(e.end_time) : null
  if (end) return end.getTime()
  const start = parseServerDate(e.date_time)
  return start ? start.getTime() + LENGTH_FALLBACK_MS : null
}

export function albumIsOpen(e: Timed): boolean {
  const end = endedAt(e)
  return end != null && Date.now() > end
}

export function albumTakesPhotos(e: Timed): boolean {
  const end = endedAt(e)
  return end != null && Date.now() > end && Date.now() < end + ADD_WINDOW_MS
}

export const photosLabel = (n: number) => `${n} ${n === 1 ? 'photo' : 'photos'}`
