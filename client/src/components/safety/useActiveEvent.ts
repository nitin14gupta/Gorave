import { useCallback, useState } from 'react'
import { useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { isEventActive } from '@/lib/dates'

/** The event you're at right now, if you're going to one that's on. */
export function useActiveEvent(): EventSummary | null {
  const [event, setEvent] = useState<EventSummary | null>(null)
  useFocusEffect(useCallback(() => {
    let alive = true
    ApiService.getMyJoinedEvents()
      .then(list => { if (alive) setEvent(list.find(e => isEventActive(e) && !e.is_cancelled) ?? null) })
      .catch(() => {})
    return () => { alive = false }
  }, []))
  return event
}
