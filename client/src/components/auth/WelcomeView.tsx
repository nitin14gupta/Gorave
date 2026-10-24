import { useEffect } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { LogoMark, PrimaryButton } from '@/components/ui'

// Party posters, cropped to 4:5 like every event poster. Eighteen of them
// fill the wall exactly: rows of 4, 5, 4 and 5 (see ROWS below). To add
// more, add photos here and add them to a row in ROWS.
const POSTERS = [
  require('../../../assets/images/welcome/confetti.webp'),
  require('../../../assets/images/welcome/dj-night.webp'),
  require('../../../assets/images/welcome/the-squad.webp'),
  require('../../../assets/images/welcome/house-party.webp'),
  require('../../../assets/images/welcome/out-late.webp'),
  require('../../../assets/images/welcome/the-boys.webp'),
  require('../../../assets/images/welcome/girls-night.webp'),
  require('../../../assets/images/welcome/after-dark.webp'),
  require('../../../assets/images/welcome/cheers.webp'),
  require('../../../assets/images/welcome/dance-floor.webp'),
  require('../../../assets/images/welcome/dress-up.webp'),
  require('../../../assets/images/welcome/sequins.webp'),
  require('../../../assets/images/welcome/diva.webp'),
  require('../../../assets/images/welcome/ass.webp'),
  require('../../../assets/images/welcome/back.webp'),
  require('../../../assets/images/welcome/clockit.webp'),
  require('../../../assets/images/welcome/enjoy.webp'),
  require('../../../assets/images/welcome/feet.webp'),
]

export interface WelcomeViewProps {
  onStart: () => void
  onSignIn: () => void
}

const { width: W, height: H } = Dimensions.get('window')

const CARD_W = Math.round(W * 0.34)
const CARD_H = Math.round(CARD_W * 1.25) // event posters are 4:5
const GAP = W * 0.25 // distance between card centres in a row; cards are wider, so they overlap

// A brick wall of invites in four rows. Rows alternate 4 and 5 cards, and
// the outer cards run off the screen edges, so there is never a gap to see
// through. Each row slowly drifts sideways (even rows left, odd rows right,
// each at its own speed) and wraps around by repeating its cards once.
// Tilts stay small (6 degrees at most) so a corner never opens a hole.
// `photos` are indexes into POSTERS; `speed` is pixels per second.
const ROWS = [
  { photos: [0, 1, 2, 3], tilts: [-5, 4, -3, 6], dir: -1, speed: 9 },
  { photos: [4, 5, 6, 7, 8], tilts: [5, -6, 3, -4, 6], dir: 1, speed: 11 },
  { photos: [9, 10, 11, 12], tilts: [-4, 5, -6, 3], dir: -1, speed: 13 },
  { photos: [13, 14, 15, 16, 17], tilts: [4, -3, 6, -5, 3], dir: 1, speed: 10 },
]

/**
 * Welcome: eighteen party posters laid like invites on a wall, edge to
 * edge with no gaps and drifting slowly, fading into the headline and the
 * buttons. Holds still if the phone's reduce-motion setting is on.
 */
export function WelcomeView({ onStart, onSignIn }: WelcomeViewProps) {
  const insets = useSafeAreaInsets()
  // The wall runs up under the status bar, so there is no empty strip on top.
  const stageH = Math.round(H * 0.6) + insets.top

  return (
    <View style={s.root}>
      <View style={[s.stage, { height: stageH }]}>
        {ROWS.map((row, i) => (
          <WallRow key={i} index={i} row={row} stageH={stageH} />
        ))}
        {/* Fades the wall into the page colour. It ends in exactly that
            colour (not "transparent", which tints grey), so there is no seam. */}
        <LinearGradient
          pointerEvents="none"
          colors={[withOpacity(Colors.background, 0), withOpacity(Colors.background, 0.7), Colors.background]}
          locations={[0, 0.6, 1]}
          style={s.fade}
        />
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

function WallRow({ index, row, stageH }: { index: number; row: (typeof ROWS)[number]; stageH: number }) {
  const n = row.photos.length
  const period = n * GAP // one full set of cards; the row repeats every `period`
  // The wall is a little taller than the stage at both ends, so the top
  // and bottom rows bleed off instead of stopping short.
  const bleed = stageH * 0.03
  const step = (stageH + bleed * 2 - CARD_H) / (ROWS.length - 1)
  const top = -bleed + index * step

  const reduced = useReducedMotion()
  const fade = useSharedValue(0)
  const x = useSharedValue(0)
  useEffect(() => {
    fade.value = withDelay(index * 120, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }))
    if (reduced) return
    // Slide by exactly one period and start over: the second set of cards
    // lands where the first began, so the loop has no visible jump.
    x.value = withRepeat(withTiming(row.dir * period, { duration: (period / row.speed) * 1000, easing: Easing.linear }), -1, false)
  }, [fade, x, index, reduced, period, row.dir, row.speed])

  const st = useAnimatedStyle(() => ({ opacity: fade.value, transform: [{ translateX: x.value }] }))

  // Right-moving rows start one period to the left, so the first set of
  // cards is the one that scrolls into view.
  const cards = [...row.photos, ...row.photos]
  // Odd rows (5 cards) sit on the grid lines; even rows (4 cards) sit between them.
  const base = (k: number) => (n === 5 ? k * GAP : k * GAP + GAP / 2)

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.row, { left: row.dir > 0 ? -period : 0, width: period * 2 + CARD_W, height: stageH }, st]}
    >
      {cards.map((p, j) => (
        <View
          key={j}
          style={[
            s.poster,
            {
              left: base(j % n) + (j >= n ? period : 0) - CARD_W / 2,
              top,
              transform: [{ rotate: `${row.tilts[j % n]}deg` }],
              zIndex: index * 20 + j,
            },
          ]}
        >
          <Image source={POSTERS[p]} style={StyleSheet.absoluteFill} contentFit="cover" />
        </View>
      ))}
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, overflow: 'hidden' },
  stage: { overflow: 'hidden', backgroundColor: Colors.background },
  row: { position: 'absolute', top: 0 },
  brand: { position: 'absolute', alignSelf: 'center', zIndex: 50, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.6)' },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 230, zIndex: 100 },
  brandText: { fontFamily: FontFamily.displayExtraBold, fontSize: 13, letterSpacing: 3, color: Colors.white },

  poster: { position: 'absolute', width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surface },

  bottom: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: 20, gap: 6 },
  line: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: withOpacity(Colors.inkPrimary, 0.6), marginTop: 4, marginBottom: 16 },
  signIn: { alignItems: 'center', paddingVertical: 14 },
  signInText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})
