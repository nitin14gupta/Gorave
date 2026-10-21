import React, { useCallback, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { ArrowLeft, Star } from 'lucide-react-native'
import { HostReviewsView } from '@/components/reviews/HostReviewsView'
import { Colors, FontFamily, Spacing } from '@/constants'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn, BrandedLoader } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import ApiService, { type ExtendedProfile, type HostReviewItem, type HostReviewEvent } from '@/api/apiService'

const PAGE_SIZE = 10

export default function HostReviewsScreen() {
  const { id, name } = useLocalSearchParams<{ id: string; name?: string }>()
  const insets = useSafeAreaInsets()
  const { hideProgress, onScroll } = useHeaderScroll()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const router = useRouter()
  const isOwnProfile = useAuthStore(s => s.userId) === id
  const showPill = usePillStore(s => s.show)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [avgRating, setAvgRating] = useState<number | null>(null)
  const [count, setCount] = useState(0)
  const [distribution, setDistribution] = useState<Record<string, number>>({})
  const [events, setEvents] = useState<HostReviewEvent[]>([])
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [activeRating, setActiveRating] = useState<number | null>(null)
  const [reviews, setReviews] = useState<HostReviewItem[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [profile, setProfile] = useState<ExtendedProfile | null>(null)
  useEffect(() => { if (id) ApiService.getUserProfile(id).then(setProfile).catch(() => {}) }, [id])

  const fetchFirstPage = useCallback((isRefresh: boolean) => {
    if (!id) return
    if (isRefresh) setRefreshing(true)
    else setLoading(true)
    ApiService.getHostReviews(id, { eventId: activeEventId, rating: activeRating, limit: PAGE_SIZE, offset: 0 })
      .then(res => {
        setAvgRating(res.avg_rating)
        setCount(res.count)
        setDistribution(res.distribution)
        setReviews(res.reviews)
        setHasMore(res.reviews.length === PAGE_SIZE)
        setEvents(res.events)
      })
      .catch((e: any) => showPill(e?.message || 'Could not load reviews', 'error'))
      .finally(() => { setLoading(false); setRefreshing(false) })
  }, [id, activeEventId, activeRating])

  useEffect(() => { fetchFirstPage(false) }, [id, activeEventId, activeRating])

  const loadMore = useCallback(() => {
    if (!id || loadingMore || !hasMore) return
    setLoadingMore(true)
    ApiService.getHostReviews(id, { eventId: activeEventId, rating: activeRating, limit: PAGE_SIZE, offset: reviews.length })
      .then(res => {
        setReviews(prev => [...prev, ...res.reviews])
        setHasMore(res.reviews.length === PAGE_SIZE)
      })
      .catch((e: any) => showPill(e?.message || 'Could not load more reviews', 'error'))
      .finally(() => setLoadingMore(false))
  }, [id, activeEventId, activeRating, loadingMore, hasMore, reviews.length])

  if (!(loading && reviews.length === 0) && !(count === 0 && !activeEventId && !activeRating)) {
    return (
      <View style={s.root}>
        <HostReviewsView
          name={(name ? decodeURIComponent(name) : '') || profile?.name || 'Host'}
          photo={profile?.photos?.[0]?.url ?? null}
          avg={avgRating}
          count={count}
          distribution={distribution}
          events={events}
          reviews={reviews}
          activeEventId={activeEventId}
          onEvent={setActiveEventId}
          activeRating={activeRating}
          onRating={setActiveRating}
          refreshing={refreshing}
          onRefresh={() => fetchFirstPage(true)}
          onEndReached={loadMore}
          loadingMore={loadingMore}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  return (
    <View style={s.root}>
      <AppHeader
        title={name ? `${name}'s reviews` : 'Host reviews'}
        hideProgress={hideProgress}
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></HeaderIconBtn>}
      />
      {loading ? (
        <View style={[s.center, { paddingTop: headerHeight }]}><BrandedLoader /></View>
      ) : (
        <View style={[s.center, { paddingTop: headerHeight }]}>
          <Star size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
          <Text style={s.emptyTitle}>No reviews yet</Text>
          <Text style={s.emptySub}>Reviews appear here once guests rate their nights.</Text>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },

  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },

  filteredEmpty: {
    paddingHorizontal: Spacing.screenPadding,
    paddingVertical: 20,
  },

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
})
