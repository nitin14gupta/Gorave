import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Check, LogOut, Send } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton, ConfirmSheet } from '@/components/ui'
import { RequestTries } from '@/components/events/RequestTries'
import { hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import ApiService, { type EventDetail } from '@/api/apiService'

const STEPS = [
  { title: 'Requested', sub: 'Just now' },
  { title: 'Host decides', sub: 'They see your profile first' },
  { title: 'You’re in', sub: 'Address and QR ticket unlock' },
]

/**
 * After "Request to join": a proper moment instead of a toast. The sent
 * badge lands, the three steps show what happens next, and withdrawing is
 * one tap away, behind a confirm that says how many requests are left.
 */
export default function RequestSentScreen() {
  const { id, title } = useLocalSearchParams<{ id: string; title?: string }>()
  const insets = useSafeAreaInsets()
  const router = useRouter()
  const showPill = usePillStore(s => s.show)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const [confirm, setConfirm] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    hSuccess()
    if (id) ApiService.getEvent(id).then(setEvent).catch(() => {})
  }, [id])

  // Entrance: badge drops in and settles, copy rises after it.
  const badge = useSharedValue(0)
  const copy = useSharedValue(0)
  useEffect(() => {
    badge.value = withSpring(1, { damping: 11, stiffness: 140 })
    copy.value = withDelay(220, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [badge, copy])
  const badgeStyle = useAnimatedStyle(() => ({ transform: [{ scale: 0.4 + badge.value * 0.6 }, { rotate: `${-8 * badge.value}deg` }], opacity: badge.value }))
  const copyStyle = useAnimatedStyle(() => ({ opacity: copy.value, transform: [{ translateY: (1 - copy.value) * 16 }] }))

  const left = event?.my_requests_left ?? null
  const max = event?.max_join_requests ?? 3

  const withdraw = async () => {
    if (!id || busy) return
    setBusy(true)
    try {
      await ApiService.withdrawJoinRequest(id)
      showPill('Request withdrawn', 'default')
      router.back()
    } catch (e: any) {
      showPill(e?.message || "Couldn't withdraw your request", 'error')
    } finally {
      setBusy(false)
    }
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }]}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Animated.View style={[s.badgeShadow, badgeStyle]}>
          <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.badge}>
            <Send size={46} color={Colors.white} strokeWidth={2} />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[{ alignItems: 'center', width: '100%' }, copyStyle]}>
          <Text style={s.title}>Request sent.</Text>
          <Text style={s.body}>
            {title ? `The host of ${title} sees your profile and decides.` : 'The host sees your profile and decides.'} We’ll tell you the moment they do.
          </Text>

          <View style={s.card}>
            {STEPS.map((st, i) => {
              const done = i === 0
              return (
                <View key={st.title} style={s.step}>
                  <View style={{ alignItems: 'center' }}>
                    <View style={[s.dot, done && s.dotDone]}>{done && <Check size={12} color={Colors.inkOnAccent} strokeWidth={3} />}</View>
                    {i < STEPS.length - 1 && <View style={s.line} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: i < STEPS.length - 1 ? 14 : 0 }}>
                    <Text style={s.stepTitle}>{st.title}</Text>
                    <Text style={s.stepSub}>{st.sub}</Text>
                  </View>
                </View>
              )
            })}
          </View>
          {left != null && <View style={{ marginTop: 14, alignSelf: 'stretch', paddingHorizontal: 4 }}><RequestTries left={left} max={max} /></View>}
        </Animated.View>
      </View>

      <PrimaryButton label="Back to the event" onPress={() => router.back()} />
      <Pressable style={s.withdraw} onPress={() => setConfirm(true)} disabled={busy}>
        <Text style={s.withdrawText}>Changed your mind? <Text style={s.withdrawLink}>Withdraw request</Text></Text>
      </Pressable>

      <ConfirmSheet
        visible={confirm}
        icon={<LogOut size={28} color={Colors.destructive} strokeWidth={2} />}
        title="Withdraw your request?"
        body={`Your place in the host’s queue goes. You can request this event again, but each event allows ${max} requests in total.`}
        confirmLabel="Withdraw"
        cancelLabel="Keep my request"
        destructive
        onConfirm={withdraw}
        onClose={() => setConfirm(false)}
      >
        {left != null ? <View style={s.sheetTries}><RequestTries left={left} max={max} note={left === 0 ? 'This was your last request, so you won’t be able to request again.' : `After withdrawing you can still send ${left} more.`} /></View> : null}
      </ConfirmSheet>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  badgeShadow: { shadowColor: Colors.brandOrange, shadowOpacity: 0.5, shadowRadius: 30, shadowOffset: { width: 0, height: 16 }, elevation: 12, borderRadius: 36 },
  badge: { width: 120, height: 120, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary, letterSpacing: -0.8, marginTop: 30 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 22, marginTop: 10, paddingHorizontal: 6 },
  card: { alignSelf: 'stretch', marginTop: 28, padding: 18, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  step: { flexDirection: 'row', gap: 12 },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.brandOrange },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: Colors.surfaceMuted, marginTop: 4 },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  withdraw: { alignItems: 'center', paddingVertical: 14 },
  withdrawText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  withdrawLink: { color: Colors.inkPrimary, textDecorationLine: 'underline' },
  sheetTries: { padding: 14, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
})
