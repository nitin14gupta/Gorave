import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Star } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl } from '@/components/ui'
import { StarRow } from '@/components/reviews/ReviewParts'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { hSelection } from '@/lib/haptics'
import { router } from 'expo-router'
import type { EventDetail, ReviewItem } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { parseServerDate } from '@/lib/dates'

export interface ReviewsViewProps {
  event: EventDetail | null
  avg: number | null
  count: number
  distribution: Record<string, number>
  reviews: ReviewItem[]
  activeRating: number | null
  onFilter: (r: number | null) => void
  refreshing: boolean
  onRefresh: () => void
  onEndReached: () => void
  loadingMore: boolean
  onBack: () => void
}

export function reviewDate(iso: string) {
  const d = parseServerDate(iso)
  return !d ? '' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function openReviewer(id: string) {
  const myId = useAuthStore.getState().userId
  router.push((id === myId ? '/(tabs)/profile' : `/(profile)/${id}`) as any)
}

const HERO_H = Math.round(Dimensions.get('window').height * 0.34)

/**
 * Reviews for one event. The event's photo on top (parallax), the score set
 * huge over it, the 5-to-1 bars, then reviews as a clean list with hairline
 * dividers, the way Airbnb lays them out.
 */
export function ReviewsView(p: ReviewsViewProps) {
  const insets = useSafeAreaInsets()
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)
  const cover = p.event?.cover_photos?.[0]?.url

  const header = (
    <View>
      <View style={s.hero}>
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
        </Animated.View>
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'rgba(0,0,0,0.2)', Colors.background]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <Animated.View style={[s.heroText, textStyle]}>
          <Text style={s.kicker} numberOfLines={1}>{p.event?.title ?? 'Reviews'}</Text>
          <View style={s.scoreRow}>
            <Text style={s.score}>{p.avg?.toFixed(1) ?? '-'}</Text>
            <View style={{ gap: 4, paddingBottom: 10 }}>
              <StarRow rating={Math.round(p.avg ?? 0)} size={15} />
              <Text style={s.countText}>{p.count} {p.count === 1 ? 'review' : 'reviews'} from guests</Text>
            </View>
          </View>
        </Animated.View>
      </View>

      <View style={s.bars}>
        {[5, 4, 3, 2, 1].map(n => {
          const c = p.distribution[String(n)] ?? 0
          const pct = p.count ? c / p.count : 0
          return (
            <View key={n} style={s.barRow}>
              <Text style={s.barNum}>{n}</Text>
              <View style={s.track}><View style={[s.fill, { width: `${pct * 100}%` }]} /></View>
              <Text style={s.barCount}>{c}</Text>
            </View>
          )
        })}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {[null, 5, 4, 3, 2, 1].map(r => {
          const on = p.activeRating === r
          return (
            <Pressable key={String(r)} style={[s.chip, on && s.chipOn]} onPress={() => { hSelection(); p.onFilter(r) }}>
              {r ? <Star size={12} color={on ? Colors.background : Colors.inkPrimary} fill={on ? Colors.background : Colors.inkPrimary} strokeWidth={1.5} /> : null}
              <Text style={[s.chipText, on && s.chipTextOn]}>{r ?? 'All'}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <View style={s.root}>
      <Animated.FlatList
        data={p.reviews}
        keyExtractor={r => r.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => <Row item={item} first={index === 0} />}
        ListEmptyComponent={<Text style={s.empty}>No {p.activeRating}-star reviews yet.</Text>}
        ListFooterComponent={p.loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.inkSecondary} /> : null}
        onEndReached={p.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={p.onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

function Row({ item, first }: { item: ReviewItem; first: boolean }) {
  return (
    <View style={[s.row, !first && s.rowBorder]}>
      <Pressable style={s.who} onPress={() => openReviewer(item.reviewer_id)}>
        <View style={s.avatar}>
          {item.reviewer_avatar ? <Image source={{ uri: item.reviewer_avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(item.reviewer_name ?? '?').charAt(0).toUpperCase()}</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={s.name} numberOfLines={1}>{item.reviewer_name ?? 'Guest'}</Text>
          <Text style={s.date}>{reviewDate(item.created_at)}</Text>
        </View>
      </Pressable>
      <StarRow rating={item.rating} size={12} />
      {item.body ? <Text style={s.body}>{item.body}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { height: HERO_H, overflow: 'hidden' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 4 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(Colors.white, 0.8) },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14 },
  score: { fontFamily: FontFamily.displayExtraBold, fontSize: 84, lineHeight: 92, letterSpacing: -3, color: Colors.white },
  countText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.75) },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  bars: { paddingHorizontal: 20, paddingTop: 18, gap: 7 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  barNum: { width: 10, fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  track: { flex: 1, height: 4, borderRadius: 2, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 2, backgroundColor: Colors.inkPrimary },
  barCount: { width: 24, textAlign: 'right', fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },

  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 22, paddingBottom: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.divider },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  chipTextOn: { color: Colors.background },

  row: { marginHorizontal: 20, paddingVertical: 18, gap: 10 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  who: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  date: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkPrimary },
  empty: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, paddingHorizontal: 20, paddingVertical: 20 },
})
