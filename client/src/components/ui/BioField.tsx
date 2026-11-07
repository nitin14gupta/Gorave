import { useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { Colors, FontFamily } from '@/constants'
import { hTap } from '@/lib/haptics'
import { TextEditorModal } from './TextEditorModal'

const MAX = 150

interface Props {
  value: string
  onChangeText: (text: string) => void
  title?: string
  placeholder?: string
  min?: number
  /** Character limit. */
  max?: number
}

/** A bio you edit in its own full-screen popup: the field shows a preview, a tap opens the editor. */
export function BioField({ value, onChangeText, title = 'A line about you', placeholder = 'Weekend DJ, chai over coffee, always first on the dance floor', min = 10, max = MAX }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Pressable style={s.preview} onPress={() => { hTap(); setOpen(true) }}>
        <Text style={value ? s.previewText : s.previewEmpty} numberOfLines={3}>{value || placeholder}</Text>
      </Pressable>
      <TextEditorModal
        visible={open}
        title={title}
        initial={value}
        placeholder={placeholder}
        min={min}
        max={max}
        onClose={() => setOpen(false)}
        onSubmit={text => { onChangeText(text); setOpen(false) }}
      />
    </>
  )
}

const s = StyleSheet.create({
  preview: { padding: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 6 },
  previewText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  previewEmpty: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkDisabled },
})
