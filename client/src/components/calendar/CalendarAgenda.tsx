import { useState, type ReactElement } from 'react'
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native'
import Animated, {
  Extrapolation, interpolate, runOnJS, useAnimatedReaction, useAnimatedRef,
  useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, type SharedValue,
} from 'react-native-reanimated'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { EventListCardSkeleton } from '@/components/ui'
import { SosPill } from '@/components/events/SosButton'
import type { EventSummary } from '@/api/apiService'
import { isEventActive, parseServerDate } from '@/lib/dates'
import { Colors, FontFamily, Spacing, Radius, EVENT_ICONS, EVENT_ICON_FALLBACK, withOpacity } from '@/constants'
import { hSelection } from '@/lib/haptics'
import { CalendarEmptyState, CalendarErrorState } from './CalendarDayPanel'
import type { AgendaDay } from './useCalendarAgenda'

const POSTER_W = 156
const POSTER_H = POSTER_W * 5 / 4
// How far a poster's image drifts against its card while crossing the screen.
const DRIFT = 18

type Role = 'going' | 'hosting' | 'waitlisted' | null
const ROLE_LABEL: Record<Exclude<Role, null>, string> = { going: 'Going', hosting: 'Hosting', waitlisted: 'Waitlisted' }

function headingFor(index: number, d: Date): string {
  if (index === 0) return 'Tonight'
  if (index === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function shortDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })
}

function timeOf(e: EventSummary): string {
  const d = parseServerDate(e.date_time)
  return d ? d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' }) : 'Time TBC'
}

function dayItems(day: AgendaDay): { event: EventSummary; role: Role }[] {
  const { joined, hosted, waitlisted, other } = day.events
  return [
    ...joined.map(event => ({ event, role: 'going' as Role })),
    ...hosted.map(event => ({ event, role: 'hosting' as Role })),
    ...waitlisted.map(event => ({ event, role: 'waitlisted' as Role })),
    ...other.map(event => ({ event, role: null })),
  ]
}

interface CalendarAgendaProps {
  days: AgendaDay[]
  loading: boolean
  error: boolean
  onRetry: () => void
  onCreateEvent: () => void
  onBrowseEvents: () => void
}

/**
 * Lab B: the coming weeks as one agenda. Busy days get a big sticky heading
 * and a row of posters; quiet days are a single compact line. The week strip
 * on top follows whichever day is under the heading, and tapping a day in it
 * jumps there.
 */
export function CalendarAgenda({ days, loading, error, onRetry, onCreateEvent, onBrowseEvents }: CalendarAgendaProps) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>()
  const scrollY = useSharedValue(0)
  // Top of each day in the list, by day index.
  const offsets = useSharedValue<number[]>([])
  const [active, setActive] = useState(0)
  const [viewH, setViewH] = useState(0)

  const onScroll = useAnimatedScrollHandler(e => { scrollY.set(e.contentOffset.y) })

  useAnimatedReaction(() => {
    const arr = offsets.value
    const y = scrollY.value + 8
    let idx = 0
    for (let i = 0; i < arr.length; i++) {
      if (arr[i] !== undefined && arr[i] <= y) idx = i
    }
    return idx
  }, (idx, prev) => {
    if (idx !== prev) runOnJS(setActive)(idx)
  })

  const setOffset = (i: number, y: number) => {
    offsets.modify(arr => {
      'worklet'
      arr[i] = y
      return arr
    })
  }

  const jumpTo = (i: number) => {
    hSelection()
    setActive(i)
    const y = offsets.get()[i]
    if (y !== undefined) scrollRef.current?.scrollTo({ y, animated: true })
  }

  if (loading && days.every(d => !d.hasEvents)) {
    return (
      <View style={s.skeleton}>
        {Array.from({ length: 3 }).map((_, i) => <EventListCardSkeleton key={i} />)}
      </View>
    )
  }
  if (error) return <CalendarErrorState title="Couldn't load your calendar" onRetry={onRetry} />
  if (days.every(d => !d.hasEvents)) {
    return (
      <CalendarEmptyState
        subtitle="Nothing in the next three weeks yet. Let's change that."
        onCreateEvent={onCreateEvent}
        onBrowseEvents={onBrowseEvents}
      />
    )
  }

  // Busy days contribute a sticky heading plus a body; quiet days one line.
  const children: ReactElement[] = []
  const sticky: number[] = []
  days.forEach((day, i) => {
    if (!day.hasEvents) {
      children.push(
        <View key={day.key} style={s.quietRow} onLayout={e => setOffset(i, e.nativeEvent.layout.y)}>
          <Text style={s.quietDate}>{i === 0 ? 'Tonight' : i === 1 ? 'Tomorrow' : shortDate(day.date)}</Text>
          <Text style={s.quietText}>Nothing yet</Text>
        </View>,
      )
      return
    }
    const items = dayItems(day)
    sticky.push(children.length)
    children.push(
      <View key={`${day.key}-h`} style={s.heading} onLayout={e => setOffset(i, e.nativeEvent.layout.y)}>
        <Text style={s.headingText}>{headingFor(i, day.date)}</Text>
        <Text style={s.headingMeta}>
          {i < 2 ? `${shortDate(day.date)} · ` : ''}{items.length} {items.length === 1 ? 'plan' : 'plans'}
        </Text>
      </View>,
    )
    children.push(<AgendaDayBody key={`${day.key}-b`} items={items} scrollY={scrollY} viewH={viewH} />)
  })

  const weekStart = Math.floor(active / 7) * 7
  const week = days.slice(weekStart, weekStart + 7)

  return (
    <View style={s.root}>
      <View style={s.strip}>
        {week.map((day, j) => {
          const i = weekStart + j
          const on = i === active
          return (
            <Pressable key={day.key} style={s.stripCell} onPress={() => jumpTo(i)} hitSlop={4}>
              <Text style={[s.stripDow, on && s.stripDowOn]}>
                {day.date.toLocaleDateString('en-GB', { weekday: 'narrow' })}
              </Text>
              <View style={[s.stripCircle, on && s.stripCircleOn]}>
                <Text style={[s.stripNum, on && s.stripNumOn]}>{day.date.getDate()}</Text>
              </View>
              <View style={[s.stripDot, day.hasEvents && (on ? s.stripDotHidden : s.stripDotOn)]} />
            </Pressable>
          )
        })}
      </View>

      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickyHeaderIndices={sticky}
        showsVerticalScrollIndicator={false}
        onLayout={e => setViewH(e.nativeEvent.layout.height)}
        contentContainerStyle={s.list}
      >
        {children}
      </Animated.ScrollView>
    </View>
  )
}

