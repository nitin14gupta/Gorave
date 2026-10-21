import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { CheckCircle, RefreshCw, Share2, X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { LogoMark } from '@/components/ui'
import QRCode from 'react-native-qrcode-svg'
import { TICKET, TicketPaper } from '@/components/events/TicketView'
import { hTap } from '@/lib/haptics'
import type { Ref } from 'react'

const UPI_LOGO = require('../../../assets/images/payments/upiLogo.png')

export interface QrPayViewProps {
  /** The card that "Share" captures as an image. */
  cardRef: Ref<View>
  eventTitle: string
  amountInr: number
  /** UPI payment string; we draw our own QR from it. */
  paymentUrl: string
  /** Razorpay's QR image, the fallback when there's no payment string. */
  imageUrl: string
  isExpired: boolean
  /** Seconds until the QR expires. */
  timeLeft: number
  verifying: boolean
  onPaid: () => void
  onShare: () => void
  onNewQr: () => void
  onBack: () => void
}

/** QR codes from Razorpay last 15 minutes. */
export const QR_LIFETIME_S = 15 * 60

export const mmss = (secs: number) => `${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`
export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Pay by QR, as the counter standee at a chai shop: printed on the same
 * maroon ticket as the ticket screen, brand on top, the amount, the code
 * on cream, UPI at the foot. The timer sits under it, set big.
 */
export function QrPayView({ cardRef, eventTitle, amountInr, paymentUrl, imageUrl, isExpired, timeLeft, verifying, onPaid, onShare, onNewQr, onBack }: QrPayViewProps) {
  const insets = useSafeAreaInsets()
  const low = timeLeft < 60

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Text style={s.barTitle}>Scan and pay</Text>
        <Pressable style={s.close} onPress={onBack} hitSlop={8}>
          <X size={18} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
        <View ref={cardRef} collapsable={false} style={s.standee}>
          <TicketPaper />
          <View style={s.brand}>
            <LogoMark size={18} />
            <Text style={s.brandText}>GORAVE</Text>
          </View>
          <Text style={s.payLine}>Scan and pay</Text>
          <Text style={s.amount}>{inr(amountInr)}</Text>
          <Text style={s.event} numberOfLines={1}>{eventTitle}</Text>

          <View style={[s.qr, isExpired && { opacity: 0.2 }]}>
            {paymentUrl ? (
              <QRCode value={paymentUrl} size={228} color={TICKET.qrInk} backgroundColor={TICKET.qrPaper} ecl="M" />
            ) : imageUrl ? (
              <Image source={{ uri: imageUrl }} style={{ width: 228, height: 228 }} contentFit="contain" />
            ) : null}
            {isExpired ? <View style={s.expiredTag}><Text style={s.expiredText}>EXPIRED</Text></View> : null}
          </View>

          <View style={s.foot}>
            <View style={s.upiChip}><Image source={UPI_LOGO} style={s.upi} contentFit="contain" /></View>
            <Text style={s.footText}>Any UPI app works</Text>
          </View>
        </View>

        {!isExpired ? (
          <View style={s.timerBlock}>
            <Text style={[s.timer, low && { color: Colors.destructive }]}>{mmss(timeLeft)}</Text>
            <Text style={s.timerSub}>left on this code. Your ticket appears here once it&apos;s paid.</Text>
          </View>
        ) : (
          <View style={s.timerBlock}>
            <Text style={s.timerSub}>Codes last 15 minutes. Get a fresh one to pay.</Text>
          </View>
        )}
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        {isExpired ? (
          <Pressable style={s.primary} onPress={() => { hTap(); onNewQr() }}>
            <RefreshCw size={17} color={Colors.background} strokeWidth={2} />
            <Text style={s.primaryText}>Get a new code</Text>
          </Pressable>
        ) : (
          <>
            <Pressable style={s.primary} onPress={() => { hTap(); onShare() }}>
              <Share2 size={17} color={Colors.background} strokeWidth={2} />
              <Text style={s.primaryText}>Send to a friend to pay</Text>
            </Pressable>
            <Pressable style={s.secondary} onPress={onPaid} disabled={verifying}>
              <CheckCircle size={16} color={Colors.inkPrimary} strokeWidth={2} />
              <Text style={s.secondaryText}>{verifying ? 'Checking…' : 'I’ve paid, check now'}</Text>
            </Pressable>
          </>
        )}
      </View>
    </View>
  )
}

const INK = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10 },
  barTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, letterSpacing: -0.6, color: Colors.inkPrimary },
  close: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), alignItems: 'center', justifyContent: 'center' },

  standee: { marginTop: 8, borderRadius: 26, overflow: 'hidden', alignItems: 'center', paddingTop: 22, paddingBottom: 18, paddingHorizontal: 20 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  brandText: { fontFamily: FontFamily.displayExtraBold, fontSize: 14, letterSpacing: 2.4, color: INK },
  payLine: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: withOpacity(INK, 0.6), marginTop: 18 },
  amount: { fontFamily: FontFamily.displayExtraBold, fontSize: 46, letterSpacing: -1.4, color: INK },
  event: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: withOpacity(INK, 0.6), marginBottom: 16 },
  qr: { padding: 14, borderRadius: 18, backgroundColor: TICKET.qrPaper },
  expiredTag: { position: 'absolute', alignSelf: 'center', top: '45%', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: TICKET.qrInk },
  expiredText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 2, color: TICKET.qrPaper },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, paddingTop: 14, alignSelf: 'stretch', justifyContent: 'center', borderTopWidth: 1, borderStyle: 'dashed', borderColor: withOpacity(INK, 0.18) },
  upi: { width: 40, height: 16 },
  upiChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: TICKET.qrPaper },
  footText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(INK, 0.6) },

  timerBlock: { alignItems: 'center', marginTop: 22, gap: 4 },
  timer: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, letterSpacing: -1, color: Colors.inkPrimary },
  timerSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center', paddingHorizontal: 20 },

  footer: { paddingHorizontal: 20, paddingTop: 12, gap: 6 },
  primary: { height: 54, borderRadius: 999, backgroundColor: Colors.inkPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.background },
  secondary: { height: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  secondaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
