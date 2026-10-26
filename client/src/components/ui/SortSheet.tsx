import { useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Check } from 'lucide-react-native'
import { hSelection } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.8

export interface SortOption<T extends string = string> {
  key: T
  label: string
}

interface Props<T extends string> {
  visible: boolean
  title?: string
  options: SortOption<T>[]
  selected: T
  onSelect: (key: T) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

/** Pick one option: a big title, then rows with a filled tick on the one in use. */
function SortSheetCore<T extends string>({ title = 'Sort by', options, selected, onSelect, onClose }: Omit<Props<T>, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <Text style={s.title}>{title}</Text>
      <BottomSheetView style={s.content}>
        <View style={s.card}>
          {options.map((opt, i) => {
            const on = selected === opt.key
            return (
              <Pressable
                key={opt.key}
                style={[s.row, i > 0 && s.rowBorder]}
                android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
                onPress={() => { hSelection(); onSelect(opt.key); sheetRef.current?.dismiss() }}
              >
                <Text style={[s.rowText, on && s.rowTextActive]} numberOfLines={1}>{opt.label}</Text>
                <View style={[s.tick, on && s.tickOn]}>
                  {on ? <Check size={13} color={Colors.background} strokeWidth={3} /> : null}
                </View>
              </Pressable>
            )
          })}
        </View>
        <View style={{ height: 32 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function SortSheet<T extends string>(props: Props<T>) {
  if (!props.visible) return null
  return <SortSheetCore {...props} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
  },
  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 17,
    gap: 12,
  },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowText: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkSecondary },
  rowTextActive: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  tick: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: withOpacity(Colors.inkPrimary, 0.25), alignItems: 'center', justifyContent: 'center' },
  tickOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
})
