import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator, Modal, Platform, ScrollView } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, CheckCircle2, X, XCircle } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap, hSuccess } from '@/lib/haptics'
import ApiService from '@/api/apiService'
import { useVpaValidation } from '@/hooks/useVpaValidation'
import { PrimaryButton } from '@/components/ui'

// The handles most people's UPI IDs end in. Tapping one finishes the ID.
const HANDLES = ['@oksbi', '@ybl', '@okhdfcbank', '@okaxis', '@paytm', '@okicici']

/**
 * Pay with a UPI ID, full screen so the keyboard never covers it. The ID in
 * big type at the top, quick handles to finish it, the account name once we
 * have checked it, and a single Pay with a "remember this ID" tick.
 */
function UpiIdSheetCore({ rzpKey, onPay, onClose }: { rzpKey: string; onPay: (vpa: string) => void; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const mountedRef = useRef(true)
  const [vpa, setVpa] = useState('')
  const [savedVpa, setSavedVpa] = useState<string | null>(null)
  const [remember, setRemember] = useState(true)
  const [paying, setPaying] = useState(false)

  const { validFormat, checking, vpaResult, vpaError } = useVpaValidation(vpa, rzpKey)
  const canPay = validFormat && vpaResult !== null && !vpaError
  const isSaved = savedVpa !== null && vpa.trim() === savedVpa
  const hasHandle = vpa.includes('@')

  useEffect(() => () => { mountedRef.current = false }, [])

  // Start with the UPI ID you saved last time, if any.
  useEffect(() => {
    let cancelled = false
    ApiService.getSavedUpiId().then(saved => {
      if (cancelled || !saved?.upi_id) return
      setSavedVpa(saved.upi_id)
      setVpa(saved.upi_id)
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  const pay = async () => {
    if (!canPay || !vpaResult || paying) return
    hSuccess()
    const id = vpa.trim()
    if (remember && !isSaved) {
      setPaying(true)
      // A failed save never blocks the payment.
      await ApiService.saveUpiId(id, vpaResult.name).catch(() => {})
      if (mountedRef.current) setPaying(false)
    }
    onPay(id)
  }

  const addHandle = (h: string) => {
    hTap()
    const name = vpa.split('@')[0]
    setVpa(`${name}${h}`)
  }

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.root, { paddingTop: insets.top + 8 }]}>
        <View style={s.bar}>
          <Pressable style={s.close} onPress={() => { hTap(); onClose() }} hitSlop={8}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.body} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Pay with{'\n'}UPI ID</Text>
            <Text style={s.sub}>We&apos;ll send a payment request to your UPI app. Approve it there.</Text>

            <View style={s.inputRow}>
              <TextInput
                style={s.input}
                placeholder="yourname@oksbi"
                placeholderTextColor={withOpacity(Colors.inkPrimary, 0.2)}
                value={vpa}
                onChangeText={v => setVpa(v.toLowerCase().replace(/\s/g, ''))}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                autoFocus={!savedVpa}
                returnKeyType="done"
                onSubmitEditing={pay}
              />
              {checking ? <ActivityIndicator size="small" color={Colors.inkSecondary} /> : null}
              {!checking && vpaResult ? <CheckCircle2 size={22} color={Colors.accentGreen} strokeWidth={2} /> : null}
              {!checking && vpaError ? <XCircle size={22} color={Colors.destructive} strokeWidth={2} /> : null}
            </View>
            <View style={[s.rule, vpaError ? { backgroundColor: Colors.destructive } : vpaResult ? { backgroundColor: Colors.accentGreen } : null]} />

            {!hasHandle || !validFormat ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={s.handlesBleed} contentContainerStyle={s.handles}>
                {HANDLES.map(h => (
                  <Pressable key={h} style={s.handle} onPress={() => addHandle(h)}>
                    <Text style={s.handleText}>{h}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            ) : null}

            {vpaResult ? (
              <View style={s.verified}>
                <View style={s.verifiedIcon}><Check size={16} color={Colors.white} strokeWidth={3} /></View>
                <View style={{ flex: 1 }}>
                  <Text style={s.verifiedLabel}>Verified account</Text>
                  <Text style={s.verifiedName} numberOfLines={1}>{vpaResult.name}</Text>
                </View>
              </View>
            ) : vpaError ? (
              <Text style={s.error}>We couldn&apos;t find this UPI ID. Check the spelling and the part after @.</Text>
            ) : (
              <Text style={s.hint}>It&apos;s in your UPI app, usually under your profile.</Text>
            )}

            {canPay && !isSaved ? (
              <Pressable style={s.remember} onPress={() => { hTap(); setRemember(r => !r) }}>
                <View style={[s.tick, remember && s.tickOn]}>{remember ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
                <Text style={s.rememberText}>Remember this UPI ID for next time</Text>
              </Pressable>
            ) : null}
            {isSaved ? <Text style={s.hint}>Your saved UPI ID</Text> : null}
          </ScrollView>

          <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
            <PrimaryButton label={canPay ? 'Send payment request' : 'Enter your UPI ID'} onPress={pay} disabled={!canPay} loading={paying} />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

export function UpiIdSheet({ visible, rzpKey, onPay, onClose }: { visible: boolean; rzpKey: string; onPay: (vpa: string) => void; onClose: () => void }) {
  if (!visible) return null
  return <UpiIdSheetCore rzpKey={rzpKey} onPay={onPay} onClose={onClose} />
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { paddingHorizontal: 16, height: 44, justifyContent: 'center' },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },
  body: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 38, lineHeight: 41, letterSpacing: -1.1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8, marginBottom: 34 },

  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.4, color: Colors.inkPrimary, paddingVertical: 4 },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 6 },

  handlesBleed: { marginHorizontal: -24, marginTop: 14 },
  handles: { paddingHorizontal: 24, gap: 8 },
  handle: { paddingHorizontal: 14, height: 36, borderRadius: 18, justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.07) },
  handleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },

  verified: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, padding: 14, borderRadius: 18, backgroundColor: withOpacity(Colors.accentGreen, 0.1), borderWidth: 1, borderColor: withOpacity(Colors.accentGreen, 0.35) },
  verifiedIcon: { width: 30, height: 30, borderRadius: 15, backgroundColor: Colors.accentGreen, alignItems: 'center', justifyContent: 'center' },
  verifiedLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', color: Colors.inkSecondary },
  verifiedName: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary, marginTop: 1 },
  error: { fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 19, color: Colors.destructive, marginTop: 12 },
  hint: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkDisabled, marginTop: 12 },

  remember: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18 },
  tick: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.3), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  rememberText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },

  footer: { paddingHorizontal: 20, paddingTop: 10 },
})
