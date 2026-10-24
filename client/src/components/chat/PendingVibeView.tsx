import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, Flame } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'

export interface PendingViewProps {
  name: string
  avatar: string | null
  /** The icebreaker you sent with the vibe, if any. */
  message: string | null
  onProfile: () => void
  onBack: () => void
  onExplore: () => void
}

/** What happens after you send a vibe, in order. */
export const VIBE_STEPS = (name: string) => [
  { title: 'Vibe sent', sub: 'They get a notification now' },
  { title: `${name} accepts`, sub: 'Or passes. Vibes expire after 7 days with no reply' },
  { title: 'You both write an icebreaker', sub: 'One line each to start things off' },
  { title: 'The chat opens', sub: 'Messages, photos and voice notes' },
]

const W = Dimensions.get('window').width
const PHOTO = W - 96

/**
 * What happens after you send a vibe. Their square photo with a flame on its corner,
 * "Vibe sent to Riya", the four steps from here to an open chat with the
 * first one ticked, and what you wrote as a quote.
 */
export function PendingVibeView(p: PendingViewProps) {
  const insets = useSafeAreaInsets()
  const steps = VIBE_STEPS(p.name)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 24 }}>
        <View style={s.photoWrap}>
          <Pressable style={s.photo} onPress={p.onProfile}>
            {p.avatar ? <Image source={{ uri: p.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" /> : <Text style={s.initial}>{p.name.charAt(0).toUpperCase()}</Text>}
          </Pressable>
          <View style={s.flame}><Flame size={20} color={Colors.background} fill={Colors.background} strokeWidth={2} /></View>
        </View>

        <Text style={s.title}>Vibe sent to {p.name}</Text>
        <Text style={s.sub}>We&apos;ll tell you the moment they answer.</Text>

        {p.message ? (
          <View style={s.quoteWrap}>
            <Text style={s.quoteLabel}>You wrote</Text>
            <View style={s.quote}><Text style={s.quoteText}>{p.message}</Text></View>
          </View>
        ) : null}

        <View style={s.steps}>
          {steps.map((st, i) => {
            const done = i === 0
            return (
              <View key={st.title} style={s.step}>
                <View style={{ alignItems: 'center' }}>
                  <View style={[s.dot, done && s.dotDone]}>
                    {done ? <Check size={13} color={Colors.background} strokeWidth={3.2} /> : <Text style={s.dotNum}>{i + 1}</Text>}
                  </View>
                  {i < steps.length - 1 ? <View style={s.line} /> : null}
                </View>
                <View style={{ flex: 1, paddingBottom: i < steps.length - 1 ? 18 : 0 }}>
                  <Text style={[s.stepTitle, !done && { color: Colors.inkSecondary }]}>{st.title}</Text>
                  <Text style={s.stepSub}>{st.sub}</Text>
                </View>
              </View>
            )
          })}
        </View>

        <PrimaryButton label="Find more people" onPress={p.onExplore} style={{ marginTop: 28 }} />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },

  photoWrap: { alignSelf: 'center', marginTop: 8, marginBottom: 22 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 32, overflow: 'hidden', backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 80, color: Colors.inkDisabled },
  flame: { position: 'absolute', right: -10, bottom: -10, width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.inkPrimary, borderWidth: 4, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.7, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center', marginTop: 6 },

  quoteWrap: { marginTop: 24, alignItems: 'flex-end', gap: 6 },
  quoteLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.inkDisabled },
  quote: { maxWidth: '88%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20, borderBottomRightRadius: 6, backgroundColor: Colors.inkPrimary },
  quoteText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.background },

  steps: { marginTop: 30, padding: 18, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  step: { flexDirection: 'row', gap: 14 },
  dot: { width: 26, height: 26, borderRadius: 13, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.inkPrimary },
  dotNum: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  line: { width: 2, flex: 1, minHeight: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.1), marginTop: 4 },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 2 },
})
