import { Dimensions, Image as RNImage, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn } from 'react-native-reanimated'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, BadgeCheck, CalendarX2, MapPin, Percent, ShieldCheck, Users, Wallet } from 'lucide-react-native'
import { Colors, FontFamily, HOST_BADGE_IMAGES, HOST_COMMISSION_PERCENT_LABEL, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'
import type { ReactNode } from 'react'

export interface HostWizardProps {
  step: number
  total: number
  cta: string
  ctaDisabled: boolean
  ctaLoading: boolean
  onBack: () => void
  onContinue: () => void
  /** Step 4: the agreement with its sign button. */
  agreement: ReactNode
  /** Step 5: payout details form. */
  payout: ReactNode
  keyboardVisible: boolean
}


const { height: H } = Dimensions.get('window')
const PHOTO_H = Math.round(H * 0.42)
// Photos from the welcome posters (assets/images/welcome), one per step.
const PHOTOS = [
  require('../../../assets/images/welcome/confetti.webp'),   // step 1: throw the night
  require('../../../assets/images/welcome/dj-night.webp'),   // step 2: it's your night to run
  require('../../../assets/images/welcome/girls-night.webp'), // step 3: earn your badge
]

/**
 * Become a host, told as stories. Segments across the top like Instagram stories; the first
 * three steps each open on a real party photo with one big line and three
 * short points. Agreement and payouts drop the photo and give the room to
 * the content.
 */
export function HostWizardView(p: HostWizardProps) {
  const insets = useSafeAreaInsets()
  const photoStep = p.step <= 3

  return (
    <View style={s.root}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }} bounces={!photoStep}>
          {photoStep ? (
            <Animated.View key={`photo-${p.step}`} entering={FadeIn.duration(300)} style={s.photo}>
              <Image source={PHOTOS[p.step - 1]} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
              <LinearGradient colors={['rgba(0,0,0,0.55)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
            </Animated.View>
          ) : (
            <View style={{ height: insets.top + 64 }} />
          )}

          <Animated.View key={`body-${p.step}`} entering={FadeIn.duration(300)} style={[s.body, photoStep && { marginTop: -56 }]}>
            {p.step === 1 && (
              <>
                <Text style={s.kicker}>HOSTING ON GORAVE</Text>
                <Text style={s.title}>Throw the night.{'\n'}We handle the rest.</Text>
                <Point icon={MapPin} title="People nearby find it" sub="Your event shows in Trending and nearby the moment you publish." />
                <Point icon={ShieldCheck} title="Every guest is phone-verified" sub="Nobody books without a verified number, and you choose who gets in on free events." />
                <Point icon={Wallet} title="Paid out after the night" sub="Ticket money lands in your bank or UPI once the event is done." />
              </>
            )}
            {p.step === 2 && (
              <>
                <Text style={s.kicker}>BEFORE YOUR FIRST EVENT</Text>
                <Text style={s.title}>Three things{'\n'}worth knowing</Text>
                <Point icon={Users} title="It's your night to run" sub="The venue, the guests and local rules are yours. Gorave handles bookings and payments." />
                <Point icon={CalendarX2} title="Cancel up to 48 hours before" sub="Guests get a full refund to their wallet. Inside 48 hours, you can't cancel." />
                <Point icon={Percent} title={`Gorave keeps ${HOST_COMMISSION_PERCENT_LABEL}`} sub="We collect the ticket price and send you the rest after the event." />
              </>
            )}
            {p.step === 3 && (
              <>
                <Text style={s.kicker}>YOUR REPUTATION</Text>
                <Text style={s.title}>Host more,{'\n'}earn your badge</Text>
                <Text style={s.lede}>Guests see your badge before they book.</Text>
                <View style={s.ladder}>
                  {([['Rising', '2+ events'], ['Established', '10+'], ['Elite', '25+'], ['Legend', '75+']] as const).map(([k, req], i) => (
                    <View key={k} style={s.rung}>
                      <View style={[s.badge, { opacity: 1 - i * 0.12 }]}>
                        <RNImage source={HOST_BADGE_IMAGES[k]} style={s.badgeImg} resizeMode="contain" />
                      </View>
                      <Text style={s.rungName}>{k}</Text>
                      <Text style={s.rungReq}>{req}</Text>
                    </View>
                  ))}
                </View>
                <View style={s.freeRow}>
                  <BadgeCheck size={18} color={Colors.inkPrimary} strokeWidth={2} />
                  <Text style={s.freeText}>You can host 2 free events a month.</Text>
                </View>
              </>
            )}
            {p.step === 4 && p.agreement}
            {p.step === 5 && p.payout}
          </Animated.View>
        </ScrollView>

        <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
          <Pressable style={s.backBtn} onPress={p.onBack} hitSlop={8}>
            <Text style={s.backText}>Back</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <PrimaryButton label={p.cta} onPress={p.onContinue} disabled={p.ctaDisabled} loading={p.ctaLoading} />
          </View>
        </View>
      </KeyboardAvoidingView>

      <View style={[s.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
        <View style={s.segments}>
          {Array.from({ length: p.total }).map((_, i) => (
            <View key={i} style={[s.segment, { backgroundColor: photoStep ? withOpacity(Colors.white, 0.3) : withOpacity(Colors.inkPrimary, 0.15) }]}>
              {i < p.step ? <View style={[s.segmentFill, { backgroundColor: photoStep ? Colors.white : Colors.inkPrimary }]} /> : null}
            </View>
          ))}
        </View>
        <Pressable style={[s.close, photoStep && s.closeOnPhoto]} onPress={p.onBack} hitSlop={8}>
          <ArrowLeft size={18} color={photoStep ? Colors.white : Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
      </View>
    </View>
  )
}

function Point({ icon: I, title, sub }: { icon: typeof MapPin; title: string; sub: string }) {
  return (
    <View style={s.point}>
      <View style={s.pointIcon}><I size={18} color={Colors.inkPrimary} strokeWidth={2} /></View>
      <View style={{ flex: 1 }}>
        <Text style={s.pointTitle}>{title}</Text>
        <Text style={s.pointSub}>{sub}</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  photo: { height: PHOTO_H, overflow: 'hidden' },
  body: { paddingHorizontal: 24 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: Colors.inkSecondary },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary, marginTop: 8, marginBottom: 22 },
  lede: { fontFamily: FontFamily.bodyRegular, fontSize: 15, color: Colors.inkSecondary, marginTop: -12, marginBottom: 20 },

  point: { flexDirection: 'row', gap: 14, marginBottom: 18 },
  pointIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  pointTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
  pointSub: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkSecondary, marginTop: 2 },

  ladder: { flexDirection: 'row', gap: 10 },
  rung: { flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  badge: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  badgeImg: { width: 44, height: 44 },
  rungName: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary, marginTop: 8 },
  rungReq: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary, marginTop: 1 },
  freeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 },
  freeText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkPrimary },

  top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: 16, gap: 12 },
  segments: { flexDirection: 'row', gap: 4 },
  segment: { flex: 1, height: 3, borderRadius: 2, overflow: 'hidden' },
  segmentFill: { flex: 1 },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.07) },
  closeOnPhoto: { backgroundColor: 'rgba(0,0,0,0.35)' },

  footer: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingTop: 12 },
  backBtn: { paddingHorizontal: 8, height: 54, justifyContent: 'center' },
  backText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkSecondary },
})
