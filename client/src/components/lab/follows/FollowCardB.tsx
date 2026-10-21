import { memo } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { MoreHorizontal } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { followAction, type FollowItemProps } from './types'

const W = Dimensions.get('window').width
export const FOLLOW_CARD_W = Math.floor((W - 32 - 10) / 2)

/**
 * B · Faces. People as square photo cards two a row, the way you'd browse
 * people at a party rather than read a list: photo first, name on it, one
 * button under it.
 */
export const FollowCardB = memo(function FollowCardB(p: FollowItemProps) {
  const u = p.user
  const act = followAction(p)
  return (
    <View style={s.wrap}>
      <Pressable style={s.photo} onPress={() => router.push(`/(profile)/${u.id}` as any)}>
        {u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(u.name ?? u.username ?? '?').charAt(0).toUpperCase()}</Text>}
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.72)']} style={s.shade} />
        <View style={s.text}>
          <Text style={s.name} numberOfLines={1}>{(u.name ?? u.username ?? 'Guest').split(' ')[0]}{u.is_me ? ' (you)' : ''}</Text>
          <Text style={s.sub} numberOfLines={1}>{u.city ?? (u.username ? `@${u.username}` : '')}</Text>
        </View>
        {u.follows_back ? <View style={s.badge}><Text style={s.badgeText}>Follows you</Text></View> : null}
        {!u.is_me ? (
          <Pressable style={s.dots} onPress={() => p.onDots(u)} hitSlop={8}>
            <MoreHorizontal size={16} color={Colors.white} strokeWidth={2.2} />
          </Pressable>
        ) : null}
      </Pressable>
      {act ? (
        <Pressable style={[s.btn, act.filled ? s.btnFilled : s.btnOutline]} onPress={() => { hTap(); act.run() }}>
          <Text style={[s.btnText, act.filled && { color: Colors.background }]}>{act.label}</Text>
        </Pressable>
      ) : null}
    </View>
  )
})

const s = StyleSheet.create({
  wrap: { width: FOLLOW_CARD_W, gap: 8, marginBottom: 14 },
  photo: { width: FOLLOW_CARD_W, height: FOLLOW_CARD_W, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.displayExtraBold, fontSize: 40, color: Colors.inkDisabled },
  shade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  text: { position: 'absolute', left: 12, right: 12, bottom: 10 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.white },
  sub: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.white, 0.8) },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, backgroundColor: 'rgba(0,0,0,0.55)' },
  badgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white },
  dots: { position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  btn: { height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnFilled: { backgroundColor: Colors.inkPrimary },
  btnOutline: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  btnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
})
