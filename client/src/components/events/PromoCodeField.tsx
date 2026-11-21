import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { Check, Ticket, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'

/**
 * "Have a promo code?" on checkout. Closed by default (most people don't have
 * one); tap to type, Apply checks it with the server. Once applied it shows
 * as a chip you can remove.
 */
export function PromoCodeField({ applied, onApply, onRemove }: {
  /** The code in use now, if any. */
  applied: string | null
  /** Returns why it didn't work, or null when it did. */
  onApply: (code: string) => Promise<string | null>
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState<string | null>(null)

  if (applied) {
    return (
      <View style={[s.box, s.applied]}>
        <View style={s.okDot}><Check size={13} color={Colors.background} strokeWidth={3} /></View>
        <Text style={s.appliedText}><Text style={s.appliedCode}>{applied}</Text> applied</Text>
        <Pressable onPress={() => { hTap(); setCode(''); setNote(null); onRemove() }} hitSlop={8} accessibilityLabel="Remove code">
          <X size={16} color={Colors.inkSecondary} strokeWidth={2.2} />
        </Pressable>
      </View>
    )
  }

  if (!open) {
    return (
      <Pressable style={s.box} onPress={() => { hSelection(); setOpen(true) }}>
        <Ticket size={16} color={Colors.inkSecondary} strokeWidth={2} />
        <Text style={s.prompt}>Have a promo code?</Text>
      </Pressable>
    )
  }

  const apply = async () => {
    const c = code.trim().toUpperCase()
    if (!c || busy) return
    setBusy(true)
    const why = await onApply(c)
    setBusy(false)
    setNote(why)
    if (!why) hSuccess()
  }

  return (
    <View>
      <View style={[s.box, s.editing, note ? s.boxError : null]}>
        <TextInput
          style={s.input}
          value={code}
          onChangeText={t => { setCode(t.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()); setNote(null) }}
          placeholder="Enter code"
          placeholderTextColor={Colors.inkDisabled}
          autoCapitalize="characters"
          autoCorrect={false}
          autoFocus
          maxLength={20}
          returnKeyType="done"
          onSubmitEditing={apply}
        />
        <Pressable style={[s.applyBtn, !code && s.applyOff]} onPress={apply} disabled={!code || busy}>
          {busy ? <ActivityIndicator size="small" color={Colors.background} /> : <Text style={s.applyText}>Apply</Text>}
        </Pressable>
      </View>
      {note ? <Text style={s.note}>{note}</Text> : null}
    </View>
  )
}

const s = StyleSheet.create({
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16, borderRadius: 16, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  editing: { paddingRight: 6 },
  boxError: { borderColor: Colors.destructive },
  prompt: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  input: { flex: 1, fontFamily: FontFamily.headingBold, fontSize: 16, letterSpacing: 1.5, color: Colors.inkPrimary, paddingVertical: 12 },
  applyBtn: { height: 40, paddingHorizontal: 18, borderRadius: 12, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  applyOff: { opacity: 0.35 },
  applyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.background },
  note: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, marginTop: 6, paddingHorizontal: 4 },
  applied: { borderColor: withOpacity(Colors.accentGreen, 0.5), backgroundColor: withOpacity(Colors.accentGreen, 0.08) },
  okDot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.accentGreen, alignItems: 'center', justifyContent: 'center' },
  appliedText: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },
  appliedCode: { fontFamily: FontFamily.headingBold, letterSpacing: 1 },
})
