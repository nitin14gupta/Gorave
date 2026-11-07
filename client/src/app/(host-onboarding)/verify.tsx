import { useCallback, useEffect, useRef, useState } from 'react'
import { ActivityIndicator, AppState, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BadgeCheck, EyeOff, KeyRound, ShieldCheck } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import ApiService, { type HostVerification } from '@/api/apiService'
import { hSuccess, hTap } from '@/lib/haptics'
import { invalidate } from '@/lib/queryCache'
import { usePillStore } from '@/store/pillStore'
import { CacheKeys, Colors, FontFamily, Spacing, withOpacity } from '@/constants'

// While someone is in DigiLocker, ask a few times once they're back.
const CHECK_TRIES = 6
const CHECK_GAP_MS = 2000

const STEPS = [
  { Icon: KeyRound, title: 'Sign in to DigiLocker', body: 'With the OTP sent to your Aadhaar-linked number. It’s the government’s own app.' },
  { Icon: ShieldCheck, title: 'Share your Aadhaar with Gorave', body: 'DigiLocker asks you to agree first. You can say no.' },
  { Icon: EyeOff, title: 'We keep very little', body: 'Your name, birth year and the last 4 digits. Never your address or full number.' },
]

/**
 * Every host verifies a government ID before hosting. New hosts land here
 * before step 1 of onboarding; existing hosts get sent here from Create.
 */
export default function VerifyIdScreen() {
  const insets = useSafeAreaInsets()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const showPill = usePillStore(s => s.show)
  const [state, setState] = useState<HostVerification | null>(null)
  const [opening, setOpening] = useState(false)
  const [checking, setChecking] = useState(false)
  const waiting = useRef(false)

  const goOn = useCallback(() => {
    hTap()
    router.replace((next || '/(events)/create') as any)
  }, [next])

  useEffect(() => {
    ApiService.getHostVerification().then(setState).catch(() => setState(null))
  }, [])

  /** Back from DigiLocker: ask the server a few times, it may take a moment. */
  const check = useCallback(async () => {
    if (!waiting.current) return
    setChecking(true)
    try {
      for (let i = 0; i < CHECK_TRIES; i++) {
        const s = await ApiService.checkHostVerification()
        if (s.status !== 'pending') {
          waiting.current = false
          setState(s)
          if (s.status === 'verified') {
            hSuccess()
            invalidate(CacheKeys.profile())
          }
          return
        }
        await new Promise(r => setTimeout(r, CHECK_GAP_MS))
      }
      setState(prev => (prev ? { ...prev, status: 'pending' } : prev))
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t reach DigiLocker. Try again.', 'error')
    } finally {
      setChecking(false)
    }
  }, [showPill])

  // Android returns from the browser without closing it, so watch for the app coming back.
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => { if (s === 'active') check() })
    return () => sub.remove()
  }, [check])

  const start = async () => {
    if (opening) return
    hTap()
    setOpening(true)
    try {
      const url = await ApiService.startHostVerification()
      waiting.current = true
      setState(prev => (prev ? { ...prev, status: 'pending', message: null } : prev))
      await WebBrowser.openBrowserAsync(url, { presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET })
      check()
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t open DigiLocker. Try again.', 'error')
    } finally {
      setOpening(false)
    }
  }

  const status = state?.status ?? 'none'
  const verified = status === 'verified'
  const note =
    status === 'failed' ? state?.message
      : status === 'denied' ? 'You didn’t share your Aadhaar, so we couldn’t verify you.'
        : status === 'expired' ? 'The DigiLocker link ran out before you finished. Start again.'
          : status === 'pending' && !checking && !opening ? 'Didn’t finish in DigiLocker? Start again.'
            : null

  return (
    <View style={s.root}>
      <AppHeader
        title="Verify your ID"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {state === null ? (
        <View style={s.center}><ActivityIndicator color={Colors.inkSecondary} /></View>
      ) : verified ? (
        <View style={[s.center, s.done]}>
          <BadgeCheck size={56} color={Colors.inkPrimary} strokeWidth={1.6} />
          <Text style={s.doneTitle}>You&apos;re verified</Text>
          <Text style={s.doneBody}>Verified as {state.verified_name}. Guests see that every host on Gorave has a checked ID.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={s.content}>
          <Text style={s.title}>Every host shows a real ID</Text>
          <Text style={s.lead}>It keeps nights safe for guests, and it takes about a minute with DigiLocker.</Text>
          <View style={s.steps}>
            {STEPS.map(({ Icon, title, body }) => (
              <View key={title} style={s.step}>
                <View style={s.stepIcon}><Icon size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
                <View style={s.stepText}>
                  <Text style={s.stepTitle}>{title}</Text>
                  <Text style={s.stepBody}>{body}</Text>
                </View>
              </View>
            ))}
          </View>
          {!state.available ? <Text style={s.note}>ID checks aren&apos;t switched on yet. Try again soon.</Text> : null}
          {note ? <Text style={s.note}>{note}</Text> : null}
        </ScrollView>
      )}

      {state !== null ? (
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          {verified ? (
            <PrimaryButton label="Continue" onPress={goOn} />
          ) : checking ? (
            <View style={s.checking}>
              <ActivityIndicator color={Colors.inkSecondary} />
              <Text style={s.checkingText}>Checking with DigiLocker</Text>
            </View>
          ) : (
            <PrimaryButton
              label={status === 'none' ? 'Verify with DigiLocker' : 'Try again'}
              onPress={start}
              loading={opening}
              disabled={!state.available}
            />
          )}
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12, paddingBottom: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.3, color: Colors.inkPrimary },
  lead: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8 },
  steps: { marginTop: 28, gap: 20 },
  step: { flexDirection: 'row', gap: 14 },
  stepIcon: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  stepText: { flex: 1, gap: 3, paddingTop: 1 },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary },
  note: { fontFamily: FontFamily.bodyMedium, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary, marginTop: 24 },
  done: { paddingHorizontal: Spacing.screenPadding, gap: 10 },
  doneTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginTop: 8 },
  doneBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
  checking: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  checkingText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkSecondary },
})
