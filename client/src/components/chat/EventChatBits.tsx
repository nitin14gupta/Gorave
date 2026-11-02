import type { ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ChevronRight, Lock, Megaphone, Pin } from 'lucide-react-native'
import type { EventChatMessage, EventChatSeen } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const AVATAR = 28
const SEEN_FACES = 5
const SEEN_FACE = 18

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
  if (isMine) return <>{children}</>
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

export function TypingLine({ names }: { names: string[] }) {
  if (names.length === 0) return null
  const who = names.length === 1 ? firstName(names[0]) : names.length === 2 ? `${firstName(names[0])} and ${firstName(names[1])}` : `${names.length} people`
  return <Text style={s.typing}>{who} {names.length === 1 ? 'is' : 'are'} typing...</Text>
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
  row: { flexDirection: 'row', alignItems: 'flex-end', paddingLeft: 8 },
  avatarSlot: { width: AVATAR + 6, marginBottom: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12, marginBottom: 2, marginTop: 6 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  hostTag: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.background, backgroundColor: Colors.inkPrimary, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 6, overflow: 'hidden' },
  seen: { flexDirection: 'row', alignItems: 'center', paddingLeft: 46, paddingRight: 16, paddingTop: 2, paddingBottom: 6 },
  seenMine: { justifyContent: 'flex-end' },
  seenRing: { borderRadius: 11, borderWidth: 1.5, borderColor: Colors.background },
  seenMore: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: Colors.inkSecondary, marginLeft: 4 },
  typing: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, paddingHorizontal: 16, paddingVertical: 4 },
  notice: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 12, paddingVertical: 14, borderRadius: 16, backgroundColor: Colors.surface },
  noticeText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
  noticeTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  noticeLink: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
})
