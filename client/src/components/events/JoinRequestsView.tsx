import { useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { Extrapolation, FadeOut, LinearTransition, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import ReanimatedSwipeable, { type SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, Inbox, Repeat, Users, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl, EmptyState } from '@/components/ui'
import { WOMEN_COLOR, MEN_COLOR } from '@/components/events/EventPeopleCard'
import { genderBucket } from '@/lib/crowdMix'
import { parseServerDate } from '@/lib/dates'
import { hSelection, hTap } from '@/lib/haptics'
import type { EventDetail, JoinRequest, JoinRequestsResponse } from '@/api/apiService'

export interface RequestsViewProps {
  event: EventDetail | null
  data: JoinRequestsResponse
  /** Request id being accepted/declined, or 'bulk'. */
  busy: string | null
  onAccept: (r: JoinRequest) => void
  onDecline: (r: JoinRequest) => void
  onAcceptAll: () => void
  onOpenProfile: (r: JoinRequest) => void
  refreshing: boolean
  onRefresh: () => void
  onBack: () => void
}

/** Little facts that help a host decide, most telling first. */
export function requestFacts(r: JoinRequest): string[] {
  const out: string[] = []
  if (r.attended_your_events) out.push('Been to your events')
  if (r.is_following) out.push('You follow them')
  if (r.mutual_count > 0) out.push(`${r.mutual_count} mutual${r.mutual_count === 1 ? '' : 's'}`)
  if (r.events_attended > 0) out.push(`${r.events_attended} event${r.events_attended === 1 ? '' : 's'} on Gorave`)
  else out.push('New to Gorave')
  return out
}

export const GENDER_WORD: Record<string, string> = { Female: 'Woman', Male: 'Man', 'Non-binary': 'Non-binary' }

export function whoLine(r: JoinRequest) {
  return [r.age ? String(r.age) : null, r.gender ? GENDER_WORD[r.gender] ?? r.gender : null, r.city].filter(Boolean).join(' · ')
}

const BAR_H = 52
type Filter = 'all' | 'women' | 'men' | 'before'

function ago(iso: string) {
  const d = parseServerDate(iso)
  if (!d) return ''
  const m = Math.max(1, Math.round((Date.now() - d.getTime()) / 60000))
  return m < 60 ? `${m}m` : m < 1440 ? `${Math.round(m / 60)}h` : `${Math.round(m / 1440)}d`
}

/**
 * Join requests, as a guest list. A large title that folds into the top bar, the room
 * drawn seat by seat in the crowd-mix colours, quick filters, then everyone
 * asking as a row you swipe right to let in or left to decline, the way
 * Mail handles a list. The buttons stay for people who don't swipe.
 */
export function JoinRequestsView(p: RequestsViewProps) {
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })
  const barTitle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [30, 70], [0, 1], Extrapolation.CLAMP) }))
  const bigTitle = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [0, 50], [1, 0], Extrapolation.CLAMP) }))
  const [filter, setFilter] = useState<Filter>('all')

  const reqs = p.data.requests
  const fit = reqs.filter(r => r.can_accept).length
  const c = p.data.counts
  const ratio = p.data.ratio
  const counts = useMemo(() => ({
    all: reqs.length,
    women: reqs.filter(r => genderBucket(r.gender) === 'women').length,
    men: reqs.filter(r => genderBucket(r.gender) === 'men').length,
    before: reqs.filter(r => r.attended_your_events).length,
  }), [reqs])
  const shown = reqs.filter(r =>
    filter === 'all' ? true :
    filter === 'before' ? r.attended_your_events :
    genderBucket(r.gender) === filter)

  const header = (
    <View style={s.head}>
      <Animated.View style={bigTitle}>
        <Text style={s.big}>Requests</Text>
        {p.event?.title ? <Text style={s.eventTitle} numberOfLines={1}>{p.event.title}</Text> : null}
      </Animated.View>

      <View style={s.room}>
        <View style={s.roomTop}>
          <Text style={s.roomNum}>{p.data.capacity - p.data.spots_left}<Text style={s.roomOf}> / {p.data.capacity} going</Text></Text>
          <Text style={s.roomLeft}>{p.data.spots_left} open</Text>
        </View>
        <Seats capacity={p.data.capacity} women={c.women} men={c.men} other={c.other} />
        <View style={s.legend}>
          <Legend color={WOMEN_COLOR} text={`${c.women} women`} />
          <Legend color={MEN_COLOR} text={`${c.men} men`} />
          {c.other ? <Legend color={Colors.inkSecondary} text={`${c.other} others`} /> : null}
          <Legend empty text="open" />
        </View>
        {ratio && ratio.women_pct > 0 && ratio.women_pct < 100 ? (
          <Text style={s.roomNote}>Room for {ratio.women_left} more women and {ratio.men_left} more men, {ratio.open_left} open to anyone</Text>
        ) : null}
      </View>

      {reqs.length ? (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={{ marginHorizontal: -20 }}>
            {([['all', 'All'], ['women', 'Women'], ['men', 'Men'], ['before', 'Been before']] as [Filter, string][]).map(([k, label]) => {
              const on = filter === k
              if (k !== 'all' && counts[k] === 0) return null
              return (
                <Pressable key={k} style={[s.chip, on && s.chipOn]} onPress={() => { hSelection(); setFilter(k) }}>
                  <Text style={[s.chipText, on && s.chipTextOn]}>{label} <Text style={[s.chipCount, on && s.chipTextOn]}>{counts[k]}</Text></Text>
                </Pressable>
              )
            })}
          </ScrollView>
          <Text style={s.hint}>Swipe right to let someone in, left to decline</Text>
        </>
      ) : null}
    </View>
  )

  return (
    <View style={s.root}>
      <Animated.FlatList
        data={shown}
        keyExtractor={r => r.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        itemLayoutAnimation={LinearTransition.duration(220)}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderItem={({ item }) => <Row r={item} busy={p.busy} onAccept={p.onAccept} onDecline={p.onDecline} onOpen={p.onOpenProfile} />}
        ListEmptyComponent={
          <View style={{ marginTop: 40 }}>
            {reqs.length ? (
              <Text style={s.emptyFilter}>Nobody in this filter.</Text>
            ) : (
              <EmptyState icon={<Inbox size={48} color={Colors.inkDisabled} strokeWidth={1.2} />} title="You're all caught up" subtitle="When someone asks to join, they'll show up here." />
            )}
          </View>
        }
        ListFooterComponent={reqs.length ? <Text style={s.foot}>Declining is final, they can&apos;t ask again. Requests still waiting when the event starts expire.</Text> : null}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingTop: insets.top + BAR_H, paddingBottom: insets.bottom + (fit > 1 ? 100 : 30) }}
      />

      <View style={[s.bar, { paddingTop: insets.top, height: insets.top + BAR_H }]}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Animated.Text style={[s.barTitle, barTitle]}>Requests · {reqs.length}</Animated.Text>
        <View style={s.iconBtn} />
      </View>

      {fit > 1 ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={s.cta} onPress={() => { hTap(); p.onAcceptAll() }} disabled={!!p.busy}>
            {p.busy === 'bulk' ? <ActivityIndicator color={Colors.background} /> : (
              <>
                <Users size={18} color={Colors.background} strokeWidth={2} />
                <Text style={s.ctaText}>Let in all {fit} who fit</Text>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

/** Every seat in the room, filled in the order people joined. */
function Seats({ capacity, women, men, other }: { capacity: number; women: number; men: number; other: number }) {
  const n = Math.min(capacity, 60)
  const seats = Array.from({ length: n }, (_, i) =>
    i < women ? WOMEN_COLOR : i < women + men ? MEN_COLOR : i < women + men + other ? Colors.inkSecondary : null)
  return (
    <View style={s.seats}>
      {seats.map((col, i) => (
        <View key={i} style={[s.seat, col ? { backgroundColor: col, borderColor: col } : null]} />
      ))}
    </View>
  )
}

function Legend({ color, text, empty }: { color?: string; text: string; empty?: boolean }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, empty ? s.legendEmpty : { backgroundColor: color }]} />
      <Text style={s.legendText}>{text}</Text>
    </View>
  )
}

