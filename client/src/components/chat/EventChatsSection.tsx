import { memo } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { BellOff } from 'lucide-react-native'
import type { EventChatRow } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

const MEDIA_LABELS: Record<string, string> = { image: 'Photo', video: 'Video', voice: 'Voice message', gif: 'GIF', event: 'Event', profile: 'Profile' }

function preview(chat: EventChatRow, myId: string | null) {
  if (chat.closed) return 'Chat closed'
  const text = chat.last_message || MEDIA_LABELS[chat.last_message_type ?? ''] || ''
  if (!text) return `${chat.member_count} going`
  if (chat.last_message_type === 'system' || chat.last_message_type === 'update') return text
  return `${chat.last_sender_id === myId ? 'You' : chat.last_sender_name ?? 'Someone'}: ${text}`
}

/** Event chats at the top of Chat. Square photos, so they never read as one person. */
const Row = memo(function Row({ chat, myId }: { chat: EventChatRow; myId: string | null }) {
  const unread = chat.unread_count > 0
  return (
    <Pressable style={s.row} onPress={() => { hTap(); router.push(`/(chat)/event/${chat.event_id}` as any) }} accessibilityRole="button">
      {chat.cover ? <Image source={{ uri: chat.cover }} style={s.cover} contentFit="cover" cachePolicy="memory-disk" transition={120} /> : <View style={s.cover} />}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{chat.title}</Text>
        <Text style={[s.sub, unread && s.subUnread]} numberOfLines={1}>{preview(chat, myId)}</Text>
      </View>
      {chat.muted ? <BellOff size={14} color={Colors.inkDisabled} strokeWidth={2} /> : null}
      {unread ? <View style={s.badge}><Text style={s.badgeText}>{chat.unread_count > 9 ? '9+' : chat.unread_count}</Text></View> : null}
    </Pressable>
  )
})

export function EventChatsSection({ chats, myId }: { chats: EventChatRow[]; myId: string | null }) {
  if (chats.length === 0) return null
  return (
    <View style={s.wrap}>
      <Text style={s.heading}>Your events</Text>
      {chats.map(c => <Row key={c.event_id} chat={c} myId={myId} />)}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: { paddingBottom: 8 },
  heading: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 8 },
  cover: { width: 52, height: 52, borderRadius: 14, backgroundColor: Colors.surface },
  body: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  subUnread: { fontFamily: FontFamily.bodyMedium, color: Colors.inkPrimary },
  badge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.inkPrimary },
  badgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.background },
})
