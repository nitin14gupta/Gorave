import { useCallback, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import * as Clipboard from 'expo-clipboard'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { ArrowLeft, BellOff, Megaphone, Users } from 'lucide-react-native'
import ApiService, { type EventChatMessage, type Message } from '@/api/apiService'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { ChatNotice, GroupRow, PinnedBar, SeenRow, SystemLine, TypingLine, UpdateCard } from '@/components/chat/EventChatBits'
import { EventChatInfoSheet, PostUpdateSheet } from '@/components/chat/EventChatSheets'
import { DateSeparator } from '@/components/chat/DateSeparator'
import { EmojiPickerOverlay } from '@/components/chat/EmojiPickerOverlay'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { ReportMessageSheet } from '@/components/chat/ReportMessageSheet'
import { EmptyState, HeaderIconBtn } from '@/components/ui'
import { useEventChat } from '@/hooks/useEventChat'
import { useImageViewer } from '@/hooks/useImageViewer'
import { useVoiceRecorder } from '@/hooks/useVoiceRecorder'
import { compressVideoForUpload } from '@/lib/videoCompress'
import { parseServerDate } from '@/lib/dates'
import { hTap } from '@/lib/haptics'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { Colors, FontFamily } from '@/constants'

const BUBBLE_TYPES_SKIPPED = new Set(['system', 'update'])
const PARTY_REACTION = '🎉'

type ListRow = { kind: 'date'; id: string; label: string } | { kind: 'msg'; id: string; msg: EventChatMessage; index: number }

const dayKey = (iso: string) => new Date(iso).toDateString()

function dayLabel(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  if (d.toDateString() === today.toDateString()) return 'Today'
  return d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })
}

function when(iso?: string) {
  const d = iso ? parseServerDate(iso) : null
  return d ? d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : ''
}

