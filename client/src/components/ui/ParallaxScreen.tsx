import type { ReactElement, ReactNode } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View, type RefreshControlProps } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useParallaxHero } from '@/hooks/useParallaxHero'

const W = Dimensions.get('window').width
const BAR_H = 52

// Party posters shared with Welcome and host onboarding.
export const POSTER = {
  confetti: require('../../../assets/images/welcome/confetti.webp'),
  djNight: require('../../../assets/images/welcome/dj-night.webp'),
  squad: require('../../../assets/images/welcome/the-squad.webp'),
  houseParty: require('../../../assets/images/welcome/house-party.webp'),
  outLate: require('../../../assets/images/welcome/out-late.webp'),
  girlsNight: require('../../../assets/images/welcome/girls-night.webp'),
  afterDark: require('../../../assets/images/welcome/after-dark.webp'),
  cheers: require('../../../assets/images/welcome/cheers.webp'),
  danceFloor: require('../../../assets/images/welcome/dance-floor.webp'),
  sequins: require('../../../assets/images/welcome/sequins.webp'),
}

interface Props {
  image: ImageSource | string | null | undefined
  title: string
  subtitle?: string
  /** Small caps line above the title. */
  eyebrow?: string
  onBack: () => void
  right?: ReactNode
  /** Height of the photo. Defaults to a near-square. */
  heroHeight?: number
  /** Shown over the photo, under the title (e.g. a balance). */
  heroExtra?: ReactNode
  refreshControl?: ReactElement<RefreshControlProps>
  children: ReactNode
  /** Sits below the scroll, fixed (e.g. a Save button). */
  footer?: ReactNode
}

/**
 * A settings-style page with a photo on top: the photo moves at half speed
 * and stretches on pull-down, the title sits on it and fades as you scroll,
 * the page rides up over it on a rounded sheet, and a plain top bar with the
 * title fades in once the photo has gone.
 */
export function ParallaxScreen(p: Props) {
  const insets = useSafeAreaInsets()
  const H = p.heroHeight ?? Math.round(W * 0.82)
  const { scrollY, onScroll, photoStyle, textStyle } = useParallaxHero(H)
  const barStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [H - insets.top - BAR_H - 60, H - insets.top - BAR_H], [0, 1], Extrapolation.CLAMP),
  }))
  const src = typeof p.image === 'string' ? { uri: p.image } : p.image

  return (
    <View style={s.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={p.refreshControl}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        <View style={[s.hero, { height: H }]}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {src ? <Image source={src} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" transition={150} /> : null}
          </Animated.View>
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.45)', 'transparent']} style={s.topShade} />
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.75)']} style={s.bottomShade} />
          <Animated.View style={[s.titleBlock, textStyle]}>
            {p.eyebrow ? <Text style={s.eyebrow}>{p.eyebrow}</Text> : null}
            <Text style={s.title} numberOfLines={2}>{p.title}</Text>
            {p.subtitle ? <Text style={s.subtitle} numberOfLines={2}>{p.subtitle}</Text> : null}
            {p.heroExtra}
          </Animated.View>
        </View>

        <View style={s.sheet}>{p.children}</View>
      </Animated.ScrollView>

      <Animated.View pointerEvents="none" style={[s.bar, { height: insets.top + BAR_H, paddingTop: insets.top }, barStyle]}>
        <Text style={s.barTitle} numberOfLines={1}>{p.title}</Text>
      </Animated.View>
      <Pressable style={[s.glass, { top: insets.top + 7, left: 14 }]} onPress={p.onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2.2} />
      </Pressable>
      {p.right ? <View style={[s.right, { top: insets.top + 7 }]}>{p.right}</View> : null}

      {p.footer}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { width: W, overflow: 'hidden', backgroundColor: Colors.nearBlack },
  topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '55%' },
  titleBlock: { position: 'absolute', left: 20, right: 20, bottom: 44, gap: 4 },
  eyebrow: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.6, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 38, lineHeight: 41, letterSpacing: -1, color: Colors.white },
  subtitle: { fontFamily: FontFamily.bodyMedium, fontSize: 14, lineHeight: 20, color: withOpacity(Colors.white, 0.85) },

  sheet: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: Colors.background, paddingHorizontal: 20, paddingTop: 22, gap: 8, minHeight: 400 },

  bar: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, maxWidth: W - 140 },
  glass: { position: 'absolute', width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },
  right: { position: 'absolute', right: 14 },
})
