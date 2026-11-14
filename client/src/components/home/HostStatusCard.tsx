import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import Animated, { FadeIn } from 'react-native-reanimated'
import { AlertCircle, BadgeCheck, ChevronRight, Clock, LifeBuoy } from 'lucide-react-native'
import ApiService, { type HostVerification } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

/**
 * Where you are on the way to hosting, on Home: being checked, not approved,
 * or approved and one step from creating. Nothing when there's nothing to say
 * (never started, or already set up).
 */
export function HostStatusCard({ onboarded }: { onboarded: boolean }) {
  const [v, setV] = useState<HostVerification | null>(null)

  // Fresh every time Home is shown, so the approval push is already reflected.
  useFocusEffect(useCallback(() => {
    ApiService.getHostVerification().then(setV).catch(() => {})
  }, []))

  if (!v) return null
  let card: { tone: 'neutral' | 'warn' | 'good'; Icon: typeof Clock; title: string; body: string; href: string } | null = null
  if (v.status === 'review') {
    card = { tone: 'neutral', Icon: Clock, title: 'We’re checking your PAN', body: 'Usually less than a day. We’ll notify you.', href: '/(host-onboarding)/verify' }
  } else if ((v.status === 'failed' || v.status === 'rejected') && v.tries_left === 0) {
    card = { tone: 'warn', Icon: LifeBuoy, title: 'Let’s sort out your ID', body: 'Our support team will help you get verified.', href: '/(settings)/support?topic=hosting' }
  } else if (v.status === 'failed' || v.status === 'rejected') {
    card = {
      tone: 'warn', Icon: AlertCircle, title: 'Your PAN wasn’t approved',
      body: `${v.message ?? 'See why and try again.'} ${v.tries_left === 1 ? '1 try left.' : `${v.tries_left} tries left.`}`,
      href: '/(host-onboarding)/verify',
    }
  } else if (v.status === 'verified' && !onboarded) {
    card = { tone: 'good', Icon: BadgeCheck, title: 'You’re verified to host', body: 'Set up payouts and create your first night.', href: '/(host-onboarding)' }
  }
  if (!card) return null

  const { tone, Icon } = card
  const iconColor = tone === 'good' ? Colors.accentGreen : tone === 'warn' ? Colors.destructive : Colors.inkPrimary
  return (
    <Animated.View entering={FadeIn.duration(260)}>
      <Pressable
        style={s.card}
        onPress={() => { hTap(); router.push(card.href as any) }}
        accessibilityRole="button"
        accessibilityLabel={`${card.title}. ${card.body}`}
      >
        <View style={[s.icon, { backgroundColor: withOpacity(iconColor, tone === 'neutral' ? 0.08 : 0.14) }]}>
          <Icon size={20} color={iconColor} strokeWidth={2} />
        </View>
        <View style={s.text}>
          <Text style={s.title}>{card.title}</Text>
          <Text style={s.body} numberOfLines={2}>{card.body}</Text>
        </View>
        <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  )
}

const s = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 20, backgroundColor: Colors.surface },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  body: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
})
