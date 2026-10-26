import { forwardRef } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Camera, Images } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

interface Props {
  onCamera: () => void
  onLibrary: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

/**
 * The "+" in chat: two big tiles, take a photo or pick from your library.
 */
export const MediaPickerSheet = forwardRef<BottomSheetModal, Props>(
  ({ onCamera, onLibrary }, ref) => {
    const dismiss = () => (ref as React.RefObject<BottomSheetModal>)?.current?.dismiss()

    const pick = (handler: () => void) => {
      dismiss()
      // slight delay so sheet closes before system picker opens
      setTimeout(handler, 220)
    }

    return (
      <BottomSheetModal
        ref={ref}
        enableDynamicSizing
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetView style={s.content}>
          <Text style={s.heading}>Send a photo</Text>

          <View style={s.grid}>
            <Pressable style={[s.tile]} onPress={() => pick(onCamera)}>
              <View style={s.iconWrap}>
                <Camera size={28} color={Colors.inkPrimary} strokeWidth={1.7} />
              </View>
              <Text style={s.tileLabel}>Camera</Text>
              <Text style={s.tileSub}>Take one now</Text>
            </Pressable>

            <Pressable style={[s.tile]} onPress={() => pick(onLibrary)}>
              <View style={s.iconWrap}>
                <Images size={28} color={Colors.inkPrimary} strokeWidth={1.7} />
              </View>
              <Text style={s.tileLabel}>Library</Text>
              <Text style={s.tileSub}>Up to 12 at once</Text>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    )
  }
)

MediaPickerSheet.displayName = 'MediaPickerSheet'

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18), width: 36 },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 36 },
  heading: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    marginBottom: 18,
  },
  grid: { flexDirection: 'row', gap: 12 },
  tile: {
    flex: 1,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05),
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.divider,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 4,
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  tileLabel: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  tileSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})
