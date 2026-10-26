import { useEffect } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import Animated, { Easing, useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { Check } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { TicketPaper } from '@/components/events/TicketView'
import { hSuccess } from '@/lib/haptics'

/**
 * Payment went through. A maroon ticket, the same paper as your real one,
 * drops in and settles once with a single buzz, then the check pops on it.
 */
export function PaymentStatusOverlay({
  title = 'Payment Confirmed!',
  subtitle = 'Taking you to your ticket…',
}: {
  title?: string
  subtitle?: string
}) {
  const drop = useSharedValue(0)
  const check = useSharedValue(0)

  useEffect(() => {
    hSuccess()
    drop.value = withSpring(1, { damping: 14, stiffness: 140 })
    check.value = withDelay(320, withTiming(1, { duration: 320, easing: Easing.out(Easing.back(2.4)) }))
  }, [drop, check])

  const ticketStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, drop.value * 1.6),
    transform: [{ translateY: (1 - drop.value) * -60 }, { rotate: `${-3 * drop.value}deg` }, { scale: 0.92 + drop.value * 0.08 }],
  }))
  const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: check.value }] }))

  return (
    <View style={s.root}>
      <Animated.View style={[s.ticket, ticketStyle]}>
        <TicketPaper />
        <Animated.View style={[s.check, checkStyle]}>
          <Check size={34} color={Colors.background} strokeWidth={3} />
        </Animated.View>
        <Text style={s.ticketLabel}>YOU&apos;RE IN</Text>
      </Animated.View>
      <Text style={s.label}>{title}</Text>
      <Text style={s.sub}>{subtitle}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', gap: 10, zIndex: 50, paddingHorizontal: 32 },
  ticket: { width: 220, height: 150, borderRadius: 24, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 22 },
  check: { width: 64, height: 64, borderRadius: 32, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  ticketLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 2, color: withOpacity(Colors.white, 0.7) },
  label: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, letterSpacing: -0.8, color: Colors.inkPrimary, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})
