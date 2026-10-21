export interface PhoneViewProps {
  phone: string
  onPhone: (digits: string) => void
  error: string
  loading: boolean
  onContinue: () => void
  onBack: () => void
  onTerms: () => void
  onPrivacy: () => void
  supportEmail: string
}

export interface OtpViewProps {
  phone: string
  code: string
  onCode: (c: string) => void
  error: boolean
  errorMsg: string
  loading: boolean
  seconds: number
  canResend: boolean
  tooMany: boolean
  onResend: () => void
  onEditNumber: () => void
  onBack: () => void
  onVerify: () => void
}

/** "98765 43210" */
export const groupPhone = (d: string) => (d.length > 5 ? `${d.slice(0, 5)} ${d.slice(5)}` : d)
