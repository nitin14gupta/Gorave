import { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import Animated, { useAnimatedRef, useAnimatedScrollHandler, useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { ScrollFade } from '@/components/ui/ScrollFade'
import type { DayEvents } from '@/hooks/useCalendarEvents'
import { Colors } from '@/constants'
import { CalendarMonthGrid, ROW_H, monthGridHeight } from './CalendarMonthGrid'
import { CalendarDayNav, CalendarDayContent } from './CalendarDayPanel'

interface CalendarFoldViewProps {
  visibleMonth: Date
  today: Date
  selectedDate: Date
  selectedKey: string
  gridWeeks: (Date | null)[][]
  hasEventsOnDate: (key: string) => boolean
  onShiftMonth: (delta: number) => void
  onGoToday: () => void
  onSelectDate: (d: Date) => void
  onShiftDay: (delta: number) => void
  dayLoading: boolean
  dayError: boolean
  dayEvents: DayEvents
  onRetry: () => void
  onCreateEvent: () => void
  onBrowseEvents: () => void
}

const FADE_H = 56

/**
 * The month pins at the top and folds down to the selected day's week
 * as the day's events scroll up, then opens again back at the top.
 *
 * The month sits over the list rather than above it. The list starts below
 * the full month, and for the first `foldRange` px of scroll the month shrinks
 * by exactly what was scrolled, so the list stays attached to its bottom edge.
 * Past that the month is one week tall and the events slide under it.
 *
 * Folded stays folded: switching day keeps the month at one week (showing the
 * new day's week) and starts that day's list from its top.
 */
export function CalendarFoldView({
  visibleMonth, today, selectedDate, selectedKey, gridWeeks, hasEventsOnDate,
  onShiftMonth, onGoToday, onSelectDate, onShiftDay,
  dayLoading, dayError, dayEvents, onRetry, onCreateEvent, onBrowseEvents,
}: CalendarFoldViewProps) {
  const [headerH, setHeaderH] = useState(0)
  const [navH, setNavH] = useState(0)
  const [viewH, setViewH] = useState(0)

  const gridH = monthGridHeight(gridWeeks.length)
  const foldRange = gridH - ROW_H
  const pinnedH = headerH + gridH + navH

  const listRef = useAnimatedRef<Animated.ScrollView>()
  // Folded = the list came to rest at or past the fold. Kept as state so the
  // list keeps its fold room while the next day loads or turns out empty.
  const [folded, setFolded] = useState(false)
  const foldedRef = useRef(false)
  const onScrollSettle = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = e.nativeEvent.contentOffset.y >= foldRange - 1
    foldedRef.current = next
    setFolded(next)
  }

  // New day while folded: jump to the top of its list, still folded.
  useEffect(() => {
    if (foldedRef.current) listRef.current?.scrollTo({ y: foldRange, animated: false })
  }, [selectedKey, foldRange, listRef])

  const scrollY = useSharedValue(0)
  // How far the events have gone under the folded month, for the tunnel fade.
  const underY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => {
    scrollY.set(e.contentOffset.y)
    underY.set(Math.max(0, e.contentOffset.y - foldRange))
  })
  const collapse = useDerivedValue(() => Math.min(1, Math.max(0, scrollY.value / foldRange)))

  const { joined, hosted, waitlisted, other } = dayEvents
  const hasList = !dayLoading && !dayError && joined.length + hosted.length + waitlisted.length + other.length > 0
  const canFold = hasList || folded

  return (
    <View style={s.root} onLayout={e => setViewH(e.nativeEvent.layout.height)}>
      <Animated.ScrollView
        ref={listRef}
        onScroll={onScroll}
        onScrollEndDrag={onScrollSettle}
        onMomentumScrollEnd={onScrollSettle}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        // Settle fully open or fully folded, then scroll freely past the fold.
        snapToOffsets={canFold ? [0, foldRange] : undefined}
        snapToEnd={false}
        contentContainerStyle={[
          { paddingTop: pinnedH, paddingBottom: 32 },
          // With events (or already folded) there is always room to fold; an
          // open, empty day just fills what's left.
          canFold ? { minHeight: viewH + foldRange } : s.grow,
        ]}
      >
        <CalendarDayContent
          dayLoading={dayLoading}
          dayError={dayError}
          dayEvents={dayEvents}
          onRetry={onRetry}
          onCreateEvent={onCreateEvent}
          onBrowseEvents={onBrowseEvents}
        />
      </Animated.ScrollView>

      <View style={s.pinned}>
        <CalendarMonthGrid
          visibleMonth={visibleMonth}
          today={today}
          selectedKey={selectedKey}
          gridWeeks={gridWeeks}
          hasEventsOnDate={hasEventsOnDate}
          onShiftMonth={onShiftMonth}
          onGoToday={onGoToday}
          onSelectDate={onSelectDate}
          collapse={collapse}
          onHeaderLayout={setHeaderH}
        />
        <View onLayout={e => setNavH(e.nativeEvent.layout.height)}>
          <CalendarDayNav selectedDate={selectedDate} onShiftDay={onShiftDay} />
        </View>
        <View pointerEvents="none" style={s.fadeSlot}>
          <ScrollFade scrollY={underY} height={FADE_H} />
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1 },
  grow: { flexGrow: 1 },
  pinned: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: Colors.background },
  fadeSlot: { position: 'absolute', top: '100%', left: 0, right: 0, height: FADE_H },
})
