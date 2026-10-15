import { useCallback, useEffect, useMemo, useState } from 'react'
import ApiService, { type EventAttendee, type EventDetail } from '@/api/apiService'
import { parseAttendeeDate } from '@/components/events/AttendeeRow'
import { genderBucket } from '@/lib/crowdMix'

export type ScannerStatus = 'open' | 'not_yet' | 'ended'

export function useAttendees(id: string | undefined) {
  const [all, setAll] = useState<EventAttendee[]>([])
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadError, setLoadError] = useState(false)

  const load = useCallback((isRefresh = false) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    setLoadError(false)
    Promise.all([
      ApiService.getEventAttendees(id),
      ApiService.getEvent(id),
    ])
      .then(([attendeesRes, eventRes]) => {
        setAll(attendeesRes.attendees)
        setEvent(eventRes)
      })
      .catch(() => setLoadError(true))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id])

  useEffect(() => { load() }, [load])

  const scannerStatus = useMemo((): ScannerStatus => {
    if (!event) return 'not_yet'
    const now = Date.now()
    const start = parseAttendeeDate(event.date_time).getTime()
    const end = event.end_time
      ? parseAttendeeDate(event.end_time).getTime()
      : start + 6 * 60 * 60 * 1000
    const openAt = start - 3 * 60 * 60 * 1000
    if (now > end) return 'ended'
    if (now < openAt) return 'not_yet'
    return 'open'
  }, [event])

  const going = useMemo(() => all.filter(a => a.status === 'going'), [all])
  const checkedIn = useMemo(() => going.filter(a => !!a.checked_in_at), [going])
  const notArrived = useMemo(() => going.filter(a => !a.checked_in_at), [going])
  // Shown to hosts when the event has a crowd mix, so they can see the split
  const genderCounts = useMemo(() => {
    const c = { women: 0, men: 0, other: 0 }
    for (const a of going) c[genderBucket(a.gender)]++
    return c
  }, [going])
  const waitlist = useMemo(
    () => all.filter(a => a.status === 'waitlist')
      .sort((x, y) => new Date(x.joined_at).getTime() - new Date(y.joined_at).getTime()),
    [all],
  )

  return {
    genderCounts,
    loading, refreshing, loadError, event, going, checkedIn, notArrived, waitlist, scannerStatus,
    reload: load,
  }
}
