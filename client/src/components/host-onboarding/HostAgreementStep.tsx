import { useEffect } from 'react'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { useProfile } from '@/hooks/useProfile'
import { AgreementViewA, AgreementViewB } from './AgreementView'
import { LabSwitch } from '@/components/lab/LabSwitch'
import { useLabVariant } from '@/store/labStore'

interface Props {
  onSignatureChange?: (uri: string | null) => void
}

/**
 * The host agreement with its signature, used in onboarding step 4 and the
 * catch-up agreement screen. Signing happens on /(host-onboarding)/signature-sheet.
 */
export function HostAgreementStep({ onSignatureChange }: Props) {
  const signatureUri = useSignatureCaptureStore(s => s.uri)
  const { profile } = useProfile()
  const look = useLabVariant('host-agreement')

  useEffect(() => {
    onSignatureChange?.(signatureUri)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureUri])

  const openSheet = () => { hTap(); router.push('/(host-onboarding)/signature-sheet') }

  const View_ = look === 'b' ? AgreementViewB : AgreementViewA
  return (
    <>
      <View_ signatureUri={signatureUri} name={profile?.name ?? ''} onSign={openSheet} />
      <LabSwitch screen="host-agreement" top={0} />
    </>
  )
}
