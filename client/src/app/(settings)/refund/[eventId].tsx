import { useCallback, useState } from 'react'
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { ArrowLeft, Check, CreditCard, Landmark, Smartphone, Wallet } from 'lucide-react-native'
import ApiService, { type RefundItem } from '@/api/apiService'
import { AppHeader, HeaderIconBtn, PrimaryButton, OutlineButton, BrandedLoader, ConfirmSheet } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import { hSuccess, hTap } from '@/lib/haptics'

type Choice = 'wallet' | 'source'

const day = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''

/** Banks quote 5 to 7 business days; 9 calendar days covers a weekend either side. */
const arrivesBy = (sentAt: string | null) => (sentAt ? day(new Date(new Date(sentAt).getTime() + 9 * 86400000).toISOString()) : '')

/**
 * Your refund. Money always lands in the Gorave Wallet first, so nobody waits.
 * Here you choose to keep it there (instant, never expires) or send the
 * card/UPI part back to where it came from.
 */
export default function RefundScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>()
  const insets = useSafeAreaInsets()
  const showPill = usePillStore(s => s.show)
  const [refund, setRefund] = useState<RefundItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [choice, setChoice] = useState<Choice | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!eventId) return
    try {
      const { items } = await ApiService.getRefunds(eventId)
      const r = items[0] ?? null
      setRefund(r)
      setChoice(c => c ?? (r?.choice_made ? 'wallet' : null))
    } catch (e: any) {
      showPill(e?.message || "Couldn't load your refund", 'error')
    } finally {
      setLoading(false)
    }
  }, [eventId, showPill])

  useFocusEffect(useCallback(() => { void load() }, [load]))

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/(settings)/wallet' as any))

  const keep = async () => {
    if (!refund) return
    setBusy(true)
    try {
      await ApiService.keepRefund(refund.id)
      hSuccess()
      showPill(`₹${refund.amount_inr} is in your Gorave Wallet`, 'default')
      leave()
    } catch (e: any) {
      showPill(e?.message || "That didn't go through, try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const sendBack = async () => {
    if (!refund) return
    setConfirmOpen(false)
    setBusy(true)
    try {
      const res = await ApiService.sendRefundBack(refund.id)
      hSuccess()
      showPill(`₹${res.amount_inr} is on its way back`, 'default')
      await load()
    } catch (e: any) {
      showPill(e?.message || "We couldn't start the refund, try again", 'error')
    } finally {
      setBusy(false)
    }
  }

  const header = (
    <AppHeader
      title="Your refund"
      leftAction={<HeaderIconBtn onPress={leave}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>}
    />
  )

  if (loading) {
    return <View style={s.root}>{header}<View style={s.center}><BrandedLoader /></View></View>
  }

  if (!refund) {
    return (
      <View style={s.root}>
        {header}
        <View style={[s.center, { paddingHorizontal: 32 }]}>
          <Text style={s.emptyTitle}>No refund here</Text>
          <Text style={s.emptyBody}>Nothing was refunded for this event. Your wallet has the full history.</Text>
          <OutlineButton label="Open wallet" size="small" style={{ marginTop: 18 }} onPress={() => router.replace('/(settings)/wallet' as any)} />
        </View>
      </View>
    )
  }

  const methodLabel = refund.method?.label ?? 'your original payment method'
  const MethodIcon = refund.method?.kind === 'card' ? CreditCard : refund.method?.kind === 'bank' ? Landmark : Smartphone
  const walletPart = refund.amount_inr - refund.to_source_inr
  const sentOrDone = refund.status === 'processing' || refund.status === 'done'
  const canChoose = refund.sendable_inr > 0 && !sentOrDone
  const spent = refund.to_source_inr > 0 && !sentOrDone && !refund.window_closed && refund.sendable_inr === 0

  return (
    <View style={s.root}>
      {header}
      <ScrollView contentContainerStyle={[s.body, { paddingBottom: canChoose ? 140 + insets.bottom : 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {refund.event ? (
          <Pressable style={s.event} onPress={() => { hTap(); router.push(`/(events)/${refund.event!.id}` as any) }}>
            {refund.event.cover
              ? <Image source={{ uri: refund.event.cover }} style={s.poster} contentFit="cover" cachePolicy="memory-disk" transition={120} />
              : <View style={[s.poster, s.posterEmpty]} />}
            <View style={s.flex}>
              <Text style={s.eventTitle} numberOfLines={2}>{refund.event.title}</Text>
              <Text style={s.eventSub}>{refund.event.cancelled ? 'Event cancelled' : 'Ticket cancelled'} · refunded {day(refund.created_at)}</Text>
            </View>
          </Pressable>
        ) : null}

        <View style={s.amountBlock}>
          <Text style={s.amount}>₹{refund.amount_inr.toLocaleString('en-IN')}</Text>
          <Text style={s.amountSub}>
            {sentOrDone
              ? refund.to_source_inr < refund.amount_inr
                ? `₹${refund.to_source_inr} going back to ${methodLabel}, ₹${walletPart} in your wallet`
                : `Going back to ${methodLabel}`
              : 'Back with you. It’s in your Gorave Wallet right now.'}
          </Text>
        </View>

        {canChoose ? (
          <>
            <Text style={s.label}>WHERE SHOULD IT GO?</Text>
            <Option
              selected={choice === 'wallet'}
              onPress={() => setChoice('wallet')}
              icon={<Wallet size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
              title="Keep in Gorave Wallet"
              tag="Instant"
              body="Use it on any event. It never expires."
            />
            <Option
              selected={choice === 'source'}
              onPress={() => setChoice('source')}
              icon={<MethodIcon size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
              title={refund.method ? `Back to ${methodLabel}` : 'Back to how you paid'}
              tag="5 to 7 days"
              body={
                walletPart > 0
                  ? `₹${refund.sendable_inr} goes back to ${methodLabel}. The ₹${walletPart} you paid from your wallet stays in your wallet.`
                  : 'Your bank takes 5 to 7 business days to show it.'
              }
            />
            {refund.send_back_until ? (
              <Text style={s.foot}>Keep it now and change your mind later: you can send it back from Wallet until {day(refund.send_back_until)}.</Text>
            ) : null}
          </>
        ) : sentOrDone ? (
          <View style={s.card}>
            <Step done title="Refund started" sub={day(refund.sent_at)} />
            <View style={s.stepLine} />
            <Step
              done={refund.status === 'done'}
              title={refund.status === 'done' ? `Sent to ${methodLabel}` : `Reaches ${methodLabel}`}
              sub={refund.status === 'done' ? 'Your bank may take a day to show it' : `by ${arrivesBy(refund.sent_at)}`}
            />
            <Text style={s.cardNote}>Not there by {arrivesBy(refund.sent_at)}? Write to us from Help and Support and we’ll chase it with the bank.</Text>
          </View>
        ) : (
          <View style={s.card}>
            <View style={s.cardRow}>
              <View style={s.iconCircle}><Wallet size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
              <View style={s.flex}>
                <Text style={s.cardTitle}>In your Gorave Wallet</Text>
                <Text style={s.cardBody}>
                  {refund.to_source_inr === 0
                    ? 'You paid from your wallet, so that’s where it went back. Ready to use, and it never expires.'
                    : refund.window_closed
                      ? 'It’s too long since you paid for this to go back to your card or UPI. It’s safe in your wallet and never expires. Need it in your bank? Write to Help and Support.'
                      : spent
                        ? 'This money has already gone on another ticket, so there’s nothing left to send back.'
                        : 'Ready to use on any event. It never expires.'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {canChoose ? (
        <View style={[s.bar, { paddingBottom: 12 + insets.bottom }]}>
          <PrimaryButton
            label={choice === 'source' ? `Send ₹${refund.sendable_inr} back` : choice === 'wallet' ? 'Keep in wallet' : 'Choose where it goes'}
            disabled={!choice}
            loading={busy}
            onPress={() => (choice === 'source' ? setConfirmOpen(true) : keep())}
          />
        </View>
      ) : null}

      <ConfirmSheet
        visible={confirmOpen}
        title={`Send ₹${refund.sendable_inr} back?`}
        body={`It leaves your Gorave Wallet now and reaches ${methodLabel} in 5 to 7 business days. This can’t be undone.`}
        confirmLabel="Send it back"
        cancelLabel="Keep in wallet"
        onConfirm={sendBack}
        onClose={() => setConfirmOpen(false)}
      />
    </View>
  )
}

function Option({ selected, onPress, icon, title, tag, body }: {
  selected: boolean; onPress: () => void; icon: React.ReactNode; title: string; tag: string; body: string
}) {
  return (
    <Pressable
      onPress={() => { hTap(); onPress() }}
      style={[s.option, selected && s.optionOn]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
    >
      <View style={s.iconCircle}>{icon}</View>
      <View style={s.flex}>
        <View style={s.optionTop}>
          <Text style={s.optionTitle} numberOfLines={1}>{title}</Text>
          <Text style={s.tag}>{tag}</Text>
        </View>
        <Text style={s.optionBody}>{body}</Text>
      </View>
      <View style={[s.radio, selected && s.radioOn]}>{selected ? <View style={s.radioDot} /> : null}</View>
    </Pressable>
  )
}

function Step({ done, title, sub }: { done: boolean; title: string; sub: string }) {
  return (
    <View style={s.step}>
      <View style={[s.stepDot, done && s.stepDotDone]}>{done ? <Check size={12} color={Colors.background} strokeWidth={3} /> : null}</View>
      <View style={s.flex}>
        <Text style={[s.stepTitle, !done && s.stepTitleOff]}>{title}</Text>
        {sub ? <Text style={s.stepSub}>{sub}</Text> : null}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1 },
  body: { paddingHorizontal: 20, paddingTop: 8, gap: 12 },

  event: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 4 },
  poster: { width: 48, height: 60, borderRadius: 10 },
  posterEmpty: { backgroundColor: Colors.elevated },
  eventTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  eventSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 3 },

  amountBlock: { paddingTop: 18, paddingBottom: 10 },
  amount: { fontFamily: FontFamily.displayExtraBold, fontSize: 48, letterSpacing: -1.5, color: Colors.inkPrimary },
  amountSub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, marginTop: 2 },

  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled, marginTop: 10 },

  option: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.divider },
  optionOn: { borderColor: Colors.inkPrimary },
  optionTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  optionTitle: { flexShrink: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  optionBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, marginTop: 3 },
  tag: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.inkSecondary, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), overflow: 'hidden' },
  iconCircle: { width: 38, height: 38, borderRadius: 19, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.inkDisabled, alignItems: 'center', justifyContent: 'center' },
  radioOn: { borderColor: Colors.inkPrimary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.inkPrimary },
  foot: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 18, color: Colors.inkDisabled, paddingHorizontal: 4, marginTop: 2 },

  card: { padding: 18, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, marginTop: 8 },
  cardRow: { flexDirection: 'row', gap: 12 },
  cardTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  cardBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, marginTop: 3 },
  cardNote: { fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 18, color: Colors.inkDisabled, marginTop: 16 },

  step: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  stepDot: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.inkDisabled, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  stepDotDone: { backgroundColor: Colors.accentGreen, borderColor: Colors.accentGreen },
  stepLine: { width: 2, height: 22, backgroundColor: Colors.divider, marginLeft: 10, marginVertical: 4 },
  stepTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  stepTitleOff: { color: Colors.inkSecondary },
  stepSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },

  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  emptyBody: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, textAlign: 'center', marginTop: 6 },

  bar: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
})
