import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import Animated, { Easing, cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { Siren } from 'lucide-react-native'
import { hHeavy, hSelection } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

// How long SOS has to be held. Long enough that a pocket tap or a slip never
// alerts anyone; tune here if it feels too slow in testing.
export const SOS_HOLD_SECONDS = 5

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.8

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.6} />
}

/**
 * SOS, confirmed by holding instead of tapping "Yes": press and hold the
 * button, it fills over SOS_HOLD_SECONDS with a countdown and a tick each
 * second, and sends when full. Letting go early resets it.
 */
function SosHoldSheetCore({ onSend, onClose }: { onSend: () => void; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  const progress = useSharedValue(0)
  const [left, setLeft] = useState<number | null>(null)
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null)
  const sent = useRef(false)

  useEffect(() => { ref.current?.present() }, [])
  useEffect(() => () => { if (ticker.current) clearInterval(ticker.current) }, [])

  const stopTicker = () => {
    if (ticker.current) clearInterval(ticker.current)
    ticker.current = null
  }

  const fire = () => {
    if (sent.current) return
    sent.current = true
    stopTicker()
    hHeavy()
    onSend()
    ref.current?.dismiss()
  }

  const start = () => {
    if (sent.current) return
    hSelection()
    setLeft(SOS_HOLD_SECONDS)
    stopTicker()
    ticker.current = setInterval(() => {
      setLeft(l => {
        const next = (l ?? SOS_HOLD_SECONDS) - 1
        if (next > 0) hSelection()
        return next
      })
    }, 1000)
    progress.set(withTiming(1, { duration: SOS_HOLD_SECONDS * 1000, easing: Easing.linear }, finished => {
      if (finished) runOnJS(fire)()
    }))
  }

  const release = () => {
    if (sent.current) return
    stopTicker()
    setLeft(null)
    cancelAnimation(progress)
    progress.set(withTiming(0, { duration: 220 }))
  }

  const fillStyle = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }))
  const holding = left !== null

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose={!holding}
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <View style={s.iconWrap}><Siren size={26} color={Colors.destructive} strokeWidth={2.2} /></View>
        <Text style={s.title}>Need help?</Text>
        <Text style={s.body}>
          We&apos;ll text your emergency contacts once, with a map link to where you are right now and the name of this event.
        </Text>

        <Pressable onPressIn={start} onPressOut={release} style={s.hold}>
          <Animated.View style={[s.fill, fillStyle]} />
          <Siren size={20} color={Colors.white} strokeWidth={2.4} />
          <Text style={s.holdText}>
            {holding ? (left && left > 0 ? `Sending in ${left}…` : 'Sending…') : 'Hold to send SOS'}
          </Text>
        </Pressable>
        <Text style={s.hint}>Hold for {SOS_HOLD_SECONDS} seconds. Let go to stop.</Text>

        <Pressable style={s.cancel} onPress={() => ref.current?.dismiss()} hitSlop={6} disabled={holding}>
          <Text style={[s.cancelText, holding && { opacity: 0.4 }]}>Cancel</Text>
        </Pressable>
        <View style={{ height: 24 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function SosHoldSheet({ visible, ...rest }: { visible: boolean; onSend: () => void; onClose: () => void }) {
  if (!visible) return null
  return <SosHoldSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingTop: 8, alignItems: 'center' },
  iconWrap: {
    width: 60, height: 60, borderRadius: 30, marginBottom: 14,
    backgroundColor: withOpacity(Colors.destructive, 0.12), alignItems: 'center', justifyContent: 'center',
  },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary },
  body: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14.5, lineHeight: 21, color: Colors.inkSecondary,
    textAlign: 'center', marginTop: 8, marginBottom: 24,
  },
  hold: {
    width: '100%', height: 64, borderRadius: 32, overflow: 'hidden',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: withOpacity(Colors.destructive, 0.55),
  },
  // The part that's filled so far, solid red, growing left to right.
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, backgroundColor: Colors.destructive },
  holdText: { fontFamily: FontFamily.headingBold, fontSize: 17, letterSpacing: 0.3, color: Colors.white },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkDisabled, marginTop: 10 },
  cancel: { paddingVertical: 14, marginTop: 6 },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})
