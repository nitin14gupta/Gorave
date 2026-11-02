import { memo, useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Bell, BellOff, Pin, PinOff } from 'lucide-react-native'
import type { EventChatRow } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const MEDIA_LABELS: Record<string, string> = { image: 'Photo', video: 'Video', voice: 'Voice message', gif: 'GIF', event: 'Event', profile: 'Profile' }

function preview(chat: EventChatRow, myId: string | null) {
  if (chat.closed) return 'Chat closed'
  const text = chat.last_message || MEDIA_LABELS[chat.last_message_type ?? ''] || ''
  if (!text) return `${chat.member_count} going`
  if (chat.last_message_type === 'system' || chat.last_message_type === 'update') return text
  return `${chat.last_sender_id === myId ? 'You' : chat.last_sender_name ?? 'Someone'}: ${text}`
}

/** Event chats at the top of Chat. Square photos, so they never read as one person. */
const Row = memo(function Row({ chat, myId, onLongPress }: { chat: EventChatRow; myId: string | null; onLongPress: (chat: EventChatRow) => void }) {
  const unread = chat.unread_count > 0
  return (
    <Pressable style={s.row} onPress={() => { hTap(); router.push(`/(chat)/event/${chat.event_id}` as any) }} onLongPress={() => { hTap(); onLongPress(chat) }} accessibilityRole="button">
      {chat.cover ? <Image source={{ uri: chat.cover }} style={s.cover} contentFit="cover" cachePolicy="memory-disk" transition={120} /> : <View style={s.cover} />}
      <View style={s.body}>
        <Text style={s.title} numberOfLines={1}>{chat.title}</Text>
        <Text style={[s.sub, unread && s.subUnread]} numberOfLines={1}>{preview(chat, myId)}</Text>
      </View>
      {chat.pinned ? <Pin size={13} color={Colors.inkSecondary} strokeWidth={2} /> : null}
      {chat.muted ? <BellOff size={14} color={Colors.inkDisabled} strokeWidth={2} /> : null}
      {unread ? <View style={s.badge}><Text style={s.badgeText}>{chat.unread_count > 9 ? '9+' : chat.unread_count}</Text></View> : null}
    </Pressable>
  )
})

export function EventChatsSection({ chats, myId, onLongPress }: { chats: EventChatRow[]; myId: string | null; onLongPress: (chat: EventChatRow) => void }) {
  if (chats.length === 0) return null
  return (
    <View style={s.wrap}>
      <Text style={s.heading}>Your events</Text>
      {chats.map(c => <Row key={c.event_id} chat={c} myId={myId} onLongPress={onLongPress} />)}
    </View>
  )
}

function backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

/** Long-press on an event chat: pin and mute, just for you. */
export function EventChatMenuSheet({ chat, onTogglePin, onToggleMute, onClose }: { chat: EventChatRow; onTogglePin: () => void; onToggleMute: () => void; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  useEffect(() => { ref.current?.present() }, [])
  const run = (action: () => void) => { hTap(); action(); ref.current?.dismiss() }
  return (
    <BottomSheetModal ref={ref} enableDynamicSizing enablePanDownToClose onDismiss={onClose} backdropComponent={backdrop} backgroundStyle={s.sheetBg} handleIndicatorStyle={s.sheetHandle}>
      <BottomSheetView style={s.sheet}>
        <Text style={s.sheetTitle} numberOfLines={1}>{chat.title}</Text>
        <Pressable style={s.sheetRow} onPress={() => run(onTogglePin)} accessibilityRole="button">
          {chat.pinned ? <PinOff size={18} color={Colors.inkPrimary} strokeWidth={1.8} /> : <Pin size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
          <Text style={s.sheetLabel}>{chat.pinned ? 'Unpin chat' : 'Pin chat'}</Text>
        </Pressable>
        <Pressable style={s.sheetRow} onPress={() => run(onToggleMute)} accessibilityRole="button">
          {chat.muted ? <Bell size={18} color={Colors.inkPrimary} strokeWidth={1.8} /> : <BellOff size={18} color={Colors.inkPrimary} strokeWidth={1.8} />}
          <View style={s.body}>
            <Text style={s.sheetLabel}>{chat.muted ? 'Unmute' : 'Mute'}</Text>
            {!chat.muted ? <Text style={s.sub}>You&apos;ll still get updates from the host.</Text> : null}
          </View>
        </Pressable>
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  sheetBg: { backgroundColor: Colors.elevated },
  sheetHandle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  sheet: { paddingHorizontal: 20, paddingBottom: 32, gap: 2 },
  sheetTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, marginBottom: 8 },
  sheetRow: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 54 },
  sheetLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
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
