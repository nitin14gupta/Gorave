import { useCallback, type ReactNode } from 'react'
import { StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { APP_HEADER_BAR_HEIGHT } from './AppHeader'

// The fixed top bar for inner screens: back on the left, the title in the
// middle of the same line, and a hairline once the list has scrolled.
//
//   const lt = useLargeTitle()
//   <LargeTitleBar title="Blocked" scrollY={lt.scrollY} leftAction={…} />
//   <FlatList onScroll={lt.onScroll} scrollEventThrottle={16}
//     contentContainerStyle={{ paddingTop: lt.barHeight }} />

export function useLargeTitle() {
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  // A plain handler (not a worklet) so it works on any list type and can be
  // combined with a screen's own onScroll.
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.set(e.nativeEvent.contentOffset.y)
  }, [scrollY])
  return { scrollY, onScroll, barHeight: insets.top + APP_HEADER_BAR_HEIGHT }
}

interface BarProps {
  title: string
  scrollY: SharedValue<number>
  leftAction?: ReactNode
  rightAction?: ReactNode
  /** Hairline under the bar once scrolled. Off when tabs with their own divider sit right under it. */
  line?: boolean
}

export function LargeTitleBar({ title, scrollY, leftAction, rightAction, line = true }: BarProps) {
  const insets = useSafeAreaInsets()
  const lineStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 8], [0, 1], Extrapolation.CLAMP),
  }))
  return (
    <View style={[s.bar, { paddingTop: insets.top, height: insets.top + APP_HEADER_BAR_HEIGHT }]}>
      <View style={s.row}>
        <View style={s.side}>{leftAction}</View>
        <Text style={s.title} numberOfLines={1}>{title}</Text>
        <View style={[s.side, s.sideRight]}>{rightAction}</View>
      </View>
      {line ? <Animated.View style={[s.line, lineStyle]} /> : null}
    </View>
  )
}

const s = StyleSheet.create({
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: Colors.background },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: 4 },
  title: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  line: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },
})
