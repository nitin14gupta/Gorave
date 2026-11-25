import { useState, useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import RazorpayCustomUI from 'react-native-customui'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader, OutlineButton, PrimaryButton } from '@/components/ui'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { usePaymentData } from '@/hooks/usePaymentData'
import { useInstalledUpiApps } from '@/hooks/useInstalledUpiApps'
import { useLastPaymentStore } from '@/store/lastPaymentStore'
import { UpiIdSheet } from '@/components/upi/UpiIdSheet'
import { PaymentFailedSheet } from '@/components/upi/PaymentFailedSheet'
import { PaymentWalletSuccessOverlay } from '@/components/events/PaymentWalletSuccessOverlay'
import { PaymentView } from '@/components/events/PaymentView'

export default function PaymentScreen() {
  const { id, wallet: walletParam, code } = useLocalSearchParams<{ id: string; wallet?: string; code?: string }>()
  // A promo code applied on the booking screen; every payment call carries it.
  const promoCode = code || null
  const router   = useRouter()
  const showPill = usePillStore(s => s.show)

  // walletApplied is decided on the booking screen and passed as a route param
  const walletApplied = parseInt(walletParam ?? '0', 10) || 0

  const { eventTitle, ticketPrice, platformFee, total, loading, error } = usePaymentData(id, promoCode)
  const { apps: upiApps, loading: upiAppsLoading } = useInstalledUpiApps()
  const lastPackageName = useLastPaymentStore(s => s.lastPackageName)
  const setLastPackageName = useLastPaymentStore(s => s.setLastPackageName)
  const recommendedApp =
    upiApps.find(a => a.package_name === lastPackageName) ??
    upiApps.find(a => /google ?pay|gpay/i.test(a.app_name)) ??
    upiApps[0]

  const [paying, setPaying]         = useState(false)
  const [payingMsg, setPayingMsg]   = useState('Processing…')
  const [upiSheetOpen, setUpiSheetOpen] = useState(false)
  const [rzpKey, setRzpKey]         = useState('')
  const [showWalletAnim, setShowWalletAnim] = useState(false)
  const [failedMsg, setFailedMsg]   = useState<string | null>(null)
  // Razorpay took the money but we couldn't confirm it with our server yet
  // (network dropped, timed out). Never "failed" from here: confirm again.
  const [unconfirmed, setUnconfirmed] = useState(false)

  // One payment at a time. A ref, not state: two taps in the same frame both
  // see the old `paying` state, but not the ref.
  const lock = useRef(false)
  // The Razorpay result we still have to confirm, kept for "Check again".
  const pending = useRef<RazorpayResult | null>(null)

  const amountToPay = Math.max(0, total - walletApplied)

  useEffect(() => {
    if (error) { showPill(error, 'error'); router.back() }
  }, [error])

  // Fetch public key early so UpiIdSheet can init Razorpay for VPA validation
  useEffect(() => {
    ApiService.getPaymentPublicKey()
      .then(r => setRzpKey(r.key))
      .catch(() => {})
  }, [])

  const begin = (msg: string): boolean => {
    if (lock.current) return false
    lock.current = true
    setPayingMsg(msg)
    setPaying(true)
    return true
  }
  const end = () => {
    lock.current = false
    setPaying(false)
  }

  // ── Full wallet payment ──────────────────────────────────────────────────

  const walletPay = async () => {
    setPayingMsg('Processing…')
    try {
      await ApiService.walletPay(id!, promoCode)
      hSuccess()
      if (walletApplied > 0) {
        // paying must clear here or the "processing" screen would keep
        // taking render priority over the wallet success overlay below.
        end()
        setShowWalletAnim(true)
        // Navigate happens inside PaymentWalletSuccessOverlay's onDone
      } else {
        lock.current = false
        router.replace(`/(events)/${id}/ticket` as any)
      }
    } catch (err: any) {
      showPill(reasonFrom(err, 'Payment failed. Try again.'), 'error')
      end()
    }
  }

  const doWalletPay = async () => {
    if (!id || !begin('Processing…')) return
    await walletPay()
  }

  const afterWalletAnim = () => {
    router.replace(`/(events)/${id}/ticket` as any)
  }

  // ── Confirming a payment Razorpay took ───────────────────────────────────

  const showResult = (status: string) => {
    if (status === 'refunded') {
      // Spot went to someone else between checkout and payment: the server
      // already refunded what was paid to the Gorave Wallet.
      end()
      showPill('That spot was just taken. Your payment is back in your Gorave Wallet', 'error')
      router.replace(`/(events)/${id}` as any)
      return
    }
    hSuccess()
    if (walletApplied > 0) {
      end()
      setShowWalletAnim(true)
    } else {
      lock.current = false
      router.replace(`/(events)/${id}/ticket` as any)
    }
  }

  // Confirms with our server, retrying through network drops and timeouts.
  // Safe to repeat: the server claims each order once. Returns false only if
  // it still couldn't get through; a real rejection (bad signature, unknown
  // order) throws.
  const confirm = async (data: RazorpayResult): Promise<boolean> => {
    pending.current = data
    setPayingMsg('Confirming your payment…')
    for (let attempt = 0; attempt < CONFIRM_TRIES; attempt++) {
      try {
        const res = await ApiService.verifyPayment({
          event_id: id!,
          razorpay_order_id: data.razorpay_order_id,
          razorpay_payment_id: data.razorpay_payment_id,
          razorpay_signature: data.razorpay_signature,
          wallet_amount: walletApplied,
        })
        pending.current = null
        showResult(res?.status ?? 'going')
        return true
      } catch (err: any) {
        if (err?.status && err.status < 500) throw err
        if (attempt < CONFIRM_TRIES - 1) await wait(1500 * 2 ** attempt)
      }
    }
    return false
  }

  const confirmOrHold = async (data: RazorpayResult) => {
    try {
      if (await confirm(data)) return
      // Paid, not confirmed yet. The server also catches these up on its own
      // (it checks with Razorpay), so the ticket arrives even if they leave.
      lock.current = false
      setPaying(false)
      setUnconfirmed(true)
    } catch (err: any) {
      pending.current = null
      setFailedMsg(reasonFrom(err, 'We couldn’t confirm this payment. If money left your account, it comes back automatically.'))
      end()
    }
  }

  const checkAgain = async () => {
    if (!pending.current || lock.current) return
    setUnconfirmed(false)
    lock.current = true
    setPaying(true)
    await confirmOrHold(pending.current)
  }

  // ── Fetch order helper ───────────────────────────────────────────────────

  // null = nothing to open (paid from the wallet, or stopped with a message).
  const fetchOrder = async () => {
    const order = await ApiService.createPaymentOrder(id!, walletApplied, promoCode)
    if (order.full_wallet) { await walletPay(); return null }
    if (!order.order_id || !order.razorpay_key || !order.amount) {
      setFailedMsg('Could not initialise payment. Please try again.')
      end()
      return null
    }
    // The UPI app charges what the server says; never more than we showed.
    if (order.amount !== amountToPay) {
      setFailedMsg(`The price just changed to ₹${order.amount.toLocaleString('en-IN')}. Go back to check it, then pay again.`)
      end()
      return null
    }
    return order
  }

  // Razorpay's own errors (cancelled, declined) vs ours (sold out, bad code).
  const paymentError = (err: any, fallback: string) => {
    setFailedMsg(err?.code === 0 ? 'Payment was cancelled.' : reasonFrom(err, fallback))
    end()
  }

  // ── UPI intent ───────────────────────────────────────────────────────────

  const handleUpiApp = async (packageName: string) => {
    if (!id) return
    hTap()
    if (amountToPay === 0) { await doWalletPay(); return }
    if (!begin('Opening UPI app…')) return
    let data: RazorpayResult
    try {
      const order = await fetchOrder()
      if (!order) return
      data = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String((order.amount ?? 0) * 100),
        currency: 'INR',
        name: 'Gorave',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'intent',
        upi_app_package_name: packageName,
        contact: order.contact ?? '',
        email: order.email ?? '',
      })
    } catch (err: any) {
      paymentError(err, 'Payment failed. Please try again.')
      return
    }
    setLastPackageName(packageName)
    await confirmOrHold(data)
  }

  // ── UPI collect ──────────────────────────────────────────────────────────

  const handleUpiCollect = async (vpa: string) => {
    if (!id) return
    setUpiSheetOpen(false)
    if (amountToPay === 0) { await doWalletPay(); return }
    if (!begin('Check your UPI app to approve…')) return
    let data: RazorpayResult
    try {
      const order = await fetchOrder()
      if (!order) return
      data = await RazorpayCustomUI.open({
        key_id: order.razorpay_key,
        order_id: order.order_id,
        amount: String((order.amount ?? 0) * 100),
        currency: 'INR',
        name: 'Gorave',
        description: eventTitle,
        method: 'upi',
        '_[flow]': 'collect',
        '_[vpa]': vpa,
        contact: order.contact ?? '',
        email: order.email ?? '',
      })
    } catch (err: any) {
      paymentError(err, 'UPI collect failed. Please try again.')
      return
    }
    await confirmOrHold(data)
  }

  // ── QR code ──────────────────────────────────────────────────────────────

  const handleQrPress = async () => {
    hTap()
    if (!begin('Generating QR code…')) return
    try {
      const res = await ApiService.createQrPayment(id!, walletApplied, promoCode)
      router.push({
        pathname: `/(events)/${id}/qr-payment` as any,
        params: {
          wallet: String(walletApplied),
          code: promoCode ?? '',
          qr_id: res.qr_id,
          purl: res.payment_url,
          iurl: res.image_url,
          amount: String(res.amount_inr),
          exp: res.expires_at,
          etitle: eventTitle ?? '',
        },
      })
      end()
    } catch (err: any) {
      const detail = reasonFrom(err, '')
      if (/unavailable|busy|try again/i.test(detail)) {
        showPill('Please try again in a few minutes.', 'error')
      } else {
        showPill(detail || 'Could not generate QR code. Please try again.', 'error')
      }
      end()
    }
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (showWalletAnim) {
    return <PaymentWalletSuccessOverlay amount={walletApplied} onDone={afterWalletAnim} />
  }

  if (unconfirmed) {
    return (
      <View style={[s.root, s.center, s.pad]}>
        <Text style={s.holdTitle}>Your payment went through</Text>
        <Text style={s.payingMsg}>
          {"We're still confirming your ticket. You won't be charged again. If it doesn't show here, it appears in your tickets within a few minutes."}
        </Text>
        <View style={s.holdActions}>
          <PrimaryButton label="Check again" onPress={checkAgain} />
          <OutlineButton label="Go to the event" onPress={() => router.replace(`/(events)/${id}` as any)} />
        </View>
      </View>
    )
  }

  if (paying) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
        <Text style={s.payingMsg}>{payingMsg}</Text>
      </View>
    )
  }

  // ── Main UI ───────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <PaymentView
        eventTitle={eventTitle ?? ''}
        ticketPrice={ticketPrice}
        platformFee={platformFee}
        walletApplied={walletApplied}
        amountToPay={amountToPay}
        upiApps={upiApps}
        upiAppsLoading={upiAppsLoading}
        recommendedApp={recommendedApp}
        recommendedIsLast={!!recommendedApp && recommendedApp.package_name === lastPackageName}
        onWalletPay={doWalletPay}
        onUpiApp={handleUpiApp}
        onQrPress={handleQrPress}
        onEnterUpiId={() => setUpiSheetOpen(true)}
        onBack={() => router.back()}
      />

      <UpiIdSheet
        visible={upiSheetOpen}
        rzpKey={rzpKey}
        onPay={handleUpiCollect}
        onClose={() => setUpiSheetOpen(false)}
      />

      <PaymentFailedSheet
        visible={failedMsg !== null}
        message={failedMsg ?? undefined}
        onRetry={() => setFailedMsg(null)}
        onBack={() => { setFailedMsg(null); router.back() }}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  payingMsg: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary, textAlign: 'center' },
  pad: { paddingHorizontal: 28 },
  holdTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, letterSpacing: -0.4, color: Colors.inkPrimary, textAlign: 'center' },
  holdActions: { alignSelf: 'stretch', gap: 10, marginTop: 8 },
})

const CONFIRM_TRIES = 4 // about 10 seconds of retries (1.5s, 3s, 6s between)
const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

interface RazorpayResult {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

// Our API errors carry the server's reason in `message`; Razorpay's in `description`.
function reasonFrom(err: any, fallback: string): string {
  return err?.description || err?.message || fallback
}
