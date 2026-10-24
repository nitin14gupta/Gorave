import { useCallback, useState } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router, useFocusEffect } from 'expo-router'
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import { Search, Heart } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { LogoMark } from '@/components/ui'
import { NotificationPopBadge } from '@/components/home/NotificationPopBadge'
import { eventDateParts } from '@/components/events/EventCard'
import { isEventPast, parseServerDate } from '@/lib/dates'
import { hTap } from '@/lib/haptics'

const W = Dimensions.get('window').width
const CARD_W = W - 64
const CARD_H = Math.round(CARD_W * 1.25) // event posters are 4:5
const STEP = CARD_W + 12

/** Logo on the left, search and activity on the right. */
export function HomeTopBar() {
  return (
    <View style={s.topBar}>
      <View style={s.brand}><LogoMark size={20} /><Text style={s.brandText}>GORAVE</Text></View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        <Pressable style={s.iconBtn} onPress={() => { hTap(); router.push('/(profile)/search' as any) }} hitSlop={6}>
          <Search size={19} color={Colors.inkPrimary} strokeWidth={1.9} />
        </Pressable>
        <Pressable style={s.iconBtn} onPress={() => router.push('/(settings)/notifications' as any)} hitSlop={6}>
          <View><Heart size={19} color={Colors.inkPrimary} strokeWidth={1.9} /><NotificationPopBadge /></View>
        </Pressable>
      </View>
    </View>
  )
}

/** What's on in your city, soonest first, that you could still join. */
export function useTonight(city: string | null | undefined) {
  const [events, setEvents] = useState<EventSummary[]>([])
  useFocusEffect(useCallback(() => {
    if (!city) return
    let alive = true
    ApiService.getEvents({ city, discover: true, limit: 12 })
      .then(list => {
        if (!alive) return
        setEvents([...list].sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0)).slice(0, 8))
      })
      .catch(() => {})
    return () => { alive = false }
  }, [city]))
  return events
}

function HeroCard({ event, index, x }: { event: EventSummary; index: number; x: SharedValue<number> }) {
  const d = eventDateParts(event.date_time)
  const cover = event.cover_photos?.[0]?.url
  // The photo slides a little slower than the card, so it looks deeper.
  const photo = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(x.value, [(index - 1) * STEP, index * STEP, (index + 1) * STEP], [-60, 0, 60], Extrapolation.CLAMP) }, { scale: 1.2 }],
  }))
  const card = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(x.value, [(index - 1) * STEP, index * STEP, (index + 1) * STEP], [0.94, 1, 0.94], Extrapolation.CLAMP) }],
  }))
  return (
    <Animated.View style={[s.heroCard, card]}>
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.push(`/(events)/${event.id}` as any)}>
        <Animated.View style={[StyleSheet.absoluteFill, photo]}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority={index < 2 ? 'high' : 'normal'} /> : null}
        </Animated.View>
        <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.35)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        <View style={s.heroDate}>
          <Text style={s.heroDay}>{d?.day}</Text>
          <Text style={s.heroMon}>{d?.mon}</Text>
        </View>
        <View style={s.heroInfo}>
          <Text style={s.heroWhen}>{[d?.dow, d?.time, event.area].filter(Boolean).join(' · ')}</Text>
          <Text style={s.heroTitle} numberOfLines={2}>{event.title}</Text>
          <View style={s.heroFoot}>
            <Text style={s.heroGoing}>{event.attendee_count > 0 ? `${event.attendee_count} going` : 'Be the first in'}</Text>
            <View style={s.heroPrice}><Text style={s.heroPriceText}>{event.is_free ? 'Free' : `₹${event.price_inr}`}</Text></View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  )
}

