import { useCallback, useEffect, useState } from 'react'
import { Linking } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useFocusEffect, useRouter } from 'expo-router'
import { checkAgainstCache } from '@/lib/myEventsCache'
import ApiService, { type EventDetail, type EventAttendee, type EventGuest } from '@/api/apiService'
import { useAuthStore } from '@/store/auth'
import { useRecentEventsStore } from '@/store/recentEventsStore'
import { usePillStore } from '@/store/pillStore'
import { useOnboardingStore } from '@/store/onboarding'
import { peekCached } from '@/lib/queryCache'
import { CacheKeys } from '@/constants'
import { genderBucket } from '@/lib/crowdMix'
import type { ProfileResponse } from '@/api/user'
import { calcAge, hoursUntil, parseDate, type RsvpStatus } from '@/components/events/eventDetailUtils'

export type LockedReason = 'checkin' | 'edit' | 'cancel' | 'age' | 'gender'

export function useEventDetail(id: string | undefined) {
  const router = useRouter()
  const myId = useAuthStore(s => s.userId)
  const myDob = useAuthStore(s => s.dob)
  const showPill = usePillStore(s => s.show)
  const storedGender = useOnboardingStore(s => s.gender)
  const myGender = peekCached<ProfileResponse>(CacheKeys.profile())?.gender ?? storedGender ?? null

  const [event, setEvent] = useState<EventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('idle')
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [cancelConfirm, setCancelConfirm] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [lockedReason, setLockedReason] = useState<null | LockedReason>(null)
  const [requestBusy, setRequestBusy] = useState(false)
  const [attendees, setAttendees] = useState<EventAttendee[]>([])
  const [attendeesLoading, setAttendeesLoading] = useState(false)
  const [guests, setGuests] = useState<EventGuest[]>([])
  const [guestTotal, setGuestTotal] = useState(0)
  const [guestWaitlist, setGuestWaitlist] = useState<EventGuest[]>([])
  const [guestsLoading, setGuestsLoading] = useState(false)
  const [guestSheetOpen, setGuestSheetOpen] = useState(false)
  // Countdown for a held waitlist spot, tagged with the offer it counts down.
  const [offerTick, setOfferTick] = useState<{ expires: string; secs: number } | null>(null)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [addressSheetOpen, setAddressSheetOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useFocusEffect(useCallback(() => {
    if (!id) return
    ApiService.getEvent(id)
      .then(ev => {
        setEvent(ev)
        checkAgainstCache(ev)
        useRecentEventsStore.getState().add(ev)
        if (ev.my_rsvp_status === 'going' || ev.my_rsvp_status === 'waitlist') {
          setRsvpStatus(ev.my_rsvp_status)
        }
        if (ev.host_id === myId) {
          setAttendeesLoading(true)
          ApiService.getEventAttendees(id)
            .then(r => setAttendees(r.attendees))
            .catch(() => { })
            .finally(() => setAttendeesLoading(false))
        }
        setGuestsLoading(true)
        ApiService.getEventGuests(id)
          .then(r => {
            setGuests(r.guests)
            setGuestTotal(r.total)
            setGuestWaitlist(r.waitlist)
          })
          .catch(() => { })
          .finally(() => setGuestsLoading(false))
      })
      .catch(() => showPill("Couldn't load this event", 'error'))
      .finally(() => setLoading(false))
  }, [id, myId]))

  const offerExpiresAt = event?.my_offer_expires_at ?? null
  const eventDateTime = event?.date_time
  const offerSecondsLeft = offerExpiresAt && offerTick?.expires === offerExpiresAt ? offerTick.secs : null
  useEffect(() => {
    if (!offerExpiresAt) return
    const tick = () => {
      const offerExpiry = parseDate(offerExpiresAt)
      const eventStart = parseDate(eventDateTime)
      if (!offerExpiry) return
      // Confirm deadline = whichever comes first: offer window OR event start
      const deadline = eventStart
        ? Math.min(offerExpiry.getTime(), eventStart.getTime())
        : offerExpiry.getTime()
      setOfferTick({ expires: offerExpiresAt, secs: Math.max(0, Math.floor((deadline - Date.now()) / 1000)) })
    }
    const first = setTimeout(tick, 0)
    const t = setInterval(tick, 1000)
    return () => { clearTimeout(first); clearInterval(t) }
  }, [offerExpiresAt, eventDateTime])

  const handleRefresh = useCallback(async () => {
    if (!id) return
    setRefreshing(true)
    try {
      const ev = await ApiService.getEvent(id)
      setEvent(ev)
      checkAgainstCache(ev)
    } catch (e: any) {
      showPill(e?.message || "Couldn't refresh this event", 'error')
    } finally {
      setRefreshing(false)
    }
  }, [id, showPill])

  // Crowd mix from the viewer's side — the server re-checks all of this.
  const bucket = genderBucket(myGender)
  const womenPct = event?.women_pct ?? null
  const crowdIneligible = womenPct != null &&
    ((womenPct >= 100 && bucket !== 'women') || (womenPct <= 0 && bucket !== 'men'))
  const ratio = event?.ratio
  const myBucketLeft = ratio
    ? bucket === 'women' ? ratio.women_left : bucket === 'men' ? ratio.men_left : ratio.open_left
    : null
  const crowdFull = !crowdIneligible && myBucketLeft != null && myBucketLeft <= 0
  const isRequestMode = event?.join_mode === 'request'

  // Request flow: warn before the last allowed request, confirm before withdrawing.
  const [lastRequestConfirm, setLastRequestConfirm] = useState(false)
  const [withdrawConfirm, setWithdrawConfirm] = useState(false)

  const sendRequest = useCallback(async (opts?: { confirmed?: boolean }) => {
    if (!event || !id) return
    if (!opts?.confirmed && event.my_requests_left === 1) {
      setLastRequestConfirm(true)
      return
    }
    setRequestBusy(true)
    try {
      await ApiService.requestToJoin(id)
      setEvent(prev => prev ? { ...prev, my_rsvp_status: 'requested', my_requests_left: Math.max(0, (prev.my_requests_left ?? 2) - 1) } : prev)
      router.push({ pathname: '/(events)/[id]/requested' as any, params: { id, title: event.title } })
    } catch (e: any) {
      showPill(e?.message || "Couldn't send your request", 'error')
    } finally {
      setRequestBusy(false)
    }
  }, [event, id, router, showPill])

  const withdrawRequest = useCallback(async () => {
    if (!id) return
    setRequestBusy(true)
    try {
      await ApiService.withdrawJoinRequest(id)
      // Withdrawing doesn't give the request back: the server counts sends.
      setEvent(prev => prev ? { ...prev, my_rsvp_status: 'cancelled', my_can_request_again: (prev.my_requests_left ?? 1) > 0 } : prev)
      showPill('Request withdrawn', 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't withdraw your request", 'error')
    } finally {
      setRequestBusy(false)
    }
  }, [id, showPill])

  const handleRsvp = useCallback(async () => {
    if (!event) return
    if (crowdIneligible) {
      setLockedReason('gender')
      return
    }
    if (event.age_restriction) {
      let dob = myDob
      if (!dob) {
        try {
          const me = await ApiService.getMe()
          dob = me.dob ?? null
          if (dob) useAuthStore.getState().setDob(dob)
        } catch { }
      }
      if (dob && calcAge(dob) < event.age_restriction) {
        setLockedReason('age')
        return
      }
    }
    if (event.join_mode === 'request') {
      await sendRequest()
      return
    }
    router.push(`/(events)/${id}/book` as any)
  }, [event, myDob, id, router, crowdIneligible, sendRequest])

  const handleScanner = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) > 3) {
      setLockedReason('checkin')
    } else {
      router.push(`/(events)/${id}/scanner` as any)
    }
  }, [event, id, router])

  const handleEditEvent = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) < 2) {
      setLockedReason('edit')
    } else {
      router.push(`/(events)/${id}/edit` as any)
    }
  }, [event, id, router])

  const handleCancelEvent = useCallback(() => {
    if (!event) return
    if (hoursUntil(event.date_time) < 48) {
      setLockedReason('cancel')
    } else {
      setCancelConfirm(true)
    }
  }, [event])

  const doCancelEvent = useCallback(async () => {
    try {
      await ApiService.cancelEvent(id!)
      setEvent(prev => prev ? { ...prev, is_cancelled: true } : prev)
      useRecentEventsStore.getState().remove(id!)
      showPill('Event cancelled', 'default')
    } catch (e: any) {
      showPill(e?.message || "Couldn't cancel this event, try again", 'error')
    }
  }, [id, showPill])

  const handleShare = useCallback(() => {
    if (!event) return
    setShareSheetOpen(true)
  }, [event])

  const handleJoinWaitlist = useCallback(async () => {
    if (!event) return
    setRsvpStatus('loading')
    try {
      const res = await ApiService.rsvpEvent(id!, 'going')
      if (res.status === 'waitlist') {
        setRsvpStatus('waitlist')
        setEvent(prev => prev ? { ...prev, spots_left: 0 } : prev)
        showPill("You're on the waitlist", 'default')
        router.push({
          pathname: '/(events)/[id]/waitlist-joined' as any,
          params: {
            id: id!,
            position: String(res.position ?? 1),
            coverUrl: event.cover_photos?.[0]?.url ?? '',
            title: event.title,
          },
        })
      } else if (res.status === 'going') {
        setRsvpStatus('going')
        showPill("You're going! 🎉", 'default')
      }
    } catch (e: any) {
      setRsvpStatus('idle')
      showPill(e?.message || "Couldn't join waitlist", 'error')
    }
  }, [event, id, router, showPill])

  const handleManageWaitlist = useCallback(() => {
    router.push(`/(events)/${id}/waitlist` as any)
  }, [id, router])

  const handleAddressAction = useCallback((key: string) => {
    if (!event) return
    if (key === 'copy') {
      Clipboard.setStringAsync(event.location_name ?? '')
      showPill('Address copied', 'default')
    } else if (key === 'maps') {
      const query = event.location_lat != null && event.location_lng != null
        ? `${event.location_lat},${event.location_lng}`
        : encodeURIComponent(event.location_name ?? '')
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => {
        showPill("Couldn't open Maps", 'error')
      })
    }
  }, [event, showPill])

  const now = new Date()
  const eventStart = event ? parseDate(event.date_time) : null
  const eventEnd = event?.end_time ? parseDate(event.end_time) : null
  const isStarted = !!eventStart && eventStart < now
  const isEnded = isStarted && (eventEnd ? eventEnd < now : true)
  const isInProgress = isStarted && !isEnded
  const isPast = isEnded
  const hasTicket = !!(event?.my_ticket_token)
  // Request-mode events never waitlist — requests are the queue.
  const shouldWaitlist = !!event && !isRequestMode &&
    (event.spots_left === 0 || (event.waitlist_count ?? 0) > 0 || crowdFull)
  const spotsLow = !!event && !shouldWaitlist && event.spots_left <= 10 && !event.is_free
  const isGoing = rsvpStatus === 'going'
  const isWaitlist = rsvpStatus === 'waitlist'
  const coverPhotos = event?.cover_photos ?? []

  return {
    myId,
    event,
    loading,
    rsvpStatus,
    optionsOpen, setOptionsOpen,
    cancelConfirm, setCancelConfirm,
    reportOpen, setReportOpen,
    lockedReason, setLockedReason,
    attendees,
    attendeesLoading,
    guests,
    guestTotal,
    guestWaitlist,
    guestsLoading,
    guestSheetOpen, setGuestSheetOpen,
    offerSecondsLeft,
    shareSheetOpen, setShareSheetOpen,
    addressSheetOpen, setAddressSheetOpen,
    refreshing,
    handleRefresh,
    handleRsvp,
    handleScanner,
    handleEditEvent,
    handleCancelEvent,
    doCancelEvent,
    handleShare,
    handleJoinWaitlist,
    handleManageWaitlist,
    handleAddressAction,
    isStarted,
    isEnded,
    isInProgress,
    isPast,
    hasTicket,
    shouldWaitlist,
    spotsLow,
    isGoing,
    isWaitlist,
    coverPhotos,
    isRequestMode,
    crowdIneligible,
    crowdFull,
    myBucket: bucket,
    requestBusy,
    sendRequest,
    lastRequestConfirm,
    setLastRequestConfirm,
    withdrawConfirm,
    setWithdrawConfirm,
    withdrawRequest,
  }
}
