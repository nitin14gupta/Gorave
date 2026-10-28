import { useEffect, useState } from 'react'
import { ActivityIndicator, Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Ticket } from 'lucide-react-native'
import ApiService, { type TransferPreview } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { OutlineButton } from '@/components/ui'
import { TicketPaper } from '@/components/events/TicketView'
import { eventDateParts } from '@/components/events/EventCard'
import { fmtTime } from '@/lib/ticketDates'
import { invalidateMyEvents } from '@/lib/myEventsCache'
import { hSuccess } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { useGoBack } from '@/hooks/useGoBack'
import { LabSwitch } from '@/components/lab/LabSwitch'
import { useLabVariant } from '@/store/labStore'

const { width: W } = Dimensions.get('window')
// The ticket is shown as an object you're being handed, not a full-bleed page.
const CARD_W = Math.min(W - 72, 320)
const POSTER_H = Math.round(CARD_W * 1.25) // events are 4:5
// Lab B: the poster fills the top of the screen instead.
const STAGE_H = Math.round(Math.min(W * 1.25, Dimensions.get('window').height * 0.58))

/**
 * A friend passing you their ticket (from a chat card or a shared link):
 * who it's from, the ticket itself (their event's poster over the same
 * maroon stub as a real Gorave ticket), and one button.
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
  const variant = useLabVariant('ticketClaim')

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
  const when = parts ? `${parts.dow} ${parts.day} ${parts.mon}` : 'TBC'
  const doors = parts?.time ?? fmtTime(ev.date_time)
  const seeEvent = () => router.replace(`/(events)/${ev.id}` as any)

  // ── B: poster stage ────────────────────────────────────────────────────────
  // The event's poster owns the top of the screen with who it's from on it;
  // the facts sit in one row of cells below and Accept stays at the bottom.
  if (variant === 'b') {
    return (
      <View style={s.root}>
        <StatusBar style="light" />
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
          <View style={{ height: STAGE_H }}>
            {ev.cover_url ? (
              <Image source={{ uri: ev.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.posterFallback]}>
                <Ticket size={40} color={Colors.inkDisabled} strokeWidth={1.4} />
              </View>
            )}
            <LinearGradient
              colors={['rgba(0,0,0,0.45)', 'transparent', 'transparent', Colors.background]}
              locations={[0, 0.25, 0.6, 1]}
              style={StyleSheet.absoluteFill}
            />
            <View style={b.fromChip}>
              {offer.from.avatar ? (
                <Image source={{ uri: offer.from.avatar }} style={b.chipAvatar} contentFit="cover" />
              ) : (
                <View style={[b.chipAvatar, s.fromFallback]}><Text style={b.chipInitial}>{from.charAt(0)}</Text></View>
              )}
              <Text style={b.chipText} numberOfLines={1}>
                {offer.is_sender ? 'Your ticket offer' : `${from} sent you this ticket`}
              </Text>
            </View>
          </View>

          <View style={b.body}>
            <Text style={b.title} numberOfLines={3}>{ev.title}</Text>
            <View style={b.facts}>
              <View style={b.fact}>
                <Text style={b.factLabel}>DATE</Text>
                <Text style={b.factValue} numberOfLines={1}>{when}</Text>
              </View>
              <View style={[b.fact, b.factBorder]}>
                <Text style={b.factLabel}>DOORS</Text>
                <Text style={b.factValue} numberOfLines={1}>{doors}</Text>
              </View>
              <View style={[b.fact, b.factBorder, { flex: 1.4 }]}>
                <Text style={b.factLabel}>WHERE</Text>
                <Text style={b.factValue} numberOfLines={1}>{ev.area || ev.city || 'After you accept'}</Text>
              </View>
            </View>
            <View style={b.freeRow}>
              <Ticket size={15} color={open ? Colors.inkPrimary : Colors.inkDisabled} strokeWidth={2.2} />
              <Text style={[b.freeText, !open && b.freeTextOff]}>
                {open ? `Free for you. ${from} already paid.` : (offer.reason ?? "This ticket can't be accepted.")}
              </Text>
            </View>
            {open ? <Text style={b.fine}>You get your own ticket and QR. {from}&apos;s old one stops working.</Text> : null}
          </View>
        </ScrollView>

        <View style={[b.bar, { paddingBottom: insets.bottom + 14 }]}>
          {open
            ? <PrimaryButton label="Accept ticket" onPress={accept} loading={busy} />
            : <OutlineButton label="See the event" onPress={seeEvent} />}
        </View>

        <Pressable style={[s.back, b.backOnPoster, { top: insets.top + 8 }]} onPress={goBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
        </Pressable>
        <LabSwitch screen="ticketClaim" />
      </View>
    )
  }

  // ── A: the ticket you're being handed ──────────────────────────────────────
  return (
    <View style={s.root}>
      <StatusBar style="light" />
      <ScrollView
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.fromRow}>
          {offer.from.avatar ? (
            <Image source={{ uri: offer.from.avatar }} style={s.fromAvatar} contentFit="cover" />
          ) : (
            <View style={[s.fromAvatar, s.fromFallback]}><Text style={s.fromInitial}>{from.charAt(0)}</Text></View>
          )}
        </View>
        <Text style={s.headline}>
          {offer.is_sender ? 'Your ticket offer' : `${from} sent you a ticket`}
        </Text>
        <Text style={s.sub}>
          {offer.is_sender
            ? 'Your friend sees this when they open your link.'
            : open ? `It's free for you, ${from} already paid.` : (offer.reason ?? "This ticket can't be accepted.")}
        </Text>

        <View style={[s.card, !open && s.cardDim]}>
          <View style={{ height: POSTER_H }}>
            {ev.cover_url ? (
              <Image source={{ uri: ev.cover_url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.posterFallback]}>
                <Ticket size={36} color={Colors.inkDisabled} strokeWidth={1.4} />
              </View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} locations={[0.5, 1]} style={StyleSheet.absoluteFill} />
            <Text style={s.posterTitle} numberOfLines={2}>{ev.title}</Text>
          </View>

          <View style={s.stub}>
            <TicketPaper />
            {/* Torn edge between poster and stub, like the real ticket. */}
            <View style={[s.notch, s.notchLeft]} />
            <View style={[s.notch, s.notchRight]} />
            <View style={s.stubRow}>
              <View style={s.stubCol}>
                <Text style={s.stubLabel}>DATE</Text>
                <Text style={s.stubValue}>{when}</Text>
              </View>
              <View style={s.stubCol}>
                <Text style={s.stubLabel}>DOORS</Text>
                <Text style={s.stubValue}>{doors}</Text>
              </View>
            </View>
            <View style={s.stubCol}>
              <Text style={s.stubLabel}>WHERE</Text>
              <Text style={s.stubValue} numberOfLines={1}>{where || 'Shared once you accept'}</Text>
            </View>
            <Text style={s.admit}>ADMIT ONE · FROM {from.toUpperCase()}</Text>
          </View>
        </View>

        <View style={s.actions}>
          {open ? (
            <>
              <PrimaryButton label="Accept ticket" onPress={accept} loading={busy} />
              <Text style={s.fine}>You get your own ticket and QR. {from}&apos;s old one stops working.</Text>
            </>
          ) : (
            <OutlineButton label="See the event" onPress={seeEvent} />
          )}
        </View>
      </ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={goBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
      </Pressable>
      <LabSwitch screen="ticketClaim" />
    </View>
  )
}

