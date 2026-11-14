import { forwardRef } from 'react'
import { StyleSheet, Text, TextInput, type TextStyle } from 'react-native'
import { Colors, withOpacity } from '@/constants'

// A PAN is always 5 letters, 4 numbers, 1 letter: ABCDE1234F.
export const PAN_EXAMPLE = 'ABCDE1234F'
export const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const isDigitAt = (i: number) => i >= 5 && i <= 8

/** Keeps only what fits the PAN format, position by position (typing or pasting). */
export function toPan(raw: string): string {
  let out = ''
  for (const ch of raw.toUpperCase()) {
    if (out.length === 10) break
    if (isDigitAt(out.length) ? /[0-9]/.test(ch) : /[A-Z]/.test(ch)) out += ch
  }
  return out
}

/** What to type next, in words. Null once it's complete. */
export function panNext(len: number): string | null {
  if (len >= 10) return null
  if (len < 5) return `${5 - len} more letter${5 - len === 1 ? '' : 's'}`
  if (len < 9) return `${9 - len} more number${9 - len === 1 ? '' : 's'}`
  return 'the last letter'
}

/**
 * The real field, laid invisibly over the drawn PAN (put it inside the same
 * box), so a tap always lands on it and brings the keyboard back, even after
 * it was closed with the back gesture. The keyboard
 * switches to numbers for the middle four, and anything that doesn't fit the
 * format at that position is ignored.
 */
export const PanKeyboard = forwardRef<TextInput, { value: string; onChange: (pan: string) => void }>(function PanKeyboard({ value, onChange }, ref) {
  return (
    <TextInput
      ref={ref}
      value={value}
      onChangeText={t => onChange(toPan(t))}
      keyboardType={isDigitAt(value.length) ? 'number-pad' : 'default'}
      autoCapitalize="characters"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      maxLength={10}
      autoFocus
      caretHidden
      style={s.overlay}
      accessibilityLabel="PAN number, 5 letters, 4 numbers, 1 letter"
    />
  )
})

/**
 * The PAN as it's printed, ABCDE 1234 F: what you've typed in full, the rest
 * of the format faint, and the next character underlined.
 */
export function PanText({ value, style, ghost = 0.18 }: { value: string; style: TextStyle; ghost?: number }) {
  const chars = PAN_EXAMPLE.split('').map((ex, i) => {
    const typed = value[i]
    const next = i === value.length
    return (
      <Text key={i} style={typed ? null : [{ color: withOpacity(Colors.inkPrimary, ghost) }, next && s.next]}>
        {typed ?? ex}{i === 4 || i === 8 ? ' ' : ''}
      </Text>
    )
  })
  return <Text style={style} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{chars}</Text>
}

const s = StyleSheet.create({
  // Nearly invisible but still there to tap, like the OTP boxes.
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, color: 'transparent', fontSize: 30, opacity: 0.02 },
  next: { textDecorationLine: 'underline', color: withOpacity(Colors.inkPrimary, 0.45) },
})
