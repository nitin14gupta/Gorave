import { useCallback, useState } from 'react'
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BadgeCheck, Check, Clock, EyeOff, ShieldCheck } from 'lucide-react-native'
import { AppHeader, HeaderIconBtn, PrimaryButton } from '@/components/ui'
import ApiService, { type HostVerification } from '@/api/apiService'
import { hSuccess, hTap } from '@/lib/haptics'
import { invalidate } from '@/lib/queryCache'
import { usePillStore } from '@/store/pillStore'
import { CacheKeys, Colors, FontFamily, Spacing, withOpacity } from '@/constants'

const PAN = /^[A-Z]{5}[0-9]{4}[A-Z]$/

/**
 * Every host verifies with their PAN before hosting. New hosts land here
 * before host onboarding; existing hosts are sent here from Create.
 * The PAN is checked with the Income Tax records, then a person at Gorave
 * approves it and the host gets a notification.
 */
export default function VerifyIdScreen() {
  const insets = useSafeAreaInsets()
  const { next } = useLocalSearchParams<{ next?: string }>()
  const showPill = usePillStore(s => s.show)
  const [state, setState] = useState<HostVerification | null>(null)
  const [pan, setPan] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [sending, setSending] = useState(false)

  // Fresh each time they come back, e.g. from the "you're verified" notification.
  useFocusEffect(useCallback(() => {
    ApiService.getHostVerification()
      .then(s => {
        setState(s)
        if (s.status === 'verified') invalidate(CacheKeys.profile())
      })
      .catch(() => setState(prev => prev ?? { status: 'none', verified_name: null, verified_at: null, pan_masked: null, submitted_at: null, message: null, available: false }))
  }, []))

  const valid = PAN.test(pan)
  const submit = async () => {
    if (!valid || !agreed || sending) return
    hTap()
    setSending(true)
    try {
      const s = await ApiService.submitPan(pan)
      setState(s)
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

  const goOn = () => {
    hTap()
    router.replace((next || '/(events)/create') as any)
  }

  const status = state?.status

  return (
    <View style={s.root}>
      <AppHeader
        title="Verify your ID"
        leftAction={<HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
      />

      {state === null ? (
        <View style={s.center}><ActivityIndicator color={Colors.inkSecondary} /></View>
      ) : status === 'verified' ? (
        <>
          <View style={[s.center, s.done]}>
            <BadgeCheck size={56} color={Colors.inkPrimary} strokeWidth={1.6} />
            <Text style={s.doneTitle}>You&apos;re verified</Text>
            <Text style={s.doneBody}>Verified as {state.verified_name}. Next, set up how you get paid and create your first night.</Text>
          </View>
          <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
            <PrimaryButton label="Continue" onPress={goOn} />
          </View>
        </>
      ) : status === 'review' ? (
        <>
          <View style={[s.center, s.done]}>
            <Clock size={52} color={Colors.inkPrimary} strokeWidth={1.6} />
            <Text style={s.doneTitle}>We&apos;re checking your PAN</Text>
            <Text style={s.doneBody}>
              {state.pan_masked ? `${state.pan_masked} is with our team. ` : ''}It usually takes less than a day. We&apos;ll send you a notification the moment it&apos;s done.
            </Text>
          </View>
          <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
            <PrimaryButton label="Back to Gorave" onPress={() => { hTap(); router.back() }} />
          </View>
        </>
      ) : (
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
            <Text style={s.title}>Every host shows a real ID</Text>
            <Text style={s.lead}>Enter your PAN. We check it with the Income Tax records, someone at Gorave reviews it, and you&apos;re ready to host.</Text>

            {state.message ? (
              <View style={s.note}>
                <Text style={s.noteTitle}>{status === 'rejected' ? 'We couldn’t approve it' : 'That didn’t work'}</Text>
                <Text style={s.noteBody}>{state.message}</Text>
              </View>
            ) : null}

            <Text style={s.label}>PAN</Text>
            <TextInput
              value={pan}
              onChangeText={t => setPan(t.replace(/[^a-z0-9]/gi, '').toUpperCase().slice(0, 10))}
              placeholder="ABCDE1234F"
              placeholderTextColor={withOpacity(Colors.inkPrimary, 0.25)}
              autoCapitalize="characters"
              autoCorrect={false}
              autoComplete="off"
              maxLength={10}
              style={s.input}
              accessibilityLabel="PAN number"
            />
            <Text style={[s.hint, pan.length === 10 && !valid && s.hintBad]}>
              {pan.length === 10 && !valid ? 'A PAN is 5 letters, 4 numbers, then 1 letter' : 'The 10 characters on your PAN card'}
            </Text>

            <Pressable style={s.consent} onPress={() => { hTap(); setAgreed(a => !a) }} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
              <View style={[s.box, agreed && s.boxOn]}>{agreed ? <Check size={14} color={Colors.background} strokeWidth={3} /> : null}</View>
              <Text style={s.consentText}>I agree to Gorave checking my PAN with the Income Tax Department&apos;s records to verify who I am.</Text>
            </Pressable>

            <View style={s.points}>
              <View style={s.point}>
                <ShieldCheck size={17} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.pointText}>Your name, date of birth and gender are matched with your profile.</Text>
              </View>
              <View style={s.point}>
                <EyeOff size={17} color={Colors.inkSecondary} strokeWidth={1.8} />
                <Text style={s.pointText}>We keep the last 4 characters of your PAN, never the full number or your address. Guests never see any of it.</Text>
              </View>
            </View>

            {!state.available ? <Text style={s.unavailable}>ID checks aren&apos;t switched on yet. Try again soon.</Text> : null}
          </ScrollView>
          <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
            <PrimaryButton label="Submit for review" onPress={submit} loading={sending} disabled={!valid || !agreed || !state.available} />
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12, paddingBottom: 24 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 26, lineHeight: 32, letterSpacing: -0.3, color: Colors.inkPrimary },
  lead: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 8 },
  note: { marginTop: 20, padding: 14, borderRadius: 16, backgroundColor: withOpacity(Colors.destructive, 0.08), gap: 3 },
  noteTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.destructive },
  noteBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary, marginTop: 28, marginBottom: 8 },
  input: {
    height: 60, borderRadius: 16, paddingHorizontal: 18, backgroundColor: Colors.surface, color: Colors.inkPrimary,
    fontFamily: FontFamily.headingBold, fontSize: 24, letterSpacing: 3,
  },
  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 8 },
  hintBad: { color: Colors.destructive },
  consent: { flexDirection: 'row', gap: 12, marginTop: 24, alignItems: 'flex-start' },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 1.5, borderColor: withOpacity(Colors.inkPrimary, 0.35), alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  boxOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  consentText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  points: { marginTop: 24, gap: 14 },
  point: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  pointText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary },
  unavailable: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary, marginTop: 20 },
  done: { paddingHorizontal: Spacing.screenPadding, gap: 10 },
  doneTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, color: Colors.inkPrimary, marginTop: 8, textAlign: 'center' },
  doneBody: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, textAlign: 'center' },
  footer: { paddingHorizontal: Spacing.screenPadding, paddingTop: 12 },
})
