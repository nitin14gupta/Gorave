import type { ReactNode } from 'react'
import { Dimensions, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import Animated, { FadeIn } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { PrimaryButton } from '@/components/ui'

const { height: H } = Dimensions.get('window')
export const ONBOARDING_STEPS = 5

interface ShellProps {
  /** 1..5 draws the progress bar; 0 hides it (age check). */
  step: number
  poster: ImageSource
  title: string
  sub?: ReactNode
  onBack?: () => void
  children?: ReactNode
  footer?: ReactNode
  /** False when the content scrolls itself (e.g. a long list). */
  scroll?: boolean
}

/** Segmented bar, one segment per step, filled up to this one. */
function Progress({ step, light }: { step: number; light?: boolean }) {
  if (!step) return <View style={{ flex: 1 }} />
  return (
    <View style={s.progress}>
      {Array.from({ length: ONBOARDING_STEPS }).map((_, i) => (
        <View
          key={i}
          style={[
            s.seg,
            { backgroundColor: light ? withOpacity(Colors.white, 0.3) : withOpacity(Colors.inkPrimary, 0.12) },
            i < step && { backgroundColor: light ? Colors.white : Colors.inkPrimary },
          ]}
        />
      ))}
    </View>
  )
}

function TopRow({ step, onBack, light }: { step: number; onBack?: () => void; light?: boolean }) {
  return (
    <View style={s.topRow}>
      {onBack ? (
        <Pressable style={[s.back, light ? s.backLight : s.backDark]} onPress={onBack} hitSlop={8}>
          <ArrowLeft size={18} color={light ? Colors.white : Colors.inkPrimary} strokeWidth={2.2} />
        </Pressable>
      ) : null}
      <Progress step={step} light={light} />
      {step ? <Text style={[s.count, light && { color: Colors.white }]}>{step}/{ONBOARDING_STEPS}</Text> : null}
    </View>
  )
}

/**
 * The frame the onboarding steps sit in: a party poster across the top
 * fading into the page, the progress bar over it, a big title under it,
 * then the step. A step with no form (the age check) lets the poster fill
 * the screen and sits the title right above the buttons.
 */
export function OnboardingShell(p: ShellProps) {
  const insets = useSafeAreaInsets()
  const Body = p.scroll === false ? View : ScrollView
  const bodyProps = p.scroll === false
    ? { style: { flex: 1 } }
    : { style: { flex: 1 }, contentContainerStyle: { paddingBottom: 16 }, showsVerticalScrollIndicator: false, keyboardShouldPersistTaps: 'handled' as const }

  // A step with no form (the age check) lets the poster take most of the
  // screen instead of leaving an empty middle.
  const empty = !p.children
  const band = empty ? H : Math.round(H * 0.27) + insets.top
  return (
    <View style={s.root}>
      <View style={[s.band, { height: band }]}>
        <Image source={p.poster} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0.35)', withOpacity(Colors.background, 0), withOpacity(Colors.background, 0.85), Colors.background]}
          locations={empty ? [0, 0.4, 0.62, 0.78] : [0, 0.35, 0.8, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>
      <View style={{ paddingTop: insets.top + 8 }}>
        <TopRow step={p.step} onBack={p.onBack} light />
      </View>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {empty ? <View style={{ flex: 1 }} /> : <View style={{ height: Math.max(0, band - insets.top - 52 - 64) }} />}
        <Animated.View entering={FadeIn.duration(380)} style={s.headA}>
          <Text style={s.title}>{p.title}</Text>
          {p.sub ? <Text style={s.sub}>{p.sub}</Text> : null}
        </Animated.View>
        {empty ? null : (
          <View style={s.bodyA}>
            <Body {...bodyProps}>{p.children}</Body>
          </View>
        )}
        <View style={[s.footerA, { paddingBottom: insets.bottom + 12 }]}>{p.footer}</View>
      </KeyboardAvoidingView>
    </View>
  )
}

/** Next button, with an optional hint line above it. */
export function OnboardingNext({ label = 'Next', onPress, disabled, loading, hint }: { label?: string; onPress: () => void; disabled?: boolean; loading?: boolean; hint?: string }) {
  return (
    <View style={{ gap: 8, paddingTop: 10 }}>
      {hint ? <Text style={s.hint}>{hint}</Text> : null}
      <PrimaryButton label={label} onPress={onPress} disabled={disabled} loading={loading} />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  band: { position: 'absolute', top: 0, left: 0, right: 0, overflow: 'hidden' },

  topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, height: 44 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  backLight: { backgroundColor: 'rgba(0,0,0,0.35)' },
  backDark: { backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  progress: { flex: 1, flexDirection: 'row', gap: 5 },
  seg: { flex: 1, height: 4, borderRadius: 2 },
  count: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary, minWidth: 26, textAlign: 'right' },

  headA: { paddingHorizontal: 24, gap: 8, marginBottom: 14 },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 36, lineHeight: 39, letterSpacing: -1, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, color: Colors.inkSecondary, marginBottom: 6 },
  bodyA: { flex: 1, paddingHorizontal: 24 },
  footerA: { paddingHorizontal: 24 },

  hint: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkDisabled, textAlign: 'center' },
})
