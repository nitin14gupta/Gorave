import type { ReactNode } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'

const W = Dimensions.get('window').width
const BAR_H = 52

interface Side {
  /** Draws the icon in the given colour (white on the photo, ink on the bar). */
  icon: (color: string) => ReactNode
  onPress: () => void
  label: string
}

interface Props {
  scrollY: SharedValue<number>
  /** Height of the hero photo the bar waits for. Defaults to the square photo. */
  heroHeight?: number
  title: string
  left: Side
  right: Side
}

/**
 * The profile's top bar. Over the photo it's just two dark glass buttons;
 * once the photo has scrolled under the top it fades into a solid bar with
 * the name in the middle, and the buttons turn into plain ink icons.
 */
export function ProfileFoldBar({ scrollY, heroHeight = W, title, left, right }: Props) {
  const insets = useSafeAreaInsets()
  const end = heroHeight - insets.top - BAR_H
  const start = end - 60

  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP),
  }))
  const glassStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [start, end], [1, 0], Extrapolation.CLAMP),
  }))
  const inkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [start, end], [0, 1], Extrapolation.CLAMP),
  }))

  const button = (side: Side, pos: 'left' | 'right') => (
    <Pressable
      key={pos}
      style={[s.btn, pos === 'left' ? { left: 14 } : { right: 14 }, { top: insets.top + (BAR_H - 40) / 2 }]}
      onPress={side.onPress}
      hitSlop={8}
      accessibilityLabel={side.label}
    >
      <Animated.View style={[StyleSheet.absoluteFill, s.glass, glassStyle]}>{side.icon(Colors.white)}</Animated.View>
      <Animated.View style={[StyleSheet.absoluteFill, s.ink, inkStyle]}>{side.icon(Colors.inkPrimary)}</Animated.View>
    </Pressable>
  )

  return (
    <>
      <Animated.View pointerEvents="none" style={[s.bar, { height: insets.top + BAR_H, paddingTop: insets.top }, barStyle]}>
        <View style={s.titleWrap}>
          <Text style={s.title} numberOfLines={1}>{title}</Text>
        </View>
      </Animated.View>
      {button(left, 'left')}
      {button(right, 'right')}
    </>
  )
}

const s = StyleSheet.create({
  bar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    backgroundColor: Colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider,
  },
  titleWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 70 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  btn: { position: 'absolute', width: 40, height: 40 },
  glass: { borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  ink: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
})
