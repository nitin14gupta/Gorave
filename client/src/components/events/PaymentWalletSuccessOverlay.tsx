import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { Easing, useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { Wallet } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { TicketPaper } from '@/components/events/TicketView'
import { hSuccess } from '@/lib/haptics'

/**
 * Wallet credit used. A maroon card with the amount drops in and settles
 * once (one buzz), the line under it fades up, then `onDone` moves on.
 */
export function PaymentWalletSuccessOverlay({ amount, onDone }: { amount: number; onDone: () => void }) {
  const drop = useSharedValue(0)
  const text = useSharedValue(0)

  useEffect(() => {
    hSuccess()
    drop.value = withSpring(1, { damping: 14, stiffness: 140 })
    text.value = withDelay(300, withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }))
    const t = setTimeout(onDone, 2200)
    return () => clearTimeout(t)
  }, [])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 1.6),
    transform: [{ translateY: (1 - drop.value) * -60 }, { rotate: `${-3 * drop.value}deg` }, { scale: 0.92 + drop.value * 0.08 }],
  }))
  const textStyle = useAnimatedStyle(() => ({ opacity: text.value, transform: [{ translateY: (1 - text.value) * 10 }] }))

  return (
    <View style={s.root}>
      <Animated.View style={[s.card, cardStyle]}>
        <TicketPaper />
        <View style={s.cardTop}>
          <Wallet size={18} color={withOpacity(Colors.white, 0.8)} strokeWidth={2} />
          <Text style={s.cardKind}>GORAVE WALLET</Text>
        </View>
        <Text style={s.amount}>₹{amount}</Text>
      </Animated.View>
      <Animated.View style={[{ alignItems: 'center' }, textStyle]}>
        <Text style={s.label}>Paid from your wallet</Text>
        <Text style={s.sub}>Applied to your booking</Text>
      </Animated.View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: withOpacity(Colors.background, 0.94), alignItems: 'center', justifyContent: 'center', zIndex: 100, paddingHorizontal: 32 },
  card: { width: 240, height: 150, borderRadius: 24, overflow: 'hidden', padding: 18, justifyContent: 'space-between', marginBottom: 26 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardKind: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.7) },
  amount: { fontFamily: FontFamily.displayExtraBold, fontSize: 44, letterSpacing: -1.2, color: Colors.white },
  label: { fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, marginTop: 6 },
})
