import type { EventSummary } from '@/api/apiService'
import { CacheKeys } from '@/constants/cacheKeys'
import { getOrFetch, invalidate, peekCached, peekEntry } from './queryCache'
import { parseServerDate } from './dates'

// Your own event lists (going, hosting, waitlisted, requested) power Home's
// sections. They're saved on the phone so Home opens instantly, and they stay
// good until the next moment something has to move: an event starting (into
// Happening now) or ending (into Rate your nights). Anything you change, and
// any push about your events, throws them away so the next look is fresh.

export const MY_EVENT_KEYS = [
  CacheKeys.homeJoinedEvents,
  CacheKeys.homeHostedEvents,
  CacheKeys.homeWaitlistedEvents,
  CacheKeys.homeRequestedEvents,
] as const

const MIN_TTL = 30_000
const MAX_TTL = 30 * 60_000
const DEFAULT_LENGTH = 6 * 60 * 60_000 // events with no end time count as 6 hours

/** How long these events stay right: until the soonest start or end, capped at 30 min. */
export function untilNextChange(events: EventSummary[]): number {
  const now = Date.now()
  let next = now + MAX_TTL
  for (const e of events) {
    const start = parseServerDate(e.date_time)?.getTime()
    if (!start) continue
    const end = parseServerDate(e.end_time)?.getTime() ?? start + DEFAULT_LENGTH
    if (start > now && start < next) next = start
    if (end > now && end < next) next = end
  }
  return Math.max(MIN_TTL, next - now)
}

function refresh(key: string, fetcher: () => Promise<EventSummary[]>) {
  return getOrFetch(key, fetcher, { ttlMs: untilNextChange, persist: true })
}

/**
 * Stale-while-revalidate. Fresh cache: returned with no network. Stale cache:
 * returned right away, refreshed in the background, then `onUpdate` fires so
 * the section can re-read. Nothing cached: fetched.
 */
export async function fetchMine(
  key: string,
  fetcher: () => Promise<EventSummary[]>,
  onUpdate?: () => void,
): Promise<EventSummary[]> {
  const entry = await peekEntry<EventSummary[]>(key)
  if (entry?.fresh) return entry.value
  if (entry) {
    refresh(key, fetcher).then(() => onUpdate?.()).catch(() => {})
    return entry.value
  }
  return refresh(key, fetcher)
}

/** Something about your events changed: next look fetches fresh. */
export function invalidateMyEvents(): void {
  for (const k of MY_EVENT_KEYS) invalidate(k)
}

/**
 * You opened an event: if what the server says differs from the copy Home is
 * holding (time, place, title, cancelled, your status), drop the cache.
 */
export function checkAgainstCache(ev: EventSummary): void {
  for (const k of MY_EVENT_KEYS) {
    const cached = peekCached<EventSummary[]>(k)?.find(e => e.id === ev.id)
    if (!cached) continue
    const changed =
      cached.date_time !== ev.date_time ||
      cached.end_time !== ev.end_time ||
      cached.title !== ev.title ||
      cached.location_name !== ev.location_name ||
      !!cached.is_cancelled !== !!ev.is_cancelled ||
      (cached.my_rsvp_status ?? null) !== (ev.my_rsvp_status ?? null)
    if (changed) { invalidateMyEvents(); return }
  }
}
