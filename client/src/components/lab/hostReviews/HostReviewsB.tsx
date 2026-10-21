import { useMemo } from 'react'
import { ActivityIndicator, Pressable, SectionList, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ChevronRight, Star } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl } from '@/components/ui'
import { StarRow } from '@/components/reviews/ReviewParts'
import type { HostReviewItem } from '@/api/apiService'
import { openEvent, openReviewer, reviewDate, type HostReviewsViewProps } from './types'

/**
 * B · Night by night. A compact host card up top, then the reviews
 * grouped under the event they were for, each event with its own score,
 * like reading a host's track record one night at a time.
 */
export function HostReviewsB(p: HostReviewsViewProps) {
  const insets = useSafeAreaInsets()

  const sections = useMemo(() => {
    const byEvent = new Map<string, HostReviewItem[]>()
    for (const r of p.reviews) {
      if (!byEvent.has(r.event_id)) byEvent.set(r.event_id, [])
      byEvent.get(r.event_id)!.push(r)
    }
    return [...byEvent.entries()].map(([id, data]) => {
      const meta = p.events.find(e => e.id === id)
      return { id, title: data[0].event_title, avg: meta?.avg_rating ?? null, total: meta?.review_count ?? data.length, data }
    })
  }, [p.reviews, p.events])

  const header = (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.photo}>{p.photo ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}</View>
        <View style={{ flex: 1 }}>
          <Text style={s.hostName} numberOfLines={1}>{p.name}</Text>
          <Text style={s.hostSub}>{p.events.length} {p.events.length === 1 ? 'event' : 'events'} reviewed</Text>
        </View>
        <View style={s.scoreBox}>
          <Star size={16} color={Colors.brandOrange} fill={Colors.brandOrange} strokeWidth={1.5} />
          <Text style={s.score}>{p.avg?.toFixed(1) ?? '-'}</Text>
        </View>
      </View>
      <View style={s.mini}>
        {[5, 4, 3, 2, 1].map(n => {
          const c = p.distribution[String(n)] ?? 0
          return (
            <View key={n} style={s.miniCol}>
              <View style={s.miniTrack}><View style={[s.miniFill, { height: `${p.count ? (c / p.count) * 100 : 0}%` }]} /></View>
              <Text style={s.miniNum}>{n}★</Text>
            </View>
          )
        })}
        <View style={s.miniTotal}>
          <Text style={s.totalNum}>{p.count}</Text>
          <Text style={s.totalLabel}>{p.count === 1 ? 'review' : 'reviews'}</Text>
        </View>
      </View>
    </View>
  )

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.barTitle}>Reviews</Text>
        <View style={s.iconBtn} />
      </View>
      <SectionList
        sections={sections}
        keyExtractor={r => r.id}
        stickySectionHeadersEnabled
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (
          <Pressable style={s.eventHead} onPress={() => openEvent(section.id)}>
            <View style={{ flex: 1 }}>
              <Text style={s.eventTitle} numberOfLines={1}>{section.title}</Text>
              <Text style={s.eventSub}>{section.total} {section.total === 1 ? 'review' : 'reviews'}</Text>
            </View>
            {section.avg ? (
              <View style={s.eventScore}>
                <Star size={12} color={Colors.brandOrange} fill={Colors.brandOrange} strokeWidth={1.5} />
                <Text style={s.eventScoreText}>{section.avg.toFixed(1)}</Text>
              </View>
            ) : null}
            <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
        )}
        renderItem={({ item }) => (
          <View style={s.review}>
            <View style={s.reviewTop}>
              <StarRow rating={item.rating} size={12} />
              <Text style={s.date}>{reviewDate(item.created_at)}</Text>
            </View>
            {item.body ? <Text style={s.body}>{item.body}</Text> : null}
            <Pressable style={s.by} onPress={() => openReviewer(item.reviewer_id)}>
              <View style={s.avatar}>{item.reviewer_avatar ? <Image source={{ uri: item.reviewer_avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}</View>
              <Text style={s.byName} numberOfLines={1}>{item.reviewer_name ?? 'Guest'}</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>No reviews yet.</Text>}
        ListFooterComponent={p.loadingMore ? <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.inkSecondary} /> : null}
        onEndReached={p.onEndReached}
        onEndReachedThreshold={0.4}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  card: { marginHorizontal: 16, marginTop: 6, marginBottom: 12, padding: 16, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 16 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  photo: { width: 60, height: 60, borderRadius: 30, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  hostName: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, color: Colors.inkPrimary },
  hostSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  scoreBox: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 14, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  score: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, color: Colors.inkPrimary },
  mini: { flexDirection: 'row', alignItems: 'flex-end', gap: 10, height: 74 },
  miniCol: { flex: 1, alignItems: 'center', gap: 6 },
  miniTrack: { width: '100%', height: 48, borderRadius: 6, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), justifyContent: 'flex-end', overflow: 'hidden' },
  miniFill: { width: '100%', backgroundColor: Colors.inkPrimary, borderRadius: 6 },
  miniNum: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkSecondary },
  miniTotal: { flex: 1.4, alignItems: 'flex-end', paddingBottom: 18 },
  totalNum: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, color: Colors.inkPrimary },
  totalLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  eventHead: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  eventTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  eventSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  eventScore: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventScoreText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },

  review: { marginHorizontal: 20, paddingVertical: 14, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  reviewTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkPrimary },
  by: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  avatar: { width: 22, height: 22, borderRadius: 11, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  byName: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  empty: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, paddingHorizontal: 20, paddingVertical: 20 },
})
