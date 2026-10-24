import { useEffect, useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Flame, X } from 'lucide-react-native'
import { hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useProfile } from '@/hooks/useProfile'
import { PrimaryButton } from './PrimaryButton'

const MAX_CHARS = 150
const FACE = 108

// First lines that are easy to reply to. Tap one to drop it in the box.
const IDEAS = [
  'What was the best night out you have had this year?',
  'Going anywhere this weekend?',
  'What song gets you on the dance floor?',
  'House party or rooftop?',
]

interface Props {
  visible: boolean
  partnerName: string | null
  /** Their photo, for the two faces at the top. */
  partnerAvatar?: string | null
  /** What they wrote when they sent the vibe. */
  partnerMessage?: string | null
  onSend: (icebreaker: string) => void
  onClose: () => void
}

/**
 * Accepting someone's vibe. A full-screen "It's a vibe" moment: your face and
 * theirs slide together with a flame between them, what they wrote, then the
 * box for your first line at the top (the keyboard never covers it) with a
 * few ideas you can tap. Sending opens the chat.
 */
function VibeIcebreakerCore({ partnerName, partnerAvatar, partnerMessage, onSend, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets()
  const { profile } = useProfile()
  const [message, setMessage] = useState('')
  const first = (partnerName ?? 'them').split(' ')[0]
  const me = profile?.photos?.[0]?.url

  // Faces slide in from the sides and meet, once.
  const meet = useSharedValue(0)
  useEffect(() => {
    meet.value = withDelay(120, withSpring(1, { damping: 13, stiffness: 120 }))
  }, [meet])
  const leftStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - meet.value) * -80 }, { rotate: `${-8 * meet.value}deg` }], opacity: meet.value }))
  const rightStyle = useAnimatedStyle(() => ({ transform: [{ translateX: (1 - meet.value) * 80 }, { rotate: `${8 * meet.value}deg` }], opacity: meet.value }))
  const flame = useSharedValue(0)
  useEffect(() => {
    flame.value = withDelay(450, withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2.2)) }))
  }, [flame])
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: flame.value }], opacity: flame.value }))

  const canSend = message.trim().length > 0
  const send = () => {
    if (!canSend) return
    hSuccess()
    onSend(message.trim())
    setMessage('')
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.root, { paddingTop: insets.top + 8 }]}>
        <View style={s.bar}>
          <Pressable style={s.close} onPress={onClose} hitSlop={8}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={s.faces}>
              <Animated.View style={[s.face, leftStyle]}>
                {me ? <Image source={{ uri: me }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.init}>{(profile?.name ?? 'Y').charAt(0)}</Text>}
              </Animated.View>
              <Animated.View style={[s.face, { marginLeft: -22 }, rightStyle]}>
                {partnerAvatar ? <Image source={{ uri: partnerAvatar }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Text style={s.init}>{first.charAt(0)}</Text>}
              </Animated.View>
              <Animated.View style={[s.flame, flameStyle]}>
                <Flame size={20} color={Colors.background} fill={Colors.background} />
              </Animated.View>
            </View>

            <Text style={s.title}>It&apos;s a vibe</Text>
            <Text style={s.sub}>You and {first} can chat once you send a first line.</Text>

            {partnerMessage ? (
              <View style={s.theirs}>
                <Text style={s.theirsLabel}>{first} wrote</Text>
                <Text style={s.theirsText}>{partnerMessage}</Text>
              </View>
            ) : null}

            <View style={s.inputCard}>
              <TextInput
                style={s.input}
                value={message}
                onChangeText={t => setMessage(t.slice(0, MAX_CHARS))}
                placeholder={`Say something to ${first}`}
                placeholderTextColor={withOpacity(Colors.inkPrimary, 0.3)}
                multiline
                maxLength={MAX_CHARS}
                autoFocus
              />
              <Text style={s.count}>{MAX_CHARS - message.length}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={s.ideasBleed} contentContainerStyle={s.ideas}>
              {IDEAS.map(i => (
                <Pressable key={i} style={s.idea} onPress={() => { hTap(); setMessage(i) }}>
                  <Text style={s.ideaText}>{i}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </ScrollView>

          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <PrimaryButton label="Send and start chatting" onPress={send} disabled={!canSend} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export function VibeIcebreakerModal({ visible, ...rest }: Props) {
  if (!visible) return null
  return <VibeIcebreakerCore {...rest} />
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 24, paddingBottom: 20, alignItems: 'center' },

  faces: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 22 },
  face: { width: FACE, height: FACE, borderRadius: 30, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, borderWidth: 3, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },
  init: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, color: Colors.inkDisabled },
  flame: { position: 'absolute', left: (FACE * 2 - 22) / 2 - 20, bottom: -14, width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.inkPrimary, borderWidth: 3, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 38, letterSpacing: -1.1, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center', marginTop: 6, marginBottom: 20 },

  theirs: { alignSelf: 'stretch', padding: 14, borderRadius: 18, borderBottomLeftRadius: 6, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, marginBottom: 14, gap: 4 },
  theirsLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.inkDisabled },
  theirsText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },

  inputCard: { alignSelf: 'stretch', padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.2), minHeight: 120 },
  input: { fontFamily: FontFamily.headingBold, fontSize: 19, lineHeight: 26, color: Colors.inkPrimary, minHeight: 70, textAlignVertical: 'top' },
  count: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right' },

  ideasBleed: { alignSelf: 'stretch', marginHorizontal: -24, marginTop: 12 },
  ideas: { paddingHorizontal: 24, gap: 8 },
  idea: { maxWidth: 230, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  ideaText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 18, color: Colors.inkPrimary },

  footer: { paddingHorizontal: 20, paddingTop: 10 },
})
