import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Ban, MessageSquareOff, BellOff, EyeOff, UserCheck } from 'lucide-react-native'
import { hError, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

interface Props {
  visible: boolean
  targetName: string | null
  isBlocked: boolean
  loading?: boolean
  onBlock: () => void
  onUnblock: () => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

/**
 * Block or unblock someone. A big title, what blocking does as three short
 * lines, then a solid red Block (or a plain Unblock) and a grey Cancel.
 */
function BlockSheetCore({ targetName, isBlocked, loading, onBlock, onUnblock, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const name = targetName ?? 'this person'
  const first = name.split(' ')[0]

  useEffect(() => { sheetRef.current?.present() }, [])

  const points = isBlocked
    ? [{ Icon: UserCheck, text: `${first} can see your profile and message you again.` }]
    : [
        { Icon: MessageSquareOff, text: `${first} can't message you or send you a vibe.` },
        { Icon: EyeOff, text: `${first} won't see your profile or be able to join your events.` },
        { Icon: BellOff, text: "We won't tell them you blocked them." },
      ]

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
        <View style={s.icon}>
          {isBlocked ? <UserCheck size={26} color={Colors.inkPrimary} strokeWidth={1.8} /> : <Ban size={26} color={Colors.destructive} strokeWidth={1.8} />}
        </View>
        <Text style={s.title}>{isBlocked ? `Unblock ${first}?` : `Block ${first}?`}</Text>

        <View style={s.card}>
          {points.map(({ Icon, text }, i) => (
            <View key={text} style={[s.point, i > 0 && s.pointBorder]}>
              <View style={s.pointIcon}><Icon size={17} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
              <Text style={s.pointText}>{text}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={[s.btn, isBlocked ? s.neutral : s.danger]}
          onPress={() => { if (isBlocked) { hTap(); onUnblock() } else { hError(); onBlock() } }}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color={isBlocked ? Colors.background : Colors.white} />
            : <Text style={isBlocked ? s.neutralText : s.dangerText}>{isBlocked ? 'Unblock' : 'Block'}</Text>}
        </Pressable>

        <Pressable style={[s.btn, s.cancel]} onPress={() => { hTap(); onClose() }}>
          <Text style={s.cancelText}>Cancel</Text>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function BlockSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <BlockSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 10, gap: 10 },
  icon: { alignSelf: 'center', width: 60, height: 60, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary, textAlign: 'center', marginBottom: 6 },

  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, marginBottom: 6 },
  point: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13 },
  pointBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  pointIcon: { width: 34, height: 34, borderRadius: 17, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  pointText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },

  btn: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  danger: { backgroundColor: Colors.destructive },
  dangerText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.white },
  neutral: { backgroundColor: Colors.inkPrimary },
  neutralText: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.background },
  cancel: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
})
