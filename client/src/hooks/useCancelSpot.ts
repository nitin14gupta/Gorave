import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import ApiService, { type MyCancelQuote } from '@/api/apiService'
import { CacheKeys } from '@/constants'
import { invalidate } from '@/lib/queryCache'
import { invalidateMyEvents } from '@/lib/myEventsCache'
import { hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'

/**
 * Cancelling your own spot from the ticket screen. The rule (can you, until
 * when, how much comes back) always comes fresh from the server, never from
 * the cached ticket or event: it changes with time and with the host's edits.
 * The server checks it again when you actually cancel.
 */
export function useCancelSpot(eventId: string | undefined) {
  const router = useRouter()
  const showPill = usePillStore(s => s.show)
  const [quote, setQuote] = useState<MyCancelQuote | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!eventId) return
    let live = true
    ApiService.getEvent(eventId)
      .then(ev => { if (live) setQuote(ev.my_cancel ?? null) })
      .catch(() => {})
    return () => { live = false }
  }, [eventId])

  const cancel = useCallback(async () => {
    if (!eventId || busy) return
    setBusy(true)
    try {
      const res = await ApiService.rsvpEvent(eventId, 'cancel')
      hSuccess()
      const refund = res?.refund_inr ?? 0
      showPill(refund > 0 ? `₹${refund} added to your Gorave Wallet` : 'Your spot is cancelled', 'default')
      // Everything that showed this booking is now wrong.
      invalidateMyEvents()
      invalidate(CacheKeys.ticket(eventId))
      invalidate(CacheKeys.eventCover(eventId))
      invalidate(CacheKeys.eventDetail(eventId))
      router.replace(`/(events)/${eventId}` as any)
    } catch (e: any) {
      showPill(e?.message || "Couldn't cancel, try again", 'error')
    } finally {
      setBusy(false)
    }
  }, [eventId, busy, router, showPill])

  return { quote, busy, cancel }
}
