import { useEffect } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, {
  Easing, FadeInDown, runOnJS, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ChevronRight, PartyPopper, Ticket, ShieldCheck } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { PosterWall } from '@/components/auth/WelcomeView'
import { hSuccess, hTap } from '@/lib/haptics'

const { width: W, height: H } = Dimensions.get('window')
const CARD = Math.round(W * 0.5)

export type FirstMove = 'events' | 'host' | 'safety'

export interface CompleteProps {
  name: string
  photo: string | null
  city: string | null
  /** Finish onboarding; with a first move, open that next. */
  onFinish: (next?: FirstMove) => void
}

const MOVES: { key: FirstMove; title: string; sub: string; Icon: typeof Ticket }[] = [
  { key: 'events', title: 'Find a night', sub: 'Parties and plans near you this week', Icon: Ticket },
  { key: 'host', title: 'Host your own', sub: 'Make an invite in a couple of minutes', Icon: PartyPopper },
  { key: 'safety', title: 'Add an emergency contact', sub: 'So SOS can reach someone at events', Icon: ShieldCheck },
]

/**
 * You, on the wall. The same drifting wall of party posters as Welcome comes
 * back, and your square photo drops onto the middle of it with your name on
 * it: you've joined the wall. Then "You're in" and three first moves.
 */
export function OnboardingComplete(p: CompleteProps) {
  const insets = useSafeAreaInsets()
  const first = p.name.split(' ')[0] || 'there'
  const wallH = Math.round(H * 0.5) + insets.top

  // Drops in from above, a little big and tilted, and settles with one buzz.
  const drop = useSharedValue(0)
  useEffect(() => {
    drop.value = withDelay(500, withSpring(1, { damping: 14, stiffness: 120 }, done => {
      if (done) runOnJS(hSuccess)()
    }))
  }, [drop])
  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 2),
    transform: [
      { translateY: (1 - drop.value) * -H * 0.4 },
      { scale: 1.25 - drop.value * 0.25 },
      { rotate: `${-4 - (1 - drop.value) * 10}deg` },
    ],
  }))
  const tagIn = useSharedValue(0)
  useEffect(() => {
    tagIn.value = withDelay(1100, withTiming(1, { duration: 350, easing: Easing.out(Easing.back(2)) }))
  }, [tagIn])
  const tagStyle = useAnimatedStyle(() => ({ opacity: tagIn.value, transform: [{ scale: 0.6 + tagIn.value * 0.4 }, { rotate: '6deg' }] }))

  return (
    <View style={s.root}>
      <View style={{ height: wallH }}>
        <PosterWall height={wallH} dim={0.35} />
        <View pointerEvents="none" style={[s.cardSpot, { top: insets.top + (wallH - insets.top - CARD) / 2 - 10 }]}>
          <Animated.View style={[s.card, cardStyle]}>
            {p.photo
              ? <Image source={{ uri: p.photo }} style={StyleSheet.absoluteFill} contentFit="cover" />
              : <Text style={s.initial}>{first.charAt(0).toUpperCase()}</Text>}
            <View style={s.nameTag}><Text style={s.nameTagText} numberOfLines={1}>{first}</Text></View>
          </Animated.View>
          <Animated.View style={[s.newTag, tagStyle]}><Text style={s.newTagText}>NEW ON GORAVE</Text></Animated.View>
        </View>
      </View>

      <View style={[s.bottom, { paddingBottom: insets.bottom + 14 }]}>
        <Animated.Text entering={FadeInDown.delay(900).duration(450)} style={s.title}>
          You&apos;re in, {first}.
        </Animated.Text>
        <Animated.Text entering={FadeInDown.delay(1000).duration(450)} style={s.sub}>
          {p.city ? `Here's what's happening in ${p.city}.` : "Here's where to start."}
        </Animated.Text>

        <Animated.View entering={FadeInDown.delay(1150).duration(450)} style={s.moves}>
          {MOVES.map(({ key, title, sub, Icon }, i) => (
            <Pressable key={key} style={[s.move, i > 0 && s.moveBorder]} onPress={() => { hTap(); p.onFinish(key) }}>
              <View style={s.moveIcon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
              <View style={{ flex: 1 }}>
                <Text style={s.moveTitle}>{title}</Text>
                <Text style={s.moveSub} numberOfLines={1}>{sub}</Text>
              </View>
              <ChevronRight size={18} color={Colors.inkDisabled} />
            </Pressable>
          ))}
        </Animated.View>

        <View style={{ flex: 1 }} />
        <Animated.View entering={FadeInDown.delay(1300).duration(450)}>
          <PrimaryButton label="Explore Gorave" onPress={() => p.onFinish()} />
        </Animated.View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  cardSpot: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 200 },
  card: {
    width: CARD, height: CARD, borderRadius: 22, overflow: 'hidden',
    backgroundColor: Colors.surfaceMuted, borderWidth: 4, borderColor: Colors.white,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 16,
  },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 72, color: Colors.inkDisabled },
  nameTag: { position: 'absolute', left: 10, bottom: 10, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.white, maxWidth: CARD - 20 },
  nameTagText: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.nearBlack },
  newTag: { position: 'absolute', top: -14, right: W / 2 - CARD / 2 - 18, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: Colors.white },
  newTagText: { fontFamily: FontFamily.displayExtraBold, fontSize: 11, letterSpacing: 1.2, color: Colors.nearBlack },

  bottom: { flex: 1, paddingHorizontal: 20, marginTop: -8 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, lineHeight: 43, letterSpacing: -1.2, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, marginTop: 6, marginBottom: 16 },
  moves: { borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  move: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  moveBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  moveIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  moveTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  moveSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
})
