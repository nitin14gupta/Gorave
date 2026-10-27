import type { ReactNode } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { dateKey } from '@/hooks/useCalendarEvents'
import { Colors, FontFamily, Spacing, Radius } from '@/constants'
import { hTap } from '@/lib/haptics'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Fixed row height so the grid can fold to exactly one week.
export const ROW_H = 54
const ROW_GAP = 2

/** Height of the day rows at full size, for laying out what sits under them. */
export function monthGridHeight(weeks: number): number {
  return weeks * ROW_H + (weeks - 1) * ROW_GAP
}

interface CalendarMonthGridProps {
  visibleMonth: Date
  today: Date
  selectedKey: string
  gridWeeks: (Date | null)[][]
  hasEventsOnDate: (key: string) => boolean
  onShiftMonth: (delta: number) => void
  onGoToday: () => void
  onSelectDate: (d: Date) => void
  /**
   * 0 = full month, 1 = folded to the week holding the selected day. Driven
   * by how far the day's list below has scrolled (lab A).
   */
  collapse?: SharedValue<number>
  /** Height of the month title row plus weekday labels (everything above the day rows). */
  onHeaderLayout?: (height: number) => void
}

function WeekRow({ index, selectedWeek, collapse, children }: {
  index: number
  selectedWeek: number
  collapse?: SharedValue<number>
  children: ReactNode
}) {
  const st = useAnimatedStyle(() => {
    if (!collapse || index === selectedWeek) return { opacity: 1 }
    return { opacity: interpolate(collapse.value, [0, 0.6], [1, 0], Extrapolation.CLAMP) }
  })
  return <Animated.View style={[s.weekRow, st]}>{children}</Animated.View>
}

export function CalendarMonthGrid({
  visibleMonth, today, selectedKey, gridWeeks, hasEventsOnDate,
  onShiftMonth, onGoToday, onSelectDate, collapse, onHeaderLayout,
}: CalendarMonthGridProps) {
  const todayKey = dateKey(today)
  const selectedWeek = Math.max(0, gridWeeks.findIndex(w => w.some(d => d && dateKey(d) === selectedKey)))
  const fullH = monthGridHeight(gridWeeks.length)

  // The grid's window shrinks to one row while the rows slide up so the
  // selected week stays in view.
  const windowStyle = useAnimatedStyle(() => {
    const c = collapse ? collapse.value : 0
    return { height: interpolate(c, [0, 1], [fullH, ROW_H], Extrapolation.CLAMP) }
  })
  const slideStyle = useAnimatedStyle(() => {
    const c = collapse ? collapse.value : 0
    return { transform: [{ translateY: interpolate(c, [0, 1], [0, -selectedWeek * (ROW_H + ROW_GAP)], Extrapolation.CLAMP) }] }
  })
  // Lab A: the month title starts large and settles to bar size as it folds.
  const titleStyle = useAnimatedStyle(() => {
    if (!collapse) return {}
    return { fontSize: interpolate(collapse.value, [0, 1], [24, 17], Extrapolation.CLAMP) }
  })

  return (
    <>
      <View onLayout={onHeaderLayout ? e => onHeaderLayout(e.nativeEvent.layout.height) : undefined}>
        <View style={s.monthRow}>
          <Pressable onPress={() => { hTap(); onShiftMonth(-1) }} hitSlop={10} style={s.monthArrow}>
            <ChevronLeft size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
          </Pressable>
          <Animated.Text style={[s.monthTitle, titleStyle]}>
            {MONTH_NAMES[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}
          </Animated.Text>
          <Pressable onPress={() => { hTap(); onShiftMonth(1) }} hitSlop={10} style={s.monthArrow}>
            <ChevronRight size={20} color={Colors.inkSecondary} strokeWidth={2.2} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable onPress={onGoToday} style={s.todayBtn}>
            <Text style={s.todayBtnText}>Today</Text>
          </Pressable>
        </View>

        <View style={s.weekHeader}>
          {WEEKDAYS.map(w => <Text key={w} style={s.weekHeaderText}>{w}</Text>)}
        </View>
      </View>

      <Animated.View style={[s.gridWindow, windowStyle]}>
        <Animated.View style={[s.grid, slideStyle]}>
          {gridWeeks.map((week, wi) => (
            <WeekRow key={wi} index={wi} selectedWeek={selectedWeek} collapse={collapse}>
              {week.map((d, di) => {
                if (!d) return <View key={di} style={s.dayCell} />
                const k = dateKey(d)
                const isSelected = k === selectedKey
                const isToday = k === todayKey
                const hasDot = k >= todayKey && hasEventsOnDate(k)
                return (
                  <Pressable key={di} style={s.dayCell} onPress={() => onSelectDate(d)}>
                    <View style={[s.dayCircle, isSelected && s.dayCircleSelected]}>
                      <Text style={[s.dayText, isToday && !isSelected && s.dayTextToday, isSelected && s.dayTextSelected]}>
                        {d.getDate()}
                      </Text>
                    </View>
                    <View style={[s.dot, hasDot && (isSelected ? s.dotSelected : s.dotVisible)]} />
                  </Pressable>
                )
              })}
            </WeekRow>
          ))}
        </Animated.View>
      </Animated.View>
    </>
  )
}

const s = StyleSheet.create({
  monthRow: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 6, paddingBottom: 12,
  },
  monthArrow: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginRight: 2 },
  todayBtn: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radius.pill,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  todayBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },

  weekHeader: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding, marginBottom: 4 },
  weekHeaderText: {
    flex: 1, textAlign: 'center',
    fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled,
  },

  gridWindow: { overflow: 'hidden' },
  grid: { paddingHorizontal: Spacing.screenPadding, gap: ROW_GAP },
  weekRow: { flexDirection: 'row', height: ROW_H },
  dayCell: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  dayCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  dayCircleSelected: { backgroundColor: Colors.inkPrimary },
  dayText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  dayTextToday: { color: Colors.inkPrimary, fontFamily: FontFamily.headingBold, textDecorationLine: 'underline' },
  dayTextSelected: { color: Colors.background, fontFamily: FontFamily.bodySemiBold },
  dot: { width: 6, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'transparent' },
  dotVisible: { backgroundColor: Colors.inkPrimary },
  dotSelected: { backgroundColor: Colors.background },
})
