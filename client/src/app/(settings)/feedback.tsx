import { useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, Frown, Heart, Laugh, Meh, Smile } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { BioField } from '@/components/ui/BioField'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

const MOODS = [
  { key: 'bad', label: 'Bad', Icon: Frown, reply: 'Sorry. Tell us what went wrong and we’ll fix it.' },
  { key: 'meh', label: 'Meh', Icon: Meh, reply: 'What would make it better? Be blunt.' },
  { key: 'good', label: 'Good', Icon: Smile, reply: 'Good is a start. What would make it great?' },
  { key: 'great', label: 'Great', Icon: Laugh, reply: 'Love to hear it. Anything you’d add?' },
  { key: 'love', label: 'Love it', Icon: Heart, reply: 'That made our day. Tell us what you love most.' },
] as const

const AREAS = ['Events', 'Hosting', 'Chat', 'Payments', 'The app itself', 'Something else'] as const

/** Tell us how it's going: a rating, what it's about, a few words. */
export default function FeedbackScreen() {
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [mood, setMood] = useState<(typeof MOODS)[number]['key'] | null>(null)
  const [areas, setAreas] = useState<string[]>([])
  const [text, setText] = useState('')
  const [contactOk, setContactOk] = useState(true)
  const [sending, setSending] = useState(false)

  const chosen = MOODS.find(m => m.key === mood)
  const canSend = !!mood || text.trim().length > 0

  const toggleArea = (a: string) => {
    hSelection()
    setAreas(prev => (prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]))
  }

  const send = async () => {
    if (!canSend || sending) return
    hTap()
    setSending(true)
    try {
      // One line the team can scan: [Love it] [Events, Chat] [OK to contact] then the words.
      const tags = [chosen ? `[${chosen.label}]` : null, areas.length ? `[${areas.join(', ')}]` : null, contactOk ? '[OK to contact]' : null]
      await ApiService.submitFeedback([...tags, text.trim()].filter(Boolean).join(' '))
      hSuccess()
      showPill('Thanks. The team reads every one.', 'default')
      router.back()
    } catch {
      showPill('Couldn’t send that. Try again.', 'error')
      setSending(false)
    }
  }

  return (
    <View style={s.root}>
      <AppHeader title="Feedback" leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>How&apos;s Gorave so far?</Text>
        <Text style={s.sub}>What you love, what&apos;s broken, what you want next. The team reads every message.</Text>

        <View style={s.scale}>
          {MOODS.map(({ key, label, Icon }) => {
            const on = mood === key
            return (
              <Pressable
                key={key}
                style={[s.step, on && s.stepOn]}
                onPress={() => { hSelection(); setMood(on ? null : key) }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
                accessibilityLabel={label}
              >
                <Icon size={24} color={on ? Colors.background : Colors.inkPrimary} strokeWidth={1.8} />
                <Text style={[s.stepText, on && s.stepTextOn]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>
        <Text style={s.reply}>{chosen ? chosen.reply : 'Pick one. It takes a second.'}</Text>

        <Text style={s.label}>WHAT&apos;S IT ABOUT?</Text>
        <View style={s.chips}>
          {AREAS.map(a => {
            const on = areas.includes(a)
            return (
              <Pressable key={a} style={[s.chip, on && s.chipOn]} onPress={() => toggleArea(a)} accessibilityRole="checkbox" accessibilityState={{ checked: on }}>
                {on ? <Check size={14} color={Colors.background} strokeWidth={3} /> : null}
                <Text style={[s.chipText, on && s.chipTextOn]}>{a}</Text>
              </Pressable>
            )
          })}
        </View>

        <Text style={s.label}>TELL US MORE</Text>
        <BioField
          value={text}
          onChangeText={setText}
          title="Your feedback"
          placeholder="The more specific, the faster we can act on it"
          min={0}
          max={1000}
        />

        <Pressable style={s.contact} onPress={() => { hTap(); setContactOk(v => !v) }} accessibilityRole="checkbox" accessibilityState={{ checked: contactOk }}>
          <View style={[s.box, contactOk && s.boxOn]}>{contactOk ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
          <Text style={s.contactText}>It&apos;s OK to contact me about this</Text>
        </Pressable>
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton label="Send feedback" onPress={send} disabled={!canSend} loading={sending} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 24 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8 },

  scale: { flexDirection: 'row', gap: 6, marginTop: 24, padding: 6, borderRadius: 22, backgroundColor: Colors.surface },
  step: { flex: 1, alignItems: 'center', gap: 6, paddingVertical: 12, borderRadius: 16 },
  stepOn: { backgroundColor: Colors.inkPrimary },
  stepText: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkSecondary },
  stepTextOn: { fontFamily: FontFamily.bodySemiBold, color: Colors.background },
  reply: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: 10, textAlign: 'center' },

  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 28, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, height: 38, borderRadius: 19, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  chipTextOn: { color: Colors.background },

  contact: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.35), alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  contactText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkPrimary },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 10 },
})
