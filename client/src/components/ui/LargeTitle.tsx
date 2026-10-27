import { useCallback, type ReactNode } from 'react'
import { StyleSheet, Text, View, type NativeScrollEvent, type NativeSyntheticEvent, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, Spacing } from '@/constants'
import { APP_HEADER_BAR_HEIGHT } from './AppHeader'

// iOS-style large titles: a big title at the top of the list that folds away
// as you scroll, while a compact bar's small title fades in.
//
//   const lt = useLargeTitle()
//   <LargeTitleBar title="Blocked" scrollY={lt.scrollY} leftAction={…} />
//   <FlatList onScroll={lt.onScroll} scrollEventThrottle={16}
//     contentContainerStyle={{ paddingTop: lt.barHeight }}
//     ListHeaderComponent={<LargeTitle title="Blocked" scrollY={lt.scrollY} />} />

/** How far you scroll before the big title is gone and the small one is in. */
const FOLD = 44

export function useLargeTitle() {
  const insets = useSafeAreaInsets()
  const scrollY = useSharedValue(0)
  // Measured height of a CollapsingLargeTitle (unused by in-list titles).
  const foldHeight = useSharedValue(0)
  // A plain handler (not a worklet) so it works on any list type and can be
  // combined with a screen's own onScroll.
  const onScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollY.set(e.nativeEvent.contentOffset.y)
  }, [scrollY])
  return { scrollY, foldHeight, onScroll, barHeight: insets.top + APP_HEADER_BAR_HEIGHT }
}

interface BarProps {
  title: string
  scrollY: SharedValue<number>
  leftAction?: ReactNode
  rightAction?: ReactNode
  /** Always show the small title (e.g. loading or empty states with no list to scroll). */
  pinned?: boolean
  /** Pass the hook's foldHeight when using CollapsingLargeTitle, so the small title lands as the block closes. */
  foldHeight?: SharedValue<number>
  /** Hairline under the bar once folded. Off when tabs with their own divider stick right under it. */
  line?: boolean
}

/** The fixed top bar. Back and actions always show; its title and hairline fade in as the big title folds. */
export function LargeTitleBar({ title, scrollY, leftAction, rightAction, pinned = false, foldHeight, line = true }: BarProps) {
  const insets = useSafeAreaInsets()
  const shownStyle = useAnimatedStyle(() => {
    const end = foldHeight && foldHeight.value > 0 ? foldHeight.value : FOLD
    return { opacity: pinned ? 1 : interpolate(scrollY.value, [end * 0.6, end], [0, 1], Extrapolation.CLAMP) }
  })
  return (
    <View style={[s.bar, { paddingTop: insets.top, height: insets.top + APP_HEADER_BAR_HEIGHT }]}>
      <View style={s.row}>
        <View style={s.side}>{leftAction}</View>
        <Animated.Text style={[s.small, shownStyle]} numberOfLines={1}>{title}</Animated.Text>
        <View style={[s.side, s.sideRight]}>{rightAction}</View>
      </View>
      {line ? <Animated.View style={[s.line, shownStyle]} /> : null}
    </View>
  )
}

interface TitleProps {
  title: string
  subtitle?: string
  scrollY: SharedValue<number>
  style?: StyleProp<ViewStyle>
}

/** The big title at the top of the scroll content. Fades and lifts away as you scroll. */
export function LargeTitle({ title, subtitle, scrollY, style }: TitleProps) {
  const st = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, FOLD], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [-80, 0, FOLD], [12, 0, -8], Extrapolation.CLAMP) }],
  }))
  return (
    <Animated.View style={[s.big, style, st]}>
      <Text style={s.bigText} numberOfLines={2}>{title}</Text>
      {subtitle ? <Text style={s.sub}>{subtitle}</Text> : null}
    </Animated.View>
  )
}

/**
 * For a title that sits above tabs, outside the panes' lists. The block
 * shrinks as the active pane scrolls, so the tabs rise and pin under the bar.
 * Put a LargeTitleSpacer at the top of each pane's list: it grows by the same
 * amount, which keeps the content moving one-to-one with the finger.
 */
export function CollapsingLargeTitle({ title, scrollY, foldHeight }: { title: string; scrollY: SharedValue<number>; foldHeight: SharedValue<number> }) {
  const clipStyle = useAnimatedStyle(() => {
    const h = foldHeight.value
    if (h <= 0) return {}
    return { height: h - Math.min(Math.max(scrollY.value, 0), h) }
  })
  return (
    <Animated.View style={[s.clip, clipStyle]}>
      <View onLayout={e => foldHeight.set(e.nativeEvent.layout.height)}>
        <LargeTitle title={title} scrollY={scrollY} />
      </View>
    </Animated.View>
  )
}

export function LargeTitleSpacer({ scrollY, foldHeight }: { scrollY: SharedValue<number>; foldHeight: SharedValue<number> }) {
  const st = useAnimatedStyle(() => ({ height: Math.min(Math.max(scrollY.value, 0), foldHeight.value) }))
  return <Animated.View style={st} />
}

const s = StyleSheet.create({
  clip: { overflow: 'hidden' },
  bar: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 20, backgroundColor: Colors.background },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12 },
  side: { width: 88, flexDirection: 'row', alignItems: 'center' },
  sideRight: { justifyContent: 'flex-end', gap: 4 },
  small: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  line: { position: 'absolute', left: 0, right: 0, bottom: 0, height: StyleSheet.hairlineWidth, backgroundColor: Colors.divider },
  big: { paddingHorizontal: Spacing.screenPadding, paddingTop: 4, paddingBottom: 14, gap: 6 },
  bigText: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 38, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },
})
