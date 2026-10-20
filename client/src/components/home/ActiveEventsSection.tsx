import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { getOrFetch, invalidate } from '@/lib/queryCache'
import { EventCard } from '@/components/events/EventCard'
import { useEventCardVariant, EVENT_CARD_CAROUSEL_W } from '@/store/eventCardVariantStore'
import { SosButton } from '@/components/events/SosButton'
import { parseServerDate, isEventActive } from '@/lib/dates'
import { CacheKeys, Colors, FontFamily, withOpacity } from '@/constants'


function activeSorted(events: EventSummary[]) {
  return events
    .filter(e => isEventActive(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

const ActiveEventCard = memo(function ActiveEventCard({ event }: { event: EventSummary }) {
  return (
    <View style={{ width: EVENT_CARD_CAROUSEL_W[useEventCardVariant()] }}>
      <EventCard event={event} showHost onPress={() => router.push(`/(events)/${event.id}` as any)} />
      <SosButton eventId={event.id} size={15} style={s.sosBadge} />
    </View>
  )
})

export interface ActiveEventsSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export const ActiveEventsSection = forwardRef<ActiveEventsSectionHandle, Props>(function ActiveEventsSection(
  { onEmptyChange },
  ref,
) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const mountedRef = useRef(true)

  const load = useCallback((force: boolean) => {
    const fetch = () =>
      getOrFetch(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), { ttlMs: 5 * 60_000, persist: false })
    return (force ? invalidate(CacheKeys.homeJoinedEvents).then(fetch) : fetch())
      .then(data => {
        if (!mountedRef.current) return
        const sorted = activeSorted(data)
        setEvents(sorted)
        onEmptyChange?.(sorted.length === 0)
      })
      .catch(() => {})
  }, [onEmptyChange])

  useImperativeHandle(ref, () => ({
    refresh: () => load(true),
  }), [load])

  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    load(false)
    return () => { mountedRef.current = false }
  }, [load]))

  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <SectionHeader title="Happening Now" leading={<View style={s.liveDot} />} />
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={s.list}
        renderItem={({ item }) => <ActiveEventCard event={item} />}
      />
    </View>
  )
})

const s = StyleSheet.create({
  wrap: { gap: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.destructive },
  list: { gap: 12, paddingRight: 4 },
  // Top right, beside the save button, so it never covers price or details.
  sosBadge: {
    position: 'absolute', top: 10, right: 46,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: withOpacity(Colors.background, 0.55),
  },
})
