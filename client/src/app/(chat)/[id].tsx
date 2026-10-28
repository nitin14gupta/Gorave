import { useCallback, useRef, useEffect, useState } from 'react'
import { View, Text, Pressable, FlatList, StyleSheet, ActivityIndicator, type ScrollViewProps, type NativeScrollEvent, type NativeSyntheticEvent, type LayoutChangeEvent } from 'react-native'
import { useSharedValue, withTiming } from 'react-native-reanimated'
import { KeyboardGestureArea, KeyboardStickyView } from 'react-native-keyboard-controller'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams } from 'expo-router'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Mic } from 'lucide-react-native'
import { BlockSheet, ReportSheet } from '@/components/ui'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { useChatScreen } from '@/hooks/useChatScreen'
import type { Message } from '@/api/apiService'

import { ChatHeader } from '@/components/chat/ChatHeader'
import { ChatInputBar } from '@/components/chat/ChatInputBar'
import { MessageBubble } from '@/components/chat/MessageBubble'
import { MediaStack } from '@/components/chat/MediaStack'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { DateSeparator } from '@/components/chat/DateSeparator'
import { TypingIndicator } from '@/components/chat/TypingIndicator'
import { EmojiPickerOverlay } from '@/components/chat/EmojiPickerOverlay'
import { ReportMessageSheet } from '@/components/chat/ReportMessageSheet'
import { ChatScrollView } from '@/components/chat/ChatScrollView'
import { ChatPartnerPreview } from '@/components/chat/ChatPartnerPreview'
import { InAppBrowserModal } from '@/components/ui/InAppBrowserModal'
import { ShareToChatSheet } from '@/components/ui/ShareToChatSheet'
import { ViewOnceViewer } from '@/components/chat/ViewOnceViewer'

type ListItem =
  | Message
  | { type: 'date_sep'; label: string; id: string }
  | { type: 'seen_label'; label: string; id: string }
  | { type: 'media_group'; id: string; messages: Message[] }

// What the Forward sheet shows at the top for each kind of message.
function forwardPreview(msg: Message): { title: string; subtitle?: string; image?: string | null } {
  const m = msg.metadata ?? {}
  switch (msg.content_type) {
    case 'image': return { title: 'Photo', image: m.url }
    case 'gif': return { title: 'GIF', image: m.url }
    case 'video': return { title: 'Video' }
    case 'voice': return { title: 'Voice message', subtitle: m.duration ? `${Math.round(m.duration)}s` : undefined }
    case 'event': return { title: m.title ?? 'Event', subtitle: [m.date, m.city].filter(Boolean).join(' · ') || undefined, image: m.cover_url }
    case 'profile': return { title: m.name ?? 'Profile', subtitle: m.city ?? undefined, image: m.avatar_url }
    default: return { title: msg.content ?? '', subtitle: 'Message' }
  }
}

// VoiceIndicator lives here as a micro-component — too small for its own file
function VoiceIndicator() {
  return (
    <View style={s.voiceIndicatorWrap}>
      <View style={[s.voiceIndicatorBubble, s.voiceIndicatorRow]}>
        <Mic size={14} color={Colors.inkSecondary} strokeWidth={2} />
        <Text style={s.voiceIndicatorText}>Recording…</Text>
      </View>
    </View>
  )
}

// Widths vary per row so the shimmer reads as chat bubbles, not a repeated bar
const SKELETON_ROWS: { mine: boolean; width: number }[] = [
  { mine: false, width: 160 }, { mine: true, width: 200 },
  { mine: true, width: 120 }, { mine: false, width: 220 },
  { mine: false, width: 90 },  { mine: true, width: 170 },
  { mine: false, width: 200 }, { mine: true, width: 130 },
]

function MessageListSkeleton() {
  return (
    <View style={[s.body, s.msgList, { justifyContent: 'flex-end' }]}>
      <AutoSkeletonView isLoading animationType="gradient" defaultRadius={16} gradientColors={[Colors.skeletonBase, Colors.skeletonHighlight]}>
        {SKELETON_ROWS.map((row, i) => (
          <View
            key={i}
            style={[
              s.skBubble,
              { width: row.width, alignSelf: row.mine ? 'flex-end' : 'flex-start' },
            ]}
          />
        ))}
      </AutoSkeletonView>
    </View>
  )
}

