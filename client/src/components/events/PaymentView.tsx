import { useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, AtSign, ChevronDown, ChevronRight, ChevronUp, Lock, QrCode, Wallet } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { UpiAppIcon } from '@/components/upi/UpiAppIcon'
import { hTap } from '@/lib/haptics'
import { TicketPaper } from '@/components/events/TicketView'
import type { UpiApp } from '@/hooks/useInstalledUpiApps'

const UPI_LOGO = require('../../../assets/images/payments/upiLogo.png')

export interface PaymentViewProps {
  eventTitle: string
  ticketPrice: number
  platformFee: number
  walletApplied: number
  amountToPay: number
  upiApps: UpiApp[]
  upiAppsLoading: boolean
  recommendedApp: UpiApp | undefined
  /** True when the recommended app is the one used last time. */
  recommendedIsLast: boolean
  onWalletPay: () => void
  onUpiApp: (packageName: string) => void
  onQrPress: () => void
  onEnterUpiId: () => void
  onBack: () => void
}

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * Payment. The amount sits on the maroon ticket you're buying, with the
 * bill folded inside it, then every way to pay: the app you used last as
 * one big row, every UPI app on the phone as a grid of icons, then QR and
 * UPI ID. Checkout like Swiggy or Zepto, in Gorave's ticket.
 */
export function PaymentView(p: PaymentViewProps) {
  const insets = useSafeAreaInsets()
  const [billOpen, setBillOpen] = useState(false)
  const rec = p.recommendedApp
  const others = p.upiApps.filter(a => a.package_name !== rec?.package_name)

  return (
    <View style={[s.root, { paddingTop: insets.top }]}>
      <View style={s.bar}>
        <Pressable style={s.iconBtn} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Text style={s.barTitle}>Payment</Text>
        <View style={s.iconBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}>
        <View style={s.stub}>
          <TicketPaper />
          <View style={s.stubBody}>
            <Text style={s.stubLabel}>PAYING FOR</Text>
            <Text style={s.stubEvent} numberOfLines={2}>{p.eventTitle}</Text>
            <Text style={s.amount}>{inr(p.amountToPay)}</Text>
          </View>
          <View style={s.perf}>
            <View style={[s.notch, { marginLeft: -12 }]} />
            <View style={s.dash} />
            <View style={[s.notch, { marginRight: -12 }]} />
          </View>
          <Pressable style={s.billToggle} onPress={() => { hTap(); setBillOpen(v => !v) }} hitSlop={6}>
            <Text style={s.billToggleText}>{billOpen ? 'Hide the bill' : 'See the bill'}</Text>
            {billOpen ? <ChevronUp size={14} color={STUB_INK_2} strokeWidth={2} /> : <ChevronDown size={14} color={STUB_INK_2} strokeWidth={2} />}
          </Pressable>
          {billOpen ? (
            <View style={s.bill}>
              <BillRow label="Ticket" value={inr(p.ticketPrice)} />
              <BillRow label="Platform fee" value={inr(p.platformFee)} />
              {p.walletApplied > 0 ? <BillRow label="Gorave Wallet" value={`-${inr(p.walletApplied)}`} /> : null}
            </View>
          ) : null}
        </View>

        {p.amountToPay === 0 ? (
          <Pressable style={s.bigRow} onPress={() => { hTap(); p.onWalletPay() }}>
            <View style={s.methodIcon}><Wallet size={22} color={Colors.inkPrimary} strokeWidth={2} /></View>
            <View style={{ flex: 1 }}>
              <Text style={s.bigLabel}>Pay with Gorave Wallet</Text>
              <Text style={s.bigSub}>Covers the whole amount</Text>
            </View>
            <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
          </Pressable>
        ) : (
          <>
            {rec ? (
              <>
                <Text style={s.section}>{p.recommendedIsLast ? 'Used last time' : 'Recommended'}</Text>
                <Pressable style={s.bigRow} onPress={() => { hTap(); p.onUpiApp(rec.package_name) }}>
                  <UpiAppIcon app={rec} size={44} />
                  <View style={{ flex: 1 }}>
                    <Text style={s.bigLabel}>{rec.app_name}</Text>
                    <Text style={s.bigSub}>Opens {rec.app_name}, you approve, done</Text>
                  </View>
                  <View style={s.payPill}><Text style={s.payPillText}>Pay {inr(p.amountToPay)}</Text></View>
                </Pressable>
              </>
            ) : null}

            <View style={s.sectionRow}>
              <Image source={UPI_LOGO} style={s.upiLogo} contentFit="contain" />
              <Text style={s.sectionInline}>UPI apps on this phone</Text>
            </View>
            {p.upiAppsLoading ? (
              <ActivityIndicator style={{ marginVertical: 20 }} color={Colors.inkDisabled} />
            ) : others.length === 0 && !rec ? (
              <Text style={s.none}>No UPI apps found. Scan a QR or enter your UPI ID instead.</Text>
            ) : (
              <View style={s.grid}>
                {others.map(app => (
                  <Pressable key={app.package_name} style={s.gridItem} onPress={() => { hTap(); p.onUpiApp(app.package_name) }}>
                    <UpiAppIcon app={app} size={48} />
                    <Text style={s.gridLabel} numberOfLines={1}>{app.app_name}</Text>
                  </Pressable>
                ))}
              </View>
            )}

            <Text style={s.section}>More ways to pay</Text>
            <View style={s.list}>
              <ListRow icon={<QrCode size={20} color={Colors.inkPrimary} strokeWidth={2} />} label="Scan a QR code" sub="From another phone or share it with a friend" onPress={p.onQrPress} />
              <ListRow icon={<AtSign size={20} color={Colors.inkPrimary} strokeWidth={2} />} label="Enter UPI ID" sub="Approve the request in your UPI app" onPress={p.onEnterUpiId} last />
            </View>
          </>
        )}

        <View style={s.secure}>
          <Lock size={12} color={Colors.inkDisabled} strokeWidth={2} />
          <Text style={s.secureText}>Payments by Razorpay. Gorave never sees your UPI PIN.</Text>
        </View>
      </ScrollView>
    </View>
  )
}

function BillRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.billRow}>
      <Text style={s.billLabel}>{label}</Text>
      <Text style={s.billValue}>{value}</Text>
    </View>
  )
}

function ListRow({ icon, label, sub, onPress, last }: { icon: React.ReactNode; label: string; sub: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[s.listRow, !last && s.listBorder]} onPress={() => { hTap(); onPress() }}>
      <View style={s.methodIconSm}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.listLabel}>{label}</Text>
        <Text style={s.listSub}>{sub}</Text>
      </View>
      <ChevronRight size={18} color={Colors.inkDisabled} strokeWidth={2} />
    </Pressable>
  )
}

const STUB_INK = Colors.white
const STUB_INK_2 = withOpacity(Colors.white, 0.6)

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  bar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 6 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },

  stub: { marginHorizontal: 16, marginTop: 8, marginBottom: 22, borderRadius: 22, overflow: 'hidden' },
  stubBody: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 14 },
  stubLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.6, color: STUB_INK_2 },
  stubEvent: { fontFamily: FontFamily.headingBold, fontSize: 18, lineHeight: 22, color: STUB_INK, marginTop: 4 },
  amount: { fontFamily: FontFamily.displayExtraBold, fontSize: 52, letterSpacing: -1.5, color: STUB_INK, marginTop: 10 },
  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(STUB_INK, 0.25), marginHorizontal: 8 },
  billToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingTop: 4, paddingBottom: 16 },
  billToggleText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: STUB_INK_2 },
  bill: { marginHorizontal: 20, marginBottom: 18, gap: 8 },
  billRow: { flexDirection: 'row', justifyContent: 'space-between' },
  billLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: STUB_INK_2 },
  billValue: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: STUB_INK },
  payPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.inkPrimary },
  payPillText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },

  section: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, marginHorizontal: 20, marginTop: 8, marginBottom: 10 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 20, marginTop: 24, marginBottom: 12 },
  sectionInline: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  upiLogo: { width: 34, height: 14 },

  bigRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginHorizontal: 16, padding: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  methodIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  bigLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  bigSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 2 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, rowGap: 16 },
  gridItem: { width: '25%', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  gridLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkSecondary, textAlign: 'center' },
  none: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginHorizontal: 20 },

  list: { marginHorizontal: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  listRow: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14 },
  listBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  methodIconSm: { width: 40, height: 40, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  listLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  listSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },

  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 24 },
  secureText: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled },
})
