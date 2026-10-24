import { forwardRef, useCallback, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { invalidate } from '@/lib/queryCache'
import { fetchMine } from '@/lib/myEventsCache'
import { CacheKeys } from '@/constants'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { UpNextSection } from './UpNextSection'
import { HostingSection } from './HostingSection'

function upcomingSorted(events: EventSummary[]) {
  return events
    .filter(e => !isEventPast(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

export interface MyEventsSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export const MyEventsSection = forwardRef<MyEventsSectionHandle, Props>(function MyEventsSection(
  { onEmptyChange },
  ref,
) {
  const [joined, setJoined] = useState<EventSummary[]>([])
  const [hosted, setHosted] = useState<EventSummary[]>([])
  const mountedRef = useRef(true)

  // The background refresh calls back into load to re-read the fresh copy.
  const reloadRef = useRef<(force: boolean) => unknown>(() => {})
  const load = useCallback((force: boolean) => {
    const fetchJoined = () =>
      fetchMine(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), () => { if (mountedRef.current) reloadRef.current(false) })
    const fetchHosted = () =>
      fetchMine(CacheKeys.homeHostedEvents, () => ApiService.getMyHostedEvents(), () => { if (mountedRef.current) reloadRef.current(false) })

    const joinedPromise = force ? invalidate(CacheKeys.homeJoinedEvents).then(fetchJoined) : fetchJoined()
    const hostedPromise = force ? invalidate(CacheKeys.homeHostedEvents).then(fetchHosted) : fetchHosted()

    return Promise.all([
      joinedPromise.catch(() => []),
      hostedPromise.catch(() => []),
    ]).then(([joinedData, hostedData]) => {
      if (!mountedRef.current) return
      const j = upcomingSorted(joinedData)
      const h = upcomingSorted(hostedData)
      setJoined(j)
      setHosted(h)
      onEmptyChange?.(j.length === 0 && h.length === 0)
    })
  }, [onEmptyChange])

  useEffect(() => { reloadRef.current = load }, [load])

  useImperativeHandle(ref, () => ({
    refresh: () => load(true),
  }), [load])

  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    load(false)
    return () => { mountedRef.current = false }
  }, [load]))

  if (joined.length === 0 && hosted.length === 0) return null

  const nearestJoined = joined[0] ? parseServerDate(joined[0].date_time)?.getTime() ?? Infinity : Infinity
  const nearestHosted = hosted[0] ? parseServerDate(hosted[0].date_time)?.getTime() ?? Infinity : Infinity

  const going = <UpNextSection events={joined} />
  const hosting = <HostingSection events={hosted} />

  return nearestHosted < nearestJoined ? (
    <>
      {hosting}
      {going}
    </>
  ) : (
    <>
      {going}
      {hosting}
    </>
  )
})