export default function ChatDetailScreen() {
  const { id: convId } = useLocalSearchParams<{ id: string }>()
  const flatListRef = useRef<FlatList>(null)
  const [browserUrl, setBrowserUrl] = useState<string | null>(null)

  const screen = useChatScreen(convId)

  // The big intro sits at the start of the chat; the header's name and photo
  // stay hidden while it's on screen and fade in once it scrolls away.
  const identityShown = useSharedValue(1)
  const [identityHidden, setIdentityHidden] = useState(false)
  const metrics = useRef({ offset: 0, contentH: 0, layoutH: 0, introH: 0, shown: 1 })
  const syncIdentity = useCallback(() => {
    const m = metrics.current
    if (!m.introH || !m.layoutH) return
    // Inverted list: the oldest end (where the intro sits) is at the far offset.
    const toOldest = Math.max(0, m.contentH - m.layoutH - m.offset)
    const target = toOldest < m.introH * 0.6 ? 0 : 1
    if (m.shown === target) return
    m.shown = target
    identityShown.set(withTiming(target, { duration: 180 }))
    setIdentityHidden(target === 0)
  }, [identityShown])
  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent
    metrics.current.offset = contentOffset.y
    metrics.current.contentH = contentSize.height
    metrics.current.layoutH = layoutMeasurement.height
    syncIdentity()
  }, [syncIdentity])
  const handleIntroLayout = useCallback((e: LayoutChangeEvent) => {
    metrics.current.introH = e.nativeEvent.layout.height
    syncIdentity()
  }, [syncIdentity])

  // Auto-scroll to newest message when a new one arrives (skip initial load).
  // Keyed on the newest message's id, not the array length — loadMore appends
  // OLDER messages at the tail, which also grows the length but must NOT yank
  // the user back down while they're scrolling up to read history.
  const prevNewestIdRef = useRef<string | null>(null)
  const initializedRef = useRef(false)
  useEffect(() => {
    if (screen.loading) return
    const newestId = screen.messages[0]?.id ?? null
    if (!initializedRef.current) {
      initializedRef.current = true
      prevNewestIdRef.current = newestId
      return
    }
    if (newestId && newestId !== prevNewestIdRef.current) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: true })
    }
    prevNewestIdRef.current = newestId
  }, [screen.messages, screen.loading])

  const handleReplyTap = useCallback((originalMsgId: string) => {
    const targetItem = (screen.listData as ListItem[]).find(
      item => !('type' in item) && (item as Message).id === originalMsgId
    )
    if (targetItem) {
      flatListRef.current?.scrollToItem({
        item: targetItem,
        animated: true,
        viewPosition: 0.5,
      })
    }
  }, [screen.listData])

  const renderScrollComponent = useCallback(
    (props: ScrollViewProps) => (
      <ChatScrollView {...props} extraContentPadding={screen.extraContentPadding} />
    ),
    [screen.extraContentPadding],
  )

  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if ('type' in item && item.type === 'date_sep') {
      return <DateSeparator label={item.label} />
    }
    if ('type' in item && item.type === 'seen_label') {
      return <Text style={s.seenLabel}>{item.label}</Text>
    }
    if ('type' in item && item.type === 'media_group') {
      return (
        <MediaStack
          messages={item.messages}
          isMine={item.messages[0].sender_id === screen.myId}
          onOpen={screen.handleMediaGroupTap}
        />
      )
    }
    const msg = item as Message
    return (
      <MessageBubble
        msg={msg}
        isMine={msg.sender_id === screen.myId}
        myId={screen.myId ?? ''}
        isFailed={screen.failedIds?.has(msg.id)}
        selectMode={screen.selectMode}
        isSelected={screen.selectedIds.has(msg.id)}
        onToggleSelect={screen.handleToggleSelected}
        onDoubleTap={screen.handleDoubleTap}
        onLongPress={screen.handleLongPress}
        onSwipeReply={screen.handleSwipeReply}
        onReactionPillPress={screen.handleReactionPillPress}
        onReplyTap={handleReplyTap}
        onMediaTap={screen.handleMediaTap}
        onRetry={screen.handleRetry}
        onLinkTap={setBrowserUrl}
        onOpenLimited={screen.handleOpenLimited}
      />
    )
  }, [screen.handleOpenLimited, screen.myId, screen.failedIds, screen.selectMode, screen.selectedIds, screen.handleToggleSelected, screen.handleDoubleTap, screen.handleLongPress, screen.handleSwipeReply, screen.handleReactionPillPress, screen.handleMediaTap, screen.handleMediaGroupTap, screen.handleRetry, handleReplyTap])

  const listHeader = screen.isPartnerRecording
    ? <VoiceIndicator />
    : screen.isPartnerTyping ? <TypingIndicator /> : null

  return (
    <View style={s.root}>
      <ChatHeader
        partnerName={screen.partnerName}
        partnerUsername={screen.partnerUsername}
        partnerAvatar={screen.partnerAvatar}
        partnerId={screen.partnerId}
        partnerIsDeleted={screen.partnerIsDeleted}
        isPartnerOnline={screen.isPartnerOnline}
        partnerLastSeenAt={screen.partnerLastSeenAt}
        isWsConnected={screen.isWsConnected}
        reconnectFailed={screen.reconnectFailed}
        onManualReconnect={screen.manualReconnect}
        loading={screen.loading}
        onMenuPress={() => screen.setMenuOpen(true)}
        selectMode={screen.selectMode}
        selectedCount={screen.selectedIds.size}
        onExitSelect={screen.handleExitSelectMode}
        identityShown={identityShown}
        identityHidden={identityHidden}
      />

      <SafeAreaView edges={['bottom']} style={s.body}>
        {screen.loading ? (
          <MessageListSkeleton />
        ) : (
          <KeyboardGestureArea
            interpolator="ios"
            offset={screen.inputBarHeight}
            style={s.body}
            textInputNativeID="chat-input"
          >
            <FlatList
              ref={flatListRef}
              data={screen.listData as ListItem[]}
              keyExtractor={item =>
                'type' in item && item.type === 'date_sep'
                  ? item.id
                  : (item as Message).id
              }
              renderItem={renderItem}
              inverted
              contentContainerStyle={s.msgList}
              showsVerticalScrollIndicator
              onEndReached={screen.loadMore}
              onEndReachedThreshold={0.2}
              onScroll={handleScroll}
              scrollEventThrottle={16}
              onContentSizeChange={(_, h) => { metrics.current.contentH = h; syncIdentity() }}
              onLayout={e => { metrics.current.layoutH = e.nativeEvent.layout.height; syncIdentity() }}
              onScrollToIndexFailed={info => {
                flatListRef.current?.scrollToOffset({
                  offset: info.highestMeasuredFrameIndex * 72,
                  animated: true,
                })
              }}
              ListHeaderComponent={listHeader}
              ListFooterComponent={
                <>
                  {screen.loadingMore && (
                    <View style={s.loadMoreWrap}>
                      <ActivityIndicator size="small" color={Colors.inkSecondary} />
                    </View>
                  )}
                  <ChatPartnerPreview
                    partnerId={screen.partnerId}
                    partnerName={screen.partnerName}
                    partnerUsername={screen.partnerUsername}
                    partnerAvatar={screen.partnerAvatar}
                    partnerIsDeleted={screen.partnerIsDeleted}
                    onLayout={handleIntroLayout}
                  />
                </>
              }
              keyboardShouldPersistTaps="handled"
              renderScrollComponent={renderScrollComponent}
            />

            {screen.selectMode ? (
              <View style={s.selectionBar}>
                <Text style={s.selectionBarNote}>
                  If this chat is reported, recently deleted messages will be included in the report
                </Text>
                <Pressable
                  onPress={screen.handleBulkDeleteForMe}
                  disabled={screen.selectedIds.size === 0}
                  style={s.selectionBarBtn}
                >
                  <Text style={[s.selectionBarBtnText, screen.selectedIds.size === 0 && s.selectionBarBtnTextDisabled]}>
                    Delete for you ({screen.selectedIds.size})
                  </Text>
                </Pressable>
              </View>
            ) : (
            <KeyboardStickyView offset={screen.stickyOffset} style={s.stickyWrap}>
              <ChatInputBar
                blockStatus={screen.blockStatus}
                partnerIsDeleted={screen.partnerIsDeleted}
                inputText={screen.inputText}
                recordState={screen.recordState}
                recordDurationMs={screen.recordDurationMs}
                recordedVoice={screen.recordedVoice}
                replyingTo={screen.replyingTo}
                editingMessage={screen.editingMessage}
                myId={screen.myId ?? ''}
                partnerName={screen.partnerName}
                onTextChange={screen.handleTextChange}
                onSend={screen.handleSend}
                onMicPress={screen.handleMicPress}
                onRecordStop={screen.handleRecordStop}
                onRecordCancel={screen.handleRecordCancel}
                onSendVoice={screen.handleSendVoice}
                onDiscardVoice={screen.handleDiscardVoice}
                onUnblock={screen.handleUnblock}
                onDeleteChat={screen.handleDeleteChat}
                onCancelReply={screen.handleCancelReply}
                onCancelEdit={screen.handleCancelEdit}
                onMediaSend={screen.handleMediaSend}
                onLayout={screen.handleInputLayout}
              />
            </KeyboardStickyView>
            )}
          </KeyboardGestureArea>
        )}
      </SafeAreaView>

      {screen.emojiTarget && (
        <EmojiPickerOverlay
          msgId={screen.emojiTarget.msgId}
          pageY={screen.emojiTarget.pageY}
          isMine={screen.emojiTarget.isMine}
          currentEmoji={screen.emojiTarget.currentEmoji}
          canCopy={screen.emojiTarget.contentType === 'text' && !!screen.emojiTarget.content}
          canEdit={screen.emojiTarget.canEdit}
          canForward={screen.emojiTarget.canForward}
          onSelect={screen.handleEmojiSelect}
          onReply={() => screen.handleReplyFromMenu(screen.emojiTarget!.msgId)}
          onCopy={() => { if (screen.emojiTarget!.content) screen.handleCopyMessage(screen.emojiTarget!.content) }}
          onForward={() => screen.handleForwardFromMenu(screen.emojiTarget!.msgId)}
          onReport={() => screen.setReportMsgId(screen.emojiTarget!.msgId)}
          onEdit={() => screen.handleEditFromMenu(screen.emojiTarget!.msgId)}
          onUnsend={() => screen.handleUnsendMessage(screen.emojiTarget!.msgId)}
          onDeleteForMe={() => screen.handleDeleteMessageForMe(screen.emojiTarget!.msgId)}
          onSelectMessage={() => screen.handleEnterSelectMode(screen.emojiTarget!.msgId)}
          onClose={screen.handleCloseEmojiPicker}
        />
      )}

      <ReportMessageSheet
        visible={!!screen.reportMsgId}
        onSubmit={screen.handleReportMessageSubmit}
        onClose={screen.handleReportSheetClosed}
      />

      <BlockSheet
        visible={screen.menuOpen}
        targetName={screen.partnerName}
        isBlocked={screen.blockStatus === 'i_blocked'}
        onBlock={async () => { await screen.handleBlock(); screen.setMenuOpen(false) }}
        onUnblock={async () => { await screen.handleUnblock(); screen.setMenuOpen(false) }}
        onClose={() => screen.setMenuOpen(false)}
      />
      <ReportSheet
        visible={screen.reportOpen}
        targetName={screen.partnerName}
        onSubmit={screen.handleReport}
        onClose={() => screen.setReportOpen(false)}
      />

      {screen.viewingMedia && (
        <MediaViewerModal
          visible={!!screen.viewingMedia}
          items={screen.viewingMedia.items}
          initialIndex={screen.viewingMedia.initialIndex}
          onClose={screen.closeMedia}
        />
      )}

      {screen.forwardMsg && (
        <ShareToChatSheet
          visible
          title="Forward"
          forward={{
            messageId: screen.forwardMsg.id,
            maxTargets: (screen.forwardMsg.forward_score ?? 0) >= 5 ? 1 : 5,
            onForwarded: screen.handleForwarded,
          }}
          previewTitle={forwardPreview(screen.forwardMsg).title}
          previewSubtitle={forwardPreview(screen.forwardMsg).subtitle}
          previewImage={forwardPreview(screen.forwardMsg).image}
          onClose={() => screen.setForwardMsg(null)}
        />
      )}

      {screen.openedLimited && (
        <ViewOnceViewer key={screen.openedLimited.url} media={screen.openedLimited} onClose={screen.closeLimited} />
      )}

      <InAppBrowserModal
        visible={!!browserUrl}
        url={browserUrl}
        onClose={() => setBrowserUrl(null)}
      />
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  body: { flex: 1 },
  stickyWrap: { backgroundColor: Colors.background },
  selectionBar: {
    backgroundColor: Colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: withOpacity(Colors.inkPrimary, 0.1),
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
    alignItems: 'center',
    gap: 10,
  },
  selectionBarNote: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    color: Colors.inkDisabled,
    textAlign: 'center',
  },
  selectionBarBtn: { paddingVertical: 4 },
  selectionBarBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 15,
    color: Colors.destructive,
  },
  selectionBarBtnTextDisabled: { color: Colors.inkDisabled },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgList: { paddingHorizontal: 16, paddingVertical: 12 },
  skBubble: { height: 40, borderRadius: 16, backgroundColor: Colors.surfaceMuted, marginBottom: 10 },
  loadMoreWrap: { paddingVertical: 14, alignItems: 'center' },
  seenLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: Colors.inkDisabled,
    textAlign: 'right',
    paddingRight: 4,
    marginBottom: 4,
  },
  voiceIndicatorWrap: { marginBottom: 12, maxWidth: '82%', alignSelf: 'flex-start' },
  voiceIndicatorBubble: {
    backgroundColor: Colors.elevated,
    borderWidth: 1, borderColor: Colors.surfaceMuted,
    borderRadius: 16, borderBottomLeftRadius: 4,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  voiceIndicatorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  voiceIndicatorText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
})
