import { useEffect, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import Animated, { cancelAnimation, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withRepeat, withSequence, withTiming } from 'react-native-reanimated'
import { router } from 'expo-router'
import { ChevronRight, Lock, Megaphone, Pin } from 'lucide-react-native'
import type { EventChatMessage, EventChatSeen } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const AVATAR = 28
const SEEN_FACES = 5
const SEEN_FACE = 18
const TYPING_FACES = 3

export const firstName = (name?: string | null) => (name ?? 'Someone').split(' ')[0]

function Face({ uri, name, size }: { uri?: string | null; name?: string | null; size: number }) {
  return (
    <View style={[s.face, { width: size, height: size, borderRadius: size / 2 }]}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={120} /> : <Text style={[s.faceInitial, { fontSize: size * 0.42 }]}>{firstName(name).charAt(0).toUpperCase()}</Text>}
    </View>
  )
}

/** "Riya joined", "The night has started": the chat's own quiet voice. */
export function SystemLine({ text }: { text: string }) {
  return <View style={s.systemWrap}><Text style={s.system}>{text}</Text></View>
}

/** The host talking to the whole room: a card, not a bubble. */
export function UpdateCard({ msg }: { msg: EventChatMessage }) {
  return (
    <View style={s.update}>
      <View style={s.updateHead}>
        <Megaphone size={14} color={Colors.inkPrimary} strokeWidth={2} />
        <Text style={s.updateLabel}>Update from {firstName(msg.sender?.name)}</Text>
      </View>
      <Text style={s.updateText}>{msg.content}</Text>
    </View>
  )
}

/** Held under the header, so nobody has to scroll for what matters. */
export function PinnedBar({ msg, canUnpin, onUnpin }: { msg: EventChatMessage; canUnpin: boolean; onUnpin: () => void }) {
  return (
    <View style={s.pinned}>
      <Pin size={14} color={Colors.inkSecondary} strokeWidth={2} />
      <Text style={s.pinnedText} numberOfLines={2}>{msg.content}</Text>
      {canUnpin ? <Pressable onPress={onUnpin} hitSlop={8}><Text style={s.unpin}>Unpin</Text></Pressable> : null}
    </View>
  )
}

/** Avatar on the last bubble of a run, name on the first, so a run reads as one person. */
export function GroupRow({ msg, isMine, firstInRun, lastInRun, children, onPressSender }: {
  msg: EventChatMessage; isMine: boolean; firstInRun: boolean; lastInRun: boolean; children: ReactNode; onPressSender: () => void
}) {
  if (isMine) return <View style={s.mine}>{children}</View>
  return (
    <View style={s.row}>
      <Pressable style={s.avatarSlot} onPress={onPressSender} disabled={!lastInRun} accessibilityLabel={`Open ${firstName(msg.sender?.name)}'s profile`}>
        {lastInRun ? <Face uri={msg.sender?.avatar} name={msg.sender?.name} size={AVATAR} /> : null}
      </Pressable>
      <View style={s.flex}>
        {firstInRun ? (
          <View style={s.nameRow}>
            <Text style={s.name} numberOfLines={1}>{firstName(msg.sender?.name)}</Text>
            {msg.sender?.is_host ? <Text style={s.hostTag}>Host</Text> : null}
          </View>
        ) : null}
        {children}
      </View>
    </View>
  )
}

/** Tiny faces of who's read this far, right under the newest message. */
export function SeenRow({ people, isMine, onPress }: { people: EventChatSeen[]; isMine: boolean; onPress: () => void }) {
  if (people.length === 0) return null
  const extra = people.length - SEEN_FACES
  return (
    <Pressable style={[s.seen, isMine && s.seenMine]} onPress={onPress} hitSlop={6} accessibilityLabel={`Seen by ${people.length}`}>
      {people.slice(0, SEEN_FACES).map((p, i) => (
        <View key={p.id} style={[s.seenRing, { marginLeft: i ? -5 : 0, zIndex: SEEN_FACES - i }]}>
          <Face uri={p.avatar} name={p.name} size={SEEN_FACE} />
        </View>
      ))}
      {extra > 0 ? <Text style={s.seenMore}>+{extra}</Text> : null}
    </Pressable>
  )
}

