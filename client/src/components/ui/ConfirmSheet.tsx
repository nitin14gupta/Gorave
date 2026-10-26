import { useRef, useEffect, type ReactNode } from 'react'
import { Text, Pressable, StyleSheet, View } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from './PrimaryButton'

interface Props {
  visible: boolean
  title: string
  body: string
  confirmLabel: string
  destructive?: boolean
  onConfirm: () => void
  onClose: () => void
  /** Optional extra content between the body and the buttons */
  children?: ReactNode
  /** Optional icon shown above the title */
  icon?: ReactNode
  cancelLabel?: string
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

function ConfirmSheetCore({ title, body, confirmLabel, destructive, onConfirm, onClose, children, icon, cancelLabel = 'Cancel' }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

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
        {icon ? <View style={s.icon}>{icon}</View> : null}
        <Text style={s.title}>{title}</Text>
        <Text style={s.body}>{body}</Text>
        {children}
        {destructive ? (
          <Pressable
            style={[s.btn, s.danger]}
            onPress={() => { hTap(); onConfirm(); onClose() }}
          >
            <Text style={s.dangerText}>{confirmLabel}</Text>
          </Pressable>
        ) : (
          <PrimaryButton
            label={confirmLabel}
            onPress={() => { hSuccess(); onConfirm(); onClose() }}
            style={s.btn}
          />
        )}
        <Pressable style={[s.cancelBtn]} onPress={() => { hTap(); onClose() }}>
          <Text style={s.cancelText}>{cancelLabel}</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function ConfirmSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ConfirmSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10, gap: 10 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary, textAlign: 'center' },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 21, marginBottom: 6 },
  btn: { height: 54, borderRadius: 999, marginTop: 4 },
  // Solid red with white text for anything you can't easily undo.
  danger: { backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center' },
  dangerText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },
  cancelBtn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  icon: { alignSelf: 'center', marginBottom: 2 },
})
