import { Dimensions, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, ShieldCheck, Wallet } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity, eventImageHeight } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import { eventDateParts } from '@/components/events/EventCard'
import { TicketPaper } from '@/components/events/TicketView'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { hSelection, hSuccess } from '@/lib/haptics'
import type { EventDetail } from '@/api/apiService'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const HERO_H = Math.min(eventImageHeight(W), SCREEN_H * 0.48)

export interface BookViewProps {
  event: EventDetail
  walletBalance: number
  walletEnabled: boolean
  onWallet: (on: boolean) => void
  platformFee: number
  total: number
  walletApplied: number
  toPay: number
  payLabel: string
  paying: boolean
  onPay: () => void
  onBack: () => void
}

export const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`

/**
 * The ticket you're buying. Poster on top (parallax), then the maroon
 * ticket you'll get, unpunched, with the price on it, and the bill under
 * it like a receipt. Same stub as the ticket screen, so booking and the
 * ticket feel like one object.
 */
export function BookView(p: BookViewProps) {
  const insets = useSafeAreaInsets()
  const ev = p.event
  const parts = eventDateParts(ev.date_time)
  const cover = ev.cover_photos?.[0]?.url
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)

  return (
    <View style={s.root}>
      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>
        <View style={s.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
          </Animated.View>
          <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
          <Animated.View style={[s.heroText, textStyle]}>
            <Text style={s.kicker}>{ev.is_free ? 'CONFIRM YOUR SPOT' : 'CHECKOUT'}</Text>
            <Text style={s.title} numberOfLines={2}>{ev.title}</Text>
          </Animated.View>
        </View>

        <View style={s.stubWrap}>
          <View style={s.stub}>
            <TicketPaper />
            <View style={s.stubTop}>
              <View>
                <Text style={s.small}>{parts?.dow.toUpperCase() ?? ''}</Text>
                <Text style={s.day}>{parts?.day ?? '--'}</Text>
                <Text style={s.small}>{parts?.mon.toUpperCase() ?? ''}</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={s.small}>ADMIT ONE</Text>
                <Text style={s.price}>{ev.is_free ? 'Free' : inr(ev.price_inr)}</Text>
                <Text style={s.stubSub} numberOfLines={1}>{parts?.time ?? ''}{ev.area ? ` · ${ev.area}` : ''}</Text>
              </View>
            </View>
            <View style={s.perf}>
              <View style={[s.notch, { marginLeft: -12 }]} />
              <View style={s.dash} />
              <View style={[s.notch, { marginRight: -12 }]} />
            </View>
            <Text style={s.stubFoot}>Your QR appears here once you&apos;re in</Text>
          </View>
        </View>

        {!ev.is_free ? (
          <View style={s.receipt}>
            <Row label="Ticket" value={inr(ev.price_inr)} />
            <Row label="Platform fee" value={inr(p.platformFee)} />
            {p.walletApplied > 0 ? <Row label="From your wallet" value={`-${inr(p.walletApplied)}`} accent /> : null}
            <View style={s.receiptRule} />
            <Row label="You pay" value={inr(p.toPay)} big />
          </View>
        ) : null}

        {!ev.is_free && p.walletBalance > 0 && !ev.is_cancelled ? (
          <Pressable style={[s.wallet, p.walletEnabled && s.walletOn]} onPress={() => { hSelection(); p.onWallet(!p.walletEnabled) }}>
            <Wallet size={18} color={Colors.inkPrimary} strokeWidth={2} />
            <View style={{ flex: 1 }}>
              <Text style={s.walletLabel}>Use Gorave Wallet</Text>
              <Text style={s.walletSub}>{inr(p.walletBalance)} available</Text>
            </View>
            <Switch
              value={p.walletEnabled}
              onValueChange={v => { hSelection(); p.onWallet(v) }}
              trackColor={{ false: Colors.divider, true: Colors.inkPrimary }}
              thumbColor={Colors.white}
            />
          </Pressable>
        ) : null}

        <View style={s.policy}>
          <ShieldCheck size={15} color={Colors.inkSecondary} strokeWidth={2} />
          <Text style={s.policyText}>If the host cancels, you get the full amount back in your Gorave Wallet.</Text>
        </View>
      </Animated.ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={p.onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <PrimaryButton
          label={p.payLabel}
          onPress={() => { if (!ev.is_cancelled) { hSuccess(); p.onPay() } }}
          disabled={ev.is_cancelled || p.paying}
          loading={p.paying}
        />
      </View>
    </View>
  )
}

function Row({ label, value, big, accent }: { label: string; value: string; big?: boolean; accent?: boolean }) {
  return (
    <View style={s.row}>
      <Text style={[s.rowLabel, big && s.rowBig, accent && { color: Colors.accentGreen }]}>{label}</Text>
      <Text style={[s.rowValue, big && s.rowBig, accent && { color: Colors.accentGreen }]}>{value}</Text>
    </View>
  )
}

const ON = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { height: HERO_H, overflow: 'hidden' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 50, gap: 6 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 30, lineHeight: 33, letterSpacing: -0.6, color: Colors.white },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  stubWrap: { marginTop: -30, paddingHorizontal: 16 },
  stub: { borderRadius: 22, overflow: 'hidden' },
  stubTop: { flexDirection: 'row', padding: 20, gap: 16 },
  small: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.4, color: withOpacity(ON, 0.55) },
  day: { fontFamily: FontFamily.displayExtraBold, fontSize: 44, lineHeight: 48, color: ON, letterSpacing: -1 },
  price: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, color: ON, marginTop: 4 },
  stubSub: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(ON, 0.7), marginTop: 2 },
  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(ON, 0.25), marginHorizontal: 8 },
  stubFoot: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(ON, 0.6), textAlign: 'center', paddingTop: 6, paddingBottom: 18 },

  receipt: { marginHorizontal: 20, marginTop: 24, gap: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  rowLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary },
  rowValue: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  rowBig: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary },
  receiptRule: { borderTopWidth: 1, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.2) },

  wallet: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 16, marginTop: 22, padding: 14, borderRadius: 16, borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.surface },
  walletOn: { borderColor: withOpacity(Colors.inkPrimary, 0.5) },
  walletLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  walletSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  policy: { flexDirection: 'row', gap: 10, marginHorizontal: 20, marginTop: 18 },
  policyText: { flex: 1, fontFamily: FontFamily.bodyRegular, fontSize: 12, lineHeight: 18, color: Colors.inkSecondary },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
})
