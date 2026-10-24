import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { View, Text, Pressable, StyleSheet, FlatList } from 'react-native'
import { ShieldCheck } from 'lucide-react-native'
import { router, useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { getOrFetch, invalidate } from '@/lib/queryCache'
import { EventCard } from '@/components/events/EventCard'
import { SosPill } from '@/components/events/SosButton'
import { parseServerDate, isEventActive } from '@/lib/dates'
import { CacheKeys, Colors, FontFamily, EVENT_CARD_CAROUSEL_W } from '@/constants'


function activeSorted(events: EventSummary[]) {
  return events
    .filter(e => isEventActive(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

const ActiveEventCard = memo(function ActiveEventCard({ event }: { event: EventSummary }) {
  return (
    <View style={{ width: EVENT_CARD_CAROUSEL_W }}>
      <EventCard event={event} showHost onPress={() => router.push(`/(events)/${event.id}` as any)} />
      <View style={s.safety}>
        <Pressable style={s.safetyInfo} onPress={() => router.push('/(safety)' as any)} hitSlop={6}>
          <ShieldCheck size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
          <View style={{ flex: 1 }}>
            <Text style={s.safetyTitle}>Feeling unsafe?</Text>
            <Text style={s.safetySub} numberOfLines={1}>SOS texts your contacts where you are</Text>
          </View>
        </Pressable>
        <SosPill eventId={event.id} />
      </View>
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
  safety: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: 12, paddingRight: 8, paddingVertical: 8, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  safetyInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  safetyTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  safetySub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
})
