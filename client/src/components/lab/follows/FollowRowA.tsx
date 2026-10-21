import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { MoreHorizontal } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { followAction, type FollowItemProps } from './types'

/**
 * A · The clean row. Instagram's followers list: face, name, handle and
 * city, a quiet "Follows you" note, and one button that says exactly what
 * it does. Everything else hides behind the three dots.
 */
export const FollowRowA = memo(function FollowRowA(p: FollowItemProps) {
  const u = p.user
  const act = followAction(p)
  return (
    <Pressable style={s.row} onPress={() => router.push(`/(profile)/${u.id}` as any)}>
      <View style={s.avatar}>
        {u.avatar_url ? <Image source={{ uri: u.avatar_url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(u.name ?? u.username ?? '?').charAt(0).toUpperCase()}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{u.name ?? u.username ?? 'Guest'}{u.is_me ? <Text style={s.you}>  You</Text> : null}</Text>
        <Text style={s.sub} numberOfLines={1}>{[u.username ? `@${u.username}` : null, u.city].filter(Boolean).join(' · ')}</Text>
        {u.follows_back ? <Text style={s.followsYou}>Follows you</Text> : null}
      </View>
      {act ? (
        <Pressable style={[s.btn, act.filled ? s.btnFilled : s.btnOutline]} onPress={() => { hTap(); act.run() }} hitSlop={4}>
          <Text style={[s.btnText, act.filled && { color: Colors.background }]}>{act.label}</Text>
        </Pressable>
      ) : null}
      {!u.is_me ? (
        <Pressable style={s.dots} onPress={() => p.onDots(u)} hitSlop={8}>
          <MoreHorizontal size={18} color={Colors.inkSecondary} strokeWidth={2} />
        </Pressable>
      ) : null}
    </Pressable>
  )
})

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 11 },
  avatar: { width: 52, height: 52, borderRadius: 26, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  you: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  followsYou: { alignSelf: 'flex-start', marginTop: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, overflow: 'hidden', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.inkSecondary },
  btn: { height: 34, minWidth: 96, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  btnFilled: { backgroundColor: Colors.inkPrimary },
  btnOutline: { backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  btnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  dots: { width: 28, height: 34, alignItems: 'center', justifyContent: 'center' },
})
