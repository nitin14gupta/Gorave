import React, { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { Calendar, Check, Link2, MapPin, MessageCircle, MoreHorizontal, Share2, Users } from 'lucide-react-native'
import { WhatsAppLogo } from '@/components/ui/brand/WhatsAppLogo'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSuccess, hTap } from '@/lib/haptics'

export interface PublishedProps {
  title: string
  dateLabel: string
  area: string
  coverUrl: string
  shareUrl: string
  onShare: () => void
  onShareInChat: () => void
  onCopyLink: () => void
  onWhatsApp: () => void
  /** "Free" or "₹499" */
  priceLabel?: string
  spots?: number
  onMyEvents: () => void
  onViewEvent: () => void
}

const Gradient = ({ children, style }: { children: React.ReactNode; style?: object }) => (
  <LinearGradient colors={[Colors.brandOrange, Colors.brandCoral]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={style}>
    {children}
  </LinearGradient>
)

// ── A · The invite ────────────────────────────────────────────────────────

/** The cover, blurred huge behind the screen, so every event's moment has its own colour. */
export function InviteBackdrop({ coverUrl }: { coverUrl: string }) {
  const fade = useSharedValue(0)
  useEffect(() => { fade.value = withTiming(1, { duration: 900 }) }, [fade])
  const st = useAnimatedStyle(() => ({ opacity: fade.value }))
  if (!coverUrl) return null
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, st]}>
      <Image source={{ uri: coverUrl }} style={[StyleSheet.absoluteFill, { opacity: 0.55 }]} contentFit="cover" blurRadius={60} />
      <LinearGradient colors={[withOpacity(Colors.nearBlack, 0.35), withOpacity(Colors.nearBlack, 0.82), Colors.nearBlack]} locations={[0, 0.55, 1]} style={StyleSheet.absoluteFill} />
    </Animated.View>
  )
}

/**
 * The event's cover becomes the invite: it flips in like a card being
 * dealt, a small Live pill fades in (with a tap), a single shine sweeps
 * across it, then the share options. The link itself is a pill you tap to copy.
 */
