import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import { Star } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { getOrFetch, invalidate } from '@/lib/queryCache'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { hTap } from '@/lib/haptics'
import { CacheKeys, Colors, FontFamily, withOpacity } from '@/constants'

const W = Dimensions.get('window').width
const CARD_W = W - 56

function pendingReviewSorted(events: EventSummary[]) {
  return events
    .filter(e => !e.is_cancelled && !!e.my_checked_in_at && e.my_review_rating == null && isEventPast(e))
    .sort((a, b) => (parseServerDate(b.date_time)?.getTime() ?? 0) - (parseServerDate(a.date_time)?.getTime() ?? 0))
}

export interface PendingReviewsSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export const PendingReviewsSection = forwardRef<PendingReviewsSectionHandle, Props>(function PendingReviewsSection(
  { onEmptyChange },
  ref,
) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const mountedRef = useRef(true)

  const load = useCallback((force: boolean) => {
    // Same cache entry ActiveEventsSection/MyEventsSection already populate —
    // this just derives a different slice of it, no extra network round-trip.
    const fetch = () =>
      getOrFetch(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), { ttlMs: 5 * 60_000, persist: false })
    return (force ? invalidate(CacheKeys.homeJoinedEvents).then(fetch) : fetch())
      .then(data => {
        if (!mountedRef.current) return
        const pending = pendingReviewSorted(data)
        setEvents(pending)
        onEmptyChange?.(pending.length === 0)
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

  const single = events.length === 1
  return (
    <View style={s.wrap}>
      <SectionHeader title="Rate your nights" />
      <ScrollView
        horizontal
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        snapToInterval={single ? undefined : CARD_W + 12}
        decelerationRate="fast"
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {events.map(e => <RateCard key={e.id} event={e} width={single ? W - 32 : CARD_W} />)}
      </ScrollView>
    </View>
  )
})

/**
 * One night to rate: the event photo across the card, "How was it?", and
 * five stars right there. Tapping a star opens the review with that many
 * stars already picked, so rating is one tap.
 */
function RateCard({ event, width }: { event: EventSummary; width: number }) {
  const cover = event.cover_photos?.[0]?.url
  const d = parseServerDate(event.date_time)
  const when = d ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
  const open = (rating?: number) => {
    hTap()
    router.push({ pathname: '/(events)/[id]/review', params: { id: event.id, ...(rating ? { rating: String(rating) } : {}) } } as any)
  }
  return (
    <Pressable style={[s.card, { width }]} onPress={() => open()}>
      {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
      <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.25)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']} style={StyleSheet.absoluteFill} />
      <View style={s.top}>
        <Text style={s.when}>{[when, event.area].filter(Boolean).join(' · ')}</Text>
      </View>
      <View style={s.bottom}>
        <Text style={s.ask}>How was</Text>
        <Text style={s.title} numberOfLines={2}>{event.title}?</Text>
        {event.host_name ? <Text style={s.host} numberOfLines={1}>Hosted by {event.host_name}</Text> : null}
        <View style={s.stars}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable key={n} onPress={() => open(n)} hitSlop={6} style={s.star}>
              <Star size={28} color={Colors.white} strokeWidth={1.8} />
            </Pressable>
          ))}
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  card: { height: 230, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.surface, justifyContent: 'space-between', padding: 16 },
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  when: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.white, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.4)', overflow: 'hidden' },
  bottom: { gap: 2 },
  ask: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.8) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, lineHeight: 27, letterSpacing: -0.5, color: Colors.white },
  host: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: withOpacity(Colors.white, 0.75), marginTop: 2 },
  stars: { flexDirection: 'row', gap: 6, marginTop: 12 },
  star: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.12)' },
})
