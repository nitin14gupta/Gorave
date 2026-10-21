import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Lock } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { ConfettiRain, PrimaryButton } from '@/components/ui'

export function NotCheckedInGate({ onBack }: { onBack: () => void }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={[g.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Pressable style={g.back} onPress={onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
      </Pressable>
      <View style={g.body}>
        <View style={g.iconWrap}>
          <Lock size={36} color={Colors.inkDisabled} strokeWidth={1.5} />
        </View>
        <Text style={g.title}>You didn't make it</Text>
        <Text style={g.sub}>
          Reviews are only for attendees who actually checked in at the event. Since you weren't scanned in, you can't leave a review.
        </Text>
      </View>
    </View>
  )
}

export function ReviewSuccessState({ countdown, onBack }: { countdown: number; onBack: () => void }) {
  return (
    <>
      <ConfettiRain />
      <View style={u.successWrap}>
        <Text style={u.successStar}>⭐</Text>
        <Text style={u.successTitle}>Review Submitted!</Text>
        <Text style={u.successSub}>Thanks for rating the vibe.</Text>
        <PrimaryButton label="Back to Event" onPress={onBack} />
        <Text style={u.countdownText}>Redirecting in {countdown}s…</Text>
      </View>
    </>
  )
}

const p = StyleSheet.create({
  ratingSection: { alignItems: 'center', gap: 14 },
  rateLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: Colors.inkDisabled,
    letterSpacing: 2,
  },
  stars: { flexDirection: 'row', gap: 10 },
  starWord: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: Colors.brandOrange,
    letterSpacing: -0.3,
  },
  starWordEmpty: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkDisabled,
  },
})

const g = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background, paddingHorizontal: 32 },
  back: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 8,
  },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, marginTop: -60 },
  iconWrap: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.elevated,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: FontFamily.headingBold, fontSize: 24,
    color: Colors.inkPrimary, textAlign: 'center',
  },
  sub: {
    fontFamily: FontFamily.bodyRegular, fontSize: 14,
    color: Colors.inkSecondary, textAlign: 'center', lineHeight: 22,
  },
})

const u = StyleSheet.create({
  successWrap: { alignItems: 'center', gap: 12, paddingHorizontal: 40, width: '100%' },
  successStar: { fontSize: 64, marginBottom: 4 },
  successTitle: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    color: Colors.inkPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  successSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  countdownText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13,
    color: Colors.inkDisabled,
    marginTop: 4,
  },
})
