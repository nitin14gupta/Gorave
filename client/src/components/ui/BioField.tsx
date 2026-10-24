import { useState } from 'react'
import { Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

const MAX = 150

interface Props {
  value: string
  onChangeText: (text: string) => void
  title?: string
  placeholder?: string
  min?: number
}

/**
 * A bio you edit in its own full-screen popup: the field shows a preview,
 * a tap opens the editor with the text box at the top, so the keyboard never
 * covers what you're typing. X closes it, Done keeps it.
 */
export function BioField({ value, onChangeText, title = 'A line about you', placeholder = 'Weekend DJ, chai over coffee, always first on the dance floor', min = 10 }: Props) {
  const insets = useSafeAreaInsets()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(value)
  const left = MAX - draft.length

  const openEditor = () => { hTap(); setDraft(value); setOpen(true) }
  const done = () => { onChangeText(draft.trim()); setOpen(false) }

  return (
    <>
      <Pressable style={s.preview} onPress={openEditor}>
        <Text style={value ? s.previewText : s.previewEmpty} numberOfLines={3}>{value || placeholder}</Text>
        {/* <Text style={s.previewHint}>{value ? 'Tap to edit' : 'Tap to write'}</Text> */}
      </Pressable>

      <Modal visible={open} animationType="slide" presentationStyle="fullScreen" onRequestClose={() => setOpen(false)} statusBarTranslucent>
        <View style={[s.modal, { paddingTop: insets.top + 8 }]}>
          <View style={s.bar}>
            <Pressable style={s.close} onPress={() => setOpen(false)} hitSlop={8}>
              <X size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
            </Pressable>
            <Text style={s.barTitle}>{title}</Text>
            <Pressable onPress={done} hitSlop={8} disabled={draft.trim().length < min}>
              <Text style={[s.done, draft.trim().length < min && { color: Colors.inkDisabled }]}>Done</Text>
            </Pressable>
          </View>
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <TextInput
              value={draft}
              onChangeText={t => setDraft(t.slice(0, MAX))}
              placeholder={placeholder}
              placeholderTextColor={withOpacity(Colors.inkPrimary, 0.25)}
              multiline
              autoFocus
              textAlignVertical="top"
              style={s.input}
            />
            <Text style={[s.count, left < 15 && { color: Colors.inkPrimary }]}>
              {draft.trim().length < min ? `At least ${min} characters` : `${left} left`}
            </Text>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  preview: { padding: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 6 },
  previewText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  previewEmpty: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkDisabled },
  previewHint: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },

  modal: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, height: 48, gap: 12 },
  close: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  barTitle: { flex: 1, fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  done: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  input: { fontFamily: FontFamily.headingBold, fontSize: 24, lineHeight: 32, letterSpacing: -0.3, color: Colors.inkPrimary, paddingHorizontal: 24, paddingTop: 20, minHeight: 160 },
  count: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled, paddingHorizontal: 24, marginTop: 8 },
})
