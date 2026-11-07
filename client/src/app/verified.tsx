import { useEffect } from 'react'
import { router } from 'expo-router'

/**
 * DigiLocker sends hosts back to https://link.gorave.in/verified, which opens
 * the app here. The ID screen underneath does the checking, so just go back to it.
 */
export default function VerifiedReturn() {
  useEffect(() => {
    if (router.canGoBack()) router.back()
    else router.replace('/(host-onboarding)/verify' as any)
  }, [])
  return null
}