export function PublishedInvite(p: PublishedProps) {
  const card = useSharedValue(0)
  const stamp = useSharedValue(0)
  const shine = useSharedValue(0)
  const rest = useSharedValue(0)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    card.value = withSpring(1, { damping: 13, stiffness: 110 })
    stamp.value = withDelay(700, withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) }))
    shine.value = withDelay(1050, withTiming(1, { duration: 900, easing: Easing.inOut(Easing.cubic) }))
    rest.value = withDelay(350, withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }))
    const t = setTimeout(hSuccess, 700)
    return () => clearTimeout(t)
  }, [card, stamp, shine, rest])

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [{ perspective: 900 }, { rotateY: `${(1 - card.value) * 70}deg` }, { rotate: `${-4 * card.value}deg` }, { scale: 0.85 + card.value * 0.15 }],
  }))
  const stampStyle = useAnimatedStyle(() => ({ opacity: stamp.value, transform: [{ translateY: (1 - stamp.value) * -6 }] }))
  const shineStyle = useAnimatedStyle(() => ({ opacity: shine.value > 0 && shine.value < 1 ? 1 : 0, transform: [{ translateX: -260 + shine.value * 560 }, { rotate: '20deg' }] }))
  const restStyle = useAnimatedStyle(() => ({ opacity: rest.value, transform: [{ translateY: (1 - rest.value) * 20 }] }))

  const copy = () => {
    p.onCopyLink()
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }
  const prettyUrl = p.shareUrl.replace(/^https?:\/\//, '')
  const quick = [
    { key: 'wa', label: 'WhatsApp', icon: <WhatsAppLogo size={22} />, on: p.onWhatsApp },
    { key: 'chat', label: 'Gorave chat', icon: <MessageCircle size={20} color={Colors.inkPrimary} strokeWidth={2} />, on: p.onShareInChat },
    { key: 'more', label: 'More', icon: <MoreHorizontal size={20} color={Colors.inkPrimary} strokeWidth={2} />, on: p.onShare },
  ]

  return (
    <View style={a.wrap}>
      <Animated.View style={[a.card, cardStyle]}>
        {p.coverUrl ? <Image source={{ uri: p.coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Gradient style={StyleSheet.absoluteFill}><View /></Gradient>}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={a.cardShade} />
        <Animated.View pointerEvents="none" style={[a.shine, shineStyle]}>
          <LinearGradient colors={['transparent', 'rgba(255,255,255,0.35)', 'transparent']} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />
        </Animated.View>
        <View style={a.cardText}>
          <View style={a.chips}>
            {!!p.priceLabel && <View style={a.chip}><Text style={a.chipText}>{p.priceLabel}</Text></View>}
            {p.spots ? <View style={a.chip}><Users size={11} color={Colors.white} strokeWidth={2.4} /><Text style={a.chipText}>{p.spots} spots</Text></View> : null}
          </View>
          <Text style={a.cardTitle} numberOfLines={2}>{p.title}</Text>
          {!!p.dateLabel && (
            <View style={a.metaRow}><Calendar size={13} color={Colors.white} strokeWidth={2} /><Text style={a.meta} numberOfLines={1}>{p.dateLabel}</Text></View>
          )}
          {!!p.area && (
            <View style={a.metaRow}><MapPin size={13} color={Colors.white} strokeWidth={2} /><Text style={a.meta} numberOfLines={1}>{p.area}</Text></View>
          )}
        </View>
        <Animated.View style={[a.live, stampStyle]}>
          <View style={a.liveDot} />
          <Text style={a.liveText}>Live</Text>
        </Animated.View>
      </Animated.View>

      <Animated.View style={[{ width: '100%', alignItems: 'center' }, restStyle]}>
        <Text style={a.headline}>You’re live.</Text>
        <Text style={a.sub}>The first few guests set the vibe. Send the invite to people you’d want in the room.</Text>

        <Pressable style={[a.linkPill, copied && a.linkPillDone]} onPress={copy}>
          {copied ? <Check size={14} color={Colors.accentGreen} strokeWidth={3} /> : <Link2 size={14} color={Colors.inkSecondary} strokeWidth={2.2} />}
          <Text style={[a.linkText, copied && { color: Colors.accentGreen }]} numberOfLines={1}>{copied ? 'Link copied' : prettyUrl}</Text>
          {!copied && <Text style={a.linkCopy}>Copy</Text>}
        </Pressable>

        <Pressable style={a.primary} onPress={p.onShare}>
          <Gradient style={a.primaryInner}>
            <Share2 size={18} color={Colors.white} strokeWidth={2.2} />
            <Text style={a.primaryText}>Share the invite</Text>
          </Gradient>
        </Pressable>

        <View style={a.quick}>
          {quick.map(q => (
            <Pressable key={q.key} style={a.quickBtn} onPress={() => { hTap(); q.on() }}>
              <View style={a.quickIcon}>{q.icon}</View>
              <Text style={a.quickLabel}>{q.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={a.links}>
          <Pressable onPress={p.onViewEvent} hitSlop={10}><Text style={a.link}>View event</Text></Pressable>
          <Text style={a.dot}>·</Text>
          <Pressable onPress={p.onMyEvents} hitSlop={10}><Text style={a.link}>My events</Text></Pressable>
        </View>
      </Animated.View>
    </View>
  )
}

const a = StyleSheet.create({
  wrap: { width: '100%', alignItems: 'center' },
  card: { width: '72%', aspectRatio: 4 / 5, borderRadius: 28, overflow: 'hidden', backgroundColor: Colors.surface, marginBottom: 26, borderWidth: 1, borderColor: withOpacity(Colors.white, 0.12), shadowColor: Colors.brandCoral, shadowOpacity: 0.4, shadowRadius: 34, shadowOffset: { width: 0, height: 20 }, elevation: 16 },
  cardShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '65%' },
  shine: { position: 'absolute', top: -60, bottom: -60, width: 110 },
  cardText: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 },
  chips: { flexDirection: 'row', gap: 6, marginBottom: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 999, backgroundColor: withOpacity(Colors.white, 0.18) },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.white },
  cardTitle: { fontFamily: FontFamily.headingBold, fontSize: 24, lineHeight: 28, color: Colors.white, letterSpacing: -0.5, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: withOpacity(Colors.white, 0.9) },
  live: { position: 'absolute', top: 14, left: 14, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: withOpacity(Colors.nearBlack, 0.55) },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Colors.accentGreen },
  liveText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.white },
  headline: { fontFamily: FontFamily.headingBold, fontSize: 34, color: Colors.inkPrimary, letterSpacing: -0.8 },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 22, color: Colors.inkSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  linkPill: { flexDirection: 'row', alignItems: 'center', gap: 8, maxWidth: '100%', marginTop: 16, marginBottom: 18, paddingLeft: 14, paddingRight: 6, paddingVertical: 6, borderRadius: 999, backgroundColor: withOpacity(Colors.white, 0.07), borderWidth: 1, borderColor: withOpacity(Colors.white, 0.1) },
  linkPillDone: { borderColor: withOpacity(Colors.accentGreen, 0.45), paddingRight: 14 },
  linkText: { flexShrink: 1, fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  linkCopy: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: withOpacity(Colors.white, 0.1) },
  primary: { width: '100%', height: 56, borderRadius: 999, overflow: 'hidden' },
  primaryInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.white },
  quick: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 20 },
  quickBtn: { alignItems: 'center', gap: 7 },
  quickIcon: { width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.white, 0.08), borderWidth: 1, borderColor: withOpacity(Colors.white, 0.08) },
  quickLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  links: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22 },
  link: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  dot: { color: Colors.inkDisabled },
})
