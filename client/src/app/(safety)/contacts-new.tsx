import { useMemo, useRef, useState } from 'react'
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Contact as ContactIcon } from 'lucide-react-native'
import { PrimaryButton } from '@/components/ui'
import { groupPhone } from '@/components/auth/authTypes'
import { useEmergencyContacts, normalizePhone } from '@/hooks/useEmergencyContacts'
import { useDeviceContacts } from '@/hooks/useDeviceContacts'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

/**
 * Add a contact by hand, in the same big-type style as signing in: a name,
 * then the number as large digits with +91 beside it. All on one page.
 */
export default function NewEmergencyContactScreen() {
  const insets = useSafeAreaInsets()
  const { contacts: emergencyContacts, addContact } = useEmergencyContacts()
  // Contacts permission is already resolved by the time someone reaches this
  // screen (via the Choose Contact picker); this re-reads the cached decision.
  const { contacts: deviceContacts } = useDeviceContacts()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | undefined>()
  const lastRef = useRef<TextInput>(null)
  const phoneRef = useRef<TextInput>(null)

  const normalized = phone.length === 10 ? normalizePhone(`+91${phone}`) : null

  const duplicate = useMemo(
    () => (normalized ? emergencyContacts.find(c => normalizePhone(c.phone) === normalized) : undefined),
    [emergencyContacts, normalized],
  )
  const deviceMatch = useMemo(
    () => (normalized && !duplicate ? deviceContacts.find(c => normalizePhone(c.phone) === normalized) : undefined),
    [deviceContacts, normalized, duplicate],
  )

  const error = duplicate ? 'This number is already an emergency contact' : saveError
  const canSave = firstName.trim().length > 0 && phone.length === 10 && !saving && !duplicate

  const useDeviceName = () => {
    if (!deviceMatch) return
    hTap()
    const [first, ...rest] = deviceMatch.name.trim().split(/\s+/)
    setFirstName(first ?? '')
    setLastName(rest.join(' '))
  }

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    setSaveError(undefined)
    const name = [firstName.trim(), lastName.trim()].filter(Boolean).join(' ')
    const created = await addContact({ name, phone: `+91${phone}`, source: 'manual' })
    setSaving(false)
    if (created) router.dismissTo('/(safety)/contacts' as any)
    else setSaveError('Could not save this contact, try again')
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={() => router.back()} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={s.body}>
          <Text style={s.title}>Who should{'\n'}we text?</Text>
          <Text style={s.sub}>They only hear from us if you send SOS.</Text>

          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            placeholder="First name"
            placeholderTextColor={withOpacity(Colors.inkPrimary, 0.18)}
            autoCapitalize="words"
            autoFocus
            returnKeyType="next"
            onSubmitEditing={() => lastRef.current?.focus()}
            style={s.name}
          />
          <View style={s.rule} />

          <TextInput
            ref={lastRef}
            value={lastName}
            onChangeText={setLastName}
            placeholder="Last name (optional)"
            placeholderTextColor={withOpacity(Colors.inkPrimary, 0.18)}
            autoCapitalize="words"
            returnKeyType="next"
            onSubmitEditing={() => phoneRef.current?.focus()}
            style={[s.name, { marginTop: 20 }]}
          />
          <View style={s.rule} />

          {/* Same trick as sign-in: the real field lies invisibly over the big
              number, so a tap anywhere on it brings the keyboard back. */}
          <View style={s.numberRow}>
            <View style={s.cc}><Text style={s.ccText}>+91</Text></View>
            <Text style={[s.number, !phone && s.placeholder]} numberOfLines={1} adjustsFontSizeToFit>
              {groupPhone(phone) || '98765 43210'}
            </Text>
            <TextInput
              ref={phoneRef}
              value={phone}
              onChangeText={t => { setSaveError(undefined); setPhone(t.replace(/\D/g, '').slice(0, 10)) }}
              keyboardType="number-pad"
              textContentType="telephoneNumber"
              autoComplete="tel"
              maxLength={10}
              caretHidden
              contextMenuHidden
              selectionColor="transparent"
              style={s.overlay}
            />
          </View>
          <View style={[s.rule, error ? { backgroundColor: Colors.destructive } : phone.length === 10 ? { backgroundColor: Colors.inkPrimary } : null]} />
          {error ? <Text style={s.error}>{error}</Text> : <Text style={s.hint}>{10 - phone.length > 0 ? `${10 - phone.length} digits to go` : 'Looks good'}</Text>}

          {deviceMatch ? (
            <Pressable style={s.suggestion} onPress={useDeviceName}>
              <ContactIcon size={15} color={Colors.inkSecondary} strokeWidth={2} />
              <Text style={s.suggestionText}>
                Saved as <Text style={s.suggestionName}>{deviceMatch.name}</Text> in your contacts. Tap to use that name
              </Text>
            </Pressable>
          ) : null}
        </View>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <PrimaryButton label="Save contact" onPress={handleSave} disabled={!canSave} loading={saving} />
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
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, marginTop: 10, marginBottom: 32 },

  name: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.5, color: Colors.inkPrimary, paddingVertical: 4 },
  rule: { height: 2, borderRadius: 1, backgroundColor: withOpacity(Colors.inkPrimary, 0.15), marginTop: 6 },

  numberRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 28 },
  cc: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  ccText: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  number: { flex: 1, fontFamily: FontFamily.displayExtraBold, fontSize: 36, letterSpacing: 0.5, color: Colors.inkPrimary },
  placeholder: { color: withOpacity(Colors.inkPrimary, 0.18) },
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 36, opacity: 0.02 },
  hint: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkDisabled, marginTop: 10 },
  error: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.destructive, marginTop: 10 },

  suggestion: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 16, padding: 12, borderRadius: 12,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
  },
  suggestionText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, lineHeight: 17 },
  suggestionName: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  footer: { paddingHorizontal: 20 },
})