function AgendaDayBody({ items, scrollY, viewH }: {
  items: { event: EventSummary; role: Role }[]
  scrollY: SharedValue<number>
  viewH: number
}) {
  const bodyY = useSharedValue(0)
  return (
    <View onLayout={e => bodyY.set(e.nativeEvent.layout.y)}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.posterRow}
      >
        {items.map(({ event, role }) => (
          <AgendaPoster key={event.id} event={event} role={role} bodyY={bodyY} scrollY={scrollY} viewH={viewH} />
        ))}
      </ScrollView>
    </View>
  )
}

function AgendaPoster({ event, role, bodyY, scrollY, viewH }: {
  event: EventSummary
  role: Role
  bodyY: SharedValue<number>
  scrollY: SharedValue<number>
  viewH: number
}) {
  const cover = event.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
  const live = role === 'going' && isEventActive(event)

  // Card top on screen goes from the bottom edge (entering) to above the top
  // (leaving); the image runs the other way across DRIFT, so it lags the card.
  const imgStyle = useAnimatedStyle(() => {
    const top = bodyY.value - scrollY.value
    return {
      transform: [{
        translateY: interpolate(top, [-POSTER_H, Math.max(viewH, 1)], [DRIFT, -DRIFT], Extrapolation.CLAMP),
      }],
    }
  })

  return (
    <Pressable style={s.poster} onPress={() => router.push(`/(events)/${event.id}` as any)}>
      <View style={s.posterFrame}>
        {cover ? (
          <Animated.View style={[s.posterImgWrap, imgStyle]}>
            <Image source={{ uri: cover }} style={s.posterImg} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          </Animated.View>
        ) : (
          <View style={s.posterFallback}>
            <TypeIcon size={28} color={Colors.inkDisabled} strokeWidth={1.5} />
          </View>
        )}
        {role && (
          <View style={s.roleChip}>
            <Text style={s.roleText}>{ROLE_LABEL[role]}</Text>
          </View>
        )}
        {live && <SosPill eventId={event.id} style={s.sos} />}
      </View>
      <Text style={s.posterTitle} numberOfLines={2}>{event.title}</Text>
      <Text style={s.posterMeta} numberOfLines={1}>
        {timeOf(event)}{event.area || event.city ? ` · ${event.area || event.city}` : ''}
      </Text>
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  skeleton: { padding: Spacing.screenPadding, gap: 10 },

  strip: {
    flexDirection: 'row', paddingHorizontal: Spacing.screenPadding - 8, paddingTop: 4, paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  stripCell: { flex: 1, alignItems: 'center', gap: 4 },
  stripDow: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled },
  stripDowOn: { color: Colors.inkPrimary },
  stripCircle: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  stripCircleOn: { backgroundColor: Colors.inkPrimary },
  stripNum: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  stripNumOn: { color: Colors.background, fontFamily: FontFamily.bodySemiBold },
  stripDot: { width: 5, height: 5, borderRadius: 3, overflow: 'hidden', backgroundColor: 'transparent' },
  stripDotOn: { backgroundColor: Colors.inkSecondary },
  stripDotHidden: { backgroundColor: 'transparent' },

  list: { paddingBottom: 48 },
  heading: {
    flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 18, paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  headingText: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.6, color: Colors.inkPrimary },
  headingMeta: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  quietRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: Spacing.screenPadding, paddingVertical: 13,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  quietDate: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkSecondary },
  quietText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkDisabled },

  posterRow: { paddingHorizontal: Spacing.screenPadding, paddingBottom: 18, gap: 12 },
  poster: { width: POSTER_W },
  posterFrame: {
    width: POSTER_W, height: POSTER_H, borderRadius: Radius.card,
    overflow: 'hidden', backgroundColor: Colors.surfaceMuted,
  },
  posterImgWrap: { position: 'absolute', left: 0, right: 0, top: -DRIFT, height: POSTER_H + DRIFT * 2 },
  posterImg: { width: '100%', height: '100%' },
  posterFallback: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  roleChip: {
    position: 'absolute', left: 8, bottom: 8,
    paddingHorizontal: 9, paddingVertical: 4, borderRadius: Radius.pill,
    backgroundColor: withOpacity(Colors.background, 0.78),
  },
  roleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkPrimary },
  sos: { position: 'absolute', top: 8, right: 8 },
  posterTitle: { fontFamily: FontFamily.headingBold, fontSize: 15, lineHeight: 19, color: Colors.inkPrimary, marginTop: 9 },
  posterMeta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 3 },
})
