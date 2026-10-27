import { useState, useCallback, useMemo } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService from '@/api/apiService'
import type { CalendarDayEvents } from '@/types/api'
import { dateKey, type CalendarFilters, type DayEvents } from '@/hooks/useCalendarEvents'
import { usePillStore } from '@/store/pillStore'

export interface AgendaDay {
  date: Date
  key: string
  events: DayEvents
  hasEvents: boolean
}

const EMPTY_DAY: CalendarDayEvents = { joined: [], hosted: [], waitlisted: [], other: [] }

function addDays(d: Date, n: number): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + n)
  return c
}

/**
 * The next `dayCount` days for the agenda layout (lab B). One summary call
 * finds which days have anything, then only those days are fetched in full,
 * reusing the same endpoints as the month view.
 */
export function useCalendarAgenda(today: Date, dayCount: number, filters: CalendarFilters, enabled = true) {
  const showPill = usePillStore(s => s.show)
  const [raw, setRaw] = useState<Map<string, CalendarDayEvents>>(new Map())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const startKey = dateKey(today)
  const endKey = dateKey(addDays(today, dayCount - 1))
  const cityName = filters.city?.name ?? null

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const rows = await ApiService.getCalendarSummary(startKey, endKey, null, null, cityName)
      const busy = rows
        .filter(r => r.has_joined || r.has_hosted || r.has_waitlisted || r.has_other)
        .map(r => r.date)
      const full = await Promise.all(busy.map(k => ApiService.getCalendarDay(k, null, null, cityName)))
      setRaw(new Map(busy.map((k, i) => [k, full[i]])))
      setError(false)
    } catch (e: any) {
      setError(true)
      showPill(e?.message || "Couldn't load your calendar", 'error')
    } finally {
      setLoading(false)
    }
  }, [startKey, endKey, cityName, showPill])

  useFocusEffect(useCallback(() => { if (enabled) load() }, [load, enabled]))

  const days: AgendaDay[] = useMemo(() => Array.from({ length: dayCount }, (_, i) => {
    const date = addDays(today, i)
    const key = dateKey(date)
    const r = raw.get(key) ?? EMPTY_DAY
    const events: DayEvents = {
      joined: filters.showGoing ? r.joined : [],
      hosted: filters.showHosted ? r.hosted : [],
      waitlisted: filters.showWaitlisted ? r.waitlisted : [],
      other: r.other,
    }
    const hasEvents = events.joined.length + events.hosted.length + events.waitlisted.length + events.other.length > 0
    return { date, key, events, hasEvents }
  }), [today, dayCount, raw, filters.showGoing, filters.showHosted, filters.showWaitlisted])

  return { days, loading, error, reload: load }
}
