import { useEffect } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Star } from 'lucide-react-native'
import type { EventDetail } from '@/api/apiService'
import { RATING_WORDS } from '@/components/reviews/RateNightView'
import { PrimaryButton } from '@/components/ui'
import { photosLabel } from '@/lib/album'
import { Colors, FontFamily, withOpacity } from '@/constants'

const { width: W, height: H } = Dimensions.get('window')
const CARD_W = Math.round(W * 0.27)
const CARD_H = Math.round(CARD_W * 1.25) // event photos are 4:5
const GAP = CARD_W * 0.74 // between card centres; cards are wider, so they overlap
const TILTS = [-6, 4, -3, 7, -5, 3]
const DRIFT_SPEED = 10 // pixels per second
const MIN_PHOTOS_TO_DRIFT = 3

interface Props {
  event: EventDetail | null
  rating: number
  /** Only when the album still takes photos. */
  onAddPhotos?: () => void
  onBack: () => void
}

function RatingStars({ rating }: { rating: number }) {
  return (
    <View style={s.stars}>
      {[1, 2, 3, 4, 5].map(n => {
        const on = n <= rating
        return <Star key={n} size={24} strokeWidth={1.6} color={on ? Colors.brandOrange : withOpacity(Colors.white, 0.35)} fill={on ? Colors.brandOrange : 'transparent'} />
      })}
    </View>
  )
}

/** One photo, dealt onto the row: it rises and settles into its tilt. The picture fades in once loaded. */
function DealtCard({ photo, index, left }: { photo: { url: string; key: string }; index: number; left: number }) {
  const tilt = TILTS[index % TILTS.length]
  const dealt = useSharedValue(0)
  useEffect(() => {
    dealt.value = withDelay(Math.min(index, 6) * 90, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [dealt, index])
  const st = useAnimatedStyle(() => ({
    opacity: dealt.value,
    transform: [{ translateY: (1 - dealt.value) * 28 }, { rotate: `${tilt * (2 - dealt.value)}deg` }],
  }))
  return (
    <Animated.View style={[s.card, { left, zIndex: index }, st]}>
      <Image source={{ uri: photo.url, cacheKey: photo.key }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300} />
    </Animated.View>
  )
}

/**
 * The night's photos, fanned out and overlapping. Like the onboarding wall,
 * the row drifts slowly and wraps by repeating its cards, so there's never a
 * gap. With one or two photos, or reduce-motion on, they just sit still.
 */
function PhotoFan({ photos }: { photos: { url: string; key: string }[] }) {
  const reduced = useReducedMotion()
  const drifting = photos.length >= MIN_PHOTOS_TO_DRIFT && !reduced
  // Enough cards that one full set is wider than the screen, so the wrap happens off screen.
  const perSet = drifting ? Math.ceil((W + CARD_W) / GAP) + 1 : photos.length
  const set = Array.from({ length: perSet }, (_, i) => photos[i % photos.length])
  const period = perSet * GAP
  const x = useSharedValue(0)
  useEffect(() => {
    if (!drifting) return
    x.value = withRepeat(withTiming(-period, { duration: (period / DRIFT_SPEED) * 1000, easing: Easing.linear }), -1, false)
  }, [drifting, period, x])
  const st = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))

  const cards = drifting ? [...set, ...set] : set
  const start = drifting ? 0 : (W - ((set.length - 1) * GAP + CARD_W)) / 2
  return (
    <View style={s.fan} pointerEvents="none">
      <Animated.View style={[s.fanRow, st]}>
        {cards.map((p, i) => <DealtCard key={i} photo={p} index={i} left={start + i * GAP} />)}
      </Animated.View>
    </View>
  )
}

/**
 * What you see right after posting a review: the night's photo with your
 * rating on it, then what guests have already dropped in the album.
 */
export function ReviewDoneView({ event, rating, onAddPhotos, onBack }: Props) {
  const insets = useSafeAreaInsets()
  const cover = event?.cover_photos?.[0]?.url
  const count = event?.album?.count ?? 0
  const preview = event?.album?.preview ?? []
  const showFan = !!onAddPhotos && preview.length > 0
  return (
    <View style={s.root}>
      <View style={{ height: Math.round(H * (showFan ? 0.42 : 0.56)), overflow: 'hidden' }}>
        {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={300} /> : null}
        <LinearGradient colors={['rgba(0,0,0,0.35)', 'transparent', Colors.background]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
        <View style={s.heroText}>
          <RatingStars rating={rating} />
          <Text style={s.word}>{RATING_WORDS[rating]}</Text>
          <Text style={s.heroTitle} numberOfLines={2}>{event?.title ?? ''}</Text>
        </View>
      </View>

      <View style={s.ask}>
        <Text style={s.askTitle}>{onAddPhotos ? 'Got pics from the night?' : 'Your review is up'}</Text>
        <Text style={s.askSub}>
          {onAddPhotos
            ? `${count ? `${photosLabel(count)} in the album so far. ` : ''}Only people who were there can see them.`
            : 'Thanks for rating the night.'}
        </Text>
      </View>

      <View style={s.middle}>{showFan ? <PhotoFan photos={preview} /> : null}</View>

      <View style={[s.actions, { paddingBottom: insets.bottom + 12 }]}>
        {onAddPhotos ? (
          <>
            <PrimaryButton label="Add photos" onPress={onAddPhotos} />
            <Pressable style={s.quiet} onPress={onBack} hitSlop={6}>
              <Text style={s.quietText}>Not now</Text>
            </Pressable>
          </>
        ) : (
          <PrimaryButton label="Back to event" onPress={onBack} />
        )}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  stars: { flexDirection: 'row', gap: 6 },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 4, gap: 6 },
  word: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: withOpacity(Colors.white, 0.85) },
  heroTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6, color: Colors.white },
  ask: { paddingHorizontal: 20, paddingTop: 18, gap: 6 },
  askTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  askSub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },
  middle: { flex: 1, justifyContent: 'center' },
  fan: { height: CARD_H + 28, overflow: 'hidden' },
  fanRow: { position: 'absolute', top: 14, left: 0, height: CARD_H },
  card: { position: 'absolute', top: 0, width: CARD_W, height: CARD_H, borderRadius: 14, overflow: 'hidden', backgroundColor: Colors.surface },
  actions: { paddingHorizontal: 20, paddingTop: 12 },
  quiet: { alignItems: 'center', paddingVertical: 12 },
  quietText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
})
