import { useRef, useEffect, type ReactNode } from 'react'
import { Text, Pressable, StyleSheet, View } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from './PrimaryButton'
import { OutlineButton } from './OutlineButton'

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
          <OutlineButton
            label={confirmLabel}
            destructive
            onPress={() => { onConfirm(); onClose() }}
            style={s.btn}
          />
        ) : (
          <PrimaryButton
            label={confirmLabel}
            onPress={() => { hSuccess(); onConfirm(); onClose() }}
            style={s.btn}
          />
        )}
        <Pressable style={s.cancelBtn} onPress={() => { hTap(); onClose() }}>
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
  bg: { backgroundColor: Colors.surface },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8, gap: 12 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, textAlign: 'center' },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 20 },
  btn: { height: 52, borderRadius: 999, marginTop: 4 },
  cancelBtn: { height: 48, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
  icon: { alignSelf: 'center', marginBottom: 2 },
})
