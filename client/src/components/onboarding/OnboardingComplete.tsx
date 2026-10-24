import { useEffect } from 'react'
import { Dimensions, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { POSTER } from '@/components/ui/ParallaxScreen'

const { width: W, height: H } = Dimensions.get('window')

export interface CompleteProps {
  name: string
  photo: string | null
  city: string | null
  onExplore: () => void
}

/** A card that settles into place from a little lower and a little more tilted. */
function Settle({ delay, rotate, children, style }: { delay: number; rotate: number; children: React.ReactNode; style: object }) {
  const t = useSharedValue(0)
  useEffect(() => {
    t.value = withDelay(delay, withTiming(1, { duration: 650, easing: Easing.out(Easing.cubic) }))
  }, [delay, t])
  const st = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [{ translateY: (1 - t.value) * 60 }, { rotate: `${rotate + (1 - t.value) * rotate}deg` }],
  }))
  return <Animated.View style={[style, st]}>{children}</Animated.View>
}

/**
 * You, on the wall. Your first photo, square, lands in the middle with
 * two party posters fanned behind it, then "You're in, Riya."
 */
export function OnboardingComplete(p: CompleteProps) {
  const insets = useSafeAreaInsets()
  const first = p.name.split(' ')[0] || 'there'
  const card = Math.round(W * 0.56)
  return (
    <View style={[s.root, { paddingTop: insets.top, paddingBottom: insets.bottom + 16 }]}>
      <View style={s.stage}>
        <Settle delay={100} rotate={-10} style={[s.poster, { width: card * 0.8, height: card, left: W / 2 - card * 0.95 }]}>
          <Image source={POSTER.confetti} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Settle>
        <Settle delay={220} rotate={9} style={[s.poster, { width: card * 0.8, height: card, left: W / 2 + card * 0.15 }]}>
          <Image source={POSTER.cheers} style={StyleSheet.absoluteFill} contentFit="cover" />
        </Settle>
        <Settle delay={380} rotate={-2} style={[s.me, { width: card, height: card }]}>
          {p.photo ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.initial}>{first.charAt(0).toUpperCase()}</Text>}
        </Settle>
      </View>
      <Animated.View entering={FadeInDown.delay(600).duration(450)} style={s.text}>
        <Text style={s.title}>You&apos;re in,{'\n'}{first}.</Text>
        <Text style={s.sub}>House parties, rooftops and game nights near you{p.city ? ` in ${p.city}` : ''}. Go find your first one.</Text>
        <PrimaryButton label="Explore Gorave" onPress={p.onExplore} style={{ marginTop: 22 }} />
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: H * 0.45 },
  poster: { position: 'absolute', borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surface },
  me: { borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: Colors.background },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 72, color: Colors.inkDisabled },
  text: { paddingHorizontal: 24 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 42, lineHeight: 44, letterSpacing: -1.2, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary, marginTop: 10 },

})