/** Dots that rise one after another, like a phone keyboard. Only shown while someone is actually typing. */
function Dot({ delay }: { delay: number }) {
  const reduced = useReducedMotion()
  const y = useSharedValue(0)
  useEffect(() => {
    if (reduced) return
    y.set(withDelay(delay, withRepeat(withSequence(withTiming(-3, { duration: 280 }), withTiming(0, { duration: 280 }), withTiming(0, { duration: 360 })), -1)))
    return () => cancelAnimation(y)
  }, [delay, reduced, y])
  const st = useAnimatedStyle(() => ({ transform: [{ translateY: y.get() }] }))
  return <Animated.View style={[s.dot, st]} />
}

/** Who's typing, as faces next to a dots bubble, sitting where their message will land. */
export function TypingLine({ people }: { people: { id: string; name: string; avatar: string | null }[] }) {
  if (people.length === 0) return null
  const shown = people.slice(0, TYPING_FACES)
  return (
    <View style={s.typingRow} accessibilityLabel={`${people.map(p => firstName(p.name)).join(', ')} typing`}>
      <View style={s.typingFaces}>
        {shown.map((p, i) => (
          <View key={p.id} style={[s.typingRing, { marginLeft: i ? -10 : 0, zIndex: TYPING_FACES - i }]}>
            <Face uri={p.avatar} name={p.name} size={AVATAR} />
          </View>
        ))}
      </View>
      <View style={s.typingBubble}>
        <Dot delay={0} /><Dot delay={140} /><Dot delay={280} />
      </View>
    </View>
  )
}

/** Replaces the input when the chat can't be posted in. */
export function ChatNotice({ closed, eventId }: { closed: boolean; eventId: string }) {
  if (!closed) {
    return (
      <View style={s.notice}>
        <Lock size={15} color={Colors.inkSecondary} strokeWidth={2} />
        <Text style={s.noticeText}>Only the host can post right now</Text>
      </View>
    )
  }
  return (
    <Pressable style={s.notice} onPress={() => { hTap(); router.push(`/(events)/${eventId}/album` as any) }} accessibilityRole="button">
      <Text style={s.noticeTitle}>This chat has closed</Text>
      <Text style={s.noticeLink}>See the album</Text>
      <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  face: { backgroundColor: Colors.elevated, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  faceInitial: { fontFamily: FontFamily.headingBold, color: Colors.inkPrimary },
  systemWrap: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 24 },
  system: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary, textAlign: 'center' },
  update: { marginHorizontal: 16, marginVertical: 8, padding: 14, borderRadius: 16, backgroundColor: Colors.surface, gap: 6, borderWidth: StyleSheet.hairlineWidth, borderColor: withOpacity(Colors.inkPrimary, 0.16) },
  updateHead: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  updateLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  updateText: { fontFamily: FontFamily.bodyMedium, fontSize: 15, lineHeight: 21, color: Colors.inkPrimary },
  pinned: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, backgroundColor: Colors.surface },
  pinnedText: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 13, lineHeight: 18, color: Colors.inkPrimary },
  unpin: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 8, paddingRight: 16 },
  // Same side space as a 1:1 chat.
  mine: { paddingHorizontal: 16 },
  avatarSlot: { width: AVATAR + 6, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12, marginBottom: 2, marginTop: 6 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  hostTag: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.background, backgroundColor: Colors.inkPrimary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  seen: { flexDirection: 'row', alignItems: 'center', paddingLeft: 46, paddingRight: 16, paddingTop: 2, paddingBottom: 6 },
  seenMine: { justifyContent: 'flex-end' },
  seenRing: { borderRadius: 11, borderWidth: 1.5, borderColor: Colors.background },
  seenMore: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkSecondary, marginLeft: 4 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 8, paddingRight: 16, paddingVertical: 6 },
  typingFaces: { flexDirection: 'row' },
  typingRing: { borderRadius: AVATAR / 2 + 2, borderWidth: 2, borderColor: Colors.background },
  typingBubble: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 34, paddingHorizontal: 14, borderRadius: 17, backgroundColor: Colors.surface },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.inkSecondary },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.surface },
  noticeText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  noticeTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  noticeLink: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
})
