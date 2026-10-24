import { useState, useCallback } from 'react'
import { useFocusEffect } from 'expo-router'
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, Spacing, SUPPORT_EMAIL } from '@/constants'
import { AppHeader, APP_HEADER_BAR_HEIGHT, HeaderIconBtn } from '@/components/ui'
import { useHeaderScroll } from '@/hooks/useHeaderScroll'
import { DeleteStepDots } from '@/components/settings/DeleteStepDots'
import { DeleteBlockedEvents } from '@/components/settings/DeleteBlockedEvents'
import { DeleteWarningStep } from '@/components/settings/DeleteWarningStep'
import { DeleteLossStep } from '@/components/settings/DeleteLossStep'
import { PhoneView } from '@/components/auth/PhoneView'
import { OtpView } from '@/components/auth/OtpView'
import { DeleteConfirmStep } from '@/components/settings/DeleteConfirmStep'
import ApiService from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { isEventPast } from '@/lib/dates'
import { useCountdown } from '@/hooks/useCountdown'

const TOTAL_STEPS = 3

export default function DeleteAccountScreen() {
  const insets   = useSafeAreaInsets()
  const { hideProgress, onScroll } = useHeaderScroll()
  const headerHeight = APP_HEADER_BAR_HEIGHT + insets.top
  const showPill = usePillStore(s => s.show)
  const clearAuth = useAuthStore(s => s.clearAuth)

  const [step, setStep]               = useState(1)
  const [otpSent, setOtpSent]         = useState(false)
  const [phoneTyped, setPhoneTyped] = useState('')
  const [phoneError, setPhoneError] = useState('')
  const [otp, setOtp]                 = useState('')
  const [otpError, setOtpError]       = useState(false)
  const [otpLoading, setOtpLoading]   = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [deleting, setDeleting]       = useState(false)
  const [typed, setTyped]             = useState('')
  const [upcomingEvents, setUpcomingEvents] = useState(0)
  const [checkingEvents, setCheckingEvents] = useState(true)
  const { seconds: resendSeconds, isExpired: canResend, reset: resetResendTimer } = useCountdown(45)

  useFocusEffect(
    useCallback(() => {
      setCheckingEvents(true)
      ApiService.getMyHostedEvents()
        .then(events => {
          // Only count events that haven't ended yet (upcoming or currently
          // in progress) — cancelled and past/ended events don't block deletion.
          const blocking = events.filter(e => !e.is_cancelled && !isEventPast(e))
          setUpcomingEvents(blocking.length)
        })
        .catch(() => {})
        .finally(() => setCheckingEvents(false))
    }, [])
  )

  const rawPhone    = useAuthStore(s => s.phone ?? '')

  const handleSendOtp = async () => {
    if (otpLoading) return
    hTap()
    setOtpLoading(true)
    try {
      await ApiService.sendOTP(rawPhone)
      setStep(4)
      setOtpSent(true)
      setOtp('')
      setOtpError(false)
      resetResendTimer()
    } catch (e: any) {
      showPill(e?.message || 'Could not send OTP. Please try again.', 'error')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (otp.length !== 6 || otpLoading) return
    hTap()
    setOtpLoading(true)
    setOtpError(false)
    try {
      await ApiService.verifyOTP(rawPhone, otp)
      hSuccess()
      setOtpVerified(true)
      setStep(5)
    } catch (e: any) {
      setOtpError(true)
      setOtp('')
      showPill(e?.message || 'Invalid OTP. Please check and try again.', 'error')
    } finally {
      setOtpLoading(false)
    }
  }

  // Step 3: confirm the number on this account (same screen as sign-in).
  const handleConfirmNumber = () => {
    if (rawPhone.replace(/\D/g, '').slice(-10) !== phoneTyped) {
      setPhoneError("That's not the number on this account")
      return
    }
    setPhoneError('')
    handleSendOtp()
  }

  const handleDelete = async () => {
    if (typed !== 'DELETE' || deleting) return
    hTap()
    setDeleting(true)
    try {
      await ApiService.deleteAccount()
      hSuccess()
      clearAuth()
      router.replace('/(auth)/phone' as any)
    } catch (e: any) {
      showPill(e?.message || `Could not delete account. Please contact ${SUPPORT_EMAIL}`, 'error')
      setDeleting(false)
    }
  }

  const backAction = (
    <HeaderIconBtn onPress={() => router.back()}>
      <ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} />
    </HeaderIconBtn>
  )

  if (checkingEvents) {
    return (
      <View style={s.root}>
        <AppHeader title="Delete Account" leftAction={backAction} />
        <View style={s.center}>
          <ActivityIndicator color={Colors.inkSecondary} />
        </View>
      </View>
    )
  }

  if (upcomingEvents > 0) {
    return (
      <View style={s.root}>
        <AppHeader title="Delete Account" leftAction={backAction} />
        <DeleteBlockedEvents
          upcomingEvents={upcomingEvents}
          onGoToEvents={() => router.push('/(settings)/my-events' as any)}
          onBack={() => router.back()}
        />
      </View>
    )
  }

  if (step === 3) {
    return (
      <PhoneView
        phone={phoneTyped}
        onPhone={v => { setPhoneTyped(v); setPhoneError('') }}
        error={phoneError}
        loading={otpLoading}
        onContinue={handleConfirmNumber}
        onBack={() => setStep(2)}
        onTerms={() => {}}
        onPrivacy={() => {}}
        supportEmail={SUPPORT_EMAIL}
        title={'Confirm your' + String.fromCharCode(10) + 'number'}
        sub="Type the number on this account. We'll text you a code to make sure it's you."
        ctaLabel="Send code"
        hideLegal
      />
    )
  }

  if (step === 4) {
    return (
      <OtpView
        phone={rawPhone.replace(/\D/g, '').slice(-10)}
        code={otp}
        onCode={v => { setOtp(v); setOtpError(false) }}
        error={otpError}
        errorMsg={otpError ? 'That code is not right' : ''}
        loading={otpLoading}
        seconds={resendSeconds}
        canResend={canResend}
        tooMany={false}
        onResend={handleSendOtp}
        onEditNumber={() => setStep(3)}
        onBack={() => setStep(3)}
        onVerify={handleVerifyOtp}
      />
    )
  }

  return (
    <View style={s.root}>
      <AppHeader title="Delete Account" hideProgress={hideProgress} leftAction={backAction} />

      <ScrollView
        contentContainerStyle={[s.content, { paddingTop: headerHeight + 20, paddingBottom: insets.bottom + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <DeleteStepDots current={step === 5 ? 3 : step} total={TOTAL_STEPS} />

        {step === 1 && (
          <DeleteWarningStep
            onContinue={() => { hTap(); setStep(2) }}
            onCancel={() => router.back()}
          />
        )}

        {step === 2 && (
          <DeleteLossStep
            onContinue={() => { hTap(); setStep(3) }}
            onCancel={() => router.back()}
          />
        )}

        {step === 5 && (
          <DeleteConfirmStep
            typed={typed}
            onTypedChange={setTyped}
            deleting={deleting}
            onDelete={handleDelete}
            onCancel={() => router.back()}
          />
        )}
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: Spacing.screenPadding, paddingTop: 20 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.screenPadding, gap: 12 },
})
