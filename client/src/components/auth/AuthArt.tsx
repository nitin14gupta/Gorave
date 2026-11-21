import { StyleSheet, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import { Colors } from '@/constants'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { Wordmark } from '@/components/ui/Wordmark'

/**
 * Sign-in number and code screens: posters fanned with the sticker on them.
 * The keyboard is up the whole time (the field focuses itself), so the fan
 * folds to a compact size as the keyboard rises and everything fits above it.
 */

/** 0 with the keyboard down, 1 with it up. */
function useKeyboardProgress() {
  return useReanimatedKeyboardAnimation().progress
}

const FAN = { phone: [POSTER.danceFloor, POSTER.cheers, POSTER.girlsNight], otp: [POSTER.houseParty, POSTER.djNight, POSTER.squad] }
const FAN_FULL = 150
const FAN_FOLDED = 92

export function PosterFan({ step }: { step: 'phone' | 'otp' }) {
  const progress = useKeyboardProgress()
  const wrap = useAnimatedStyle(() => ({ height: interpolate(progress.value, [0, 1], [FAN_FULL, FAN_FOLDED], Extrapolation.CLAMP) }))
  const inner = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -22], Extrapolation.CLAMP) },
      { scale: interpolate(progress.value, [0, 1], [1, 0.62], Extrapolation.CLAMP) },
    ],
  }))
  return (
    <Animated.View style={[a.wrap, wrap]}>
      <Animated.View style={[a.inner, inner]}>
        <View style={a.fan}>
          {FAN[step].map((src, i) => (
            <Image
              key={i}
              source={src}
              style={[a.poster, i === 1 ? a.posterMid : { transform: [{ rotate: i === 0 ? '-9deg' : '9deg' }, { translateY: 10 }] }]}
              contentFit="cover"
            />
          ))}
        </View>
        <View style={a.sticker}><Wordmark kind="sticker" height={40} /></View>
      </Animated.View>
    </Animated.View>
  )
}

const POSTER_W = 82
const a = StyleSheet.create({
  wrap: { alignItems: 'center', overflow: 'visible', marginBottom: 10 },
  inner: { alignItems: 'center' },
  fan: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'center' },
  poster: { width: POSTER_W, height: Math.round(POSTER_W * 1.25), borderRadius: 12, marginHorizontal: -8, borderWidth: 2, borderColor: Colors.background },
  posterMid: { zIndex: 2, transform: [{ translateY: -4 }] },
  sticker: { position: 'absolute', top: 96, zIndex: 3, transform: [{ rotate: '-4deg' }] },
})
