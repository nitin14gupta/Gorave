import { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check, ShieldCheck, X } from 'lucide-react-native'
import { hSelection, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const REASONS = ['Spam', 'Harassment', 'Hate speech or symbols', 'Nudity or sexual content', 'Scam or fraud', 'Other']

interface Props {
  visible: boolean
  onSubmit: (reason: string) => Promise<void>
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.65} />
}

/**
 * Reporting a message: pick a reason (a tick shows on the one you chose),
 * then a solid red Report button. A short thank-you replaces the list when
 * it's sent, then the sheet closes.
 */
function ReportMessageSheetCore({ onSubmit, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const handleSubmit = async () => {
    if (!selected || loading) return
    hSuccess()
    setLoading(true)
    try {
      await onSubmit(selected)
      setDone(true)
      setTimeout(() => { setDone(false); setSelected(null); onClose() }, 1500)
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
        <View style={s.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Report message</Text>
            <Text style={s.subtitle}>They won&apos;t know it was you.</Text>
          </View>
          <Pressable style={s.close} onPress={() => { hTap(); onClose() }} hitSlop={10}>
            <X size={18} color={Colors.inkPrimary} strokeWidth={2.2} />
          </Pressable>
        </View>

        {done ? (
          <View style={s.doneBox}>
            <View style={s.doneIcon}><ShieldCheck size={30} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
            <Text style={s.doneTitle}>Thanks for telling us</Text>
            <Text style={s.doneText}>Our team will look at it.</Text>
          </View>
        ) : (
          <>
            <View style={s.options}>
              {REASONS.map((reason, i) => {
                const on = selected === reason
                return (
                  <Pressable
                    key={reason}
                    style={[s.option, i < REASONS.length - 1 && s.optionBorder, on && s.optionOn]}
                    onPress={() => { hSelection(); setSelected(reason) }}
                  >
                    <Text style={[s.optionText, on && s.optionTextOn]}>{reason}</Text>
                    <View style={[s.tick, on && s.tickOn]}>
                      {on ? <Check size={14} color={Colors.background} strokeWidth={3} /> : null}
                    </View>
                  </Pressable>
                )
              })}
            </View>
            <Pressable
              style={[s.submit, !selected && s.submitOff]}
              onPress={handleSubmit}
              disabled={!selected || loading}
            >
              {loading ? <ActivityIndicator color={Colors.white} /> : <Text style={s.submitText}>Report</Text>}
            </Pressable>
          </>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ReportMessageSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ReportMessageSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 20 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginTop: 4 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },

  options: { borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden', marginBottom: 20 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 16 },
  optionOn: { backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
  optionBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  optionText: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
  optionTextOn: { fontFamily: FontFamily.bodySemiBold },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.25), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },

  // Solid red, same as the confirm sheets' destructive button.
  submit: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.destructive },
  submitOff: { opacity: 0.4 },
  submitText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },

  doneBox: { alignItems: 'center', paddingVertical: 28, gap: 6 },
  doneIcon: { width: 64, height: 64, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), marginBottom: 6 },
  doneTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 20, letterSpacing: -0.3, color: Colors.inkPrimary },
  doneText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
})
