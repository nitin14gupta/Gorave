import { useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ban, Check, ChevronRight } from 'lucide-react-native'
import type { AlbumPhoto } from '@/api/apiService'
import { hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const REASONS = [
  { label: 'Not from this event', hint: 'It has nothing to do with the night' },
  { label: 'Nudity or sexual content', hint: null },
  { label: 'Posted without consent', hint: "Someone in it didn't agree to this" },
  { label: 'Harassment or bullying', hint: null },
  { label: 'Violence', hint: null },
  { label: 'Something else', hint: null },
]

export type AlbumSheetMode = 'report' | 'remove'

interface Props {
  mode: AlbumSheetMode
  photo: AlbumPhoto
  onReport: (reason: string) => Promise<void>
  onRemove: () => Promise<void>
  onBlock: () => Promise<void>
  /** Sheet dismissed with nothing done. */
  onClose: () => void
  /** Done after a report: the photo leaves the album for this person. */
  onReported: () => void
}

/**
 * Slides up inside the full-screen viewer so the photo stays open behind it.
 * (The app's usual sheets sit under a native Modal, so they can't be used here.)
 * A reason is one tap, then a thank-you with the option to block the person.
 */
export function AlbumPhotoSheet({ mode, photo, onReport, onRemove, onBlock, onClose, onReported }: Props) {
  const insets = useSafeAreaInsets()
  const [sending, setSending] = useState<string | null>(null)
  const [reported, setReported] = useState(false)
  const [blocking, setBlocking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const name = photo.uploader.name?.split(' ')[0] ?? 'this person'
  const busy = !!sending || blocking

  const run = async (key: string, action: () => Promise<void>, after?: () => void) => {
    if (busy) return
    hSelection()
    setSending(key)
    setError(null)
    try {
      await action()
      after?.()
    } catch (e: any) {
      setError(e?.message || "That didn't go through. Try again.")
    } finally {
      setSending(null)
    }
  }

  const block = async () => {
    if (busy) return
    setBlocking(true)
    setError(null)
    try {
      await onBlock()
    } catch (e: any) {
      setError(e?.message || "That didn't go through. Try again.")
      setBlocking(false)
    }
  }

  const dismiss = () => {
    if (busy) return
    if (reported) onReported()
    else onClose()
  }

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(160)} style={[StyleSheet.absoluteFill, s.backdrop]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={dismiss} accessibilityLabel="Close" />
      </Animated.View>

      <Animated.View entering={SlideInDown.duration(240)} exiting={SlideOutDown.duration(180)} style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={s.handle} />

        {mode === 'remove' ? (
          <>
            <Text style={s.title}>Remove this photo?</Text>
            <Text style={s.sub}>It&apos;s removed for everyone in the album.</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <Pressable style={[s.button, s.danger]} onPress={() => run('remove', onRemove)}>
              {sending ? <ActivityIndicator color={Colors.white} size="small" /> : <Text style={s.dangerText}>Remove</Text>}
            </Pressable>
            <Pressable style={s.button} onPress={dismiss}><Text style={s.buttonText}>Cancel</Text></Pressable>
          </>
        ) : reported ? (
          <>
            <View style={s.doneIcon}><Check size={22} color={Colors.inkPrimary} strokeWidth={2.4} /></View>
            <Text style={s.title}>Thanks for telling us</Text>
            <Text style={s.sub}>You won&apos;t see this photo again, and we&apos;ll take a look. Nobody will know it was you.</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <Pressable style={s.row} onPress={block} accessibilityRole="button">
              <Ban size={18} color={Colors.inkPrimary} strokeWidth={2} />
              <Text style={s.rowLabel}>Block {name}</Text>
              {blocking ? <ActivityIndicator color={Colors.inkPrimary} size="small" /> : null}
            </Pressable>
            <Pressable style={s.button} onPress={dismiss}><Text style={s.buttonText}>Done</Text></Pressable>
          </>
        ) : (
          <>
            <Text style={s.title}>Report this photo</Text>
            <Text style={s.sub}>What&apos;s wrong with it? Nobody will know you reported it.</Text>
            {error ? <Text style={s.error}>{error}</Text> : null}
            <View style={s.list}>
              {REASONS.map(r => (
                <Pressable
                  key={r.label}
                  style={s.row}
                  android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
                  onPress={() => run(r.label, () => onReport(r.label), () => { hSuccess(); setReported(true) })}
                  accessibilityRole="button"
                >
                  <View style={s.rowText}>
                    <Text style={s.rowLabel}>{r.label}</Text>
                    {r.hint ? <Text style={s.rowHint}>{r.hint}</Text> : null}
                  </View>
                  {sending === r.label
                    ? <ActivityIndicator color={Colors.inkPrimary} size="small" />
                    : <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />}
                </Pressable>
              ))}
            </View>
          </>
        )}
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  backdrop: { backgroundColor: 'rgba(0,0,0,0.55)' },
  sheet: {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    paddingHorizontal: 20, paddingTop: 10,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    backgroundColor: Colors.elevated,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, marginBottom: 14, backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, marginTop: 4, marginBottom: 12 },
  error: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.destructive, marginBottom: 8 },
  list: { marginHorizontal: -20 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 54, paddingHorizontal: 20, paddingVertical: 8 },
  rowText: { flex: 1, gap: 1 },
  rowLabel: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  rowHint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  doneIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.1) },
  button: { height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center', marginTop: 8, backgroundColor: withOpacity(Colors.inkPrimary, 0.1) },
  buttonText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  danger: { backgroundColor: Colors.destructive },
  dangerText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.white },
})
