import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BlurView } from 'expo-blur'
import { useRouter } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { Check, Copy, Lock, Navigation } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { StaticEventMap } from '@/components/maps'
import { hSuccess, hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import type { EventDetail } from '@/api/apiService'

interface Props {
  event: EventDetail
  eventId: string
  /** Opens the existing "open in maps" sheet */
  onPressAddress: () => void
}

/**
 * Where. Before you're in: a blurred map with the approximate area, the
 * area name, and the path to unlocking the exact address (it lights up as
 * your request moves). Once you're in: the map with a pin, the full
 * address, and Directions / Copy.
 */
export function EventAddressCard({ event, eventId, onPressAddress }: Props) {
  const router = useRouter()
  const showPill = usePillStore(s => s.show)
  const hasMap = event.location_lat != null && event.location_lng != null
  const masked = !!event.is_location_masked
  const area = [event.area, event.city].filter(Boolean).join(', ') || event.location_name || 'Location'
  const status = event.my_rsvp_status
  const stage = status === 'requested' ? 1 : 0
  const free = event.join_mode === 'request'
  const steps = free ? ['Request', 'Host says yes', 'Address unlocks'] : ['Book', 'Address unlocks']
  const fullLine = [event.address_line1, event.address_line2].filter(Boolean).join(', ')

  const map = hasMap ? (
    <Pressable style={s.map} onPress={() => { hTap(); router.push(`/(events)/${eventId}/map` as any) }}>
      <StaticEventMap lat={event.location_lat!} lng={event.location_lng!} eventType={event.event_type} hideMarker={masked} />
      {masked && (
        <>
          <BlurView intensity={18} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View pointerEvents="none" style={s.circleWrap}><View style={s.circle} /></View>
          <View pointerEvents="none" style={s.lockChip}>
            <Lock size={12} color={Colors.inkPrimary} strokeWidth={2.4} />
            <Text style={s.lockChipText}>Exact spot hidden</Text>
          </View>
        </>
      )}
    </Pressable>
  ) : null

  if (masked) {
    return (
      <View style={s.card}>
        {map}
        <View style={s.body}>
          <Text style={s.title}>{area}</Text>
          <Text style={s.sub}>Somewhere in this circle, about 1 km wide</Text>
          <View style={s.steps}>
            {steps.map((st, i) => {
              const on = i <= stage
              return (
                <React.Fragment key={st}>
                  <View style={[s.step, on && s.stepOn]}>
                    {i < stage && <Check size={11} color={Colors.inkPrimary} strokeWidth={3} />}
                    <Text style={[s.stepText, on && s.stepTextOn]}>{st}</Text>
                  </View>
                  {i < steps.length - 1 && <Text style={s.arrow}>→</Text>}
                </React.Fragment>
              )
            })}
          </View>
        </View>
      </View>
    )
  }

  return (
    <View style={s.card}>
      {map}
      <View style={s.body}>
        <View style={s.unlockRow}>
          <View style={s.unlocked}>
            <Check size={11} color={Colors.accentGreen} strokeWidth={3} />
            <Text style={s.unlockedText}>Unlocked</Text>
          </View>
          <Text style={s.privateNote}>Only the host and guests see this</Text>
        </View>
        <Text style={s.title}>{fullLine || event.location_name || area}</Text>
        <Text style={s.sub}>{[event.area, event.city, event.pincode].filter(Boolean).join(' · ')}</Text>
        <View style={s.actions}>
          <Pressable style={s.actionPrimary} onPress={() => { hTap(); onPressAddress() }}>
            <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.actionGradient}>
              <Navigation size={15} color={Colors.white} strokeWidth={2.2} />
              <Text style={s.actionPrimaryText}>Directions</Text>
            </LinearGradient>
          </Pressable>
          <Pressable
            style={s.actionGhost}
            onPress={() => {
              hSuccess()
              Clipboard.setStringAsync(event.location_name ?? fullLine)
              showPill('Address copied', 'default')
            }}
          >
            <Copy size={15} color={Colors.inkPrimary} strokeWidth={2.2} />
            <Text style={s.actionGhostText}>Copy</Text>
          </Pressable>
        </View>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.divider, padding: 10, marginBottom: 16 },
  map: { height: 150, borderRadius: 14, overflow: 'hidden' },
  circleWrap: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  circle: { width: 104, height: 104, borderRadius: 52, backgroundColor: withOpacity(Colors.mapRadarBlue, 0.18), borderWidth: 2, borderColor: withOpacity(Colors.mapRadarBlue, 0.6) },
  lockChip: { position: 'absolute', left: 10, bottom: 10, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999, backgroundColor: withOpacity(Colors.background, 0.85) },
  lockChipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
  body: { paddingHorizontal: 6, paddingTop: 12, paddingBottom: 6 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 19, color: Colors.inkPrimary, letterSpacing: -0.3 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },
  steps: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginTop: 12 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, backgroundColor: Colors.elevated },
  stepOn: { backgroundColor: withOpacity(Colors.inkPrimary, 0.12) },
  stepText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkSecondary },
  stepTextOn: { color: Colors.inkPrimary },
  arrow: { color: Colors.inkDisabled, fontSize: 12 },
  unlockRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  unlocked: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: withOpacity(Colors.accentGreen, 0.15) },
  unlockedText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.accentGreen },
  privateNote: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  actions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  actionPrimary: { flex: 1, height: 44, borderRadius: 999, overflow: 'hidden' },
  actionGradient: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  actionPrimaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.white },
  actionGhost: { flex: 1, height: 44, borderRadius: 999, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: Colors.elevated },
  actionGhostText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
