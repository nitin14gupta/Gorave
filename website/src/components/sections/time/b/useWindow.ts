'use client'

import { useMemo } from 'react'
import { useClientValue } from '@/hooks/useClientValue'
import { windowKeys } from './kit'

const istToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

/** Today's IST date key, client only ('' on the server and during hydration). */
export function useIstToday() {
  return useClientValue(istToday, '')
}

/**
 * The calendar days this window covers, computed in the browser from IST.
 * Until then (server HTML, hydration) it falls back to the days the server
 * actually found events on, so the first paint already shows real dates.
 * Days the server has listings on are always included.
 */
export function useWindowKeys(slug: string, fallback: string[]) {
  const today = useIstToday()
  return useMemo(() => {
    if (!today) return fallback
    // The window's own days, plus any later day the server found listings on.
    const keys = new Set([...windowKeys(slug, today), ...fallback.filter(k => k >= today)])
    return keys.size ? [...keys].sort() : fallback
  }, [today, slug, fallback])
}

const istMinutes = () => {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date())
  const h = Number(parts.find(p => p.type === 'hour')?.value ?? 0)
  const m = Number(parts.find(p => p.type === 'minute')?.value ?? 0)
  // Rounded to 10 minutes so the snapshot stays stable between renders.
  return h * 60 + Math.floor(m / 10) * 10
}

/** Current IST time as minutes since midnight (10-minute steps), -1 until the client knows. */
export function useIstMinutes() {
  return useClientValue(istMinutes, -1)
}
