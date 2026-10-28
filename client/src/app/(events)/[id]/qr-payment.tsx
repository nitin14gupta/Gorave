import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import { View, Text, StyleSheet, Pressable, BackHandler } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Notifications from 'expo-notifications'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import ApiService from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { hTap, hSuccess } from '@/lib/haptics'
import { useImageShare } from '@/hooks/useImageShare'
import { PrimaryButton, ConfirmSheet, BrandedLoader } from '@/components/ui'
import { QrPayView } from '@/components/events/QrPayView'
import { PaymentStatusOverlay } from '@/components/events/PaymentStatusOverlay'

type Status = 'loading' | 'active' | 'paid' | 'expired' | 'error'

export default function QrPaymentScreen() {
  const {
    id, wallet: walletParam,
    qr_id: qrIdParam, purl, iurl, amount, exp, etitle,
  } = useLocalSearchParams<{
    id: string; wallet?: string
    qr_id?: string; purl?: string; iurl?: string
    amount?: string; exp?: string; etitle?: string
  }>()
  const insets      = useSafeAreaInsets()
  const router      = useRouter()
  const showPill    = usePillStore(s => s.show)
  const { shareImage } = useImageShare()
  const walletApplied = parseInt(walletParam ?? '0', 10) || 0

  // Pre-loaded from the payment screen: start with that QR, no API call.
  const [status, setStatus]         = useState<Status>(qrIdParam ? 'active' : 'loading')
  const [qrId, setQrId]             = useState(qrIdParam ?? '')
  const [imageUrl, setImageUrl]     = useState(qrIdParam ? iurl ?? '' : '')
  const [paymentUrl, setPaymentUrl] = useState(qrIdParam ? purl ?? '' : '')  // UPI string for QRCode svg
  const [amountInr, setAmountInr]   = useState(qrIdParam ? parseInt(amount ?? '0', 10) || 0 : 0)
  const [expiresAt, setExpiresAt]   = useState<Date | null>(() => (qrIdParam && exp ? new Date(exp) : null))
  const [timeLeft, setTimeLeft]     = useState(0)
  const [verifying, setVerifying]   = useState(false)
  const eventTitle = etitle ?? ''
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false)

  const statusRef  = useRef<Status>('loading')
  useLayoutEffect(() => { statusRef.current = status })
  const qrCardRef  = useRef<View>(null)

  // ── Load QR on mount (skip if pre-loaded from params) ─────────────────────

  const fetchQr = () => {
    ApiService.createQrPayment(id!, walletApplied)
      .then(res => {
        setQrId(res.qr_id)
        setImageUrl(res.image_url)
        setPaymentUrl(res.payment_url ?? '')
        setAmountInr(res.amount_inr)
        setExpiresAt(new Date(res.expires_at))
        setStatus('active')
      })
      .catch((err: any) => {
        const detail = err?.detail ?? err?.message ?? ''
        if (detail.toLowerCase().includes('unavailable') || detail.toLowerCase().includes('busy') || detail.toLowerCase().includes('try again')) {
          showPill('Please try again in a few minutes.', 'error')
        } else {
          showPill(detail || 'Could not generate QR. Try again.', 'error')
        }
        setStatus('error')
      })
  }
  // A fresh QR on demand (new QR, Try again).
  const loadQr = () => {
    setStatus('loading')
    fetchQr()
  }

  useEffect(() => {
    if (!qrIdParam) fetchQr()
  }, [])

  // ── Countdown ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!expiresAt || status !== 'active') return
    const tick = setInterval(() => {
      const left = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000))
      setTimeLeft(left)
      if (left === 0) {
        setStatus('expired')
        clearInterval(tick)
        // Tells the server to close the QR on Razorpay's side right away,
        // instead of waiting for the user to tap "I've Paid".
        if (qrId) ApiService.getQrStatus(qrId).catch(() => {})
      }
    }, 1000)
    return () => clearInterval(tick)
  }, [expiresAt, status])

  // ── Push notification listener ─────────────────────────────────────────────

  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener(n => {
      const d = n.request.content.data as any
      if (d?.type === 'payment_success' && d?.event_id === id) {
        setStatus('paid')
        hSuccess()
        setTimeout(() => router.replace(`/(events)/${id}/ticket` as any), 1600)
      }
    })
    return () => sub.remove()
  }, [id])

  // ── Fallback poll — covers the case where the push notification never
  // arrives (permission denied, delivery delay, backgrounded app). Runs
  // only while the QR is active and backs off so a slow network doesn't
  // spam the status endpoint or wedge the UI on repeated failures.
  useEffect(() => {
    if (status !== 'active') return
    let cancelled = false
    let delay = 8000
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      if (cancelled || !qrId) return
      try {
        const res = await ApiService.getQrStatus(qrId)
        if (cancelled) return
        if (res.status === 'paid') {
          setStatus('paid')
          hSuccess()
          setTimeout(() => router.replace(`/(events)/${id}/ticket` as any), 1600)
          return
        }
        if (res.status === 'expired') { setStatus('expired'); return }
        if (res.status === 'refunded') {
          setStatus('error')
          showPill('That spot was just taken — your payment is back in your Gorave Wallet', 'error')
          router.replace(`/(events)/${id}` as any)
          return
        }
        delay = 8000
      } catch {
        delay = Math.min(delay * 2, 30000)
      }
      if (!cancelled) timer = setTimeout(poll, delay)
    }

    timer = setTimeout(poll, delay)
    return () => { cancelled = true; clearTimeout(timer) }
  }, [status, qrId, id])

  // ── Back intercept ─────────────────────────────────────────────────────────

  const confirmBack = () => {
    const s = statusRef.current
    if (s === 'paid' || s === 'loading' || s === 'error') { router.back(); return }
    setLeaveConfirmOpen(true)
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      const s = statusRef.current
      if (s === 'paid' || s === 'loading' || s === 'error') return false
      confirmBack()
      return true
    })
    return () => sub.remove()
  }, [])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const handleManualCheck = async () => {
    if (verifying) return
    hTap()
    setVerifying(true)
    try {
      const res = await ApiService.getQrStatus(qrId)
      if (res.status === 'paid') {
        setStatus('paid'); hSuccess()
        setTimeout(() => router.replace(`/(events)/${id}/ticket` as any), 1600)
      } else if (res.status === 'expired') {
        setStatus('expired')
      } else if (res.status === 'refunded') {
        showPill('That spot was just taken — your payment is back in your Gorave Wallet', 'error')
        router.replace(`/(events)/${id}` as any)
      } else {
        showPill('Payment not received yet. Please complete the payment first.', 'default')
      }
    } catch {
      showPill('Could not check payment status.', 'error')
    } finally {
      setVerifying(false)
    }
  }

  const handleShare = async () => {
    hTap()
    if (!paymentUrl && !imageUrl) return
    const name = eventTitle || 'the event'
    const message = `Pay ₹${amountInr} for my Gorave ticket to ${name}. Scan with any UPI app (GPay, PhonePe, Paytm, BHIM). The code works for 15 minutes.`
    const result = await shareImage(qrCardRef, { message })
    if (!result.shared && result.error === 'failed') {
      showPill('Could not share QR code.', 'error')
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (status === 'paid') {
    return <PaymentStatusOverlay title="Payment Confirmed!" subtitle="Taking you to your ticket…" />
  }

  const isActive  = status === 'active'
  const isExpired = status === 'expired'

  if (isActive || isExpired) {
    return (
      <View style={s.root}>
        <QrPayView
          cardRef={qrCardRef}
          eventTitle={eventTitle}
          amountInr={amountInr}
          paymentUrl={paymentUrl}
          imageUrl={imageUrl}
          isExpired={isExpired}
          timeLeft={timeLeft}
          verifying={verifying}
          onPaid={handleManualCheck}
          onShare={handleShare}
          onNewQr={loadQr}
          onBack={confirmBack}
        />
        <ConfirmSheet
          visible={leaveConfirmOpen}
          title="Leave this payment?"
          body="The QR still works for a few minutes. If you leave now and nobody pays it, you won't get the ticket."
          confirmLabel="Leave"
          cancelLabel="Stay"
          destructive
          onConfirm={() => router.back()}
          onClose={() => setLeaveConfirmOpen(false)}
        />
      </View>
    )
  }

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <Pressable onPress={confirmBack} style={s.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.headerTitle}>Pay by QR</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Loading */}
      {status === 'loading' && (
        <View style={s.center}>
          <BrandedLoader />
          <Text style={s.hintText}>Making your QR code…</Text>
        </View>
      )}

      {/* Error */}
      {status === 'error' && (
        <View style={s.center}>
          <Text style={s.hintText}>Could not make a QR code.</Text>
          <View style={{ width: 200, marginTop: 16 }}>
            <PrimaryButton label="Try again" onPress={loadQr} />
          </View>
        </View>
      )}

      <ConfirmSheet
        visible={leaveConfirmOpen}
        title="Leave payment?"
        body="Your QR code is still active. If you leave, the payment will fail."
        confirmLabel="Leave anyway"
        destructive
        onConfirm={() => router.back()}
        onClose={() => setLeaveConfirmOpen(false)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 24 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },





  hintText: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, textAlign: 'center' },
})
