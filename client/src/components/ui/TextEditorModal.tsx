import { useEffect, useState } from 'react'
import { ActivityIndicator, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

interface Props {
  visible: boolean
  title: string
  initial?: string
  placeholder?: string
  min?: number
  max: number
  /** The word on the right, like Done or Post. */
  actionLabel?: string
  /** Shows a spinner in place of the action while it's saving. */
  busy?: boolean
  /** A line under the count, for what happens next. */
  note?: string
  onClose: () => void
  onSubmit: (text: string) => void
}

/**
 * A full-screen writing popup with the text box at the top, so the keyboard
 * never covers what you're typing. Used for the bio, rating a night and host
 * updates. X closes it, the action on the right keeps it.
 */
export function TextEditorModal({ visible, title, initial = '', placeholder, min = 1, max, actionLabel = 'Done', busy, note, onClose, onSubmit }: Props) {
  const insets = useSafeAreaInsets()
  const [draft, setDraft] = useState(initial)
  // Each time it opens, start from what's saved.
  useEffect(() => { if (visible) Promise.resolve().then(() => setDraft(initial)) }, [visible, initial])
  const left = max - draft.length
  const ready = draft.trim().length >= min && !busy

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose} statusBarTranslucent>
      <View style={[s.modal, { paddingTop: insets.top + 8 }]}>
        <View style={s.bar}>
          <Pressable style={s.close} onPress={onClose} hitSlop={8} accessibilityLabel="Close">
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
          <Text style={s.barTitle}>{title}</Text>
          <View style={s.actionSlot}>
            {busy ? <ActivityIndicator color={Colors.inkPrimary} /> : (
              <Pressable onPress={() => onSubmit(draft.trim())} hitSlop={8} disabled={!ready} accessibilityRole="button">
                <Text style={[s.action, !ready && s.actionOff]}>{actionLabel}</Text>
              </Pressable>
            )}
          </View>
        </View>
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TextInput
            value={draft}
            onChangeText={t => setDraft(t.slice(0, max))}
            placeholder={placeholder}
            placeholderTextColor={withOpacity(Colors.inkPrimary, 0.25)}
            multiline
            autoFocus
            textAlignVertical="top"
            style={s.input}
          />
          <Text style={[s.count, left < 15 && s.countLow]}>
            {min > 1 && draft.trim().length < min ? `At least ${min} characters` : `${left} left`}
          </Text>
          {note ? <Text style={s.note}>{note}</Text> : null}
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  modal: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, gap: 12 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  actionSlot: { minWidth: 38, alignItems: 'flex-end' },
  action: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  actionOff: { color: Colors.inkDisabled },
  input: { fontFamily: FontFamily.headingBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: Colors.inkPrimary, paddingHorizontal: 24, paddingTop: 20, minHeight: 160, maxHeight: 360 },
  count: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled, paddingHorizontal: 24, marginTop: 8 },
  countLow: { color: Colors.inkPrimary },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, paddingHorizontal: 24, marginTop: 6 },
})
