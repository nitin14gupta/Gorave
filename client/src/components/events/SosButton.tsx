import { useState } from 'react'
import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { router } from 'expo-router'
import { Siren } from 'lucide-react-native'
import { ConfirmSheet } from '@/components/ui/ConfirmSheet'
import { SafetyMenuRow } from '@/components/safety/SafetyMenuRow'
import { useSos } from '@/hooks/useSos'
import { SosHoldSheet } from './SosHoldSheet'
import { useHasEmergencyContacts } from '@/hooks/useEmergencyContacts'
import { useLocationStore } from '@/store/locationStore'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

export function useSosFlow(eventId: string) {
  const { sendSos } = useSos(eventId)
  const hasEmergencyContacts = useHasEmergencyContacts()
  const [sosOpen, setSosOpen] = useState(false)
  const [setupOpen, setSetupOpen] = useState(false)

  const open = () => {
    hTap()
    if (hasEmergencyContacts) {
      useLocationStore.getState()._start()
      setSosOpen(true)
    } else {
      setSetupOpen(true)
    }
  }

  const sheets = (
    <>
      {/* Hold to send, not a Yes tap: an SOS should never go out by accident. */}
      <SosHoldSheet visible={sosOpen} onSend={sendSos} onClose={() => setSosOpen(false)} />
      <ConfirmSheet
        visible={setupOpen}
        title="Add an emergency contact first"
        body="SOS alerts your emergency contacts with your location — add at least one before you can send it."
        confirmLabel="Add Contact"
        onConfirm={() => router.push('/(safety)/contacts' as any)}
        onClose={() => setSetupOpen(false)}
      />
    </>
  )

  return { open, sheets }
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

// Compact icon-only trigger — a thumb-corner badge on list/card rows.
export function SosButton({ eventId, size = 13, style }: { eventId: string; size?: number; style?: StyleProp<ViewStyle> }) {
  const { open, sheets } = useSosFlow(eventId)
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  return (
    <>
      <AnimatedPressable
        style={[s.badge, style, pressStyle]}
        onPress={open}
        hitSlop={6}
        onPressIn={() => { pressScale.set(withSpring(0.9, { duration: 120 })) }}
        onPressOut={() => { pressScale.set(withSpring(1, { duration: 120 })) }}
      >
        <Siren size={size} color={Colors.destructive} strokeWidth={2.4} />
      </AnimatedPressable>
      {sheets}
    </>
  )
}

// Full icon + title + subtitle + chevron row — the event detail Safety
// section's SOS entry.
export function SosRow({ eventId }: { eventId: string }) {
  const { open, sheets } = useSosFlow(eventId)
  return (
    <>
      <SafetyMenuRow
        icon={<Siren size={20} color={Colors.destructive} strokeWidth={1.6} />}
        title="Emergency SOS"
        subtitle="Get help quickly"
        onPress={open}
        showSeparator={false}
      />
      {sheets}
    </>
  )
}

// Labelled pill for the Happening Now card and the Safety centre.
export function SosPill({ eventId, style }: { eventId: string; style?: StyleProp<ViewStyle> }) {
  const { open, sheets } = useSosFlow(eventId)
  return (
    <>
      <Pressable style={[s.pill, style]} onPress={open} hitSlop={6}>
        <Siren size={15} color={Colors.white} strokeWidth={2.4} />
        <Text style={s.pillText}>SOS</Text>
      </Pressable>
      {sheets}
    </>
  )
}

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: Colors.destructive },
  pillText: { fontFamily: FontFamily.headingBold, fontSize: 14, letterSpacing: 0.4, color: Colors.white },
  badge: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
})
