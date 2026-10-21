import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity, eventImageHeight } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { eventDateParts } from '@/components/events/EventCard'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import type { EventDetail } from '@/api/apiService'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const HERO_H = Math.min(eventImageHeight(W), SCREEN_H * 0.5)

export interface WaitlistJoinedViewProps {
  event: EventDetail | null
  /** Title and cover from the route params, shown before the event loads. */
  title: string
  coverUrl: string
  /** Your place in the queue, 1 = next. */
  position: number
  /** Everyone waiting, you included. */
  total: number
  onBack: () => void
  onLeave: () => void
}

export const WAITLIST_STEPS = [
  { title: 'A spot opens', sub: 'Someone cancels or the host adds spots' },
  { title: 'You get 1 hour', sub: 'We notify you, the spot is held for you' },
  { title: 'You’re in', sub: 'Ticket and full address unlock' },
]

/**
 * On the waitlist. The poster on top (parallax), then your place set huge,
 * the queue drawn as seats with you in it, and what happens next.
 */
export function WaitlistJoinedView({ event, title, coverUrl, position, total, onBack, onLeave }: WaitlistJoinedViewProps) {
  const insets = useSafeAreaInsets()
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)
  const parts = eventDateParts(event?.date_time)
  const cover = event?.cover_photos?.[0]?.url || coverUrl
  const ahead = Math.max(0, position - 1)
  const seats = Math.min(Math.max(total, position), 8)

  return (
    <View style={s.root}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View style={s.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
          </Animated.View>
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={[s.heroText, textStyle]}>
            <Text style={s.kicker}>ON THE WAITLIST</Text>
            <Text style={s.title} numberOfLines={2}>{event?.title ?? title}</Text>
            {parts ? <Text style={s.meta}>{`${parts.dow} ${parts.day} ${parts.mon} · ${parts.time}`}{event?.area ? ` · ${event.area}` : ''}</Text> : null}
          </Animated.View>
        </View>

        <View style={s.body}>
          <View style={s.place}>
            <Text style={s.hash}>#</Text>
            <Text style={s.pos}>{position}</Text>
            <View style={s.placeText}>
              <Text style={s.placeLine}>in line</Text>
              <Text style={s.placeSub}>{ahead === 0 ? 'You’re next' : `${ahead} ${ahead === 1 ? 'person' : 'people'} ahead of you`}</Text>
            </View>
          </View>

          <View style={s.queue}>
            {Array.from({ length: seats }).map((_, i) => {
              const n = i + 1
              const you = n === position
              return (
                <View key={i} style={s.seatCol}>
                  <View style={[s.seat, n < position && s.seatAhead, you && s.seatYou]}>
                    <Text style={[s.seatNum, you && s.seatNumYou]}>{n}</Text>
                  </View>
                  {you ? <Text style={s.youLabel}>You</Text> : null}
                </View>
              )
            })}
          </View>

          <Text style={s.section}>What happens next</Text>
          <View style={s.steps}>
            {WAITLIST_STEPS.map((st, i) => (
              <View key={st.title} style={s.step}>
                <Text style={s.stepNum}>{i + 1}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={s.stepTitle}>{st.title}</Text>
                  <Text style={s.stepSub}>{st.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          <PrimaryButton label="Back to the event" onPress={onBack} />
          <Pressable style={s.leave} onPress={onLeave} hitSlop={6}>
            <Text style={s.leaveText}>Leave the waitlist</Text>
          </Pressable>
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
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 10, gap: 6 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6, color: Colors.white },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(Colors.white, 0.75) },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  body: { paddingHorizontal: 20, paddingTop: 22 },
  place: { flexDirection: 'row', alignItems: 'flex-end' },
  hash: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, lineHeight: 92, color: Colors.inkDisabled, marginRight: 2 },
  pos: { fontFamily: FontFamily.displayExtraBold, fontSize: 96, lineHeight: 100, letterSpacing: -4, color: Colors.inkPrimary },
  placeText: { marginLeft: 14, paddingBottom: 16 },
  placeLine: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  placeSub: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary, marginTop: 2 },

  queue: { flexDirection: 'row', gap: 8, marginTop: 14, marginBottom: 30 },
  seatCol: { alignItems: 'center', gap: 6 },
  seat: { width: 34, height: 34, borderRadius: 17, borderWidth: 1.5, borderColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  seatAhead: { backgroundColor: withOpacity(Colors.inkPrimary, 0.12), borderColor: 'transparent' },
  seatYou: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  seatNum: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  seatNumYou: { color: Colors.background },
  youLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkPrimary },

  section: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, marginBottom: 14 },
  steps: { gap: 16, marginBottom: 30 },
  step: { flexDirection: 'row', gap: 14 },
  stepNum: { width: 26, fontFamily: FontFamily.displayExtraBold, fontSize: 20, color: Colors.inkDisabled },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },

  leave: { alignItems: 'center', paddingVertical: 16 },
  leaveText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.destructive },
})
