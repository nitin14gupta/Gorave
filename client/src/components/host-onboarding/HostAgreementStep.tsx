import { useEffect } from 'react'
import { router } from 'expo-router'
import { hTap } from '@/lib/haptics'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { useProfile } from '@/hooks/useProfile'
import { AgreementView } from './AgreementView'

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

  useEffect(() => {
    onSignatureChange?.(signatureUri)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signatureUri])

  const openSheet = () => { hTap(); router.push('/(host-onboarding)/signature-sheet') }

  return <AgreementView signatureUri={signatureUri} name={profile?.name ?? ''} onSign={openSheet} />
}
