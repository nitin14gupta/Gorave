import { useEffect } from 'react'
import { Dimensions, StyleSheet, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming, type SharedValue } from 'react-native-reanimated'
import { PartyPopper } from 'lucide-react-native'
import { Colors } from '@/constants'

const { width: W } = Dimensions.get('window')
const BITS = 12
const REACH = W * 0.32
const PALETTE = [Colors.brandOrange, Colors.white, Colors.brandCoral]

function Bit({ i, t }: { i: number; t: SharedValue<number> }) {
  const angle = (i / BITS) * Math.PI * 2
  const reach = REACH * (i % 2 ? 1 : 0.72)
  const st = useAnimatedStyle(() => ({
    opacity: 1 - t.value,
    transform: [{ translateX: Math.cos(angle) * reach * t.value }, { translateY: Math.sin(angle) * reach * t.value + 30 * t.value * t.value }],
  }))
  return <Animated.View style={[s.bit, { backgroundColor: PALETTE[i % PALETTE.length] }, st]} />
}

/** The double-tap moment: a popper pops over the photo and bits fly out. Plays once per mount. */
export function VoteBurst() {
  const pop = useSharedValue(0)
  const t = useSharedValue(0)
  useEffect(() => {
    pop.value = withSequence(withTiming(1, { duration: 220, easing: Easing.out(Easing.back(2)) }), withTiming(1, { duration: 320 }), withTiming(0, { duration: 180 }))
    t.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) })
  }, [pop, t])
  const iconStyle = useAnimatedStyle(() => ({ opacity: pop.value, transform: [{ scale: 0.5 + pop.value * 0.5 }] }))
  return (
    <View pointerEvents="none" style={s.wrap}>
      {Array.from({ length: BITS }, (_, i) => <Bit key={i} i={i} t={t} />)}
      <Animated.View style={[s.icon, iconStyle]}>
        <PartyPopper size={44} color={Colors.background} strokeWidth={1.8} />
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  bit: { position: 'absolute', width: 9, height: 9, borderRadius: 3 },
  icon: { width: 92, height: 92, borderRadius: 46, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white },
})
