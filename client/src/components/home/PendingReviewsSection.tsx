import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { Star } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { getOrFetch, invalidate } from '@/lib/queryCache'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { EventListCard, PrimaryButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { CacheKeys, Colors, FontFamily } from '@/constants'

const COLLAPSED_COUNT = 3

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
  const [expanded, setExpanded] = useState(false)
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

  const hasMore = events.length > COLLAPSED_COUNT
  const visible = expanded ? events : events.slice(0, COLLAPSED_COUNT)

  return (
    <View style={s.wrap}>
      <SectionHeader
        title="Rate Your Nights"
        actionLabel={hasMore ? (expanded ? 'Show less' : 'See all') : undefined}
        onAction={() => setExpanded(v => !v)}
      />
      <View style={s.list}>
        {visible.map(e => {
          const goToReview = () => { hTap(); router.push(`/(events)/${e.id}/review` as any) }
          return (
            <EventListCard
              key={e.id}
              event={e}
              showHotlist={false}
              onPress={goToReview}
              footer={
                <View style={s.rateFooter}>
                  <PrimaryButton
                    label="Rate this event"
                    size="small"
                    style={s.rateBtn}
                    icon={<Star size={14} color={Colors.background} fill={Colors.background} strokeWidth={0} />}
                    onPress={goToReview}
                  />
                </View>
              }
            />
          )
        })}
      </View>
    </View>
  )
})

const s = StyleSheet.create({
  wrap: { gap: 10 },
  list: { gap: 10 },
  // Inset CTA area attached to the card's bottom — the card's own
  // overflow:hidden clips this to match its rounded corners, so it reads as
  // one piece rather than a floating separate button.
  rateFooter: {
    padding: 10,
    paddingTop: 0,
  },
  // Real PrimaryButton (same orange→coral gradient as every other CTA in
  // the app) stretched full width, not a hand-rolled flat-color lookalike.
  rateBtn: { width: '100%' },
})
