import type { ReactNode } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import Animated, { Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AlertCircle, ArrowLeft, Bell, ChevronRight, Compass, LifeBuoy, ShieldCheck } from 'lucide-react-native'
import { PrimaryButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, Spacing, withOpacity } from '@/constants'

const PARTY = require('../../../assets/images/welcome/house-party.webp')
const CHEERS = require('../../../assets/images/welcome/cheers.webp')
const PHOTO_H = Math.round(Dimensions.get('window').height * 0.5)
const OVERLAP = 28

function ago(iso: string | null): string {
  if (!iso) return 'just now'
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const h = Math.round(mins / 60)
  if (h < 24) return `${h} hr ago`
  return new Date(iso).toLocaleDateString([], { day: 'numeric', month: 'short' })
}

/** "XXXXXX620E" read the way it's printed: ••••• •62• E. */
const spaced = (pan: string | null) => (pan ? `${pan.slice(0, 5)} ${pan.slice(5, 9)} ${pan.slice(9)}`.replace(/X/g, '•') : '••••• •••• •')

/**
 * A photo behind, the content on a sheet that scrolls over it. The photo moves
 * slower than your finger and stretches if you pull down: tied to the scroll,
 * nothing plays by itself.
 */
function PhotoSheet({ photo, onBack, children, footer }: { photo: number; onBack: () => void; children: ReactNode; footer: ReactNode }) {
  const insets = useSafeAreaInsets()
  const y = useSharedValue(0)
  const onScroll = useAnimatedScrollHandler(e => { y.set(e.contentOffset.y) })
  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(y.get(), [-PHOTO_H, 0, PHOTO_H], [-PHOTO_H / 2, 0, -PHOTO_H * 0.45], Extrapolation.CLAMP) },
      { scale: interpolate(y.get(), [-PHOTO_H, 0], [1.8, 1], Extrapolation.CLAMP) },
    ],
  }))
  return (
    <View style={s.root}>
      <Animated.View style={[s.photoWrap, photoStyle]}>
        <Image source={photo} style={s.photo} contentFit="cover" transition={0} />
        <View style={s.shade} />
      </Animated.View>

      <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: PHOTO_H - OVERLAP }}>
        <View style={[s.sheet, { minHeight: Dimensions.get('window').height - PHOTO_H + OVERLAP }]}>{children}</View>
      </Animated.ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={() => { hTap(); onBack() }} hitSlop={8} accessibilityLabel="Back">
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2.2} />
      </Pressable>
      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>{footer}</View>
    </View>
  )
}

export function Progress({ done, warn }: { done: number; warn?: boolean }) {
  return (
    <View style={s.progress}>
      {[0, 1, 2].map(i => <View key={i} style={[s.seg, i < done && s.segOn, warn && i === done && s.segWarn]} />)}
    </View>
  )
}

// ── Waiting for our team ────────────────────────────────────────────────────

export function VerifyPending({ panMasked, submittedAt, onBack }: { panMasked: string | null; submittedAt: string | null; onBack: () => void }) {
  return (
    <PhotoSheet photo={PARTY} onBack={onBack} footer={<PrimaryButton label="Back to Gorave" onPress={() => { hTap(); onBack() }} />}>
      <Progress done={2} />
      <Text style={s.kicker}>STEP 2 OF 3 · BEING REVIEWED</Text>
      <Text style={s.title}>Almost ready{'\n'}to host.</Text>
      <Text style={s.body}>
        Your PAN matched the Income Tax records. Now someone on our team checks it against your profile, usually in less than a day.
      </Text>

      <View style={s.pill}>
        <ShieldCheck size={16} color={Colors.accentGreen} strokeWidth={2} />
        <Text style={s.pillText}>PAN {spaced(panMasked)}</Text>
        <Text style={s.pillTime}>{ago(submittedAt)}</Text>
      </View>

      <Text style={s.section}>While you wait</Text>
      <Pressable style={s.row} onPress={() => { hTap(); router.navigate('/(tabs)/events' as any) }} accessibilityRole="button">
        <View style={s.rowIcon}><Compass size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
        <View style={s.rowText}>
          <Text style={s.rowTitle}>See what others are hosting</Text>
          <Text style={s.rowBody}>Steal ideas for your first night</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
      <View style={s.row}>
        <View style={s.rowIcon}><Bell size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
        <View style={s.rowText}>
          <Text style={s.rowTitle}>We&apos;ll notify you</Text>
          <Text style={s.rowBody}>The moment it&apos;s approved, set up payouts and go</Text>
        </View>
      </View>
    </PhotoSheet>
  )
}

// ── Didn't work: the automatic check, or our team said no ───────────────────

