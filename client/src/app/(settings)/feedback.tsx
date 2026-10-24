import { useState } from 'react'
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Send, Frown, Meh, Smile, Laugh, Heart } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSuccess, hTap } from '@/lib/haptics'

const MOODS = [
  { key: 'bad', label: 'Bad', Icon: Frown },
  { key: 'meh', label: 'Meh', Icon: Meh },
  { key: 'good', label: 'Good', Icon: Smile },
  { key: 'great', label: 'Great', Icon: Laugh },
  { key: 'love', label: 'Love it', Icon: Heart },
] as const

/** Tell us how it's going: a quick mood, then a line or two. */
export default function FeedbackScreen() {
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [mood, setMood] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const canSend = text.trim().length > 0 || !!mood
  const moodLabel = MOODS.find(m => m.key === mood)?.label

  const handleSubmit = async () => {
    if (!canSend || submitting) return
    hTap()
    setSubmitting(true)
    try {
      await ApiService.submitFeedback([moodLabel ? `[${moodLabel}]` : null, text.trim()].filter(Boolean).join(' '))
      hSuccess()
      showPill('Thanks! We read everything.', 'default')
      router.back()
    } catch {
      showPill('Failed to send. Please try again.', 'error')
      setSubmitting(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>How&apos;s Gorave{'\n'}so far?</Text>
        <Text style={s.sub}>What you love, what&apos;s broken, what you want next. The team reads every message.</Text>

        <View style={s.moods}>
          {MOODS.map(({ key, label, Icon }) => {
            const on = mood === key
            return (
              <Pressable key={key} style={s.mood} onPress={() => { hTap(); setMood(on ? null : key) }}>
                <View style={[s.moodCircle, on && s.moodCircleOn]}>
                  <Icon size={24} color={on ? Colors.background : Colors.inkPrimary} strokeWidth={1.8} />
                </View>
                <Text style={[s.moodText, on && s.moodTextOn]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={s.inputCard}>
          <TextInput
            style={s.textarea}
            value={text}
            onChangeText={setText}
            placeholder="Tell us more (optional)"
            placeholderTextColor={Colors.inkDisabled}
            multiline
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={s.charCount}>{text.length}/1000</Text>
        </View>

        <PrimaryButton
          label="Send feedback"
          onPress={handleSubmit}
          disabled={!canSend}
          loading={submitting}
          icon={<Send size={16} color={Colors.background} strokeWidth={2} />}
        />
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 16 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary },

  moods: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  mood: { alignItems: 'center', gap: 6, width: 60 },
  moodCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, alignItems: 'center', justifyContent: 'center' },
  moodCircleOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  moodText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  moodTextOn: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },

  inputCard: { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.divider, padding: 16 },
  textarea: { minHeight: 140, fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 8 },
})
