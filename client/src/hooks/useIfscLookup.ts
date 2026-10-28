import { useEffect, useState } from 'react'

const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/

export interface BankInfo {
  bank: string
  branch: string
}

// The bank + branch are fully determined by the IFSC code — no need to make
// a host type them in. Razorpay's public IFSC lookup is free, unauthenticated.
export function useIfscLookup(ifscCode: string) {
  // The last answer, and which code it was for: a different code is loading.
  const [result, setResult] = useState<{ code: string; bankInfo: BankInfo | null; error: boolean } | null>(null)

  const validFormat = IFSC_REGEX.test(ifscCode)
  const current = validFormat && result?.code === ifscCode ? result : null
  const loading = validFormat && !current
  const bankInfo = current?.bankInfo ?? null
  const error = !!current?.error

  useEffect(() => {
    if (!validFormat) return

    let cancelled = false
    fetch(`https://ifsc.razorpay.com/${ifscCode}`)
      .then(res => { if (!res.ok) throw new Error('not found'); return res.json() })
      .then(data => { if (!cancelled) setResult({ code: ifscCode, bankInfo: { bank: data.BANK, branch: data.BRANCH }, error: false }) })
      .catch(() => { if (!cancelled) setResult({ code: ifscCode, bankInfo: null, error: true }) })

    return () => { cancelled = true }
  }, [ifscCode, validFormat])

  return { validFormat, loading, bankInfo, error }
}
