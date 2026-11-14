import { memo, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { ArrowDownToLine, Building2, CheckCircle2, Eye, EyeOff, Lock, PencilLine, ShieldCheck, Zap } from 'lucide-react-native'
import { Input } from '@/components/ui'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { BankInfo } from '@/hooks/useIfscLookup'

type PayoutTab = 'UPI' | 'Bank Account'

const METHODS: { key: PayoutTab; title: string; sub: string; Icon: typeof Zap }[] = [
  { key: 'UPI', title: 'UPI', sub: 'One ID, fastest', Icon: Zap },
  { key: 'Bank Account', title: 'Bank account', sub: 'No limits', Icon: Building2 },
]

const TRUST: { Icon: typeof Lock; text: string }[] = [
  { Icon: ArrowDownToLine, text: 'Only for paying you. We never take money from it.' },
  { Icon: Lock, text: 'Encrypted. Only the last 4 digits are ever shown, even to us.' },
  { Icon: PencilLine, text: 'Change it any time in Settings.' },
]

function PayoutStepBase(p: {
  activeTab: PayoutTab
  onTabChange: (tab: string) => void
  upiId: string
  onUpiIdChange: (v: string) => void
  checking: boolean
  vpaResult: { name: string } | null
  vpaError: boolean
  holderName: string
  onHolderNameChange: (v: string) => void
  accountNumber: string
  onAccountNumberChange: (v: string) => void
  confirmAccountNumber: string
  onConfirmAccountNumberChange: (v: string) => void
  ifscCode: string
  onIfscCodeChange: (v: string) => void
  bankLookupLoading: boolean
  bankInfo: BankInfo | null
  ifscError: boolean
  accountNumberMismatch: boolean
}) {
  const [showNumber, setShowNumber] = useState(false)
  const eye = (
    <Pressable onPress={() => setShowNumber(v => !v)} hitSlop={8} accessibilityLabel={showNumber ? 'Hide number' : 'Show number'}>
      {showNumber ? <EyeOff size={18} color={Colors.inkSecondary} strokeWidth={1.8} /> : <Eye size={18} color={Colors.inkSecondary} strokeWidth={1.8} />}
    </Pressable>
  )

  return (
    <View>
      <Text style={s.title}>Where should your{'\n'}earnings land?</Text>
      <Text style={s.lede}>Ticket money from your nights comes here after each event. We only ever send money here.</Text>

      <View style={s.methods}>
        {METHODS.map(({ key, title, sub, Icon }) => {
          const on = p.activeTab === key
          return (
            <Pressable
              key={key}
              style={[s.method, on && s.methodOn]}
              onPress={() => { hSelection(); p.onTabChange(key) }}
              accessibilityRole="radio"
              accessibilityState={{ selected: on }}
            >
              <Icon size={18} color={on ? Colors.background : Colors.inkPrimary} strokeWidth={2} />
              <Text style={[s.methodTitle, on && s.methodTitleOn]}>{title}</Text>
              <Text style={[s.methodSub, on && s.methodSubOn]}>{sub}</Text>
            </Pressable>
          )
        })}
      </View>

      {p.activeTab === 'UPI' ? (
        <View style={s.upi}>
          <Text style={s.label}>YOUR UPI ID</Text>
          <TextInput
            value={p.upiId}
            onChangeText={t => p.onUpiIdChange(t.toLowerCase().trim())}
            placeholder="yourname@okhdfc"
            placeholderTextColor={withOpacity(Colors.inkPrimary, 0.2)}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            style={s.bigInput}
          />
          <View style={[s.rule, p.vpaResult && !p.checking && s.ruleOk, p.vpaError && !p.checking && s.ruleBad]} />
          {p.checking ? (
            <View style={s.status}><ActivityIndicator size="small" color={Colors.inkSecondary} /><Text style={s.statusText}>Checking with your bank…</Text></View>
          ) : p.vpaResult ? (
            <View style={s.status}>
              <CheckCircle2 size={15} color={Colors.accentGreen} strokeWidth={2.2} />
              <Text style={[s.statusText, s.ok]}>Paying <Text style={s.okName}>{p.vpaResult.name}</Text></Text>
            </View>
          ) : p.vpaError ? (
            <Text style={[s.statusText, s.bad]}>We couldn&apos;t find that UPI ID. Check for a typo.</Text>
          ) : (
            <Text style={s.statusText}>The one you use on GPay, PhonePe or Paytm. We&apos;ll show the name it belongs to.</Text>
          )}
        </View>
      ) : (
        <View style={s.bank}>
          <Input label="Name on the account" placeholder="As your bank has it" value={p.holderName} onChangeText={p.onHolderNameChange} />
          <Input
            label="Account number"
            placeholder="Account number"
            value={p.accountNumber}
            onChangeText={t => p.onAccountNumberChange(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry={!showNumber}
            rightIcon={eye}
          />
          <Input
            label="Account number again"
            placeholder="Just to be sure"
            value={p.confirmAccountNumber}
            onChangeText={t => p.onConfirmAccountNumberChange(t.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            secureTextEntry={!showNumber}
            error={p.accountNumberMismatch ? 'These don’t match yet' : undefined}
          />
          <Input
            label="IFSC"
            placeholder="On your cheque book or bank app, like HDFC0001234"
            value={p.ifscCode}
            onChangeText={t => p.onIfscCodeChange(t.toUpperCase())}
            error={!p.bankLookupLoading && p.ifscError ? 'We couldn’t find that IFSC' : undefined}
            autoCapitalize="characters"
          />
          {p.bankLookupLoading ? (
            <View style={s.status}><ActivityIndicator size="small" color={Colors.inkSecondary} /><Text style={s.statusText}>Finding your branch…</Text></View>
          ) : p.bankInfo ? (
            <View style={s.status}>
              <CheckCircle2 size={15} color={Colors.accentGreen} strokeWidth={2.2} />
              <Text style={[s.statusText, s.ok]}>{p.bankInfo.bank}, {p.bankInfo.branch}</Text>
            </View>
          ) : null}
        </View>
      )}

      <View style={s.trust}>
        <View style={s.trustHead}>
          <ShieldCheck size={16} color={Colors.inkSecondary} strokeWidth={2} />
          <Text style={s.trustTitle}>What we do with this</Text>
        </View>
        {TRUST.map(({ Icon, text }) => (
          <View key={text} style={s.trustRow}>
            <Icon size={15} color={Colors.inkSecondary} strokeWidth={1.8} />
            <Text style={s.trustText}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  )
}

export const PayoutStep = memo(PayoutStepBase)

const s = StyleSheet.create({
  // Same type as the wizard's other steps.
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary, marginTop: 8 },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 10 },

  methods: { flexDirection: 'row', gap: 10, marginTop: 24 },
  method: { flex: 1, padding: 14, gap: 4, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  methodOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  methodTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary, marginTop: 6 },
  methodTitleOn: { color: Colors.background },
  methodSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  methodSubOn: { color: withOpacity(Colors.background, 0.7) },

  upi: { marginTop: 28 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginBottom: 6 },
  bigInput: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.3, color: Colors.inkPrimary, paddingVertical: 4 },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 4 },
  ruleOk: { backgroundColor: Colors.accentGreen },
  ruleBad: { backgroundColor: Colors.destructive },

  bank: { marginTop: 24, gap: 14 },

  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  statusText: { flexShrink: 1, fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 10 },
  ok: { color: Colors.accentGreen, fontFamily: FontFamily.bodyMedium, marginTop: 0 },
  okName: { fontFamily: FontFamily.bodySemiBold },
  bad: { color: Colors.destructive },

  trust: { marginTop: 32, padding: 16, borderRadius: 18, backgroundColor: Colors.surface, gap: 12 },
  trustHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  trustTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  trustRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  trustText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
})
