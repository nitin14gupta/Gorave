import React, { useCallback, useEffect, useState } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { Colors, FontFamily, Spacing } from '@/constants'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type EventDetail, type ReviewItem } from '@/api/apiService'
import { ReviewsView } from '@/components/reviews/ReviewsView'

const PAGE_SIZE = 10

export default function ReviewsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loadError, setLoadError] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [activeRating, setActiveRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [event, setEvent] = useState<EventDetail | null>(null)

  useEffect(() => { if (id) ApiService.getEvent(id).then(setEvent).catch(() => {}) }, [id])

  // Whoever asks for a first page shows its spinner (initial state, a filter
  // change, Retry, pull-to-refresh), so this only fetches.
  const fetchFirstPage = useCallback(() => {
    if (!id) return
    ApiService.getEventReviews(id, { rating: activeRating, limit: PAGE_SIZE, offset: 0 })
      .then(res => {
        setLoadError(false)
        setAvgRating(res.avg_rating)
        setCount(res.count)
        setDistribution(res.distribution)
        setReviews(res.reviews)
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch(() => setLoadError(true))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id, activeRating])

  useEffect(() => { fetchFirstPage() }, [id, activeRating])

  const loadMore = useCallback(() => {
    if (!id || loadingMore || !hasMore) return
    setLoadingMore(true)
    ApiService.getEventReviews(id, { rating: activeRating, limit: PAGE_SIZE, offset: reviews.length })
      .then(res => {
        setReviews(prev => [...prev, ...res.reviews])
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch(() => {})
      .finally(() => setLoadingMore(false))
  }, [id, activeRating, loadingMore, hasMore, reviews.length])

  // Loaded with reviews: the layout owns the whole screen, header included.
  if (!(loading && reviews.length === 0) && !(loadError && reviews.length === 0) && !(count === 0 && !activeRating)) {
    return (
      <View style={s.root}>
        <ReviewsView
          event={event}
          avg={avgRating}
          count={count}
          distribution={distribution}
          reviews={reviews}
          activeRating={activeRating}
          onFilter={r => { if (r !== activeRating) { setLoading(true); setActiveRating(r) } }}
          refreshing={refreshing}
          onRefresh={() => { setRefreshing(true); fetchFirstPage() }}
          onEndReached={loadMore}
          loadingMore={loadingMore}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
        </Pressable>
        <Text style={s.title}>Reviews</Text>
        <View style={s.iconBtn} />
      </View>

      {loading && reviews.length === 0 ? (
        <View style={s.center}>
          <BrandedLoader />
        </View>
      ) : loadError && reviews.length === 0 ? (
        <View style={s.center}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>Couldn’t load reviews</Text>
          <Text style={s.emptySub}>Something went wrong.</Text>
          <Pressable style={s.retryBtn} onPress={() => { setLoading(true); fetchFirstPage() }}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : count === 0 && !activeRating ? (
        <View style={s.center}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySub}>Reviews appear here once attendees rate the event.</Text>
        </View>
      ) : (
        null
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.divider,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },




  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 40,
  },
  emptyTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 18,
    color: Colors.inkPrimary,
    textAlign: 'center',
  },
  emptySub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
  },
  retryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.elevated,
    borderWidth: 1,
    borderColor: Colors.divider,
  },
  retryText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.inkPrimary,
  },
})
