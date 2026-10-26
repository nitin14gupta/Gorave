import { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withSequence, withDelay } from 'react-native-reanimated'
import { XCircle, AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { PrimaryButton } from '@/components/ui'


function renderBackdrop(props: BottomSheetBackdropProps) {
  return (
    <BottomSheetBackdrop
      {...props}
      disappearsOnIndex={-1}
      appearsOnIndex={0}
      pressBehavior="none"
      opacity={0.75}
    />
  )
}

interface Props {
  visible: boolean
  message?: string
  onRetry: () => void
  onBack: () => void
}

function PaymentFailedCore({ message, onRetry, onBack }: Omit<Props, 'visible'>) {
  const ref    = useRef<BottomSheetModal>(null)
  const scale  = useSharedValue(0)
  const shake  = useSharedValue(0)

  const isCancelled = message === 'Payment was cancelled.'

  useEffect(() => {
    ref.current?.present()
    scale.value = withSpring(1, { damping: 10, stiffness: 180 })
    if (!isCancelled) {
      shake.value = withDelay(
        300,
        withSequence(
          withTiming(-8, { duration: 60 }),
          withTiming(8,  { duration: 60 }),
          withTiming(-6, { duration: 50 }),
          withTiming(6,  { duration: 50 }),
          withTiming(0,  { duration: 40 }),
        ),
      )
    }
  }, [])

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: shake.value }],
  }))

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose={false}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <Animated.View style={[s.iconWrap, iconStyle]}>
          {isCancelled
            ? <AlertCircle size={34} color={Colors.inkPrimary} strokeWidth={1.8} />
            : <XCircle size={34} color={Colors.destructive} strokeWidth={1.8} />
          }
        </Animated.View>

        <Text style={s.title}>{isCancelled ? 'Payment cancelled' : 'Payment didn\'t go through'}</Text>
        <Text style={s.message}>
          {isCancelled
            ? 'You came back without completing the payment. Want to try again?'
            : (message ?? 'Something went wrong on the way. If no money left your account, nothing was charged.')
          }
        </Text>

        <View style={s.actions}>
          <PrimaryButton
            label="Try again"
            onPress={() => { hTap(); onRetry() }}
            icon={<RefreshCw size={16} color={Colors.background} strokeWidth={2} />}
          />
          <Pressable style={[s.secondary]} onPress={() => { hTap(); onBack() }}>
            <ArrowLeft size={16} color={Colors.inkPrimary} strokeWidth={2} />
            <Text style={s.secondaryText}>Go back</Text>
          </Pressable>
        </View>

        {!isCancelled && (
          <Text style={s.note}>
            If money did leave your account, it comes back to the same place in 5 to 7 business days.
          </Text>
        )}
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function PaymentFailedSheet({ visible, message, onRetry, onBack }: Props) {
  if (!visible) return null
  return <PaymentFailedCore message={message} onRetry={onRetry} onBack={onBack} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.sheetBackground, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.1) },
  content: { paddingHorizontal: 24, paddingBottom: 40, paddingTop: 10, alignItems: 'center' },

  iconWrap: { width: 72, height: 72, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), marginBottom: 16 },

  title: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 26,
    letterSpacing: -0.6,
    color: Colors.inkPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },

  actions: { width: '100%', gap: 10 },
  secondary: { height: 54, borderRadius: 27, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  secondaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },

  note: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    textAlign: 'center',
    marginTop: 18,
    lineHeight: 17,
  },
})
