import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { groupPhone, type PhoneViewProps } from './authTypes'

/**
 * Phone number, as the big number. Your number typed in large display digits as you
 * go, the way Cash App and Revolut show amounts: hard to get wrong, and it
 * feels like the start of something. +91 sits as a quiet chip.
 */
export function PhoneView(p: PhoneViewProps) {
  const insets = useSafeAreaInsets()
  const shown = groupPhone(p.phone)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.body}>
          <Text style={s.title}>What&apos;s your{'\n'}number?</Text>
          <Text style={s.sub}>We&apos;ll text you a code to sign in.</Text>

          {/* The real field lies invisibly over the big number, so a tap always
              lands on it and the keyboard reopens, even after it was dismissed. */}
          <View style={s.numberRow}>
            <View style={s.cc}><Text style={s.ccText}>+91</Text></View>
            <Text style={[s.number, !p.phone && s.placeholder]} numberOfLines={1} adjustsFontSizeToFit>
              {shown || '98765 43210'}
            </Text>
            <TextInput
              value={p.phone}
              onChangeText={t => p.onPhone(t.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={10}
              autoFocus
              caretHidden
              contextMenuHidden
              selectionColor="transparent"
              style={s.overlay}
            />
          </View>
          <View style={[s.rule, p.error ? { backgroundColor: Colors.destructive } : p.phone.length === 10 ? { backgroundColor: Colors.inkPrimary } : null]} />
          {p.error ? <Text style={s.error}>{p.error}</Text> : <Text style={s.hint}>{10 - p.phone.length > 0 ? `${10 - p.phone.length} digits to go` : 'Looks good'}</Text>}

        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label="Send code" onPress={p.onContinue} disabled={p.phone.length !== 10} loading={p.loading} />
          <Text style={s.legal}>
            By continuing you agree to our <Text style={s.link} onPress={p.onTerms}>Terms</Text> and <Text style={s.link} onPress={p.onPrivacy}>Privacy Policy</Text>, and to get event texts from Gorave. Message rates may apply. Help: {p.supportEmail}
          </Text>
        </View>
      </KeyboardAvoidingView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 12 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, lineHeight: 42, letterSpacing: -1.1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, marginTop: 10, marginBottom: 44 },

  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cc: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  ccText: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  number: { flex: 1, fontFamily: FontFamily.displayExtraBold, fontSize: 40, letterSpacing: 0.5, color: Colors.inkPrimary },
  placeholder: { color: withOpacity(Colors.inkPrimary, 0.18) },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 10 },
  hint: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkDisabled, marginTop: 10 },
  error: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.destructive, marginTop: 10 },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 40, opacity: 0.02 },

  footer: { paddingHorizontal: 20, gap: 12 },
  legal: { fontFamily: FontFamily.bodyRegular, fontSize: 11, lineHeight: 16, color: Colors.inkDisabled, textAlign: 'center' },
  link: { color: Colors.inkSecondary, textDecorationLine: 'underline' },
})
