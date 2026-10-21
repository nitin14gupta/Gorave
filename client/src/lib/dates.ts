/**
 * Reads the server's timestamps, e.g. "2026-10-21 08:57:02.277848+00".
 * Hermes can't parse the space, a bare "+00" offset or more than 3 decimal
 * places, so all three are normalised first.
 */
export function parseServerDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const d = new Date(
    iso.trim()
      .replace(' ', 'T')
      .replace(/(\.\d{3})\d+/, '$1')
      .replace(/([+-]\d{2})$/, '$1:00'),
  )
  return isNaN(d.getTime()) ? null : d
}

export function isEventPast(event: { date_time: string; end_time?: string | null }): boolean {
  const now = new Date()
  const start = parseServerDate(event.date_time)
  if (!start) return false
  if (start >= now) return false // hasn't started yet
  const end = event.end_time ? parseServerDate(event.end_time) : null
  return end ? end < now : true
}

export function isEventActive(event: { date_time: string; end_time?: string | null }): boolean {
  const start = parseServerDate(event.date_time)
  if (!start) return false
  if (start > new Date()) return false // hasn't started yet
  return !isEventPast(event)
}
