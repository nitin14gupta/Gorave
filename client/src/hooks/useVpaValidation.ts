import { useEffect, useRef, useState } from 'react'
import RazorpayCustomUI from 'react-native-customui'

export interface VpaResult {
  name: string
  vpa: string
}

const VPA_FORMAT_REGEX = /^[\w.\-]+@[\w]+$/

export function useVpaValidation(vpa: string, rzpKey: string) {
  // The last check, and which UPI ID it was for: typing anything else clears it.
  const [check, setCheck] = useState<{ vpa: string; result: VpaResult | null; error: boolean } | null>(null)
  const [checking, setChecking] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initializedRef = useRef(false)

  const validFormat = VPA_FORMAT_REGEX.test(vpa.trim())
  const current = validFormat && check?.vpa === vpa.trim() ? check : null
  const vpaResult = current?.result ?? null
  const vpaError = !!current?.error

  useEffect(() => {
    if (rzpKey && !initializedRef.current) {
      RazorpayCustomUI.initRazorpay(rzpKey)
      initializedRef.current = true
    }
  }, [rzpKey])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!validFormat) return
    const trimmed = vpa.trim()
    debounceRef.current = setTimeout(async () => {
      setChecking(true)
      try {
        const res: any = await RazorpayCustomUI.isValidVpa(trimmed)
        if (res?.customer_name || res?.name) {
          setCheck({ vpa: trimmed, result: { name: res.customer_name ?? res.name, vpa: trimmed }, error: false })
        } else {
          setCheck({ vpa: trimmed, result: null, error: true })
        }
      } catch {
        setCheck({ vpa: trimmed, result: null, error: true })
      } finally {
        setChecking(false)
      }
    }, 600)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [vpa, validFormat])

  return { validFormat, checking, vpaResult, vpaError }
}
