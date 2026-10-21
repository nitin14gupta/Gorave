import { useState, useEffect } from 'react'
import { View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { DeletedAccountSheet } from '@/components/ui'
import { OtpView } from '@/components/auth/OtpView'
import { useAuth } from '@/hooks/useAuth'
import { useCountdown } from '@/hooks/useCountdown'
import { Colors } from '@/constants'

export default function OTPScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>()
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [attempts, setAttempts] = useState(0)
  const [deletedOn, setDeletedOn] = useState<string | null>(null)
  const tooManyAttempts = attempts >= 3
  const { handleVerifyOTP, handleSendOTP } = useAuth()
  const { seconds, isExpired, reset } = useCountdown(45)

  const isComplete = code.length === 6

  const handleVerify = async () => {
    if (!isComplete || tooManyAttempts) return
    setLoading(true)
    setError(false)
    setErrorMsg('')
    try {
      await handleVerifyOTP(phone, code)
    } catch (e: any) {
      const msg: string = e?.message ?? ''
      if (msg.startsWith('ACCOUNT_DELETED:')) {
        setDeletedOn(msg.replace('ACCOUNT_DELETED:', ''))
        setCode('')
        setLoading(false)
        return
      }
      const next = attempts + 1
      setAttempts(next)
      setError(true)
      if (next >= 3) {
        setErrorMsg('Too many tries. Send yourself a new code.')
      } else {
        setErrorMsg(e?.message || 'That code did not match. Try again.')
      }
      setCode('')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isComplete && !loading && !tooManyAttempts) handleVerify()
  }, [isComplete])

  const handleResend = async () => {
    try {
      await handleSendOTP(phone)
      reset()
      setAttempts(0)
      setError(false)
      setErrorMsg('')
    } catch (e: any) {
      setError(true)
      setErrorMsg(e?.message || 'Failed to resend code. Try again.')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <DeletedAccountSheet visible={deletedOn !== null} deletedOn={deletedOn ?? ''} onClose={() => setDeletedOn(null)} />
      <OtpView
        phone={phone}
        code={code}
        onCode={c => { setCode(c); if (error) { setError(false); setErrorMsg('') } }}
        error={error}
        errorMsg={errorMsg}
        loading={loading}
        seconds={seconds}
        canResend={isExpired || tooManyAttempts}
        tooMany={tooManyAttempts}
        onResend={handleResend}
        onEditNumber={() => router.back()}
        onBack={() => router.back()}
        onVerify={handleVerify}
      />
    </View>
  )
}
