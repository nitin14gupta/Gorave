import React, { useEffect, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Colors } from '@/constants'
import { BrandedLoader } from '@/components/ui'
import ApiService, { type EventDetail } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { BookView } from '@/components/events/BookView'

export default function BookScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEnabled, setWalletEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const showPill = usePillStore(s => s.show)

  useEffect(() => {
    if (!id) return
    Promise.all([ApiService.getEvent(id), ApiService.getWallet()])
      .then(([ev, wallet]) => {
        setEvent(ev)
        setWalletBalance(wallet.balance)
        if (ev.is_cancelled) showPill('This event has been cancelled', 'error')
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id])

  const platformFee = event ? event.platform_fee_inr : 0
  const total       = event ? event.price_inr + platformFee : 0
  const walletApplied = walletEnabled ? Math.min(walletBalance, total) : 0
  const toPay = Math.max(0, total - walletApplied)

  const handlePay = async () => {
    if (!event || paying) return

    if (!event.is_free) {
      // Pass walletApplied as a param so payment screen knows what was decided here
      router.push(`/(events)/${id}/payment?wallet=${walletApplied}` as any)
      return
    }

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
      setPaying(false)
    }
  }

  if (loading || !event) {
    return (
      <View style={[s.root, s.center]}>
        <BrandedLoader />
      </View>
    )
  }

  const isCancelled = event.is_cancelled
  const payLabel = isCancelled
    ? 'Event cancelled'
    : event.is_free
    ? 'Confirm my spot'
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
        total={total}
        walletApplied={walletApplied}
        toPay={toPay}
        payLabel={payLabel}
        paying={paying}
        onPay={handlePay}
        onBack={() => router.back()}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center' },
})
