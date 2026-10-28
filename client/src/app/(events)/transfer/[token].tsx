import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Lock, Ticket } from 'lucide-react-native'
import ApiService, { type TransferPreview } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { LogoMark, OutlineButton } from '@/components/ui'
import { TICKET, TicketPaper } from '@/components/events/TicketView'
import { eventDateParts } from '@/components/events/EventCard'
import { invalidateMyEvents } from '@/lib/myEventsCache'
import { hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { useGoBack } from '@/hooks/useGoBack'

const { width: W } = Dimensions.get('window')
// The ticket is an object you're being handed, not a full-bleed page.
const CARD_W = Math.min(W - 56, 330)
const POSTER_W = CARD_W - 24
const POSTER_H = Math.round(POSTER_W * 1.25) // events are 4:5

/**
 * A friend passing you their ticket (from a chat card or a shared link):
 * who it's from, then the ticket itself, built exactly like a real Gorave
 * ticket (maroon paper, big date block, notched tear line), with its QR
 * still sealed until you accept.
 */
export default function TransferClaimScreen() {
  const { token } = useLocalSearchParams<{ token: string }>()
  const router = useRouter()
  const goBack = useGoBack()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [offer, setOffer] = useState<TransferPreview | null>(null)
  const [failed, setFailed] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!token) return
    ApiService.getTicketTransfer(token).then(setOffer).catch(() => setFailed(true))
  }, [token])

  const accept = async () => {
    if (!token || busy) return
    setBusy(true)
    try {
      const res = await ApiService.acceptTicketTransfer(token)
      hSuccess()
      showPill('The ticket is yours. See you there', 'default')
      invalidateMyEvents()
      router.replace(`/(events)/${res.event_id}/ticket` as any)
    } catch (e: any) {
      showPill(e?.message || "Couldn't accept it, try again", 'error')
      ApiService.getTicketTransfer(token).then(setOffer).catch(() => {})
    } finally {
      setBusy(false)
    }
  }

  if (!offer) {
    return (
      <View style={[s.root, s.center]}>
        <StatusBar style="light" />
        {failed ? (
          <>
            <Text style={s.headline}>This ticket link isn&apos;t valid</Text>
            <Pressable onPress={goBack} hitSlop={8}><Text style={s.link}>Go back</Text></Pressable>
          </>
        ) : <ActivityIndicator color={Colors.inkSecondary} />}
      </View>
    )
  }

  const ev = offer.event
  const from = offer.from.name?.split(' ')[0] ?? 'A friend'
  const parts = eventDateParts(ev.date_time)
  const where = [ev.area, ev.city].filter(Boolean).join(', ')
  const open = offer.can_accept

  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {offer.from.avatar ? (
          <Image source={{ uri: offer.from.avatar }} style={s.fromAvatar} contentFit="cover" />
        ) : (
          <View style={[s.fromAvatar, s.fromFallback]}><Text style={s.fromInitial}>{from.charAt(0)}</Text></View>
        )}
        <Text style={s.headline}>{offer.is_sender ? 'Your ticket offer' : `${from} sent you a ticket`}</Text>
        <Text style={s.sub}>
          {offer.is_sender
            ? 'Your friend sees this when they open your link.'
            : open ? `It's free for you, ${from} already paid.` : (offer.reason ?? "This ticket can't be accepted.")}
        </Text>

        <View style={[s.ticket, !open && s.ticketDim]}>
          <TicketPaper />

          {/* The event's poster, framed on the ticket paper. */}
          <View style={s.posterFrame}>
            {ev.cover_url ? (
              <Image source={{ uri: ev.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.posterFallback]}>
                <Ticket size={36} color={withOpacity(Colors.white, 0.4)} strokeWidth={1.4} />
              </View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.75)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
            <Text style={s.posterTitle} numberOfLines={2}>{ev.title}</Text>
          </View>

          {/* Same layout as the real ticket's stub. */}
          <View style={s.when}>
            <View style={s.dateBlock}>
              <Text style={s.dow}>{parts?.dow.toUpperCase() ?? 'TBC'}</Text>
              <Text style={s.day}>{parts?.day ?? '--'}</Text>
              <Text style={s.mon}>{parts?.mon.toUpperCase() ?? ''}</Text>
            </View>
            <View style={s.whenInfo}>
              <Text style={s.small}>DOORS</Text>
              <Text style={s.big}>{parts?.time ?? 'TBC'}</Text>
              <Text style={[s.small, { marginTop: 10 }]}>WHERE</Text>
              <Text style={s.mid} numberOfLines={2}>{where || 'Shared once you accept'}</Text>
            </View>
          </View>

          <View style={s.perf}>
            <View style={[s.notch, s.notchL]} />
            <View style={s.dash} />
            <View style={[s.notch, s.notchR]} />
          </View>

          {/* Where the QR goes: sealed until it's yours. */}
          <View style={s.sealed}>
            <View style={s.sealedIcon}><Lock size={18} color={withOpacity(Colors.white, 0.85)} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.sealedTitle}>{open ? 'Your QR appears when you accept' : 'Not available'}</Text>
              <Text style={s.sealedSub}>ADMIT ONE · FROM {from.toUpperCase()}</Text>
            </View>
            <LogoMark size={16} opacity={0.7} />
          </View>
        </View>

        <View style={s.actions}>
          {open ? (
            <>
              <PrimaryButton label="Accept ticket" onPress={accept} loading={busy} />
              <Text style={s.fine}>{from}&apos;s old ticket stops working once you accept.</Text>
            </>
          ) : (
            <OutlineButton label="See the event" onPress={() => router.replace(`/(events)/${ev.id}` as any)} />
          )}
        </View>
      </ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={goBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const ON_TICKET = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  scroll: { alignItems: 'center', paddingHorizontal: 20 },
  back: {
    position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center',
  },

  fromAvatar: { width: 56, height: 56, borderRadius: 18, marginBottom: 14 },
  fromFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  fromInitial: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  headline: {
    fontFamily: FontFamily.displayExtraBold, fontSize: 28, lineHeight: 32, letterSpacing: -0.7,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14.5, lineHeight: 20, color: Colors.inkSecondary,
    textAlign: 'center', marginTop: 6, marginBottom: 24, paddingHorizontal: 12,
  },

  // The ticket: one piece of maroon paper, like the real one.
  ticket: { width: CARD_W, borderRadius: 22, overflow: 'hidden', backgroundColor: TICKET.paperMid },
  ticketDim: { opacity: 0.5 },
  posterFrame: { margin: 12, marginBottom: 0, height: POSTER_H, borderRadius: 14, overflow: 'hidden' },
  posterFallback: { backgroundColor: withOpacity(Colors.white, 0.06), alignItems: 'center', justifyContent: 'center' },
  posterTitle: {
    position: 'absolute', left: 14, right: 14, bottom: 12,
    fontFamily: FontFamily.displayExtraBold, fontSize: 24, lineHeight: 27, letterSpacing: -0.5, color: Colors.white,
  },
  when: { flexDirection: 'row', padding: 20, gap: 20 },
  dateBlock: {
    width: 84, alignItems: 'center', paddingVertical: 8, paddingRight: 20,
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: withOpacity(ON_TICKET, 0.25),
  },
  dow: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.6, color: withOpacity(ON_TICKET, 0.6) },
  day: { fontFamily: FontFamily.displayExtraBold, fontSize: 48, lineHeight: 52, color: ON_TICKET, letterSpacing: -1 },
  mon: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.6, color: withOpacity(ON_TICKET, 0.6) },
  whenInfo: { flex: 1, justifyContent: 'center' },
  small: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.4, color: withOpacity(ON_TICKET, 0.5) },
  big: { fontFamily: FontFamily.headingBold, fontSize: 24, color: ON_TICKET, marginTop: 2 },
  mid: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: ON_TICKET, marginTop: 2 },
  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  notchL: { marginLeft: -12 },
  notchR: { marginRight: -12 },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(ON_TICKET, 0.25), marginHorizontal: 8 },
  sealed: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20 },
  sealedIcon: {
    width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: withOpacity(ON_TICKET, 0.1),
  },
  sealedTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: ON_TICKET },
  sealedSub: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.4, color: withOpacity(ON_TICKET, 0.5), marginTop: 3 },

  actions: { width: '100%', marginTop: 28, gap: 12 },
  fine: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, lineHeight: 18, color: Colors.inkDisabled, textAlign: 'center' },
  link: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})
