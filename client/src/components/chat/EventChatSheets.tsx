import { useEffect, useRef, useState } from 'react'
import { ActivityIndicator, Pressable, StyleSheet, Switch, Text, View } from 'react-native'
import { BottomSheetBackdrop, BottomSheetFlatList, BottomSheetModal, BottomSheetTextInput, BottomSheetView, type BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { UserMinus } from 'lucide-react-native'
import ApiService, { type EventChat, type EventChatMember } from '@/api/apiService'
import { ConfirmSheet, PrimaryButton } from '@/components/ui'
import { hTap } from '@/lib/haptics'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily, withOpacity } from '@/constants'

const MAX_UPDATE = 1000

function backdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

/** Everyone in the chat. Opening it from the faces under a message shows who's seen it first. */
export function EventChatInfoSheet({ chat, eventId, myId, onMute, onClose }: {
  chat: EventChat; eventId: string; myId: string | null; onMute: (muted: boolean) => void; onClose: () => void
}) {
  const ref = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)
  const [members, setMembers] = useState<EventChatMember[]>([])
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(chat.posting_locked)
  const [toRemove, setToRemove] = useState<EventChatMember | null>(null)
  const transitioning = useRef(false)

  useEffect(() => {
    ref.current?.present()
    ApiService.getEventChatMembers(eventId).then(setMembers).catch(() => {}).finally(() => setLoading(false))
  }, [eventId])

  const toggleLock = (value: boolean) => {
    setLocked(value)
    ApiService.lockEventChat(eventId, value).catch((e: any) => {
      setLocked(!value)
      showPill(e?.message || "That didn't go through", 'error')
    })
  }

  const remove = async () => {
    if (!toRemove) return
    const person = toRemove
    setToRemove(null)
    try {
      await ApiService.removeEventChatMember(eventId, person.id)
      setMembers(prev => prev.filter(m => m.id !== person.id))
      showPill(`Removed ${person.name?.split(' ')[0] ?? 'them'} from the chat`, 'success')
    } catch (e: any) {
      showPill(e?.message || "That didn't go through", 'error')
    }
  }

  return (
    <>
      <BottomSheetModal
        ref={ref}
        snapPoints={['70%']}
        enablePanDownToClose
        onDismiss={() => { if (!transitioning.current) onClose() }}
        backdropComponent={backdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetFlatList
          data={members}
          keyExtractor={(m: EventChatMember) => m.id}
          contentContainerStyle={s.list}
          ListHeaderComponent={
            <View>
              <Text style={s.title}>{chat.member_count} in this chat</Text>
              <View style={s.switchRow}>
                <Text style={s.switchLabel}>Mute this chat</Text>
                <Switch value={chat.muted} onValueChange={onMute} />
              </View>
              {chat.is_host ? (
                <View style={s.switchRow}>
                  <View style={s.flex}>
                    <Text style={s.switchLabel}>Only host can post</Text>
                    <Text style={s.switchHint}>Guests can still read and react.</Text>
                  </View>
                  <Switch value={locked} onValueChange={toggleLock} />
                </View>
              ) : null}
              {loading ? <ActivityIndicator color={Colors.inkSecondary} style={s.spinner} /> : null}
            </View>
          }
          renderItem={({ item }: { item: EventChatMember }) => (
            <View style={s.member}>
              <Pressable style={s.memberMain} onPress={() => { hTap(); ref.current?.dismiss(); router.push(item.id === myId ? '/(tabs)/profile' : `/(profile)/${item.id}` as any) }}>
                <View style={s.avatar}>
                  {item.avatar ? <Image source={{ uri: item.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : null}
                </View>
                <View style={s.flex}>
                  <Text style={s.name} numberOfLines={1}>{item.id === myId ? 'You' : item.name ?? 'Guest'}</Text>
                  {item.role === 'host' ? <Text style={s.role}>Host</Text> : null}
                </View>
              </Pressable>
              {chat.is_host && item.role !== 'host' ? (
                <Pressable hitSlop={8} onPress={() => { hTap(); setToRemove(item) }} accessibilityLabel={`Remove ${item.name ?? 'guest'}`}>
                  <UserMinus size={18} color={Colors.inkSecondary} strokeWidth={1.8} />
                </Pressable>
              ) : null}
            </View>
          )}
        />
      </BottomSheetModal>
      <ConfirmSheet
        visible={!!toRemove}
        title={`Remove ${toRemove?.name?.split(' ')[0] ?? 'them'} from the chat?`}
        body="They keep their ticket and can still come. They just can't read or post here any more."
        confirmLabel="Remove"
        destructive
        onConfirm={remove}
        onClose={() => setToRemove(null)}
      />
    </>
  )
}

/** The host's megaphone: pinned at the top and pushed to everyone. */
export function PostUpdateSheet({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const ref = useRef<BottomSheetModal>(null)
  const showPill = usePillStore(s => s.show)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  useEffect(() => { ref.current?.present() }, [])

  const post = async () => {
    if (!text.trim() || sending) return
    setSending(true)
    try {
      await ApiService.postEventChatUpdate(eventId, text.trim())
      ref.current?.dismiss()
    } catch (e: any) {
      showPill(e?.message || "That didn't go through", 'error')
      setSending(false)
    }
  }

  return (
    <BottomSheetModal
      ref={ref}
      enableDynamicSizing
      enablePanDownToClose
      keyboardBehavior="interactive"
      keyboardBlurBehavior="restore"
      android_keyboardInputMode="adjustResize"
      onDismiss={onClose}
      backdropComponent={backdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.update}>
        <Text style={s.title}>Post an update</Text>
        <Text style={s.switchHint}>Goes to every guest with a notification, and stays pinned at the top.</Text>
        <BottomSheetTextInput
          style={s.input}
          value={text}
          onChangeText={setText}
          placeholder="Doors open at 9, come to the side gate"
          placeholderTextColor={Colors.inkDisabled}
          multiline
          maxLength={MAX_UPDATE}
          autoFocus
        />
        <PrimaryButton label="Post update" onPress={post} disabled={!text.trim()} loading={sending} />
      </BottomSheetView>
    </BottomSheetModal>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  bg: { backgroundColor: Colors.elevated },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 20, color: Colors.inkPrimary, marginBottom: 8 },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 8 },
  switchLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  switchHint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary },
  spinner: { marginTop: 16 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  memberMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surface },
  name: { fontFamily: FontFamily.bodyMedium, fontSize: 15, color: Colors.inkPrimary },
  role: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  update: { paddingHorizontal: 20, paddingBottom: 28, gap: 8 },
  input: { minHeight: 96, marginTop: 6, marginBottom: 6, padding: 14, borderRadius: 16, backgroundColor: Colors.surface, color: Colors.inkPrimary, fontFamily: FontFamily.bodyRegular, fontSize: 15, lineHeight: 21, textAlignVertical: 'top' },
})
