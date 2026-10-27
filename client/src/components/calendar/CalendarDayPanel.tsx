import { View, Text, StyleSheet, Pressable } from 'react-native'
import { Image } from 'expo-image'
import { ChevronLeft, ChevronRight, TriangleAlert } from 'lucide-react-native'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { PrimaryButton, OutlineButton, EventListCard, EventListCardSkeleton } from '@/components/ui'
import type { DayEvents } from '@/hooks/useCalendarEvents'
import { isEventActive } from '@/lib/dates'
import { Colors, FontFamily, Spacing } from '@/constants'
import { hTap } from '@/lib/haptics'

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

function ordinal(n: number): string {
  const v = n % 100
  if (v >= 11 && v <= 13) return `${n}th`
  switch (n % 10) {
    case 1: return `${n}st`
    case 2: return `${n}nd`
    case 3: return `${n}rd`
    default: return `${n}th`
  }
}

/** "Tuesday October 29th" with arrows to step a day either way. */
export function CalendarDayNav({ selectedDate, onShiftDay }: {
  selectedDate: Date
  onShiftDay: (delta: number) => void
}) {
  return (
    <View style={s.dayNavRow}>
      <Pressable onPress={() => { hTap(); onShiftDay(-1) }} hitSlop={10} style={s.dayNavArrow}>
        <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
      </Pressable>
      <Text style={s.dayNavText} numberOfLines={1}>
        <Text style={s.dayNavBold}>{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })} </Text>
        <Text style={s.dayNavMuted}>{MONTH_NAMES[selectedDate.getMonth()]} {ordinal(selectedDate.getDate())}</Text>
      </Text>
      <Pressable onPress={() => { hTap(); onShiftDay(1) }} hitSlop={10} style={s.dayNavArrow}>
        <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
      </Pressable>
    </View>
  )
}

/** "Got plans?" with Create / Browse, shared by both calendar layouts. */
export function CalendarEmptyState({ subtitle, onCreateEvent, onBrowseEvents }: {
  subtitle: string
  onCreateEvent: () => void
  onBrowseEvents: () => void
}) {
  return (
    <View style={s.emptyWrap}>
      <View style={s.emptyPosters}>
        <Image source={POSTER.danceFloor} style={[s.emptyPoster, { transform: [{ rotate: '-6deg' }], marginRight: -28 }]} contentFit="cover" />
        <Image source={POSTER.cheers} style={[s.emptyPoster, { transform: [{ rotate: '5deg' }], zIndex: 1 }]} contentFit="cover" />
      </View>
      <Text style={s.emptyTitle}>Got plans?</Text>
      <Text style={s.emptySub}>{subtitle}</Text>
      <View style={s.emptyActions}>
        <View style={{ flex: 1 }}>
          <PrimaryButton label="Create Event" size="small" onPress={() => { hTap(); onCreateEvent() }} />
        </View>
        <View style={{ flex: 1 }}>
          <OutlineButton label="Browse Events" size="small" onPress={() => { hTap(); onBrowseEvents() }} />
        </View>
      </View>
    </View>
  )
}

export function CalendarErrorState({ title, onRetry }: { title: string; onRetry: () => void }) {
  return (
    <View style={s.emptyWrap}>
      <TriangleAlert size={28} color={Colors.inkDisabled} strokeWidth={1.6} />
      <Text style={s.emptyTitle}>{title}</Text>
      <Text style={s.emptySub}>Check your connection and try again</Text>
      <PrimaryButton label="Retry" size="small" onPress={() => { hTap(); onRetry() }} />
    </View>
  )
}

interface CalendarDayContentProps {
  dayLoading: boolean
  dayError: boolean
  dayEvents: DayEvents
  onRetry: () => void
  onCreateEvent: () => void
  onBrowseEvents: () => void
}

/**
 * The selected day's events, grouped by how you're involved. Not scrollable on
 * its own: the calendar screen owns the scroll so the month can fold above it.
 */
export function CalendarDayContent({
  dayLoading, dayError, dayEvents, onRetry, onCreateEvent, onBrowseEvents,
}: CalendarDayContentProps) {
  const { joined: dayJoined, hosted: dayHosted, waitlisted: dayWaitlisted, other: dayOther } = dayEvents
  const hasEvents = dayJoined.length > 0 || dayHosted.length > 0 || dayWaitlisted.length > 0 || dayOther.length > 0

  if (dayLoading) {
    return (
      <View style={s.eventsCol}>
        <View style={s.cardsCol}>
          {Array.from({ length: 3 }).map((_, i) => <EventListCardSkeleton key={i} />)}
        </View>
      </View>
    )
  }
  if (dayError) return <CalendarErrorState title="Couldn't load this day" onRetry={onRetry} />
  if (!hasEvents) {
    return (
      <CalendarEmptyState
        subtitle="Nothing on this day yet. Let's change that."
        onCreateEvent={onCreateEvent}
        onBrowseEvents={onBrowseEvents}
      />
    )
  }

  return (
    <View style={s.eventsCol}>
      {dayJoined.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>GOING</Text>
          <View style={s.cardsCol}>
            {dayJoined.map(e => <EventListCard key={e.id} event={e} showSos={isEventActive(e)} />)}
          </View>
        </View>
      )}
      {dayHosted.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>HOSTING</Text>
          <View style={s.cardsCol}>
            {dayHosted.map(e => <EventListCard key={e.id} event={e} />)}
          </View>
        </View>
      )}
      {dayWaitlisted.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>WAITLISTED</Text>
          <View style={s.cardsCol}>
            {dayWaitlisted.map(e => <EventListCard key={e.id} event={e} />)}
          </View>
        </View>
      )}
      {dayOther.length > 0 && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>HAPPENING NEARBY</Text>
          <View style={s.cardsCol}>
            {dayOther.map(e => <EventListCard key={e.id} event={e} />)}
          </View>
        </View>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  dayNavRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 12, paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  dayNavArrow: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  dayNavText: { flex: 1, textAlign: 'center' },
  dayNavBold: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  dayNavMuted: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkSecondary },

  eventsCol: { padding: Spacing.screenPadding, gap: 20 },
  section: { gap: 10 },
  sectionLabel: {
    fontFamily: FontFamily.bodyMedium, fontSize: 11, letterSpacing: 0.8,
    color: Colors.inkSecondary,
  },
  cardsCol: { gap: 10 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 32, gap: 6 },
  emptyPosters: { flexDirection: 'row', marginBottom: 14 },
  emptyPoster: { width: 84, height: 105, borderRadius: 12, backgroundColor: Colors.surfaceMuted },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 18 },
  emptyActions: { flexDirection: 'row', gap: 10, width: '100%' },
})
