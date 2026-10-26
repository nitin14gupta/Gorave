import { useState, useRef, useEffect, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Check, Flag } from 'lucide-react-native'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { BioField } from '@/components/ui/BioField'

const REASONS: { key: string; label: string }[] = [
  { key: 'fake_scam', label: 'Fake or scam' },
  { key: 'inappropriate_content', label: 'Inappropriate content' },
  { key: 'misleading_info', label: 'Misleading information' },
  { key: 'spam', label: 'Spam' },
  { key: 'dangerous_activity', label: 'Dangerous activity' },
  { key: 'other', label: 'Something else' },
]

interface Props {
  visible: boolean
  eventId: string
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

/**
 * Report an event, laid out like the confirm sheet: an icon and centred
 * title, the reasons as rows (tap one), optional details in the full-screen
 * editor, then Send report in solid red and a grey Cancel.
 */
function ReportEventSheetCore({ eventId, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  const [selected, setSelected] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const showPill = usePillStore(s => s.show)
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { sheetRef.current?.present() }, [])
  useEffect(() => () => { if (doneTimerRef.current) clearTimeout(doneTimerRef.current) }, [])

  const handleSubmit = useCallback(async () => {
    if (!selected || loading) return
    hSuccess()
    setLoading(true)
    try {
      await ApiService.reportEvent(eventId, selected, description.trim() || undefined)
      setDone(true)
      doneTimerRef.current = setTimeout(onClose, 1500)
    } catch (err: any) {
      const status = err?.status ?? err?.response?.status
      if (status === 409) {
        showPill("You've already reported this event", 'default')
        onClose()
      } else {
        showPill('Failed to send the report. Try again.', 'error')
      }
    } finally {
      setLoading(false)
    }
  }, [selected, loading, eventId, description, showPill, onClose])

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={[s.content, { paddingBottom: insets.bottom + 24 }]}>
        {done ? (
          <View style={s.doneBox}>
            <View style={s.icon}><Check size={26} color={Colors.inkPrimary} strokeWidth={2.6} /></View>
            <Text style={s.title}>Thanks for telling us</Text>
            <Text style={s.sub}>We review every report. The host never sees who sent it.</Text>
          </View>
        ) : (
          <>
            <View style={s.icon}><Flag size={24} color={Colors.destructive} strokeWidth={2} /></View>
            <Text style={s.title}>Report this event</Text>
            <Text style={s.sub}>What is wrong with it? The host never sees who reported.</Text>

            <View style={s.list}>
              {REASONS.map(reason => {
                const on = selected === reason.key
                return (
                  <Pressable
                    key={reason.key}
                    style={[s.row, on && s.rowOn]}
                    onPress={() => { hSelection(); setSelected(reason.key) }}
                  >
                    <Text style={s.rowText}>{reason.label}</Text>
                    <View style={[s.tick, on && s.tickOn]}>{on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
                  </Pressable>
                )
              })}
            </View>

            {/* Typing opens a full-screen editor, so the keyboard never covers it. */}
            {selected ? (
              <BioField
                value={description}
                onChangeText={setDescription}
                title="What happened?"
                placeholder="Add details (optional)"
                min={0}
                max={200}
              />
            ) : null}

            <Pressable
              style={[s.btn, s.danger, !selected && s.off]}
              onPress={handleSubmit}
              disabled={!selected || loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.dangerText}>Send report</Text>}
            </Pressable>
            <Pressable style={[s.btn, s.grey]} onPress={() => { hTap(); onClose() }}>
              <Text style={s.greyText}>Cancel</Text>
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ReportEventSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ReportEventSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  icon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), marginBottom: 2 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 6 },

  list: { gap: 6, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 50, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), borderWidth: 1.5, borderColor: 'transparent' },
  rowOn: { borderColor: Colors.inkPrimary },
  rowText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  tick: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.25), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },

  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  danger: { backgroundColor: Colors.destructive, marginTop: 4 },
  off: { opacity: 0.4 },
  dangerText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },
  grey: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  greyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },

  doneBox: { alignItems: 'center', paddingVertical: 16, gap: 6 },
})
