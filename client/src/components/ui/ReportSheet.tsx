import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, Flag, ShieldCheck } from 'lucide-react-native'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BioField } from './BioField'

const REASONS = ['Fake profile', 'Inappropriate photos', 'Harassment', 'Spam', 'Underage', 'Other']
const MAX_DETAILS = 300

interface Props {
  visible: boolean
  targetName: string | null
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

/**
 * Report someone. Pick a reason (a tick shows which), optionally add what
 * happened in the full-screen editor so the keyboard never covers it, then a
 * solid red Report. A short thank-you replaces it once it's sent.
 */
function ReportSheetCore({ targetName, onSubmit, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [details, setDetails] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const first = (targetName ?? 'this person').split(' ')[0]

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleSubmit = async () => {
    if (!selected || loading) return
    hSuccess()
    setLoading(true)
    try {
      // Details ride along on the same reason string the API already takes.
      await onSubmit(details.trim() ? `${selected}: ${details.trim()}` : selected)
      setDone(true)
      setTimeout(() => { setDone(false); setSelected(null); setDetails(''); onClose() }, 1500)
    } catch {}
    finally { setLoading(false) }
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handleIndicator}
    >
      <BottomSheetView style={s.content}>
        {done ? (
          <View style={s.doneBox}>
            <View style={s.doneIcon}><ShieldCheck size={30} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
            <Text style={s.title}>Thanks for telling us</Text>
            <Text style={s.sub}>We review every report. {first} won&apos;t know it was you.</Text>
          </View>
        ) : (
          <>
            <View style={s.icon}><Flag size={24} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
            <Text style={s.title}>Report {first}</Text>
            <Text style={s.sub}>What&apos;s going on? {first} won&apos;t know you reported them.</Text>

            <View style={s.card}>
              {REASONS.map((reason, i) => {
                const on = selected === reason
                return (
                  <Pressable
                    key={reason}
                    style={[s.row, i > 0 && s.rowBorder]}
                    onPress={() => { hSelection(); setSelected(reason) }}
                  >
                    <Text style={[s.rowText, on && s.rowTextOn]}>{reason}</Text>
                    <View style={[s.tick, on && s.tickOn]}>{on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}</View>
                  </Pressable>
                )
              })}
            </View>

            {selected ? (
              <BioField
                value={details}
                onChangeText={setDetails}
                title="What happened?"
                placeholder="Add details (optional). Anything that helps us look into it."
                min={0}
                max={MAX_DETAILS}
              />
            ) : null}

            <Pressable
              style={[s.btn, s.danger, !selected && s.disabled]}
              onPress={handleSubmit}
              disabled={!selected || loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.dangerText}>Report</Text>}
            </Pressable>
            <Pressable style={[s.btn, s.cancel]} onPress={() => { hTap(); onClose() }}>
              <Text style={s.cancelText}>Cancel</Text>
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ReportSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ReportSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10, gap: 10 },
  icon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 6 },

  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 15 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  rowTextOn: { fontFamily: FontFamily.bodySemiBold },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.25), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },

  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  danger: { backgroundColor: Colors.destructive, marginTop: 6 },
  dangerText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },
  disabled: { opacity: 0.4 },
  cancel: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },

  doneBox: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  doneIcon: { width: 64, height: 64, borderRadius: 22, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
})
