import { useCallback, useEffect, useState } from 'react'
import { Share } from 'react-native'
import { useRouter } from 'expo-router'
import ApiService, { type CancelReason, type Conversation, type MyCancelQuote, type MyTransferQuote } from '@/api/apiService'
import { CacheKeys } from '@/constants'
import { invalidate } from '@/lib/queryCache'
import { invalidateMyEvents } from '@/lib/myEventsCache'
import { buildTransferUrl } from '@/lib/deepLink'
import { hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'

/**
 * "Can't make it?" on the ticket screen: pass the ticket to a friend first,
 * cancel only if that isn't for you. Both rules (can you pass it on, can you
 * cancel, what comes back) come fresh from the server every time, never from
 * the cached ticket: they change with time and with what the host does.
 */
export function useCantMakeIt(eventId: string | undefined, eventTitle: string) {
  const router = useRouter()
  const showPill = usePillStore(s => s.show)
  const [cancelQuote, setCancelQuote] = useState<MyCancelQuote | null>(null)
  const [transfer, setTransfer] = useState<MyTransferQuote | null>(null)
  const [busy, setBusy] = useState(false)

  const reload = useCallback(async () => {
    if (!eventId) return
    try {
      const ev = await ApiService.getEvent(eventId)
      setCancelQuote(ev.my_cancel ?? null)
      setTransfer(ev.my_transfer ?? null)
    } catch {}
  }, [eventId])

  useEffect(() => {
    if (!eventId) return
    let live = true
    ApiService.getEvent(eventId)
      .then(ev => {
        if (!live) return
        setCancelQuote(ev.my_cancel ?? null)
        setTransfer(ev.my_transfer ?? null)
      })
      .catch(() => {})
    return () => { live = false }
  }, [eventId])

  const forgetBooking = useCallback(() => {
    if (!eventId) return
    invalidateMyEvents()
    invalidate(CacheKeys.ticket(eventId))
    invalidate(CacheKeys.eventCover(eventId))
    invalidate(CacheKeys.eventDetail(eventId))
  }, [eventId])

  const cancel = useCallback(async (reason?: CancelReason) => {
    if (!eventId || busy) return
    setBusy(true)
    try {
      const res = await ApiService.rsvpEvent(eventId, 'cancel', reason)
      hSuccess()
      const refund = res?.refund_inr ?? 0
      showPill(refund > 0 ? `₹${refund} added to your Gorave Wallet` : 'Your spot is cancelled', 'default')
      forgetBooking()
      router.replace(`/(events)/${eventId}` as any)
    } catch (e: any) {
      showPill(e?.message || "Couldn't cancel, try again", 'error')
    } finally {
      setBusy(false)
    }
  }, [eventId, busy, forgetBooking, router, showPill])

  /** A ticket card in your chat with them; your ticket works until they accept. */
  const sendToFriend = useCallback(async (conv: Conversation): Promise<boolean> => {
    if (!eventId) return false
    try {
      await ApiService.offerTicketTransfer(eventId, conv.partner_id)
      hSuccess()
      showPill(`Sent to ${conv.partner_name ?? 'your friend'}. Your ticket works until they accept`, 'default')
      reload()
      return true
    } catch (e: any) {
      showPill(e?.message || "Couldn't send it, try again", 'error')
      return false
    }
  }, [eventId, reload, showPill])

  /** For someone not on Gorave yet: the first person to open the link gets it. */
  const shareLink = useCallback(async () => {
    if (!eventId) return
    try {
      const pending = transfer?.pending
      const token = pending && !pending.to_user_id ? pending.token : (await ApiService.offerTicketTransfer(eventId)).token
      reload()
      await Share.share({
        message: `I can't make it to ${eventTitle}, so my ticket is yours. Open this to take it: ${buildTransferUrl(token)}`,
      })
    } catch (e: any) {
      if (e?.message) showPill(e.message, 'error')
    }
  }, [eventId, eventTitle, transfer, reload, showPill])

  const withdraw = useCallback(async () => {
    if (!eventId) return
    try {
      await ApiService.withdrawTicketTransfer(eventId)
      showPill('Offer withdrawn. The ticket is still yours', 'default')
      reload()
    } catch {
      showPill("Couldn't withdraw it, try again", 'error')
    }
  }, [eventId, reload, showPill])

  return { cancelQuote, transfer, busy, cancel, sendToFriend, shareLink, withdraw, forgetBooking }
}
