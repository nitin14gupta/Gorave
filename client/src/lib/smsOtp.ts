import { Platform } from 'react-native'

/**
 * Android fills in the login OTP by itself, with Google's SMS APIs (no SMS
 * permission needed). Two ways, and the server says which to use:
 *  - retriever: the SMS ends with this app's 11-character code, so the phone
 *    hands it straight to us. Nothing to tap.
 *  - consent: any SMS. Android asks "Allow Gorave to read this message?" once.
 * iPhone needs none of this: the OTP field offers the code from Messages.
 */
type OtpVerify = typeof import('@pushpendersingh/react-native-otp-verify')
export type AutofillMode = 'retriever' | 'consent'

let mod: OtpVerify | null | undefined
let appHash: string | null | undefined

/** Builds made before this package was added don't have it; they just skip autofill. */
function load(): OtpVerify | null {
  if (Platform.OS !== 'android') return null
  if (mod !== undefined) return mod
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require('@pushpendersingh/react-native-otp-verify') as OtpVerify
  } catch {
    mod = null
  }
  return mod
}

/** Right before asking for an OTP: start listening, and get the code the SMS should end with. */
export async function prepareSmsOtp(): Promise<string | null> {
  const m = load()
  if (!m) return null
  try { await m.startSmsRetriever() } catch { /* no Play services: type it in */ }
  if (appHash === undefined) {
    try { appHash = await m.getAppSignature() } catch { appHash = null }
  }
  return appHash ?? null
}

/** After the OTP is sent. The one-tap prompt only when the SMS won't carry our code, so it never asks twice. */
export function afterSmsOtpSent(mode: AutofillMode | undefined) {
  const m = load()
  if (!m || mode !== 'consent') return
  m.requestPhoneNumber().catch(() => {})
}

/** While the code boxes are on screen. Returns a cleanup. */
export function listenForSmsOtp(onCode: (code: string) => void, length = 6): () => void {
  const m = load()
  if (!m) return () => {}
  let done = false
  let sub: unknown
  try {
    sub = m.addSmsListener(msg => {
      // Each listener also hears the other kind of SMS, with nothing in it. Only a real code counts.
      if (done || msg.status !== 'success' || !msg.message) return
      const code = m.extractOtp(msg.message, length)
      if (code) {
        done = true
        onCode(code)
      }
    })
  } catch {
    return () => {}
  }
  return () => {
    done = true
    if (typeof sub === 'function') sub()
    else (sub as { remove?: () => void } | undefined)?.remove?.()
    m.removeSmsListener().catch(() => {})
  }
}