export function VerifyProblem({ kind, message, triesLeft, panMasked, onRetry, onBack }: {
  kind: 'failed' | 'rejected'
  message: string | null
  triesLeft: number
  panMasked: string | null
  onRetry: () => void
  onBack: () => void
}) {
  const locked = triesLeft === 0
  const title = locked ? 'Let’s sort this\nout together.' : kind === 'rejected' ? 'We couldn’t\napprove it.' : 'That PAN\ndidn’t work.'
  const lead = locked
    ? 'You’ve used both tries. Message our support team and a person will help you get verified and hosting.'
    : kind === 'rejected'
      ? 'Someone on our team looked at it. Here’s why it wasn’t approved:'
      : 'The Income Tax records didn’t accept it:'
  const footer = locked ? (
    <PrimaryButton label="Contact support" onPress={() => { hTap(); router.push('/(settings)/support' as any) }} />
  ) : (
    <PrimaryButton label="Try again" onPress={() => { hTap(); onRetry() }} />
  )
  return (
    <PhotoSheet photo={CHEERS} onBack={onBack} footer={footer}>
      <Progress done={kind === 'rejected' ? 1 : 0} warn />
      <Text style={s.kicker}>{kind === 'rejected' ? 'NOT APPROVED' : 'CHECK FAILED'}</Text>
      <Text style={s.title}>{title}</Text>
      <Text style={s.body}>{lead}</Text>

      {message && !locked ? (
        <View style={s.reason}>
          <AlertCircle size={18} color={Colors.destructive} strokeWidth={2} />
          <Text style={s.reasonText}>{message}</Text>
        </View>
      ) : null}

      {!locked ? (
        <>
          <Text style={s.section}>Before you try again</Text>
          <View style={s.tips}>
            {kind === 'failed' ? <Text style={s.tip}>• Check each letter and number against your PAN card. 0 and O are easy to mix up.</Text> : null}
            <Text style={s.tip}>• Use your own personal PAN, not a company&apos;s or a family member&apos;s.</Text>
            <Text style={s.tip}>• Your profile name and birthday should match your PAN card.</Text>
            {panMasked ? <Text style={s.tip}>• Last time: PAN {spaced(panMasked)}.</Text> : null}
          </View>
          <Text style={s.tries}>{triesLeft === 1 ? 'You have one more try. After that, our support team will help you directly.' : `${triesLeft} tries left.`}</Text>
        </>
      ) : (
        <Pressable style={s.row} onPress={() => { hTap(); router.push('/(settings)/support' as any) }} accessibilityRole="button">
          <View style={s.rowIcon}><LifeBuoy size={18} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
          <View style={s.rowText}>
            <Text style={s.rowTitle}>Support</Text>
            <Text style={s.rowBody}>Usually answered within a day</Text>
          </View>
          <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2} />
        </Pressable>
      )}
    </PhotoSheet>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  photoWrap: { position: 'absolute', top: 0, left: 0, right: 0, height: PHOTO_H },
  photo: { width: '100%', height: '100%' },
  // A flat dim so the back button reads on any photo. No gradient.
  shade: { ...StyleSheet.absoluteFill, backgroundColor: withOpacity('#000000', 0.18) },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity('#000000', 0.45) },
  sheet: {
    borderTopLeftRadius: OVERLAP, borderTopRightRadius: OVERLAP, backgroundColor: Colors.background,
    paddingHorizontal: Spacing.screenPadding, paddingTop: 22, paddingBottom: 120,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: Spacing.screenPadding, paddingTop: 12, backgroundColor: Colors.background },
  progress: { flexDirection: 'row', gap: 6 },
  seg: { flex: 1, height: 4, borderRadius: 2, backgroundColor: withOpacity(Colors.inkPrimary, 0.15) },
  segOn: { backgroundColor: Colors.inkPrimary },
  segWarn: { backgroundColor: Colors.destructive },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkSecondary, marginTop: 16 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 34, lineHeight: 38, letterSpacing: -0.6, color: Colors.inkPrimary, marginTop: 8 },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginTop: 10 },
  pill: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 18, paddingHorizontal: 14, height: 48, borderRadius: 14, backgroundColor: Colors.surface },
  pillText: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 14, letterSpacing: 1, color: Colors.inkPrimary },
  pillTime: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  reason: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: withOpacity(Colors.destructive, 0.1) },
  reasonText: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  section: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary, marginTop: 26, marginBottom: 6 },
  tips: { gap: 8 },
  tip: { fontFamily: FontFamily.bodyRegular, fontSize: 14, lineHeight: 20, color: Colors.inkPrimary },
  tries: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: 16 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface },
  rowText: { flex: 1, gap: 2 },
  rowTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowBody: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
})
