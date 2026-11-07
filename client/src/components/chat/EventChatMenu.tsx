import { useEffect, useRef } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Bell, BellOff, Pin, PinOff, Trash2 } from 'lucide-react-native'
import type { EventChatRow } from '@/api/apiService'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

const MEDIA_LABELS: Record<string, string> = { image: 'Photo', video: 'Video', voice: 'Voice message', gif: 'GIF', event: 'Event', profile: 'Profile' }

/** The grey line under an event chat in Chat. */
export function eventChatPreview(chat: EventChatRow, myId: string | null) {
  if (chat.closed) return 'Chat closed'
  const text = chat.last_message || MEDIA_LABELS[chat.last_message_type ?? ''] || ''
  if (!text) return `${chat.member_count} going`
  if (chat.last_message_type === 'system' || chat.last_message_type === 'update') return text
  return `${chat.last_sender_id === myId ? 'You' : chat.last_sender_name ?? 'Someone'}: ${text}`
}

function backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

/** Long-press on an event chat: pin and mute, just for you. */
export function EventChatMenuSheet({ chat, onTogglePin, onToggleMute, onDelete, onClose }: { chat: EventChatRow; onTogglePin: () => void; onToggleMute: () => void; onDelete: () => void; onClose: () => void }) {
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
        <Pressable style={s.sheetRow} onPress={() => run(onDelete)} accessibilityRole="button">
          <Trash2 size={18} color={Colors.destructive} strokeWidth={1.8} />
          <Text style={[s.sheetLabel, s.danger]}>Delete chat</Text>
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
  body: { flex: 1, gap: 2 },
  danger: { color: Colors.destructive },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
})
