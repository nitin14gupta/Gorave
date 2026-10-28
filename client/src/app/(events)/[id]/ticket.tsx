import React, { useEffect, useRef, useState } from 'react'
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { type ViewShotRef } from 'react-native-view-shot'
import { Asset as MediaAsset, requestPermissionsAsync as requestMediaPermissionsAsync } from 'expo-media-library'
import { hSuccess } from '@/lib/haptics'
import { CacheKeys, Colors, FontFamily } from '@/constants'
import ApiService, { type EventDetail, type MyCancelQuote, type MyTransferQuote, type TicketInfo } from '@/api/apiService'
import { usePillStore } from '@/store/pillStore'
import { getOrFetch, invalidate, peekCached, setCached } from '@/lib/queryCache'
import { BrandedLoader } from '@/components/ui'
import { useGoBack } from '@/hooks/useGoBack'
import { EventShareCard } from '@/components/events/EventShareCard'
import { fmtDate, fmtTime, parseTs } from '@/lib/ticketDates'
import { useImageShare } from '@/hooks/useImageShare'
import { TicketView } from '@/components/events/TicketView'
import { CantMakeItSheet } from '@/components/events/CantMakeItSheet'
import { ShareToChatSheet } from '@/components/ui/ShareToChatSheet'
import { useCantMakeIt } from '@/hooks/useCantMakeIt'

// ── "Can't make it?" row ─────────────────────────────────────────────────────

const until = (iso: string | null) => (iso ? `${fmtDate(iso)}, ${fmtTime(iso)}` : '')

