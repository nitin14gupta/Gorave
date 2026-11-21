import { useEffect } from 'react'
import { View, Image, StyleSheet, Text } from 'react-native'
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { Logo, Colors, FontFamily, withOpacity } from '@/constants'
import { Wordmark } from './Wordmark'

export function SplashScreen() {
  const scale = useSharedValue(1)
  const barX = useSharedValue(0)

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.025, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      true,
    )
    barX.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    )
  }, [])

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }))

  const barStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: barX.value * (LOADER_WIDTH - LOADER_BAR_WIDTH) }],
  }))

  return (
    <View style={s.root}>
      <View style={s.stack}>
        <Animated.View style={[s.logoGlow, logoStyle]}>
          <Image source={Logo} style={s.logo} resizeMode="contain" />
        </Animated.View>
        <Wordmark height={40} style={{ marginTop: 6 }} />
      </View>
      {/* <Text style={s.tagline}>EVERY GOOD NIGHT STARTS WITH AN INVITE</Text> */}

      <View style={s.loaderTrack}>
        <Animated.View style={[s.loaderBar, barStyle]} />
      </View>
    </View>
  )
}

const LOADER_WIDTH = 88
const LOADER_BAR_WIDTH = 36

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stack: {
    alignItems: 'center',
  },
  shadowOuter: {
    width: 100,
    height: 14,
    borderRadius: 999,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.04),
    marginTop: -6,
  },
  shadowInner: {
    width: 60,
    height: 8,
    borderRadius: 999,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    marginTop: -9,
  },
  logoGlow: {
    width: 144,
    height: 144,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 116,
    height: 116,
  },
  tagline: {
    position: 'absolute',
    bottom: 48,
    fontFamily: FontFamily.bodyMedium,
    fontSize: 10,
    letterSpacing: 2.6,
    color: withOpacity(Colors.inkPrimary, 0.45),
  },
  loaderTrack: {
    position: 'absolute',
    bottom: 88,
    width: LOADER_WIDTH,
    height: 3,
    borderRadius: 2,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.12),
    overflow: 'hidden',
  },
  loaderBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: LOADER_BAR_WIDTH,
    borderRadius: 2,
    backgroundColor: Colors.inkPrimary,
  },
})