/** Event group chat: everyone who's confirmed, the host's updates, and the night as it happens. */
export default function EventChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const eventId = id!
  const myId = useAuthStore(s => s.userId)
  const showPill = usePillStore(s => s.show)
  const c = useEventChat(eventId)
  const { viewingMedia, openMedia, closeMedia } = useImageViewer()
  const [text, setText] = useState('')
  const [replyingTo, setReplyingTo] = useState<EventChatMessage | null>(null)
  const [menu, setMenu] = useState<{ msg: EventChatMessage; pageY: number } | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [infoOpen, setInfoOpen] = useState(false)
  const [updateOpen, setUpdateOpen] = useState(false)
  const typingSent = useRef(false)

  const sendVoice = useCallback(async (uri: string, duration: number) => {
    const { url, key } = await ApiService.uploadChatVoice(uri)
    c.send('', 'voice', { url, duration, ...(key ? { key } : {}) })
  }, [c])
  const voice = useVoiceRecorder({ onSend: sendVoice, onVoiceTyping: active => c.sendTyping(active, 'voice') })

  const rows = useMemo<ListRow[]>(() => {
    const out: ListRow[] = []
    c.messages.forEach((msg, index) => {
      out.push({ kind: 'msg', id: msg.id, msg, index })
      const older = c.messages[index + 1]
      if (!older || dayKey(older.sent_at) !== dayKey(msg.sent_at)) out.push({ kind: 'date', id: `day_${msg.id}`, label: dayLabel(msg.sent_at) })
    })
    return out
  }, [c.messages])

  const newest = c.messages.find(m => !BUBBLE_TYPES_SKIPPED.has(m.content_type))
  const seenNewest = useMemo(() => {
    if (!newest) return []
    return c.seen.filter(p => p.id !== newest.sender_id && p.last_read_at >= newest.sent_at)
  }, [c.seen, newest])

  const handleText = (value: string) => {
    setText(value)
    const typing = value.length > 0
    if (typing !== typingSent.current) {
      typingSent.current = typing
      c.sendTyping(typing)
    }
  }

  const handleSend = () => {
    const body = text.trim()
    if (!body) return
    const reply = replyingTo
      ? { reply_to: { message_id: replyingTo.id, content: replyingTo.content, content_type: replyingTo.content_type, sender_label: replyingTo.sender_id === myId ? 'You' : replyingTo.sender?.name?.split(' ')[0] ?? 'Guest' } }
      : null
    c.send(body, 'text', reply)
    setText('')
    setReplyingTo(null)
    typingSent.current = false
    c.sendTyping(false)
  }

  // The bubble shows from the local file right away; upload runs behind it.
  const handleMedia = async (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number, duration?: number) => {
    const clientId = c.addOptimisticUpload(uri, type, width, height)
    try {
      const file = type === 'video' ? await compressVideoForUpload(uri) : uri
      const { url, media_type, key } = await ApiService.uploadChatMedia(file)
      const metadata: Record<string, any> = key ? { url, key } : { url }
      if (width) metadata.width = width
      if (height) metadata.height = height
      if (duration) metadata.duration = Math.round(duration * 10) / 10
      c.transmit(clientId, { content: null, content_type: type === 'gif' ? 'gif' : media_type, metadata })
    } catch {
      c.markFailed(clientId)
      showPill("Media didn't send, try again", 'error')
    }
  }

  const doubleTap = (msgId: string) => {
    const msg = c.messages.find(m => m.id === msgId)
    if (!msg || msg.sender_id === myId) return
    hTap()
    c.react(msgId, msg.reactions?.[myId ?? ''] === PARTY_REACTION ? null : PARTY_REACTION)
  }

  const unsend = async (msg: EventChatMessage) => {
    c.removeLocally(msg.id)
    try { await ApiService.unsendMessage(msg.id) } catch { showPill("That didn't go through", 'error'); void c.reload() }
  }

  const deleteForAll = async (msg: EventChatMessage) => {
    c.removeLocally(msg.id)
    try { await ApiService.deleteEventChatMessage(eventId, msg.id) } catch { showPill("That didn't go through", 'error'); void c.reload() }
  }

  const deleteForMe = async (msg: EventChatMessage) => {
    c.removeLocally(msg.id)
    try { await ApiService.deleteMessageForMe(msg.id) } catch { void c.reload() }
  }

  const pin = async (messageId: string | null) => {
    try { await ApiService.pinEventChatMessage(eventId, messageId) } catch (e: any) { showPill(e?.message || "That didn't go through", 'error') }
  }

  const renderItem = ({ item }: { item: ListRow }) => {
    if (item.kind === 'date') return <DateSeparator label={item.label} />
    const { msg, index } = item
    if (msg.content_type === 'system') return <SystemLine text={msg.content ?? ''} />
    if (msg.content_type === 'update') return <UpdateCard msg={msg} />
    const isMine = msg.sender_id === myId
    const newer = c.messages[index - 1]
    const older = c.messages[index + 1]
    const sameRun = (other?: EventChatMessage) => !!other && other.sender_id === msg.sender_id && !BUBBLE_TYPES_SKIPPED.has(other.content_type) && dayKey(other.sent_at) === dayKey(msg.sent_at)
    return (
      <>
        <GroupRow
          msg={msg}
          isMine={isMine}
          firstInRun={!sameRun(older)}
          lastInRun={!sameRun(newer)}
          onPressSender={() => { hTap(); router.push(`/(profile)/${msg.sender_id}` as any) }}
        >
          <MessageBubble
            msg={msg as Message}
            isMine={isMine}
            myId={myId ?? ''}
            isFailed={c.failedIds.has(msg.id)}
            onDoubleTap={doubleTap}
            onLongPress={(_, pageY) => setMenu({ msg, pageY })}
            onSwipeReply={m => setReplyingTo(m as EventChatMessage)}
            onReactionPillPress={(msgId, emoji) => c.react(msgId, c.messages.find(m => m.id === msgId)?.reactions?.[myId ?? ''] === emoji ? null : emoji)}
            onReplyTap={() => {}}
            onMediaTap={(url, type) => openMedia([{ url, type }], 0)}
            onRetry={c.retry}
          />
        </GroupRow>
        {msg.id === newest?.id ? <SeenRow people={seenNewest} isMine={isMine} onPress={() => setInfoOpen(true)} /> : null}
      </>
    )
  }

  if (c.removed) {
    return (
      <SafeAreaView style={s.root}>
        <HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>
        <View style={s.center}>
          <EmptyState icon={<Users size={52} color={Colors.inkDisabled} strokeWidth={1.2} />} title="You're not in this chat" subtitle="This chat is for confirmed guests of the event." />
        </View>
      </SafeAreaView>
    )
  }

  const chat = c.chat
  const canPost = !!chat && !chat.closed && (!chat.posting_locked || chat.is_host)

  return (
    <SafeAreaView edges={['top', 'bottom']} style={s.root}>
      <View style={s.header}>
        <HeaderIconBtn onPress={() => router.back()}><ArrowLeft size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>
        <Pressable style={s.headerMain} onPress={() => { hTap(); setInfoOpen(true) }} accessibilityRole="button" accessibilityLabel="Chat details">
          {chat?.cover ? <Image source={{ uri: chat.cover }} style={s.cover} contentFit="cover" cachePolicy="memory-disk" /> : <View style={s.cover} />}
          <View style={s.flex}>
            <Text style={s.title} numberOfLines={1}>{chat?.title ?? ''}</Text>
            <Text style={s.sub} numberOfLines={1}>{chat ? `${chat.member_count} going · ${when(chat.date_time)}` : ''}</Text>
          </View>
          {chat?.muted ? <BellOff size={15} color={Colors.inkSecondary} strokeWidth={2} /> : null}
        </Pressable>
        {chat?.is_host && !chat.closed ? (
          <HeaderIconBtn onPress={() => { hTap(); setUpdateOpen(true) }}><Megaphone size={18} color={Colors.inkPrimary} strokeWidth={2} /></HeaderIconBtn>
        ) : null}
      </View>

      {chat?.pinned ? <PinnedBar msg={chat.pinned} canUnpin={chat.is_host} onUnpin={() => pin(null)} /> : null}

      <KeyboardAvoidingView behavior="padding" style={s.flex}>
        {c.loading ? (
          <View style={s.center}><ActivityIndicator color={Colors.inkSecondary} /></View>
        ) : (
          <FlatList
            data={rows}
            inverted
            keyExtractor={r => r.id}
            renderItem={renderItem}
            contentContainerStyle={s.list}
            onEndReached={c.loadMore}
            onEndReachedThreshold={0.3}
            initialNumToRender={20}
            windowSize={9}
            ListHeaderComponent={<TypingLine names={Object.values(c.typing)} />}
          />
        )}

        {canPost ? (
          <ChatInputBar
            blockStatus="none"
            partnerIsDeleted={false}
            inputText={text}
            recordState={voice.recordState}
            recordDurationMs={voice.recordDurationMs}
            recordedVoice={voice.recordedVoice}
            replyingTo={replyingTo}
            editingMessage={null}
            myId={myId ?? ''}
            partnerName={replyingTo?.sender?.name?.split(' ')[0] ?? null}
            allowViewLimit={false}
            onTextChange={handleText}
            onSend={handleSend}
            onMicPress={voice.handleMicPress}
            onRecordStop={voice.handleRecordStop}
            onRecordCancel={voice.handleRecordCancel}
            onSendVoice={voice.handleSendVoice}
            onDiscardVoice={voice.handleDiscardVoice}
            onUnblock={() => {}}
            onDeleteChat={() => {}}
            onCancelReply={() => setReplyingTo(null)}
            onCancelEdit={() => {}}
            onMediaSend={handleMedia}
            onLayout={() => {}}
          />
        ) : chat ? (
          <ChatNotice closed={chat.closed} eventId={eventId} />
        ) : null}
      </KeyboardAvoidingView>

      {menu ? (
        <EmojiPickerOverlay
          msgId={menu.msg.id}
          pageY={menu.pageY}
          isMine={menu.msg.sender_id === myId}
          currentEmoji={menu.msg.reactions?.[myId ?? ''] ?? null}
          canCopy={menu.msg.content_type === 'text' && !!menu.msg.content}
          canEdit={false}
          canForward={false}
          hideSelect
          extraActions={chat?.is_host ? [
            ...(menu.msg.content_type === 'text' ? [{ label: 'Pin to top', onPress: () => pin(menu.msg.id) }] : []),
            ...(menu.msg.sender_id !== myId ? [{ label: 'Delete for everyone', danger: true, onPress: () => deleteForAll(menu.msg) }] : []),
          ] : []}
          onSelect={(msgId, emoji) => { c.react(msgId, emoji); setMenu(null) }}
          onReply={() => setReplyingTo(menu.msg)}
          onCopy={() => { if (menu.msg.content) Clipboard.setStringAsync(menu.msg.content) }}
          onForward={() => {}}
          onReport={() => setReportId(menu.msg.id)}
          onEdit={() => {}}
          onUnsend={() => unsend(menu.msg)}
          onDeleteForMe={() => deleteForMe(menu.msg)}
          onSelectMessage={() => {}}
          onClose={() => setMenu(null)}
        />
      ) : null}

      <ReportMessageSheet
        visible={!!reportId}
        onSubmit={reason => ApiService.reportMessage(reportId!, reason)}
        onClose={() => setReportId(null)}
      />
      {infoOpen && chat ? <EventChatInfoSheet chat={chat} eventId={eventId} myId={myId} onMute={c.setMuted} onClose={() => setInfoOpen(false)} /> : null}
      {updateOpen ? <PostUpdateSheet eventId={eventId} onClose={() => setUpdateOpen(false)} /> : null}
      <MediaViewerModal
        visible={!!viewingMedia}
        items={viewingMedia?.items ?? []}
        initialIndex={viewingMedia?.initialIndex ?? 0}
        onClose={closeMedia}
      />
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  headerMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  cover: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.surface },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  list: { paddingVertical: 8 },
})
