import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated from 'react-native-reanimated'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Star } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BioField } from '@/components/ui/BioField'
import { PrimaryButton } from '@/components/ui'
import { eventDateParts } from '@/components/events/EventCard'
import { hSelection } from '@/lib/haptics'
import type { EventDetail } from '@/api/apiService'

const HERO_H = Math.round(Dimensions.get('window').height * 0.42)

export interface RateViewProps {
  event: EventDetail | null
  rating: number
  onRate: (n: number) => void
  body: string
  onBody: (t: string) => void
  maxBody: number
  submitting: boolean
  onSubmit: () => void
  onBack: () => void
}

/** What each star means, shown under the picker. */
export const RATING_WORDS = ['', 'Not for me', 'It was okay', 'Good night', 'Great night', 'Best night out']

/**
 * Rate the night. The night's own photo sits on top so you remember it,
 * then five big stars with a word for each, then an optional note.
 */
export function RateNightView({ event, rating, onRate, body, onBody, maxBody, submitting, onSubmit, onBack }: RateViewProps) {
  const insets = useSafeAreaInsets()
  const cover = event?.cover_photos?.[0]?.url
  const parts = eventDateParts(event?.date_time)
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)

  return (
    <View style={s.root}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={s.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
          </Animated.View>
          <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={[s.heroText, textStyle]}>
            <Text style={s.kicker}>RATE YOUR NIGHT</Text>
            <Text style={s.title} numberOfLines={2}>{event?.title ?? ''}</Text>
            <Text style={s.meta} numberOfLines={1}>
              {[event?.host_name ? `Hosted by ${event.host_name}` : null, parts ? `${parts.dow} ${parts.day} ${parts.mon}` : null].filter(Boolean).join(' · ')}
            </Text>
          </Animated.View>
        </View>

        <View style={s.body}>
          <View style={s.stars}>
            {[1, 2, 3, 4, 5].map(n => {
              const on = n <= rating
              return (
                <Pressable key={n} hitSlop={6} onPress={() => { hSelection(); onRate(n) }}>
                  <Star size={44} strokeWidth={1.6} color={on ? Colors.brandOrange : withOpacity(Colors.inkPrimary, 0.28)} fill={on ? Colors.brandOrange : 'transparent'} />
                </Pressable>
              )
            })}
          </View>
          <Text style={[s.word, !rating && s.wordIdle]}>{rating ? RATING_WORDS[rating] : 'Tap a star'}</Text>

          {/* Writing opens its own full-screen editor, so the keyboard never covers it. */}
          <BioField
            value={body}
            onChangeText={onBody}
            title="Your review"
            placeholder="What made the night? The crowd, the music, the host…"
            min={0}
            max={maxBody}
          />
          <Text style={s.public}>Your review shows on the event and the host’s profile with your name.</Text>

          <PrimaryButton label="Post review" onPress={onSubmit} disabled={rating === 0} loading={submitting} />
        </View>
      </Animated.ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { height: HERO_H, overflow: 'hidden' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 8, gap: 6 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6, color: Colors.white },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.75) },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  body: { paddingHorizontal: 20, paddingTop: 26, gap: 14 },
  stars: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 },
  word: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 10 },
  wordIdle: { color: Colors.inkDisabled, fontFamily: FontFamily.bodyMedium, fontSize: 14 },

  noteBox: { borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, padding: 16, paddingBottom: 10 },
  input: { minHeight: 120, fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary, padding: 0 },
  count: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right' },
  public: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginBottom: 6 },
})
