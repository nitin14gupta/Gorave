import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
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
 * three steps show what happens next, and withdrawing is one tap away,
 * behind a confirm that says whether you'll get another chance.
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

  // The screen fades in once; nothing pops or moves after that.
  const fade = useSharedValue(0)
  useEffect(() => {
    fade.value = withTiming(1, { duration: 350, easing: Easing.out(Easing.cubic) })
  }, [fade])
  const fadeStyle = useAnimatedStyle(() => ({ opacity: fade.value }))

  const left = event?.my_requests_left ?? null
  const max = event?.max_join_requests ?? 2

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
    <Animated.View style={[s.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 20 }, fadeStyle]}>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <View style={s.badgeShadow}>
          <View style={[s.badge, { backgroundColor: Colors.inkPrimary }]}>
            <Send size={40} color={Colors.background} strokeWidth={2} />
          </View>
        </View>

        <View style={{ alignItems: 'center', width: '100%' }}>
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
        </View>
      </View>

      <PrimaryButton label="Back to the event" onPress={() => router.back()} />
      <Pressable style={s.withdraw} onPress={() => setConfirm(true)} disabled={busy}>
        <Text style={s.withdrawText}>Changed your mind? <Text style={s.withdrawLink}>Withdraw request</Text></Text>
      </Pressable>

      <ConfirmSheet
        visible={confirm}
        icon={<LogOut size={28} color={Colors.destructive} strokeWidth={2} />}
        title="Withdraw your request?"
        body={left === 0 ? 'Your place in the host’s queue goes, and you won’t be able to request this event again.' : 'Your place in the host’s queue goes. You get one more chance to request this event after this.'}
        confirmLabel="Withdraw"
        cancelLabel="Keep my request"
        destructive
        onConfirm={withdraw}
        onClose={() => setConfirm(false)}
      >
        {left != null ? <View style={s.sheetTries}><RequestTries left={left} max={max} note={left === 0 ? 'This was your last chance, so you won’t be able to request again.' : 'You’ll get one more chance to request after this.'} /></View> : null}
      </ConfirmSheet>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 20 },
  badgeShadow: { borderRadius: 30 },
  badge: { width: 96, height: 96, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary, letterSpacing: -0.8, marginTop: 30 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center', lineHeight: 22, marginTop: 10, paddingHorizontal: 6 },
  card: { alignSelf: 'stretch', marginTop: 28, padding: 18, borderRadius: 22, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  step: { flexDirection: 'row', gap: 12 },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  dotDone: { backgroundColor: Colors.inkPrimary },
  line: { width: 2, flex: 1, minHeight: 18, backgroundColor: Colors.surfaceMuted, marginTop: 4 },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  withdraw: { alignItems: 'center', paddingVertical: 14 },
  withdrawText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  withdrawLink: { color: Colors.inkPrimary, textDecorationLine: 'underline' },
  sheetTries: { padding: 14, borderRadius: 16, backgroundColor: withOpacity(Colors.inkPrimary, 0.05) },
})
