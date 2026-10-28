import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Pressable, Dimensions, ActivityIndicator } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { ChevronLeft, ChevronRight, Clock3, Link2, Send } from 'lucide-react-native'
import { hSelection, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import type { CancelReason, MyCancelQuote, MyTransferQuote } from '@/api/apiService'

const MAX_SHEET_HEIGHT = Dimensions.get('window').height * 0.85

const REASONS: { key: CancelReason; label: string }[] = [
  { key: 'plans_changed', label: 'Plans changed' },
  { key: 'unwell', label: 'Not feeling well' },
  { key: 'date', label: "The date doesn't work" },
  { key: 'other', label: 'Something else' },
]

interface Props {
  visible: boolean
  cancelQuote: MyCancelQuote | null
  transfer: MyTransferQuote | null
  busy: boolean
  onSendToFriend: () => void
  onShareLink: () => void
  onWithdraw: () => void
  onCancel: (reason?: CancelReason) => void
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function refundLine(q: MyCancelQuote): string {
  if (q.kind === 'free') return 'Your spot goes to the next person. There is nothing to refund on a free event.'
  if (q.kind === 'moved') return `The host moved this event, so the full ₹${q.refund_inr} goes back to your Gorave Wallet.`
  return `₹${q.refund_inr} goes back to your Gorave Wallet. The ₹${q.fee_kept_inr} platform fee isn't refunded.`
}

/**
 * "Can't make it?" Passing the ticket on comes first: no empty spot for the
 * host, the friend gets a fresh ticket, and it works even inside the 48h
 * window where paid tickets can't be cancelled. Cancelling is still there,
 * one step down, with why and exactly what comes back.
 */
function CantMakeItSheetCore({ cancelQuote, transfer, busy, onSendToFriend, onShareLink, onWithdraw, onCancel, onClose }: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [step, setStep] = useState<'options' | 'cancel'>(() => (transfer?.allowed ? 'options' : 'cancel'))
  const [reason, setReason] = useState<CancelReason | null>(null)

  useEffect(() => { sheetRef.current?.present() }, [])

  const canPass = !!transfer?.allowed
  const canCancel = !!cancelQuote?.allowed
  const pending = transfer?.pending
  const free = cancelQuote?.kind === 'free'
  const cancelWord = free ? 'Cancel my spot' : 'Cancel ticket'

  const close = (then?: () => void) => {
    sheetRef.current?.dismiss()
    if (then) setTimeout(then, 250)
  }

  return (
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      maxDynamicContentSize={MAX_SHEET_HEIGHT}
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        {step === 'options' ? (
          <>
            <Text style={s.title}>Can&apos;t make it?</Text>
            <Text style={s.sub}>Send your ticket to a friend. They get a fresh one, and the night doesn&apos;t lose a guest.</Text>

            {pending ? (
              <View style={s.pending}>
                <Clock3 size={18} color={Colors.inkPrimary} strokeWidth={2} />
                <View style={{ flex: 1 }}>
                  <Text style={s.pendingTitle}>
                    {pending.to_name ? `Waiting for ${pending.to_name} to accept` : 'Your link is out'}
                  </Text>
                  <Text style={s.pendingSub}>
                    {pending.to_name ? 'Your ticket works until they do.' : 'The first person to open it gets your ticket. It works until then.'}
                  </Text>
                </View>
                <Pressable onPress={() => { hTap(); onWithdraw() }} hitSlop={8}>
                  <Text style={s.withdraw}>Withdraw</Text>
                </Pressable>
              </View>
            ) : null}

            {canPass ? (
              <View style={s.card}>
                <Pressable style={s.row} onPress={() => { hTap(); close(onSendToFriend) }}>
                  <View style={s.rowIcon}><Send size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowLabel}>Send to a friend</Text>
                    <Text style={s.rowSub}>Someone you chat with on Gorave</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
                </Pressable>
                <Pressable style={[s.row, s.rowBorder]} onPress={() => { hTap(); onShareLink() }}>
                  <View style={s.rowIcon}><Link2 size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.rowLabel}>{pending && !pending.to_name ? 'Share the link again' : 'Share a link'}</Text>
                    <Text style={s.rowSub}>For a friend who isn&apos;t on Gorave yet</Text>
                  </View>
                  <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
                </Pressable>
              </View>
            ) : null}

            {canCancel ? (
              <Pressable style={s.cancelLink} onPress={() => { hTap(); setStep('cancel') }} hitSlop={8}>
                <Text style={s.cancelLinkText}>{cancelWord} instead</Text>
              </Pressable>
            ) : cancelQuote?.reason ? (
              <Text style={s.note}>{cancelQuote.reason}. Sending it to a friend still works until the start.</Text>
            ) : null}
          </>
        ) : (
          <>
            <View style={s.titleRow}>
              {canPass ? (
                <Pressable onPress={() => { hTap(); setStep('options') }} hitSlop={10} style={s.back}>
                  <ChevronLeft size={20} color={Colors.inkPrimary} strokeWidth={2.2} />
                </Pressable>
              ) : null}
              <Text style={[s.title, { flex: 1 }]}>{canCancel ? 'Why are you cancelling?' : "Can't make it?"}</Text>
            </View>

            {canCancel && cancelQuote ? (
              <>
                <Text style={s.sub}>Optional, it helps the host plan the night.</Text>
                <View style={s.chips}>
                  {REASONS.map(r => {
                    const on = reason === r.key
                    return (
                      <Pressable
                        key={r.key}
                        style={[s.chip, on && s.chipOn]}
                        onPress={() => { hSelection(); setReason(on ? null : r.key) }}
                      >
                        <Text style={[s.chipText, on && s.chipTextOn]}>{r.label}</Text>
                      </Pressable>
                    )
                  })}
                </View>
                <Text style={s.refund}>{refundLine(cancelQuote)}</Text>
                <Pressable
                  style={[s.danger, busy && { opacity: 0.6 }]}
                  disabled={busy}
                  onPress={() => { hTap(); onCancel(reason ?? undefined) }}
                >
                  {busy ? <ActivityIndicator color={Colors.white} /> : <Text style={s.dangerText}>{cancelWord}</Text>}
                </Pressable>
                <Pressable style={s.keep} onPress={() => close()} hitSlop={6}>
                  <Text style={s.keepText}>{free ? 'Keep my spot' : 'Keep my ticket'}</Text>
                </Pressable>
              </>
            ) : (
              <Text style={s.note}>{cancelQuote?.reason ?? transfer?.reason ?? "This can't be changed now."}</Text>
            )}
          </>
        )}
        <View style={{ height: 28 }} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

export function CantMakeItSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <CantMakeItSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.elevated, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  back: { paddingVertical: 4, paddingRight: 2, marginLeft: 2 },
  title: {
    fontFamily: FontFamily.displayExtraBold, fontSize: 26, letterSpacing: -0.6,
    color: Colors.inkPrimary, paddingHorizontal: 4, paddingTop: 4,
  },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, paddingHorizontal: 4, marginTop: 6, marginBottom: 16 },
  pending: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 18, marginBottom: 12,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
  },
  pendingTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.inkPrimary },
  pendingSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkSecondary, marginTop: 1 },
  withdraw: { fontFamily: FontFamily.bodySemiBold, fontSize: 13.5, color: Colors.inkPrimary },
  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15.5, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12.5, color: Colors.inkDisabled, marginTop: 1 },
  cancelLink: { alignSelf: 'center', paddingVertical: 14, marginTop: 8 },
  cancelLinkText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.destructive },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 19, color: Colors.inkSecondary, textAlign: 'center', paddingHorizontal: 16, marginTop: 14 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 4 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999,
    borderWidth: 1, borderColor: Colors.divider, backgroundColor: 'transparent',
  },
  chipOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  chipText: { fontFamily: FontFamily.bodyMedium, fontSize: 13.5, color: Colors.inkSecondary },
  chipTextOn: { fontFamily: FontFamily.bodySemiBold, color: Colors.background },
  refund: { fontFamily: FontFamily.bodyRegular, fontSize: 13.5, lineHeight: 19, color: Colors.inkSecondary, paddingHorizontal: 4, marginTop: 18 },
  danger: { marginTop: 16, height: 52, borderRadius: 26, backgroundColor: Colors.destructive, alignItems: 'center', justifyContent: 'center' },
  dangerText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.white },
  keep: { alignSelf: 'center', paddingVertical: 12, marginTop: 4 },
  keepText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14.5, color: Colors.inkPrimary },
})
