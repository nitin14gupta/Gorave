import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, memo, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { View, StyleSheet, FlatList, type ListRenderItemInfo } from 'react-native'
import { router } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { EventCard } from '@/components/events/EventCard'
import { useProfile } from '@/hooks/useProfile'
import { getOrFetch } from '@/lib/queryCache'
import { CacheKeys, Colors, FontFamily, EVENT_CARD_CAROUSEL_W } from '@/constants'

const CARD_GAP = 12
const INITIAL_COUNT = 6
const PAGE_SIZE = 6
const FETCH_LIMIT = 30

const TrendingCard = memo(function TrendingCard({ event, onPress }: {
  event: EventSummary
  onPress: (id: string) => void
}) {
  const handlePress = useCallback(() => onPress(event.id), [onPress, event.id])
  return (
    <View style={{ width: EVENT_CARD_CAROUSEL_W }}>
      <EventCard event={event} onPress={handlePress} />
    </View>
  )
})

export interface TrendingSectionHandle {
  /** Force a fresh fetch — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  /** Reports whether this section has nothing to show, once its fetch
   * resolves — the home screen combines this with the other two sections'
   * emptiness to decide whether to show a single "nothing here yet" state,
   * instead of each section showing its own. */
  onEmptyChange?: (empty: boolean) => void
}

// "Trending" has no dedicated backend signal yet — events in your city ranked by
// current attendee_count is a reasonable stand-in and needs no new endpoint.
// The API has no offset/page param, so we over-fetch once (FETCH_LIMIT) and
// reveal more of the already-sorted batch as the user scrolls — simple lazy
// loading without a second network round-trip per page.
export const TrendingSection = forwardRef<TrendingSectionHandle, Props>(function TrendingSection(
  { onEmptyChange },
  ref,
) {
  const { profile } = useProfile()
  const [allEvents, setAllEvents] = useState<EventSummary[]>([])
  const [visibleCount, setVisibleCount] = useState(INITIAL_COUNT)
  const mountedRef = useRef(true)

  const load = useCallback((): Promise<void> => {
    const ownEventIds = () =>
      Promise.all([
        getOrFetch(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), { ttlMs: 5 * 60_000, persist: false }).catch(() => []),
        getOrFetch(CacheKeys.homeHostedEvents, () => ApiService.getMyHostedEvents(), { ttlMs: 5 * 60_000, persist: false }).catch(() => []),
      ]).then(([joined, hosted]) => new Set([...joined, ...hosted].map(e => e.id)))

    // City-scoped like the Events tab — the profile's lat/lng get
    // overwritten by live GPS pings, so the city is the stable signal.
    const city = profile?.city
    if (!city) return Promise.resolve()
    return Promise.all([
      ApiService.getEvents({ city, limit: FETCH_LIMIT }),
      ownEventIds(),
    ])
      .then(([result, ownIds]) => {
        if (!mountedRef.current) return
        const sorted = result
          .filter(e => !ownIds.has(e.id))
          .sort((a, b) => b.attendee_count - a.attendee_count)
        setAllEvents(sorted)
        setVisibleCount(INITIAL_COUNT)
        onEmptyChange?.(sorted.length === 0)
      })
      .catch(() => {})
  }, [profile?.city, onEmptyChange])

  useImperativeHandle(ref, () => ({ refresh: load }), [load])

  useEffect(() => {
    mountedRef.current = true
    load()
    return () => { mountedRef.current = false }
  }, [load])

  const handleCardPress = useCallback((id: string) => {
    router.push(`/(events)/${id}` as any)
  }, [])

  const renderItem = useCallback(({ item }: ListRenderItemInfo<EventSummary>) => (
    <TrendingCard event={item} onPress={handleCardPress} />
  ), [handleCardPress])

  const cardW = EVENT_CARD_CAROUSEL_W
  const getItemLayout = useCallback((_: unknown, index: number) => ({
    length: cardW,
    offset: (cardW + CARD_GAP) * index,
    index,
  }), [])

  if (allEvents.length === 0) return null

  const events = allEvents.slice(0, visibleCount)

  return (
    <View style={s.wrap}>
      <SectionHeader
        title={`Trending in ${profile?.city ?? 'your city'}`}
        actionLabel="See all"
        onAction={() => router.push('/(tabs)/events' as any)}
      />
      <FlatList
        data={events}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={e => e.id}
        contentContainerStyle={s.list}
        onEndReachedThreshold={0.5}
        onEndReached={() => setVisibleCount(c => Math.min(c + PAGE_SIZE, allEvents.length))}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        initialNumToRender={INITIAL_COUNT}
        maxToRenderPerBatch={PAGE_SIZE}
        windowSize={5}
        removeClippedSubviews
      />
    </View>
  )
})

const s = StyleSheet.create({
  wrap: { gap: 10 },
  list: { gap: 12, paddingRight: 4 },
})
