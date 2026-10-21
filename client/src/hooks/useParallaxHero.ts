import { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'

/**
 * Parallax for a photo at the top of a scroll view, like the event page:
 * the photo moves at half the scroll speed and stretches on pull-down, and
 * the text over it fades and drifts as it leaves.
 *
 * Put `onScroll` on an Animated.ScrollView / Animated.FlatList (with
 * scrollEventThrottle={16}), `photoStyle` on an absolute-fill Animated.View
 * holding the image (its parent clips with overflow: 'hidden'), and
 * `textStyle` on the overlaid title block.
 */
export function useParallaxHero(height: number) {
  const scrollY = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { scrollY.value = e.contentOffset.y })

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-height, 0, height], [-height / 2, 0, height * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(scrollY.value, [-height, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }))

  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, height * 0.45], [1, 0], Extrapolation.CLAMP),
    transform: [{ translateY: interpolate(scrollY.value, [0, height], [0, height * 0.25], Extrapolation.CLAMP) }],
  }))

  return { scrollY, onScroll, photoStyle, textStyle }
}