const ON_TICKET = Colors.white
const NOTCH = 18

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 },
  scroll: { alignItems: 'center', paddingHorizontal: 20 },
  back: {
    position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center',
  },

  fromRow: { marginBottom: 14 },
  fromAvatar: { width: 56, height: 56, borderRadius: 18 },
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

  card: {
    width: CARD_W, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: withOpacity(Colors.white, 0.08),
  },
  cardDim: { opacity: 0.5 },
  posterFallback: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  posterTitle: {
    position: 'absolute', left: 16, right: 16, bottom: 14,
    fontFamily: FontFamily.displayExtraBold, fontSize: 24, lineHeight: 27, letterSpacing: -0.5, color: Colors.white,
  },
  stub: { paddingHorizontal: 18, paddingTop: 18, paddingBottom: 16, gap: 12 },
  notch: {
    position: 'absolute', top: -NOTCH / 2, width: NOTCH, height: NOTCH, borderRadius: NOTCH / 2,
    backgroundColor: Colors.background,
  },
  notchLeft: { left: -NOTCH / 2 },
  notchRight: { right: -NOTCH / 2 },
  stubRow: { flexDirection: 'row', gap: 16 },
  stubCol: { flex: 1, gap: 2 },
  stubLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.4, color: withOpacity(ON_TICKET, 0.55) },
  stubValue: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: ON_TICKET },
  admit: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.6, color: withOpacity(ON_TICKET, 0.5), marginTop: 2 },

  actions: { width: '100%', marginTop: 28, gap: 12 },
  fine: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, lineHeight: 18, color: Colors.inkDisabled, textAlign: 'center' },
  link: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
})

const b = StyleSheet.create({
  backOnPoster: { backgroundColor: 'rgba(0,0,0,0.4)' },
  fromChip: {
    position: 'absolute', left: 20, bottom: 26, right: 20,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  chipAvatar: { width: 34, height: 34, borderRadius: 11, borderWidth: 1.5, borderColor: withOpacity(Colors.white, 0.6) },
  chipInitial: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.inkPrimary },
  chipText: { flexShrink: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.white },
  body: { paddingHorizontal: 20, marginTop: -6, gap: 16 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, lineHeight: 35, letterSpacing: -0.8, color: Colors.inkPrimary },
  facts: {
    flexDirection: 'row', borderRadius: 18, borderWidth: 1, borderColor: Colors.divider,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.04),
  },
  fact: { flex: 1, paddingVertical: 12, paddingHorizontal: 12, gap: 3 },
  factBorder: { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: Colors.divider },
  factLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.3, color: Colors.inkDisabled },
  factValue: { fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.inkPrimary },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  freeText: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.inkPrimary },
  freeTextOff: { color: Colors.inkSecondary },
  fine: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, lineHeight: 18, color: Colors.inkDisabled, marginTop: -8 },
  bar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12,
    backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider,
  },
})
