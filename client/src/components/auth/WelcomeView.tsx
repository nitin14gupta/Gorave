import { useEffect } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { WELCOME_POSTERS } from '@/constants/welcomePosters'
import { LogoMark, PrimaryButton } from '@/components/ui'

// Every image in assets/images/welcome is a poster. After adding or
// removing one, run `npm run posters` to refresh the list. Event posters
// are 4:5, so photos of that shape look best; others are cropped to fit.
const POSTERS = WELCOME_POSTERS

export interface WelcomeViewProps {
  onStart: () => void
  onSignIn: () => void
}

const { width: W, height: H } = Dimensions.get('window')

// Lay the posters out for however many there are: staggered rows across
// the stage, the outer ones bleeding off the edges, each tilted a little.
// Same count gives the same layout every time (no randomness).
const COLS = POSTERS.length <= 8 ? 3 : 4
const ROWS = Math.max(1, Math.ceil(POSTERS.length / COLS))
const CARD_W = Math.round(W * (COLS === 3 ? 0.38 : 0.31))
const CARD_H = Math.round(CARD_W * 1.25) // event posters are 4:5

function layout(i: number, stageH: number) {
  const row = Math.floor(i / COLS)
  const col = i % COLS
  const shift = row % 2 ? 0.5 : 0
  const step = ROWS > 1 ? (stageH * 0.94 - CARD_H) / (ROWS - 1) : 0
  return {
    x: ((col + 0.25 + shift) / COLS) * W * 1.08 - W * 0.04,
    y: row * step - stageH * 0.04,
    r: ((i * 37) % 23) - 11,
    z: i + 1,
  }
}

/**
 * Welcome: party posters scattered like invites on a table, each one a
 * different kind of night, then one line and the buttons. The
 * posters settle in once; after that, nothing moves.
 */
export function WelcomeView({ onStart, onSignIn }: WelcomeViewProps) {
  const insets = useSafeAreaInsets()
  const stageH = Math.round(H * 0.6)

  return (
    <View style={[s.root, { paddingTop: insets.top + 4 }]}>

      <View style={{ height: stageH }}>
        {POSTERS.map((photo, i) => (
          <Poster key={i} index={i} photo={photo} stageH={stageH} />
        ))}
        <LinearGradient pointerEvents="none" colors={['transparent', Colors.background]} style={s.fade} />
      </View>

      <View style={[s.brand, { top: insets.top + 10 }]} pointerEvents="none">
        <LogoMark size={18} />
        <Text style={s.brandText}>GORAVE</Text>
      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <Text style={s.line}>Every good night{'\n'}starts with an invite.</Text>
        <Text style={s.sub}>House parties, rooftops and game nights, hosted by people near you.</Text>
        <PrimaryButton label="Get started" onPress={onStart} />
        <Pressable style={s.signIn} onPress={onSignIn} hitSlop={6}>
          <Text style={s.signInText}>I already have an account</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Poster({ index, photo, stageH }: { index: number; photo: number; stageH: number }) {
  const f = layout(index, stageH)
  const t = useSharedValue(0)
  useEffect(() => { t.value = withDelay(Math.min(index, 14) * 40, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) })) }, [t, index])
  const st = useAnimatedStyle(() => ({
    opacity: t.value,
    transform: [
      { translateY: (1 - t.value) * 40 },
      { rotate: `${f.r * t.value}deg` },
    ],
  }))
  return (
    <Animated.View
      style={[
        s.poster,
        { left: f.x * W - CARD_W / 2, top: f.y * stageH, zIndex: f.z },
        st,
      ]}
    >
      <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  brand: { position: 'absolute', alignSelf: 'center', zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.6)' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 90, zIndex: 40 },
  brandText: { fontFamily: FontFamily.displayExtraBold, fontSize: 13, letterSpacing: 3, color: Colors.white },

  poster: { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surface, shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 10 }, elevation: 8 },

  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, gap: 6 },
  line: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: withOpacity(Colors.inkPrimary, 0.6), marginTop: 4, marginBottom: 16 },
  signIn: { alignItems: 'center', paddingVertical: 14 },
  signInText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})
