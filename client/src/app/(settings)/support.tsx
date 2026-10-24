import { useState } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ScrollView, Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Mail, Wallet, CreditCard, PartyPopper, UserCog, MessageCircleQuestion } from 'lucide-react-native'
import { PrimaryButton } from '@/components/ui'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'

const TOPICS = [
  { id: 'refund', label: 'Refund to my bank', subject: 'Wallet Refund Request', Icon: Wallet },
  { id: 'payment', label: 'Payment issue', subject: 'Payment Issue', Icon: CreditCard },
  { id: 'event', label: 'An event', subject: 'Event Issue', Icon: PartyPopper },
  { id: 'account', label: 'My account', subject: 'Account Issue', Icon: UserCog },
  { id: 'other', label: 'Something else', subject: 'Support Request', Icon: MessageCircleQuestion },
] as const

export default function SupportScreen() {
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const topic = TOPICS.find(t => t.id === selectedTopic)
  const canSend = !!selectedTopic && message.trim().length > 10

  const handleSend = async () => {
    if (!canSend || !topic) return
    hTap()
    setSending(true)
    try {
      await ApiService.submitSupport(topic.id, message.trim())
      hSuccess()
      // Also open the mail app, so they keep a copy.
      const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`[Gorave] ${topic.subject}`)}&body=${encodeURIComponent(message.trim())}`
      if (await Linking.canOpenURL(url)) await Linking.openURL(url)
      showPill("Sent. We'll reply within 1 to 2 business days.", 'default')
      router.back()
    } catch {
      showPill('Failed to send. Please try again or email us directly.', 'error')
    } finally {
      setSending(false)
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
        <Text style={s.title}>What do you{'\n'}need help with?</Text>
        <Text style={s.sub}>A real person reads this. We reply within 1 to 2 business days.</Text>

        <View style={s.grid}>
          {TOPICS.map(({ id, label, Icon }) => {
            const on = selectedTopic === id
            return (
              <Pressable key={id} style={[s.tile, on && s.tileOn]} onPress={() => { hTap(); setSelectedTopic(id) }}>
                <Icon size={20} color={on ? Colors.background : Colors.inkPrimary} strokeWidth={1.8} />
                <Text style={[s.tileText, on && s.tileTextOn]}>{label}</Text>
              </Pressable>
            )
          })}
        </View>

        <View style={s.inputCard}>
          <TextInput
            style={s.input}
            value={message}
            onChangeText={setMessage}
            placeholder="What happened? Add the event name, amount or date if it helps."
            placeholderTextColor={Colors.inkDisabled}
            multiline
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={s.charCount}>{message.length}/1000</Text>
        </View>

        {selectedTopic === 'refund' ? (
          <Text style={s.note}>
            Mention your phone number and the events you were refunded for. Bank transfers are done by hand and usually take 5 to 10 business days.
          </Text>
        ) : null}

        <PrimaryButton
          label="Send"
          onPress={handleSend}
          disabled={!canSend}
          loading={sending}
          icon={<Mail size={16} color={Colors.background} strokeWidth={2} />}
          style={{ marginTop: 8 }}
        />

        <Text style={s.direct}>
          Or write to{' '}
          <Text
            style={s.emailLink}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
            onLongPress={async () => {
              hTap()
              await Clipboard.setStringAsync(SUPPORT_EMAIL)
              showPill('Email copied', 'default')
            }}
          >
            {SUPPORT_EMAIL}
          </Text>
          {' '}(long-press to copy)
        </Text>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingTop: 12, gap: 14 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginBottom: 10 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '48.5%', gap: 10, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  tileOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  tileText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  tileTextOn: { color: Colors.background },

  inputCard: { backgroundColor: Colors.surface, borderRadius: 18, borderWidth: 1, borderColor: Colors.divider, padding: 16, marginTop: 6 },
  input: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkPrimary, lineHeight: 22, minHeight: 130 },
  charCount: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, textAlign: 'right', marginTop: 8 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, padding: 14, borderRadius: 14, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },

  direct: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'center', marginTop: 4 },
  emailLink: { color: Colors.inkPrimary, fontFamily: FontFamily.bodyMedium },
})