/** The line under "Can't make it?" on the ticket: what you can still do. */
function cantMakeItSub(c: MyCancelQuote | null, t: MyTransferQuote | null): string {
  if (t?.pending) return t.pending.to_name ? `Waiting for ${t.pending.to_name} to accept` : 'Your ticket link is out'
  if (t?.allowed && c?.allowed) return 'Send it to a friend, or cancel'
  if (t?.allowed) return 'Send it to a friend'
  if (c?.allowed) {
    if (c.kind === 'free') return `Free cancellation until ${until(c.deadline)}`
    if (c.kind === 'moved') return `Event moved: full ₹${c.refund_inr} back until ${until(c.deadline)}`
    return `₹${c.refund_inr} back to your wallet until ${until(c.deadline)}`
  }
  return c?.reason ?? t?.reason ?? "This can't be changed now"
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TicketScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const router = useRouter()
  const goBack = useGoBack()
  const showPill = usePillStore(s => s.show)

  const [ticket, setTicket] = useState<TicketInfo | null>(() => id ? peekCached<TicketInfo>(CacheKeys.ticket(id)) : null)
  const [loading, setLoading] = useState(() => !!id && !peekCached<TicketInfo>(CacheKeys.ticket(id)))
  const [loadError, setLoadError] = useState(false)
  const [event, setEvent] = useState<EventDetail | null>(null)
  const cardRef = useRef<ViewShotRef | null>(null)
  // Passed on or cancelled (maybe from another phone): the saved ticket is dead.
  const [gone, setGone] = useState(false)
  const cant = useCantMakeIt(id, ticket?.event_title ?? '')
  const [cantOpen, setCantOpen] = useState(false)
  const [pickFriend, setPickFriend] = useState(false)
  const cantLoaded = cant.cancelQuote !== null || cant.transfer !== null
  const shareCardRef = useRef<View>(null)
  const { shareImage } = useImageShare()

  // The saved ticket shows instantly (and works at the door with no signal),
  // but is always checked: it may have been passed on or cancelled since.
  const fetchTicket = () => {
    if (!id) return
    ApiService.getMyTicket(id)
      .then(t => {
        setTicket(t)
        const d = parseTs(t.date_time)
        setCached(CacheKeys.ticket(id), t, d ? Math.max(d.getTime() - Date.now(), 0) : 60_000)
      })
      .catch((e: any) => {
        if (e?.status === 404 || e?.status === 403) {
          invalidate(CacheKeys.ticket(id))
          setTicket(null)
          setGone(true)
          return
        }
        if (!peekCached<TicketInfo>(CacheKeys.ticket(id))) {
          setLoadError(true)
          showPill("Couldn't load your ticket", 'error')
        }
      })
      .finally(() => setLoading(false))
  }
  // Retry after a failed load.
  const loadTicket = () => {
    setLoading(true)
    setLoadError(false)
    fetchTicket()
  }

  useEffect(() => {
    if (!id) return
    fetchTicket()
    // Cover photo only — this screen never touches live fields (RSVP status,
    // spots left), just cosmetic display for the share card, so it's as safe
    // to cache-until-event-ends as the ticket itself.
    getOrFetch(CacheKeys.eventCover(id), () => ApiService.getEvent(id), {
      ttlMs: ev => {
        const d = parseTs(ev.date_time)
        return d ? Math.max(d.getTime() - Date.now(), 0) : 60_000
      },
    })
      .then(setEvent)
      .catch(() => {})
  }, [id])

  const handleShare = async () => {
    if (!ticket) return
    const message = `I'm going to "${ticket.event_title}" on ${fmtDate(ticket.date_time)}${event?.area ? `, ${event.area}` : ''}.`
    try {
      if (coverUrl) {
        const result = await shareImage(shareCardRef, { message, title: ticket.event_title })
        if (result.shared || result.error === 'cancelled') return
      }
      await Share.share({ message, title: ticket.event_title })
    } catch {
      showPill("Couldn't share, try again", 'error')
    }
  }

  const coverUrl = event?.cover_photos?.[0]?.url ?? ''

  const handleDirections = () => {
    const lat = event?.location_lat
    const lng = event?.location_lng
    const query = lat != null && lng != null ? `${lat},${lng}` : encodeURIComponent(ticket?.location_name ?? '')
    if (!query) return
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`).catch(() => showPill("Couldn't open Maps", 'error'))
  }

  const handleSave = async () => {
    if (!cardRef.current) return
    try {
      const { status } = await requestMediaPermissionsAsync()
      if (status !== 'granted') {
        showPill('Allow photo access to save your ticket', 'error')
        return
      }
      const uri = await (cardRef.current as any).capture()
      await MediaAsset.create(uri)
      hSuccess()
      showPill('Ticket saved to Photos!', 'default')
    } catch {
      showPill("Couldn't save ticket, try again", 'error')
    }
  }

  if (loading) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <BrandedLoader />
      </View>
    )
  }

  if (!ticket) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        <Text style={s.errorText}>
          {loadError ? "Couldn't load your ticket" : gone ? "This ticket isn't yours any more" : 'Ticket not found'}
        </Text>
        {loadError && (
          <Pressable onPress={loadTicket} style={s.retryBtn}>
            <Text style={s.retryText}>Try again</Text>
          </Pressable>
        )}
        <Pressable onPress={goBack}>
          <Text style={s.backLinkText}>Go back</Text>
        </Pressable>
      </View>
    )
  }

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <TicketView
        ticket={ticket}
        event={event}
        cardRef={cardRef}
        onBack={goBack}
        onShare={handleShare}
        onSave={handleSave}
        onDirections={handleDirections}
        onAllTickets={() => router.replace('/(settings)/joined-events' as any)}
        cancelRow={cantLoaded ? {
          label: cant.busy ? 'Cancelling…' : "Can't make it?",
          sub: cantMakeItSub(cant.cancelQuote, cant.transfer),
          enabled: !cant.busy,
          onPress: () => setCantOpen(true),
        } : null}
      />

      <CantMakeItSheet
        visible={cantOpen}
        cancelQuote={cant.cancelQuote}
        transfer={cant.transfer}
        busy={cant.busy}
        onSendToFriend={() => setPickFriend(true)}
        onShareLink={cant.shareLink}
        onWithdraw={cant.withdraw}
        onCancel={cant.cancel}
        onClose={() => setCantOpen(false)}
      />

      <ShareToChatSheet
        visible={pickFriend}
        title="Send your ticket"
        pick={{ label: 'Send ticket', send: cant.sendToFriend }}
        previewTitle={ticket.event_title}
        previewSubtitle={`${fmtDate(ticket.date_time)} · They get a fresh ticket`}
        previewImage={coverUrl || null}
        onClose={() => setPickFriend(false)}
      />

      {/* Off-screen — captured and shared as an image, never shown to the user */}
      {coverUrl ? (
        <View style={s.shareCardHost} pointerEvents="none">
          <EventShareCard
            ref={shareCardRef}
            imageUrl={coverUrl}
            title={ticket.event_title}
            dateTimeLabel={`${fmtDate(ticket.date_time)}${ticket.date_time ? ` · ${fmtTime(ticket.date_time)}` : ''}`}
          />
        </View>
      ) : null}
    </View>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontFamily: FontFamily.bodyRegular, fontSize: 16, color: Colors.inkSecondary, marginBottom: 16 },
  backLinkText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20, backgroundColor: Colors.surfaceMuted, marginBottom: 16 },
  retryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
