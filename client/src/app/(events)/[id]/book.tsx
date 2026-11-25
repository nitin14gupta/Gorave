import React, { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors, FontFamily } from '@/constants'
import { BrandedLoader, OutlineButton } from '@/components/ui'
import ApiService, { type EventDetail, type PriceQuote } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { BookView } from '@/components/events/BookView'

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [paying, setPaying] = useState(false)
  // The live price from the server: early bird, or the code you applied.
  // A paid event can't be paid for until it's here.
  const [quote, setQuote] = useState<PriceQuote | null>(null)
  const [quoteFailed, setQuoteFailed] = useState(false)
  // A ref, not state: two taps in the same frame both see the old `paying`.
  const lock = useRef(false)
  const showPill = usePillStore(s => s.show)

  const loadQuote = useCallback((code?: string) => {
    if (!id) return
    setQuoteFailed(false)
    ApiService.getQuote(id, code)
      .then(q => setQuote(q))
      .catch(() => setQuoteFailed(true))
  }, [id])

  const load = useCallback(() => {
    if (!id) return
    Promise.all([ApiService.getEvent(id), ApiService.getWallet()])
      .then(([ev, wallet]) => {
        setEvent(ev)
        setWalletBalance(wallet.balance)
        setLoadFailed(false)
        if (!ev.is_free) loadQuote()
        if (ev.is_cancelled) showPill('This event has been cancelled', 'error')
      })
      .catch(() => setLoadFailed(true))
      .finally(() => setLoading(false))
  }, [id, loadQuote, showPill])

  useEffect(() => { load() }, [load])

  const platformFee = quote?.fee_inr ?? (event ? event.platform_fee_inr : 0)
  const total       = quote?.total_inr ?? (event ? event.price_inr + platformFee : 0)

  /** Try a code. Returns the reason it didn't work, or null. */
  const applyCode = async (code: string): Promise<string | null> => {
    if (!id) return null
    try {
      const q = await ApiService.getQuote(id, code)
      setQuote(q)
      setQuoteFailed(false)
      return q.code_applied ? null : 'Early bird is already cheaper, so you keep that price.'
    } catch (e: any) {
      return e?.message || "That code didn't work"
    }
  }
  const removeCode = () => {
    if (!id) return
    ApiService.getQuote(id)
      .then(q => { setQuote(q); setQuoteFailed(false) })
      .catch(() => showPill("Couldn't remove the code, try again", 'error'))
  }
  const walletApplied = walletEnabled ? Math.min(walletBalance, total) : 0
  const toPay = Math.max(0, total - walletApplied)

  const handlePay = async () => {
    if (!event || lock.current) return

    if (!event.is_free) {
      // Never send someone to pay on a guessed price: retry the quote instead.
      if (!quote) { loadQuote(); return }
      // Pass walletApplied as a param so payment screen knows what was decided here
      const code = quote.code_applied && quote.code ? `&code=${encodeURIComponent(quote.code)}` : ''
      router.push(`/(events)/${id}/payment?wallet=${walletApplied}${code}` as any)
      return
    }

    lock.current = true
    setPaying(true)
    try {
      const res = await ApiService.rsvpEvent(event.id, 'going')
      if (res.status === 'going') {
        router.replace(`/(events)/${id}/ticket` as any)
      } else {
        showPill("It's full, so you're on the waitlist. We'll tell you if a spot opens.", 'default')
        router.back()
      }
    } catch (e: any) {
      if (e?.status === 403) {
        showPill(e?.message ?? "You don't meet the requirements for this event", 'error')
      } else {
        showPill(e?.message || "Booking didn't go through, try again", 'error')
      }
      lock.current = false
      setPaying(false)
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  if (!event || loadFailed) {
    return (
      <View style={[s.root, s.center, s.pad]}>
        <Text style={s.errTitle}>{"Couldn't load this event"}</Text>
        <Text style={s.errBody}>Check your connection and try again.</Text>
        <View style={s.errActions}>
          <OutlineButton label="Try again" onPress={() => { setLoading(true); load() }} />
          <OutlineButton label="Go back" onPress={() => router.back()} />
        </View>
      </View>
    )
  }

  const isCancelled = event.is_cancelled
  const waitingForPrice = !event.is_free && !quote
  const payLabel = isCancelled
    ? 'Event cancelled'
    : event.is_free
    ? 'Confirm my spot'
    : waitingForPrice
    ? (quoteFailed ? "Couldn't get the price. Tap to retry" : 'Getting your price…')
    : toPay === 0
    ? 'Pay with wallet'
    : `Pay ₹${toPay.toLocaleString('en-IN')}`

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <BookView
        event={event}
        walletBalance={walletBalance}
        walletEnabled={walletEnabled}
        onWallet={setWalletEnabled}
        platformFee={platformFee}
        quote={quote}
        onApplyCode={applyCode}
        onRemoveCode={removeCode}
        total={total}
        walletApplied={walletApplied}
        toPay={toPay}
        payLabel={payLabel}
        paying={paying}
        payDisabled={waitingForPrice && !quoteFailed}
        onPay={handlePay}
        onBack={() => router.back()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 28, gap: 8 },
  errTitle: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary, textAlign: 'center' },
  errBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, textAlign: 'center' },
  errActions: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
})
