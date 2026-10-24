import { useEffect } from 'react'
import { StyleSheet } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated'
import { Colors, withOpacity } from '@/constants'

interface Props {
  /** Show it once the list has scrolled; hide it at the very top. */
  visible?: boolean
  /** Or follow the scroll directly (fades in over the first 60px). */
  scrollY?: SharedValue<number>
  /** Where the fade starts (e.g. under a fixed header). */
  top?: number
  height?: number
}

/**
 * The tunnel: a smooth fade from the page colour at the top edge of a
 * scrolling list, so cards melt away as they scroll up and come back as you
 * scroll down. Sits over the list and under any header; never takes touches.
 */
export function ScrollFade({ visible = false, scrollY, top = 0, height = 110 }: Props) {
  const o = useSharedValue(0)
  useEffect(() => {
    o.value = withTiming(visible ? 1 : 0, { duration: 260 })
  }, [visible, o])
  const st = useAnimatedStyle(() => ({
    opacity: scrollY ? interpolate(scrollY.value, [0, 60], [0, 1], Extrapolation.CLAMP) : o.value,
  }))
  return (
    <Animated.View pointerEvents="none" style={[s.wrap, { top, height }, st]}>
      <LinearGradient
        colors={[Colors.background, withOpacity(Colors.background, 0.85), withOpacity(Colors.background, 0)]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, zIndex: 5 },
})
