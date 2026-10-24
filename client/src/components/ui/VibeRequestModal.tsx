import { useState } from 'react'
import { Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { Image } from 'expo-image'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Flame, MapPin, X } from 'lucide-react-native'
import { hMedium, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { DiscoverUser } from '@/api/apiService'
import { PrimaryButton } from './PrimaryButton'

const MAX_CHARS = 150
// A vibe is a short note, so it stops at 4 lines (the bio allows 5).
const MAX_LINES = 4
const PHOTO = 168

interface Props {
  visible: boolean
  user: DiscoverUser | null
  onSend: (message: string) => void
  onClose: () => void
}

/** First lines built from what they're into, then a couple that always work. */
function ideasFor(user: DiscoverUser | null): string[] {
  const picks = (user?.interests ?? []).slice(0, 2).map(i => `You're into ${i} too? What got you into it?`)
  return [...picks, 'Going anywhere good this weekend?', 'What is the best night out you have had this year?']
}

/**
 * Sending someone a vibe. Full screen so the keyboard never covers the box:
 * their square photo, name and city, a note on what they'll see, the box for
 * your message (up to 4 lines) and ideas from their interests you can tap.
 */
function VibeRequestModalCore({ user, onSend, onClose }: Omit<Props, 'visible'>) {
  const insets = useSafeAreaInsets()
  const [message, setMessage] = useState('')
  const first = (user?.name ?? 'them').split(' ')[0]
  const avatar = user?.photos?.[0]?.url
  const canSend = message.trim().length > 0

  const send = () => {
    if (!canSend) return
    hMedium()
    onSend(message.trim())
    setMessage('')
  }
  const close = () => { hTap(); setMessage(''); onClose() }
  const change = (t: string) => {
    if (t.length > MAX_CHARS || t.split('\n').length > MAX_LINES) return
    setMessage(t)
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={close} statusBarTranslucent>
      <View style={[s.root, { paddingTop: insets.top + 8 }]}>
        <View style={s.bar}>
          <Pressable style={s.close} onPress={close} hitSlop={8}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Animated.View entering={FadeInDown.duration(380)} style={s.photoWrap}>
              <View style={s.photo}>
                {avatar ? <Image source={{ uri: avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" /> : <Text style={s.init}>{first.charAt(0)}</Text>}
              </View>
              <View style={s.flame}><Flame size={20} color={Colors.background} fill={Colors.background} /></View>
            </Animated.View>

            <Text style={s.title}>Vibe with {first}</Text>
            {user?.city ? <View style={s.cityRow}><MapPin size={13} color={Colors.inkSecondary} strokeWidth={2} /><Text style={s.city}>{user.city}</Text></View> : null}
            <Text style={s.sub}>{first} sees this before deciding. Make it about them, not just “hey”.</Text>

            <View style={s.inputCard}>
              <TextInput
                style={s.input}
                value={message}
                onChangeText={change}
                placeholder={`What made you want to meet ${first}?`}
                placeholderTextColor={withOpacity(Colors.inkPrimary, 0.3)}
                multiline
                maxLength={MAX_CHARS}
                autoFocus
              />
              <Text style={s.count}>{MAX_CHARS - message.length}</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={s.ideasBleed} contentContainerStyle={s.ideas}>
              {ideasFor(user).map(i => (
                <Pressable key={i} style={s.idea} onPress={() => { hTap(); change(i) }}>
                  <Text style={s.ideaText}>{i}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </ScrollView>

          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <PrimaryButton label="Send vibe" onPress={send} disabled={!canSend} icon={<Flame size={17} color={Colors.background} fill={Colors.background} />} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export function VibeRequestModal({ visible, ...rest }: Props) {
  if (!visible) return null
  return <VibeRequestModalCore {...rest} />
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 24, paddingBottom: 20, alignItems: 'center' },

  photoWrap: { marginTop: 4, marginBottom: 18 },
  photo: { width: PHOTO, height: PHOTO, borderRadius: 40, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  init: { fontFamily: FontFamily.displayExtraBold, fontSize: 60, color: Colors.inkDisabled },
  flame: { position: 'absolute', right: -8, bottom: -8, width: 46, height: 46, borderRadius: 23, backgroundColor: Colors.inkPrimary, borderWidth: 4, borderColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, letterSpacing: -1, color: Colors.inkPrimary, textAlign: 'center' },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  city: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, textAlign: 'center', marginTop: 10, marginBottom: 20 },

  inputCard: { alignSelf: 'stretch', padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.2), minHeight: 120 },
  input: { fontFamily: FontFamily.headingBold, fontSize: 19, lineHeight: 26, color: Colors.inkPrimary, minHeight: 70, textAlignVertical: 'top' },
  count: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right' },

  ideasBleed: { alignSelf: 'stretch', marginHorizontal: -24, marginTop: 12 },
  ideas: { paddingHorizontal: 24, gap: 8 },
  idea: { maxWidth: 240, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  ideaText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 18, color: Colors.inkPrimary },

  footer: { paddingHorizontal: 20, paddingTop: 10 },
})
