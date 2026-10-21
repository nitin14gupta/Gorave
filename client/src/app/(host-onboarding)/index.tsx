import { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Platform, Keyboard } from 'react-native'
import { router } from 'expo-router'
import { hTap, hSuccess } from '@/lib/haptics'
import { Screen, BrandedLoader } from '@/components/ui'
import { CacheKeys, Colors, FontFamily, Spacing } from '@/constants'
import {
  HostAgreementStep,
  PayoutStep,
  DuplicatePayoutSheet,
} from '@/components/host-onboarding'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { setCached } from '@/lib/queryCache'
import { useVpaValidation } from '@/hooks/useVpaValidation'
import { useIfscLookup } from '@/hooks/useIfscLookup'
import { HostWizardView } from '@/components/host-onboarding/HostWizardView'

const TOTAL_STEPS = 5
const AGREEMENT_STEP = 4
const FINISHING_DELAY_MS = 900
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/

const STEP_CTA = ['Get started', 'Continue', 'Continue', 'Sign and continue', 'Save and finish']

export default function HostOnboardingScreen() {
  const showPill = usePillStore(s => s.show)
  const [step, setStep] = useState(1)

  // Payout step state lives here — this is the last step, and its submit
  // action drives the whole flow's completion, so the orchestrator owns it
  // rather than the (presentational-only) PayoutStep component.
  const [activeTab, setActiveTab] = useState<'UPI' | 'Bank Account'>('Bank Account')
  const [upiId, setUpiId] = useState('')
  const [rzpKey, setRzpKey] = useState('')
  const [holderName, setHolderName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('')
  const [ifscCode, setIfscCode] = useState('')
  const [saving, setSaving] = useState(false)
  const [finishing, setFinishing] = useState(false)
  const [keyboardVisible, setKeyboardVisible] = useState(false)
  const [duplicateError, setDuplicateError] = useState<string | null>(null)

  // Host Agreement step state — same reasoning as payout above: its submit
  // action (upload the already-captured signature → accept) drives
  // advancing past this step, so the orchestrator owns it rather than the
  // presentational step. The signature itself is captured inside the
  // signature-sheet route at "Confirm Signature" time, not here.
  const [signatureUri, setSignatureUri] = useState<string | null>(null)
  const [agreementSaving, setAgreementSaving] = useState(false)
  const setStoredSignatureUri = useSignatureCaptureStore(s => s.setUri)

  // Reset the captured-signature store on entry so a signature left over
  // from a previous, abandoned visit to this flow doesn't show as already
  // signed.
  useEffect(() => {
    setStoredSignatureUri(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const showSub = Keyboard.addListener(showEvt, () => setKeyboardVisible(true))
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardVisible(false))
    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [])

  const { validFormat, checking, vpaResult, vpaError } = useVpaValidation(upiId, rzpKey)
  const { loading: bankLookupLoading, bankInfo, error: ifscError } = useIfscLookup(ifscCode)

  const accountNumberMismatch = confirmAccountNumber.length > 0 && accountNumber !== confirmAccountNumber
  const canSubmitUpi = validFormat && vpaResult !== null && !vpaError
  const canSubmitBank =
    holderName.trim().length >= 2 &&
    ACCOUNT_NUMBER_REGEX.test(accountNumber) &&
    accountNumber === confirmAccountNumber &&
    bankInfo !== null
  const canSubmit = activeTab === 'UPI' ? canSubmitUpi : canSubmitBank

  useEffect(() => {
    ApiService.getPaymentPublicKey().then(r => setRzpKey(r.key)).catch(() => {})
  }, [])

  const handleBack = () => {
    if (step > 1) {
      hTap()
      setStep(s => s - 1)
    } else {
      router.back()
    }
  }

  const handleSubmit = async () => {
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      const updatedProfile = await ApiService.savePayoutDetails(
        activeTab === 'UPI'
          ? { payout_method: 'upi', upi_id: upiId.trim() }
          : {
              payout_method: 'bank',
              account_holder_name: holderName.trim(),
              account_number: accountNumber,
              ifsc_code: ifscCode,
              bank_name: bankInfo!.bank,
            },
      )
      setCached(CacheKeys.profile(), updatedProfile)
      hSuccess()
      setSaving(false)
      setFinishing(true)
      setTimeout(() => router.replace('/(events)/create'), FINISHING_DELAY_MS)
    } catch (err: any) {
      if (err?.status === 409) {
        setDuplicateError(err?.message ?? 'This payout account is already linked to another Gorave account.')
      } else {
        showPill(err?.message ?? 'Could not save payout details. Try again.', 'error')
      }
      setSaving(false)
    }
  }

  const handleAgreementContinue = async () => {
    if (!signatureUri || agreementSaving) return
    setAgreementSaving(true)
    try {
      const signatureUrl = await ApiService.uploadSignature(signatureUri)
      const updatedProfile = await ApiService.acceptHostAgreement(signatureUrl)
      setCached(CacheKeys.profile(), updatedProfile)
      setStoredSignatureUri(null)
      hTap()
      setStep(s => s + 1)
    } catch (err: any) {
      showPill(err?.message ?? 'Could not save your signature. Try again.', 'error')
    } finally {
      setAgreementSaving(false)
    }
  }

  const handleContinue = () => {
    if (step === AGREEMENT_STEP) {
      handleAgreementContinue()
      return
    }
    if (step < TOTAL_STEPS) {
      hTap()
      setStep(s => s + 1)
    } else {
      handleSubmit()
    }
  }

  if (finishing) {
    return (
      <Screen style={styles.finishingRoot}>
        <BrandedLoader size={48} />
        <Text style={styles.finishingTitle}>You&apos;re a host now</Text>
        <Text style={styles.finishingSub}>Taking you to create your first event…</Text>
      </Screen>
    )
  }

  const isPayoutStep = step === TOTAL_STEPS
  const isAgreementStep = step === AGREEMENT_STEP
  const continueDisabled = (isPayoutStep && !canSubmit) || (isAgreementStep && !signatureUri)

  return (
    <View style={styles.flex}>
      <HostWizardView
        step={step}
        total={TOTAL_STEPS}
        cta={STEP_CTA[step - 1]}
        ctaDisabled={continueDisabled}
        ctaLoading={isPayoutStep ? saving : isAgreementStep ? agreementSaving : false}
        onBack={handleBack}
        onContinue={handleContinue}
        keyboardVisible={keyboardVisible}
        agreement={<HostAgreementStep onSignatureChange={setSignatureUri} />}
        payout={
          <PayoutStep
            activeTab={activeTab}
            onTabChange={tab => setActiveTab(tab as 'UPI' | 'Bank Account')}
            upiId={upiId}
            onUpiIdChange={setUpiId}
            checking={checking}
            vpaResult={vpaResult}
            vpaError={vpaError}
            holderName={holderName}
            onHolderNameChange={setHolderName}
            accountNumber={accountNumber}
            onAccountNumberChange={setAccountNumber}
            confirmAccountNumber={confirmAccountNumber}
            onConfirmAccountNumberChange={setConfirmAccountNumber}
            ifscCode={ifscCode}
            onIfscCodeChange={setIfscCode}
            bankLookupLoading={bankLookupLoading}
            bankInfo={bankInfo}
            ifscError={ifscError}
            accountNumberMismatch={accountNumberMismatch}
          />
        }
      />

      <DuplicatePayoutSheet
        visible={duplicateError !== null}
        message={duplicateError ?? ''}
        onClose={() => setDuplicateError(null)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { flex: 1, justifyContent: 'center', paddingHorizontal: Spacing.screenPadding },
  scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: 32, paddingBottom: 24 },
  stepContent: { width: '100%' },
  footer: { flexDirection: 'row', gap: 12, paddingHorizontal: Spacing.screenPadding, paddingBottom: 16 },
  backBtn: { width: 96 },
  nextBtn: { flex: 1 },

  finishingRoot: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  finishingTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    color: Colors.inkPrimary,
    marginTop: 20,
  },
  finishingSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    color: Colors.inkSecondary,
  },
})
