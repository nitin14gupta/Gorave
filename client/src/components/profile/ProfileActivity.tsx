import { useEffect, useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Star } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import type { EventSummary, HostReviewItem } from '@/types/api'
import { eventDateParts } from '@/components/events/EventCard'
import { reviewDate, openReviewer } from '@/components/reviews/HostReviewsView'

const CARD_W = Math.round(Dimensions.get('window').width * 0.4)

export function useProfileActivity(userId: string) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const [reviews, setReviews] = useState<HostReviewItem[]>([])
  const [avg, setAvg] = useState<number | null>(null)
  const [count, setCount] = useState(0)

  useEffect(() => {
    let alive = true
    ApiService.getEvents({ host_id: userId, limit: 10 }).then(r => { if (alive) setEvents(r) }).catch(() => {})
    ApiService.getHostReviews(userId, { limit: 3 })
      .then(r => { if (alive) { setReviews(r.reviews); setAvg(r.avg_rating); setCount(r.count) } })
      .catch(() => {})
    return () => { alive = false }
  }, [userId])

  return { events, reviews, avg, count }
}

/** A row of event posters under a small caps title. Tap one to open it. */
export function EventRail({ events, name, title }: { events: EventSummary[]; name: string; title: string }) {
  if (!events.length) return null
  return (
    <View style={s.block}>
      <Text style={s.label}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.rail} style={s.railBleed}>
        {events.map(e => {
          const d = eventDateParts(e.date_time)
          return (
            <Pressable key={e.id} style={{ width: CARD_W }} onPress={() => router.push(`/(events)/${e.id}` as any)}>
              <View style={s.poster}>
                {e.cover_photos?.[0]?.url ? <Image source={{ uri: e.cover_photos[0].url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
              </View>
              <Text style={s.when}>{d ? `${d.dow}, ${d.day} ${d.mon} · ${d.time}` : ''}</Text>
              <Text style={s.evTitle} numberOfLines={2}>{e.title}</Text>
              <Text style={s.evMeta} numberOfLines={1}>{e.area ?? e.city ?? name}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )
}

/** What guests said about their nights. */
export function ReviewsPeek({ reviews, avg, count, userId, name }: { reviews: HostReviewItem[]; avg: number | null; count: number; userId: string; name: string | null }) {
  if (!reviews.length) return null
  return (
    <View style={s.block}>
      <View style={s.head}>
        <Text style={s.label}>WHAT GUESTS SAY</Text>
        {avg != null ? (
          <View style={s.avg}><Star size={12} color={Colors.inkPrimary} fill={Colors.inkPrimary} /><Text style={s.avgText}>{avg.toFixed(1)} · {count}</Text></View>
        ) : null}
      </View>
      {reviews.map(r => (
        <View key={r.id} style={s.review}>
          <Pressable style={s.who} onPress={() => openReviewer(r.reviewer_id)}>
            <View style={s.av}>{r.reviewer_avatar ? <Image source={{ uri: r.reviewer_avatar }} style={StyleSheet.absoluteFill} contentFit="cover" /> : null}</View>
            <View style={{ flex: 1 }}>
              <Text style={s.rName} numberOfLines={1}>{r.reviewer_name ?? 'Guest'}</Text>
              <Text style={s.rMeta} numberOfLines={1}>{r.event_title} · {reviewDate(r.created_at)}</Text>
            </View>
            <View style={s.avg}><Star size={12} color={Colors.inkPrimary} fill={Colors.inkPrimary} /><Text style={s.avgText}>{r.rating}</Text></View>
          </Pressable>
          {r.body ? <Text style={s.rBody}>{r.body}</Text> : null}
        </View>
      ))}
      {count > reviews.length ? (
        <Pressable onPress={() => router.push(`/(profile)/host-reviews?id=${userId}&name=${encodeURIComponent(name ?? '')}` as any)} hitSlop={6}>
          <Text style={s.all}>See all {count} reviews</Text>
        </Pressable>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  block: { gap: 12 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  railBleed: { marginHorizontal: -18 },
  rail: { paddingHorizontal: 18, gap: 12 },
  poster: { width: CARD_W, height: Math.round(CARD_W * 1.25), borderRadius: 16, overflow: 'hidden', backgroundColor: Colors.surface },
  when: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary, marginTop: 8 },
  evTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary, marginTop: 2 },
  evMeta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  avg: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  avgText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
  review: { gap: 8, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  who: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  av: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  rName: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  rMeta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  rBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  all: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
