import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { CalendarClock, Mail, Undo2 } from 'lucide-react-native'
import { Colors, FontFamily, SUPPORT_EMAIL, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

interface Props {
  visible: boolean
  deletedOn: string   // e.g. "13 Jun 2025"
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

/**
 * Signing in to an account that's scheduled for deletion. A big title, when
 * it was requested and what happens next as two short lines, then Email
 * support to get it back, or OK.
 */
function DeletedAccountSheetCore({ deletedOn, onClose }: Omit<Props, 'visible'>) {
  const ref = useRef<BottomSheetModal>(null)

  useEffect(() => { ref.current?.present() }, [])

  const handleContact = () => {
    hTap()
    const subject = encodeURIComponent('[Gorave] Account Recovery Request')
    const body = encodeURIComponent(
      `Hi,\n\nI requested account deletion on ${deletedOn} and would like to recover my account.\n\nRegistered phone: `,
    )
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`)
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={false}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <View style={s.icon}><CalendarClock size={26} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
        <Text style={s.title}>This account is being deleted</Text>

        <View style={s.card}>
          <View style={s.point}>
            <View style={s.pointIcon}><CalendarClock size={17} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
            <Text style={s.pointText}>You asked to delete it on <Text style={s.bold}>{deletedOn}</Text>. It&apos;s removed for good within 30 days.</Text>
          </View>
          <View style={[s.point, s.pointBorder]}>
            <View style={s.pointIcon}><Undo2 size={17} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
            <Text style={s.pointText}>Changed your mind? Write to us within 30 days and we&apos;ll bring everything back.</Text>
          </View>
        </View>

        <Pressable style={[s.btn, s.primary]} onPress={handleContact}>
          <Mail size={17} color={Colors.background} strokeWidth={2} />
          <Text style={s.primaryText}>Email support to recover</Text>
        </Pressable>
        <Pressable style={[s.btn, s.cancel]} onPress={() => { hTap(); onClose() }}>
          <Text style={s.cancelText}>OK, got it</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function DeletedAccountSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <DeletedAccountSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10, gap: 10 },
  icon: { alignSelf: 'center', width: 60, height: 60, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, lineHeight: 30, letterSpacing: -0.6, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 6 },

  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, marginBottom: 6 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  pointBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  pointIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  pointText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  bold: { fontFamily: FontFamily.bodySemiBold },

  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  primary: { backgroundColor: Colors.inkPrimary },
  primaryText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.background },
  cancel: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
})
