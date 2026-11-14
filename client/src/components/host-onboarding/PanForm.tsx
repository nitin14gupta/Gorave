import { useRef } from 'react'
import { Pressable, StyleSheet, Text, View, type TextInput } from 'react-native'
import { Check, Lock } from 'lucide-react-native'
import { OnboardingNext, OnboardingShell } from '@/components/onboarding/OnboardingShell'
import { POSTER } from '@/components/ui/ParallaxScreen'
import { PAN_RE, PanKeyboard, PanText, panNext } from './PanInput'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

export interface PanFormProps {
  pan: string
  onPan: (pan: string) => void
  agreed: boolean
  onAgree: () => void
  onSubmit: () => void
  sending: boolean
  available: boolean
  /** Why the last try didn't work, when trying again. */
  lastTime: string | null
  onBack: () => void
}

/**
 * The PAN step, in the onboarding look: the poster, a big title, and the PAN
 * typed big over an underline, formatted as it's printed (ABCDE 1234 F) with
 * the rest of the format faint.
 */
export function PanForm(p: PanFormProps) {
  const input = useRef<TextInput>(null)
  const done = p.pan.length === 10
  const next = panNext(p.pan.length)

  return (
    <OnboardingShell
      step={0}
      poster={POSTER.djNight}
      onBack={p.onBack}
      title={'Your PAN,\nplease.'}
      sub="Every host on Gorave shows a real ID. It's checked with the Income Tax records, then by a person on our team."
      footer={
        <OnboardingNext
          label="Check my PAN"
          onPress={p.onSubmit}
          loading={p.sending}
          disabled={!PAN_RE.test(p.pan) || !p.agreed || !p.available}
          hint={p.available ? undefined : 'ID checks aren’t switched on yet'}
        />
      }
    >
      {p.lastTime ? <View style={s.last}><Text style={s.lastText}>Last time: {p.lastTime}</Text></View> : null}

      <View style={s.field}>
        <PanText value={p.pan} style={s.pan} />
        <PanKeyboard ref={input} value={p.pan} onChange={p.onPan} />
      </View>
      <View style={[s.rule, done && s.ruleDone]} />
      {done ? (
        <View style={s.statusRow}>
          <Check size={13} color={Colors.accentGreen} strokeWidth={3} />
          <Text style={[s.status, s.statusOk]}>Format looks right</Text>
        </View>
      ) : (
        <Text style={s.status}>{p.pan.length ? `Next: ${next}` : '5 letters, 4 numbers, 1 letter, as on your card'}</Text>
      )}

      <Pressable style={s.consent} onPress={() => { hTap(); p.onAgree() }} accessibilityRole="checkbox" accessibilityState={{ checked: p.agreed }}>
        <View style={[s.box, p.agreed && s.boxOn]}>{p.agreed ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
        <Text style={s.consentText}>I agree to Gorave checking my PAN with the Income Tax records.</Text>
      </Pressable>
      <View style={s.privacy}>
        <Lock size={12} color={Colors.inkDisabled} strokeWidth={2} />
        <Text style={s.privacyText}>We keep the last 4 characters only, never your full PAN or address. Guests never see it.</Text>
      </View>
    </OnboardingShell>
  )
}

const s = StyleSheet.create({
  last: { marginBottom: 16, padding: 12, borderRadius: 12, backgroundColor: withOpacity(Colors.destructive, 0.1) },
  lastText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 19, color: Colors.inkPrimary },
  field: { marginTop: 6 },
  pan: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, letterSpacing: 2, color: Colors.inkPrimary, paddingVertical: 4 },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 4 },
  ruleDone: { backgroundColor: Colors.accentGreen },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  status: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled, marginTop: 8 },
  statusOk: { color: Colors.accentGreen, marginTop: 0 },
  consent: { flexDirection: 'row', gap: 12, marginTop: 28, alignItems: 'center' },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.35), alignItems: 'center', justifyContent: 'center' },
  boxOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  consentText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  privacy: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12 },
  privacyText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 17, color: Colors.inkDisabled },
})