/** Big 4:5 posters you swipe through; the photos drift inside the cards. */
export function TonightCarousel({ events, city }: { events: EventSummary[]; city: string | null | undefined }) {
  const x = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { x.value = e.contentOffset.x })
  if (!events.length) return null
  return (
    <View style={{ gap: 12 }}>
      <View style={s.headRow}>
        <Text style={s.head}>On in {city ?? 'your city'}</Text>
        <Pressable onPress={() => router.push('/(tabs)/events' as any)} hitSlop={8}><Text style={s.seeAll}>See all</Text></Pressable>
      </View>
      <Animated.ScrollView
        horizontal
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsHorizontalScrollIndicator={false}
        snapToInterval={STEP}
        decelerationRate="fast"
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 32, gap: 12 }}
      >
        {events.map((e, i) => <HeroCard key={e.id} event={e} index={i} x={x} />)}
      </Animated.ScrollView>
    </View>
  )
}

/** Your next seven days, with a dot on the ones you have plans. */
export function WeekStrip() {
  const [days, setDays] = useState<Record<string, number>>({})
  useFocusEffect(useCallback(() => {
    let alive = true
    Promise.all([ApiService.getMyJoinedEvents().catch(() => []), ApiService.getMyHostedEvents().catch(() => [])])
      .then(([a, b]) => {
        if (!alive) return
        const map: Record<string, number> = {}
        for (const e of [...a, ...b]) {
          if (e.is_cancelled || isEventPast(e)) continue
          const d = parseServerDate(e.date_time)
          if (!d) continue
          const k = d.toDateString()
          map[k] = (map[k] ?? 0) + 1
        }
        setDays(map)
      })
    return () => { alive = false }
  }, []))

  const today = new Date()
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(today.getDate() + i); return d })
  const plans = week.reduce((n, d) => n + (days[d.toDateString()] ?? 0), 0)

  return (
    <View style={{ gap: 12 }}>
      <Text style={s.weekSub}>{plans ? `${plans} plan${plans === 1 ? '' : 's'} in the next 7 days` : 'Nothing planned this week yet'}</Text>
      <View style={s.week}>
        {week.map((d, i) => {
          const n = days[d.toDateString()] ?? 0
          const isToday = i === 0
          return (
            <Pressable key={i} style={[s.day, n > 0 && s.dayOn]} onPress={() => { hTap(); router.push('/(settings)/calendar' as any) }}>
              <Text style={[s.dow, n > 0 && s.onText]}>{isToday ? 'Today' : d.toLocaleDateString('en-US', { weekday: 'short' })}</Text>
              <Text style={[s.num, n > 0 && s.onText]}>{d.getDate()}</Text>
              <View style={[s.dot, n > 0 && { backgroundColor: Colors.background }]} />
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 48 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandText: { fontFamily: FontFamily.displayExtraBold, fontSize: 15, letterSpacing: 3, color: Colors.inkPrimary },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },

  headRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  head: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary },
  seeAll: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },

  heroCard: { width: CARD_W, height: CARD_H, borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.surface },
  heroDate: { position: 'absolute', top: 14, left: 14, width: 52, paddingVertical: 6, borderRadius: 14, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  heroDay: { fontFamily: FontFamily.displayExtraBold, fontSize: 22, lineHeight: 24, color: Colors.white },
  heroMon: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.2, color: withOpacity(Colors.white, 0.8), textTransform: 'uppercase' },
  heroInfo: { position: 'absolute', left: 18, right: 18, bottom: 18, gap: 6 },
  heroWhen: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(Colors.white, 0.85) },
  heroTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.8, color: Colors.white },
  heroFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  heroGoing: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.85) },
  heroPrice: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.white },
  heroPriceText: { fontFamily: FontFamily.headingBold, fontSize: 13, color: Colors.nearBlack },

  weekSub: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  week: { flexDirection: 'row', gap: 6 },
  day: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  dayOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  dow: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.inkSecondary },
  num: { fontFamily: FontFamily.displayExtraBold, fontSize: 18, color: Colors.inkPrimary },
  onText: { color: Colors.background },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: 'transparent' },
})
