import { useCallback, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BadgeCheck } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import { PanForm } from '@/components/host-onboarding/PanForm'
import { VerifyPending, VerifyProblem } from '@/components/host-onboarding/VerifyStatus'
import ApiService, { type HostVerification } from '@/api/apiService'
import { hSuccess, hTap } from '@/lib/haptics'
import { invalidate } from '@/lib/queryCache'
import { usePillStore } from '@/store/pillStore'
import { CacheKeys, Colors, FontFamily, Spacing } from '@/constants'

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/
const EMPTY: HostVerification = { status: 'none', verified_name: null, verified_at: null, pan_masked: null, submitted_at: null, message: null, tries_left: 3, available: false }

/**
 * Every host verifies with their PAN before hosting. New hosts land here
 * before host onboarding; existing hosts are sent here from Create.
 * The PAN is checked with the Income Tax records, someone at Gorave approves
 * it, and the host gets a notification. If it fails or is rejected they see
 * why and can try again (3 rejections, then support).
 */
export default function VerifyIdScreen() {
  const insets = useSafeAreaInsets()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const showPill = usePillStore(s => s.show)
  const [state, setState] = useState<HostVerification | null>(null)
  const [pan, setPan] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)
  // After "Try again" on a failed or rejected PAN: back to the form.
  const [retrying, setRetrying] = useState(false)

  // Fresh each time they come back, e.g. from the "you're verified" notification.
  useFocusEffect(useCallback(() => {
    ApiService.getHostVerification()
      .then(s => {
        setState(s)
        if (s.status === 'verified') invalidate(CacheKeys.profile())
      })
      .catch(() => setState(prev => prev ?? EMPTY))
  }, []))

  const valid = PAN.test(pan)
  const submit = async () => {
    if (!valid || !agreed || sending) return
    hTap()
    setSending(true)
    try {
      const s = await ApiService.submitPan(pan)
      setState(s)
      setRetrying(false)
      if (s.status === 'review') {
        hSuccess()
        setPan('')
        setAgreed(false)
      }
    } catch (e: any) {
      showPill(e?.message || 'Couldn’t check that PAN. Try again.', 'error')
    } finally {
      setSending(false)
    }
  }

  const back = () => router.back()
  const status = state?.status

  if (state === null) {
    return <View style={[s.root, s.center]}><ActivityIndicator color={Colors.inkSecondary} /></View>
  }

  if (status === 'review') {
    return <VerifyPending panMasked={state.pan_masked} submittedAt={state.submitted_at} onBack={back} />
  }

  if ((status === 'failed' || status === 'rejected') && !retrying) {
    return (
      <VerifyProblem
        kind={status}
        message={state.message}
        triesLeft={state.tries_left}
        panMasked={state.pan_masked}
        onRetry={() => setRetrying(true)}
        onBack={back}
      />
    )
  }

  if (status === 'verified') {
    return (
      <View style={s.root}>
        <AppHeader title="Verify your ID" leftAction={<HeaderIconBtn onPress={back}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>} />
        <View style={[s.center, s.done]}>
          <BadgeCheck size={56} color={Colors.accentGreen} strokeWidth={1.6} />
          <Text style={s.doneTitle}>You&apos;re verified</Text>
          <Text style={s.doneBody}>Verified as {state.verified_name}. Next, set up how you get paid and create your first night.</Text>
        </View>
        <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
          <PrimaryButton label="Continue" onPress={() => { hTap(); router.replace((next || '/(events)/create') as any) }} />
        </View>
      </View>
    )
  }

  // The form: first time, or trying again.
  return (
    <View style={s.root}>
      <PanForm
        pan={pan}
        onPan={setPan}
        agreed={agreed}
        onAgree={() => setAgreed(a => !a)}
        onSubmit={submit}
        sending={sending}
        available={state.available}
        triesLeft={state.tries_left}
        lastTime={retrying ? state.message : null}
        onBack={retrying ? () => setRetrying(false) : back}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  done: { paddingHorizontal: Spacing.screenPadding, gap: 10 },
  doneTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginTop: 8, textAlign: 'center' },
  doneBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
})
