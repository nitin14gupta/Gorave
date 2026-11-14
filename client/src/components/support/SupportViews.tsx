import type { ComponentType } from 'react'
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BadgeCheck, Check, CreditCard, MessageCircleQuestion, PartyPopper, UserCog, Wallet } from 'lucide-react-native'
import { BioField } from '@/components/ui/BioField'
import { AppHeader, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { hSelection, hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, SUPPORT_EMAIL, Spacing, withOpacity } from '@/constants'

export const SUPPORT_TOPICS: { id: string; label: string; desc: string; subject: string; Icon: ComponentType<{ size: number; color: string; strokeWidth: number }> }[] = [
  { id: 'hosting', label: 'Hosting and ID check', desc: 'Verifying your PAN, getting set up to host', subject: 'Hosting and ID Check', Icon: BadgeCheck },
  { id: 'payment', label: 'Payment issue', desc: 'Charged but no ticket, a payment that failed', subject: 'Payment Issue', Icon: CreditCard },
  { id: 'refund', label: 'Refund to my bank', desc: 'Moving your wallet balance to your account', subject: 'Wallet Refund Request', Icon: Wallet },
  { id: 'event', label: 'An event', desc: 'A night you went to, or one you host', subject: 'Event Issue', Icon: PartyPopper },
  { id: 'account', label: 'My account', desc: 'Logging in, your profile, safety', subject: 'Account Issue', Icon: UserCog },
  { id: 'other', label: 'Something else', desc: 'Anything we haven’t covered', subject: 'Support Request', Icon: MessageCircleQuestion },
]

const PLACEHOLDER: Record<string, string> = {
  hosting: 'Tell us what happened with your PAN check. We’ll get you sorted.',
  payment: 'What did you pay for, how much, and when?',
  refund: 'How much should come back, and to which bank account?',
  event: 'Which event, and what happened?',
  account: 'What’s going wrong with your account?',
  other: 'What can we help with?',
}

export interface SupportViewProps {
  topic: string | null
  onTopic: (id: string) => void
  message: string
  onMessage: (text: string) => void
  onSend: () => void
  sending: boolean
  canSend: boolean
  onBack: () => void
}

/** The note under the message for topics that need more than words. */
function TopicNote({ topic }: { topic: string | null }) {
  if (topic === 'refund') return <Text style={s.note}>Add your phone number and the events you were refunded for. Bank transfers are done by hand and take 5 to 10 business days.</Text>
  if (topic === 'hosting') return <Text style={s.note}>You don&apos;t need to send your PAN again. We can see your check from our side.</Text>
  return null
}

function EmailLine() {
  const showPill = usePillStore(s => s.show)
  return (
    <Text style={s.direct}>
      Or email{' '}
      <Text
        style={s.emailLink}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
        onLongPress={async () => { hTap(); await Clipboard.setStringAsync(SUPPORT_EMAIL); showPill('Email copied', 'default') }}
      >
        {SUPPORT_EMAIL}
      </Text>
    </Text>
  )
}

function Message({ topic, message, onMessage }: Pick<SupportViewProps, 'topic' | 'message' | 'onMessage'>) {
  return (
    <BioField
      value={message}
      onChangeText={onMessage}
      title="What happened?"
      placeholder={PLACEHOLDER[topic ?? 'other']}
      min={10}
      max={1000}
    />
  )
}

/** Support: the topics as a list, then the message, then Send. */
export function SupportView(p: SupportViewProps) {
  const insets = useSafeAreaInsets()
  return (
    <View style={s.root}>
      <AppHeader title="Support" leftAction={<HeaderIconBtn onPress={p.onBack}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>} />
      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.title}>How can we help?</Text>
        <Text style={s.sub}>A real person reads every message. We reply within 1 to 2 business days.</Text>

        <View style={s.list}>
          {SUPPORT_TOPICS.map(({ id, label, desc, Icon }, i) => {
            const on = p.topic === id
            return (
              <Pressable
                key={id}
                style={[s.row, i > 0 && s.rowBorder]}
                onPress={() => { hSelection(); p.onTopic(id) }}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={[s.rowIcon, on && s.rowIconOn]}>
                  <Icon size={18} color={on ? Colors.background : Colors.inkPrimary} strokeWidth={1.8} />
                </View>
                <View style={s.rowText}>
                  <Text style={s.rowTitle}>{label}</Text>
                  <Text style={s.rowDesc}>{desc}</Text>
                </View>
                <View style={[s.radio, on && s.radioOn]}>{on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
              </Pressable>
            )
          })}
        </View>

        {p.topic ? (
          <>
            <Text style={s.label}>YOUR MESSAGE</Text>
            <Message topic={p.topic} message={p.message} onMessage={p.onMessage} />
            <TopicNote topic={p.topic} />
          </>
        ) : null}
        <EmailLine />
      </ScrollView>
      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton label="Send" onPress={p.onSend} disabled={!p.canSend} loading={p.sending} />
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 8, paddingBottom: 24 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, lineHeight: 36, letterSpacing: -0.8, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8 },

  list: { marginTop: 22, borderRadius: 20, backgroundColor: Colors.surface, paddingHorizontal: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  rowIconOn: { backgroundColor: Colors.inkPrimary },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowDesc: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 16, color: Colors.inkSecondary },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.3), alignItems: 'center', justifyContent: 'center' },
  radioOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 10 },


  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 26, marginBottom: 10 },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, padding: 14, borderRadius: 14, backgroundColor: withOpacity(Colors.inkPrimary, 0.05), marginTop: 12 },
  direct: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'center', marginTop: 22 },
  emailLink: { color: Colors.inkPrimary, fontFamily: FontFamily.bodyMedium },
})
