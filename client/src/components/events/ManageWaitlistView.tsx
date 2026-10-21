import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Clock } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl } from '@/components/ui'
import { WOMEN_COLOR, MEN_COLOR } from '@/components/events/EventPeopleCard'
import type { EventDetail, WaitlistEntry } from '@/api/apiService'
import { parseServerDate } from '@/lib/dates'

export interface ManageWaitlistViewProps {
  event: EventDetail | null
  pending: WaitlistEntry[]
  offered: WaitlistEntry[]
  byGender: { women: number; men: number; other: number }
  admitting: boolean
  onAdmit: () => void
  refreshing: boolean
  onRefresh: () => void
  onBack: () => void
  onOpenProfile: (entry: WaitlistEntry) => void
}

export function timeAgo(iso: string) {
  const d = parseServerDate(iso)
  if (!d) return ''
  const mins = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000))
  if (mins < 60) return `${mins}m ago`
  const h = Math.round(mins / 60)
  return h < 24 ? `${h}h ago` : `${Math.round(h / 24)}d ago`
}

export function timeLeft(iso: string) {
  const d = parseServerDate(iso)
  if (!d) return ''
  const s = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  return h > 0 ? `${h}h ${m}m left` : `${m}m left`
}

export const GENDER_WORD: Record<string, string> = { Female: 'Woman', Male: 'Man', 'Non-binary': 'Non-binary' }

const BAR_H = 52

/**
 * Manage waitlist (host). A large title that folds into the top bar, the queue's
 * mix as one bar, then everyone in order with their number set big, like a
 * departures board. One button at the bottom offers the next spot.
 */
export function ManageWaitlistView(p: ManageWaitlistViewProps) {
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const barTitle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [30, 70], [0, 1], Extrapolation.CLAMP) }))
  const bigTitle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolation.CLAMP) }))
  const total = p.pending.length
  const g = p.byGender

  const header = (
    <View style={s.head}>
      <Animated.View style={bigTitle}>
        <Text style={s.big}>Waitlist</Text>
        {p.event?.title ? <Text style={s.eventTitle} numberOfLines={1}>{p.event.title}</Text> : null}
      </Animated.View>

      <View style={s.stats}>
        <Stat n={total} label="waiting" />
        <Stat n={p.offered.length} label="offered" />
        <Stat n={p.event?.spots_left ?? 0} label="spots left" />
      </View>

      {total > 0 ? (
        <View style={{ gap: 8 }}>
          <View style={s.mixBar}>
            {g.women ? <View style={{ flex: g.women, backgroundColor: WOMEN_COLOR }} /> : null}
            {g.men ? <View style={{ flex: g.men, backgroundColor: MEN_COLOR }} /> : null}
            {g.other ? <View style={{ flex: g.other, backgroundColor: Colors.inkDisabled }} /> : null}
          </View>
          <View style={s.legend}>
            <Legend color={WOMEN_COLOR} text={`${g.women} women`} />
            <Legend color={MEN_COLOR} text={`${g.men} men`} />
            {g.other ? <Legend color={Colors.inkDisabled} text={`${g.other} others`} /> : null}
          </View>
        </View>
      ) : null}

      {p.offered.length > 0 ? (
        <>
          <Text style={s.section}>Spot offered</Text>
          {p.offered.map(e => <Row key={e.id} entry={e} offered onPress={() => p.onOpenProfile(e)} />)}
        </>
      ) : null}
      <Text style={s.section}>In line</Text>
    </View>
  )

  return (
    <View style={s.root}>
      <Animated.FlatList
        data={p.pending}
        keyExtractor={e => e.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderItem={({ item }) => <Row entry={item} onPress={() => p.onOpenProfile(item)} />}
        ListEmptyComponent={<Text style={s.empty}>Nobody’s waiting right now.</Text>}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingTop: insets.top + BAR_H, paddingBottom: insets.bottom + 110 }}
      />

      <View style={[s.bar, { paddingTop: insets.top, height: insets.top + BAR_H }]}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Animated.Text style={[s.barTitle, barTitle]}>Waitlist · {total}</Animated.Text>
        <View style={s.iconBtn} />
      </View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[s.cta, (!total || p.admitting) && s.ctaOff]} disabled={!total || p.admitting} onPress={p.onAdmit}>
          {p.admitting ? <ActivityIndicator color={Colors.background} /> : (
            <>
              <Text style={s.ctaText}>Add a spot for the next person</Text>
              <Text style={s.ctaSub}>Adds 1 spot and holds it for the first person in line who fits the mix, for 1 hour</Text>
            </>
          )}
        </Pressable>
      </View>
    </View>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statN}>{n}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function Legend({ color, text }: { color: string; text: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.dot, { backgroundColor: color }]} />
      <Text style={s.legendText}>{text}</Text>
    </View>
  )
}

function Row({ entry, offered, onPress }: { entry: WaitlistEntry; offered?: boolean; onPress: () => void }) {
  return (
    <Pressable style={s.row} onPress={onPress}>
      <Text style={s.num}>{String(entry.position).padStart(2, '0')}</Text>
      <View style={s.avatar}>
        {entry.avatar ? <Image source={{ uri: entry.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(entry.name ?? '?').charAt(0).toUpperCase()}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{entry.name ?? 'Guest'}</Text>
        <Text style={s.sub} numberOfLines={1}>
          {[entry.gender ? GENDER_WORD[entry.gender] : null, entry.username ? `@${entry.username}` : null].filter(Boolean).join(' · ')}
        </Text>
      </View>
      {offered && entry.offer_expires_at ? (
        <View style={s.offerChip}>
          <Clock size={11} color={Colors.inkPrimary} strokeWidth={2.2} />
          <Text style={s.offerText}>{timeLeft(entry.offer_expires_at)}</Text>
        </View>
      ) : (
        <Text style={s.when}>{timeAgo(entry.joined_at)}</Text>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, backgroundColor: Colors.background },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },

  head: { paddingHorizontal: 20, paddingTop: 4 },
  big: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, letterSpacing: -1, color: Colors.inkPrimary },
  eventTitle: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary, marginTop: 2 },

  stats: { flexDirection: 'row', marginTop: 22, marginBottom: 18, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  stat: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  statN: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, color: Colors.inkPrimary },
  statLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  mixBar: { flexDirection: 'row', height: 8, borderRadius: 4, overflow: 'hidden', gap: 2 },
  legend: { flexDirection: 'row', gap: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  section: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 26, marginBottom: 4, textTransform: 'uppercase' },

  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 12 },
  num: { width: 34, fontFamily: FontFamily.displayExtraBold, fontSize: 22, color: Colors.inkDisabled },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  when: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  offerChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  offerText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkPrimary },
  empty: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, paddingHorizontal: 20, paddingVertical: 12 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  cta: { borderRadius: 18, backgroundColor: Colors.inkPrimary, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center', minHeight: 58, justifyContent: 'center' },
  ctaOff: { opacity: 0.4 },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.background },
  ctaSub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: withOpacity(Colors.background, 0.65), marginTop: 2, textAlign: 'center' },
})
