import { useState, useCallback, useEffect, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { CalendarDaySummary, CalendarDayEvents } from '@/types/api'
import type { CityResponse } from '@/hooks/useCities'
import { usePillStore } from '@/store/pillStore'

export interface DayEvents {
  joined: EventSummary[]
  hosted: EventSummary[]
  waitlisted: EventSummary[]
  /** Every other published event happening that day (any host, any location) that isn't one you're going to, hosting, or waitlisted for. */
  other: EventSummary[]
}

export interface CalendarFilters {
  showHosted: boolean
  showGoing: boolean
  showWaitlisted: boolean
  /** null = no location restriction ("All") */
  city: CityResponse | null
}

export const DEFAULT_CALENDAR_FILTERS: CalendarFilters = {
  showHosted: true,
  showGoing: true,
  showWaitlisted: true,
  city: null,
}

export function dateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Any date within the target month — returns [firstOfMonth, lastOfMonth] as 'YYYY-MM-DD'.
function monthBounds(monthDate: Date): [string, string] {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  return [dateKey(new Date(year, month, 1)), dateKey(new Date(year, month + 1, 0))]
}

const EMPTY_DAY: CalendarDayEvents = { joined: [], hosted: [], waitlisted: [], other: [] }

// The grid only ever needs "does this day have a dot" — a cheap month-scoped
// summary covers that. Full event details are fetched lazily, one day at a
// time, only for whichever day is actually selected — not the user's entire
// hosted/joined/waitlisted history up front (that only gets worse as an
// account ages).
export function useCalendarEvents(visibleMonth: Date, selectedDate: Date, filters: CalendarFilters = DEFAULT_CALENDAR_FILTERS) {
  const showPill = usePillStore(s => s.show)
  const [summary, setSummary] = useState<Map<string, CalendarDaySummary>>(new Map())
  const [monthLoading, setMonthLoading] = useState(true)
  const [monthError, setMonthError] = useState(false)

  // The last day fetched, tagged with which day and city it was for: a
  // different key means the selected day is still loading.
  const [day, setDay] = useState<{ key: string; raw: CalendarDayEvents; error: boolean } | null>(null)
  const [reloading, setReloading] = useState(false)

  const [monthStart, monthEnd] = monthBounds(visibleMonth)
  const selKey = dateKey(selectedDate)
  const todayKey = dateKey(new Date())
  const selectedIsPast = selKey < todayKey
  // Only the city matters for refetching — the Hosted/Going/Waitlisted
  // toggles are applied client-side below, so flipping them is instant and
  // never re-hits the network.
  // Filtered by the events.city column server-side, not a radius around it
  const cityName = filters.city?.name ?? null

  const loadMonth = useCallback(async () => {
    setMonthLoading(true)
    try {
      const rows = await ApiService.getCalendarSummary(monthStart, monthEnd, null, null, cityName)
      setSummary(new Map(rows.map(r => [r.date, r])))
      setMonthError(false)
    } catch (e: any) {
      setMonthError(true)
      showPill(e?.message || "Couldn't load this month's calendar", 'error')
    } finally {
      setMonthLoading(false)
    }
  }, [monthStart, monthEnd, cityName, showPill])

  useFocusEffect(useCallback(() => { loadMonth() }, [loadMonth]))

  const dayKey = `${selKey}|${cityName ?? ''}`
  // Past days have nothing to show, so they never fetch.
  const dayRaw = selectedIsPast ? EMPTY_DAY : day?.raw ?? EMPTY_DAY
  const dayError = !selectedIsPast && !!day?.error
  const dayLoading = !selectedIsPast && (day?.key !== dayKey || reloading)

  const fetchDay = useCallback(() => {
    return ApiService.getCalendarDay(selKey, null, null, cityName)
      .then(data => setDay({ key: dayKey, raw: data, error: false }))
      .catch((e: any) => {
        setDay({ key: dayKey, raw: EMPTY_DAY, error: true })
        showPill(e?.message || "Couldn't load this day's events", 'error')
      })
  }, [selKey, cityName, dayKey, showPill])

  useEffect(() => {
    if (!selectedIsPast) fetchDay()
  }, [fetchDay, selectedIsPast])

  // Retry: show the spinner again while the same day refetches.
  const loadDay = useCallback(() => {
    if (selectedIsPast) return
    setReloading(true)
    fetchDay().finally(() => setReloading(false))
  }, [fetchDay, selectedIsPast])

  const hasEventsOnDate = useCallback((key: string) => {
    const s = summary.get(key)
    if (!s) return false
    return (filters.showGoing && s.has_joined) || (filters.showHosted && s.has_hosted) || (filters.showWaitlisted && s.has_waitlisted) || s.has_other
  }, [summary, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  const dayEvents: DayEvents = useMemo(() => ({
    joined: filters.showGoing ? dayRaw.joined : [],
    hosted: filters.showHosted ? dayRaw.hosted : [],
    waitlisted: filters.showWaitlisted ? dayRaw.waitlisted : [],
    other: dayRaw.other,
  }), [dayRaw, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  return {
    hasEventsOnDate,
    monthLoading,
    monthError,
    dayEvents,
    dayLoading,
    dayError,
    reloadMonth: loadMonth,
    reloadDay: loadDay,
  }
}
