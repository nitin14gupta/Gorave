// Date formatting for tickets (server timestamps like "2026-10-22 18:00:00+05").

import { parseServerDate } from '@/lib/dates'

export const parseTs = parseServerDate

export function fmtDate(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtTime(iso: string | null | undefined) {
  const d = parseTs(iso)
  if (!d) return ''
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
}
