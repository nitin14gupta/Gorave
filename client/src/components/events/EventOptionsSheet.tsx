import React, { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { ChevronRight, Pencil, Users } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

interface CoreProps {
  onEdit: () => void
  onCancel: () => void
  onWaitlist: () => void
  onClose: () => void
  showWaitlist: boolean
}

function Row({ icon, title, sub, onPress }: { icon: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  return (
    <Pressable style={[s.row]} onPress={onPress}>
      <View style={s.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        <Text style={s.rowSub}>{sub}</Text>
      </View>
      <ChevronRight size={18} color={Colors.inkDisabled} />
    </Pressable>
  )
}

/**
 * The host's ⋯ menu on their own event, laid out like the confirm sheet:
 * a centred title, the actions as rows, then Cancel event in solid red and a
 * grey Close.
 */
function EventOptionsSheetCore({ onEdit, onCancel, onWaitlist, onClose, showWaitlist }: CoreProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const insets = useSafeAreaInsets()
  useEffect(() => { sheetRef.current?.present() }, [])

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
        <Text style={s.title}>Your event</Text>
        <Text style={s.sub}>Make changes or manage who gets in.</Text>

        <View style={s.list}>
          <Row
            icon={<Pencil size={18} color={Colors.inkPrimary} strokeWidth={1.9} />}
            title="Edit event"
            sub="Details, photos, time and place"
            onPress={() => { hTap(); onClose(); onEdit() }}
          />
          {showWaitlist ? (
            <Row
              icon={<Users size={18} color={Colors.inkPrimary} strokeWidth={1.9} />}
              title="Manage waitlist"
              sub="See who is waiting and let people in"
              onPress={() => { hTap(); onClose(); onWaitlist() }}
            />
          ) : null}
        </View>

        <Pressable
          style={[s.btn, s.danger]}
          onPress={() => { hTap(); onClose(); onCancel() }}
        >
          <Text style={s.dangerText}>Cancel event</Text>
        </Pressable>
        <Pressable style={[s.btn, s.grey]} onPress={() => { hTap(); onClose() }}>
          <Text style={s.greyText}>Close</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

interface Props extends CoreProps {
  visible: boolean
}

export function EventOptionsSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <EventOptionsSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingTop: 10, gap: 10 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 6 },

  list: { gap: 8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 14, paddingVertical: 14, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  rowTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },

  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  danger: { backgroundColor: Colors.destructive },
  dangerText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },
  grey: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  greyText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
})