function SwipeAction({ progress, side }: { progress: SharedValue<number>; side: 'accept' | 'decline' }) {
  const st = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(progress.value, [0, 1], [0.7, 1], Extrapolation.CLAMP) }] }))
  const accept = side === 'accept'
  return (
    <View style={[s.action, accept ? s.actionAccept : s.actionDecline, accept ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }]}>
      <Animated.View style={[s.actionInner, st]}>
        {accept ? <Check size={22} color={Colors.background} strokeWidth={2.6} /> : <X size={22} color={Colors.white} strokeWidth={2.6} />}
        <Text style={[s.actionText, { color: accept ? Colors.background : Colors.white }]}>{accept ? 'Let in' : 'Decline'}</Text>
      </Animated.View>
    </View>
  )
}

function Row({ r, busy, onAccept, onDecline, onOpen }: { r: JoinRequest; busy: string | null; onAccept: (r: JoinRequest) => void; onDecline: (r: JoinRequest) => void; onOpen: (r: JoinRequest) => void }) {
  const facts = requestFacts(r).slice(0, 2).join(' · ')
  const bucket = genderBucket(r.gender)
  const dot = bucket === 'women' ? WOMEN_COLOR : bucket === 'men' ? MEN_COLOR : Colors.inkSecondary
  const swipe = useRef<SwipeableMethods>(null)
  return (
    <Animated.View exiting={FadeOut.duration(180)}>
      <ReanimatedSwipeable
        ref={swipe}
        friction={1.6}
        leftThreshold={90}
        rightThreshold={90}
        overshootLeft={false}
        overshootRight={false}
        enabled={!busy}
        renderLeftActions={r.can_accept ? (progress: SharedValue<number>) => <SwipeAction progress={progress} side="accept" /> : undefined}
        renderRightActions={(progress: SharedValue<number>) => <SwipeAction progress={progress} side="decline" />}
        onSwipeableOpen={(direction: 'left' | 'right') => {
          hTap()
          // Snap back; an accepted row leaves the list, a decline asks first.
          swipe.current?.close()
          // 'left' = the row moved right, revealing the left (accept) action.
          if (direction === 'left') onAccept(r)
          else onDecline(r)
        }}
      >
        <View style={s.row}>
          <Pressable style={s.who} onPress={() => onOpen(r)}>
            <View>
              <View style={s.avatar}>
                {r.avatar ? <Image source={{ uri: r.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(r.name ?? '?').charAt(0)}</Text>}
              </View>
              <View style={[s.genderDot, { backgroundColor: dot }]} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={s.nameRow}>
                <Text style={s.name} numberOfLines={1}>{r.name ?? 'Guest'}</Text>
                <Text style={s.when}>{ago(r.requested_at)}</Text>
              </View>
              <Text style={s.sub} numberOfLines={1}>{whoLine(r)}</Text>
              <View style={s.factRow}>
                {r.attended_your_events ? <Repeat size={11} color={Colors.inkPrimary} strokeWidth={2.4} /> : null}
                <Text style={[s.fact, !r.can_accept && { color: Colors.destructive }]} numberOfLines={1}>
                  {r.can_accept ? facts : 'Their share of the mix is full'}
                </Text>
              </View>
            </View>
          </Pressable>
          <Pressable style={[s.accept, (!r.can_accept || !!busy) && { opacity: 0.35 }]} onPress={() => { hTap(); onAccept(r) }} disabled={!r.can_accept || !!busy}>
            {busy === r.id ? <ActivityIndicator size="small" color={Colors.background} /> : <Check size={18} color={Colors.background} strokeWidth={2.6} />}
          </Pressable>
          <Pressable style={s.decline} onPress={() => { hTap(); onDecline(r) }} disabled={!!busy} hitSlop={6}>
            <X size={18} color={Colors.inkSecondary} strokeWidth={2.2} />
          </Pressable>
        </View>
      </ReanimatedSwipeable>
    </Animated.View>
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

  room: { marginTop: 20, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 12 },
  roomTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  roomNum: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, color: Colors.inkPrimary },
  roomOf: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  roomLeft: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  seats: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  seat: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.18) },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendEmpty: { borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.3) },
  legendText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  roomNote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 17, color: Colors.inkSecondary },

  chips: { gap: 8, paddingHorizontal: 20, paddingTop: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.divider },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  chipCount: { fontFamily: FontFamily.bodyRegular, color: Colors.inkSecondary },
  chipTextOn: { color: Colors.background },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, marginTop: 14, marginBottom: 4 },

  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: Colors.background },
  who: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  genderDot: { position: 'absolute', right: 1, bottom: 1, width: 14, height: 14, borderRadius: 7, borderWidth: 2.5, borderColor: Colors.background },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { flexShrink: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  when: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 1 },
  factRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 3 },
  fact: { flexShrink: 1, fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkPrimary },
  accept: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  decline: { width: 40, height: 40, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },

  action: { flex: 1, justifyContent: 'center', paddingHorizontal: 24 },
  actionAccept: { backgroundColor: Colors.inkPrimary },
  actionDecline: { backgroundColor: Colors.destructive },
  actionInner: { alignItems: 'center', gap: 3 },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12 },

  emptyFilter: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  foot: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 18, color: Colors.inkDisabled, paddingHorizontal: 20, paddingTop: 14 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  cta: { height: 54, borderRadius: 999, backgroundColor: Colors.inkPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.background },
})
