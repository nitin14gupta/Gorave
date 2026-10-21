import { useState } from 'react'
import { View, Keyboard } from 'react-native'
import { router } from 'expo-router'
import { InAppBrowserModal } from '@/components/ui'
import { PhoneView } from '@/components/auth/PhoneView'
import { useAuth } from '@/hooks/useAuth'
import { Colors, TERMS_URL, PRIVACY_URL, SUPPORT_EMAIL } from '@/constants'

export default function PhoneScreen() {
  const [phone, setPhone]           = useState('')
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const [legalUrl, setLegalUrl]     = useState<string | null>(null)
  const { handleSendOTP }           = useAuth()
  const isValid                     = phone.length === 10

  const handleContinue = async () => {
    if (!isValid) return
    Keyboard.dismiss()
    setLoading(true)
    setError('')
    try {
      await handleSendOTP(phone)
      router.push({ pathname: '/(auth)/otp', params: { phone } })
    } catch (e: any) {
      setError(e?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <PhoneView
        phone={phone}
        onPhone={setPhone}
        error={error}
        loading={loading}
        onContinue={handleContinue}
        onBack={() => router.back()}
        onTerms={() => setLegalUrl(TERMS_URL)}
        onPrivacy={() => setLegalUrl(PRIVACY_URL)}
        supportEmail={SUPPORT_EMAIL}
      />
      <InAppBrowserModal visible={legalUrl !== null} url={legalUrl} onClose={() => setLegalUrl(null)} />
    </View>
  )
}
