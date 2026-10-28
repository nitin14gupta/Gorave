import { useRef, useEffect } from 'react'
import {
  View, Text, TextInput, Pressable, ActivityIndicator, StyleSheet, Keyboard,
  type LayoutChangeEvent,
} from 'react-native'
import { BottomSheetModal } from '@gorhom/bottom-sheet'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { Square, Mic, Send, Trash2, Plus, X, Play, Pause, Pencil } from 'lucide-react-native'
import { RecordingWave, PlaybackWave } from '@/components/ui'
import { hHeavy, hSuccess, hTap, hError } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { usePillStore } from '@/store/pillStore'
import type { Message } from '@/api/apiService'
import type { RecordedVoice } from '@/hooks/useVoiceRecorder'
import { ReplyBar } from './ReplyBar'
import { MediaPickerSheet } from './MediaPickerSheet'
import { MediaPreviewModal } from './MediaPreviewModal'
import { useMediaPicker, type ViewLimit } from '@/hooks/useMediaPicker'
import { useViewLimitStore } from '@/store/viewLimitStore'

// One chat message holds up to 1,000 characters, same as Instagram and the server.
const MAX_MESSAGE_CHARS = 1000

export type RecordState = 'idle' | 'recording' | 'preview' | 'sending'

interface Props {
  blockStatus: 'none' | 'i_blocked' | 'they_blocked'
  partnerIsDeleted?: boolean
  inputText: string
  recordState: RecordState
  recordDurationMs: number
  recordedVoice: RecordedVoice | null
  replyingTo: Message | null
  editingMessage: Message | null
  myId: string
  partnerName: string | null
  onTextChange: (t: string) => void
  onSend: () => void
  onMicPress: () => void
  onRecordStop: () => void
  onRecordCancel: () => void
  onSendVoice: () => void
  onDiscardVoice: () => void
  onUnblock: () => void
  onDeleteChat: () => void
  onCancelReply: () => void
  onCancelEdit: () => void
  onMediaSend: (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number, duration?: number, viewLimit?: ViewLimit) => void
  onLayout: (e: LayoutChangeEvent) => void
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000)
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}

// Mini voice player shown in the preview bar after recording stops
function VoicePreviewPlayer({ uri, durationMs }: { uri: string; durationMs: number }) {
  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    player.replace({ uri })
  }, [uri])

  const toggle = () => {
    hTap()
    if (status.playing) { player.pause() }
    else { player.seekTo(0); player.play() }
  }

  const dur = Math.max(1, Math.round(durationMs / 1000))
  const mins = Math.floor(dur / 60)
  const secs = String(dur % 60).padStart(2, '0')

  return (
    <View style={pv.wrap}>
      <Pressable onPress={toggle} style={pv.btn}>
        {status.playing
          ? <Pause size={14} color={Colors.background} strokeWidth={2.5} />
          : <Play size={14} color={Colors.background} strokeWidth={2.5} />
        }
      </Pressable>
      <View style={pv.wave}>
        <PlaybackWave isActive={status.playing} color={Colors.inkSecondary} compact />
      </View>
      <Text style={pv.dur}>{`${mins}:${secs}`}</Text>
    </View>
  )
}

const pv = StyleSheet.create({
  wrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  btn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  wave: { flex: 1, overflow: 'hidden' },
  dur: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary, minWidth: 28, textAlign: 'right' },
})

export function ChatInputBar({
  blockStatus, partnerIsDeleted, inputText, recordState, recordDurationMs, recordedVoice,
  replyingTo, editingMessage, myId, partnerName,
  onTextChange, onSend, onMicPress, onRecordStop, onRecordCancel,
  onSendVoice, onDiscardVoice,
  onUnblock, onDeleteChat, onCancelReply, onCancelEdit, onMediaSend, onLayout,
}: Props) {
  const inputRef = useRef<TextInput>(null)
  const showPill = usePillStore(st => st.show)
  const sheetRef = useRef<BottomSheetModal>(null)

  const { handleCamera, handleLibrary, pendingMedia, confirmSend, cancelPreview, removeFromPreview, updatePreview } = useMediaPicker({ onMediaSend })
  // View once / twice / unlimited: starts on whatever you picked last time.
  const viewLimit = useViewLimitStore(st => st.last)
  const setViewLimit = useViewLimitStore(st => st.setLast)

  useEffect(() => {
    if (replyingTo) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [replyingTo?.id])

  useEffect(() => {
    if (editingMessage) {
      const t = setTimeout(() => inputRef.current?.focus(), 60)
      return () => clearTimeout(t)
    }
  }, [editingMessage?.id])

  const openMediaSheet = () => {
    Keyboard.dismiss()
    setTimeout(() => sheetRef.current?.present(), 160)
  }

  // ── Deleted partner / block states ──────────────────────────────────────────

  if (partnerIsDeleted) {
    return (
      <View style={s.blockNotice} onLayout={onLayout}>
        <Text style={s.blockNoticeTitle}>This account was deleted</Text>
        <Text style={s.blockNoticeText}>Their messages are no longer available, and you can&apos;t reply.</Text>
      </View>
    )
  }

  if (blockStatus === 'they_blocked') {
    return (
      <View style={s.blockNotice} onLayout={onLayout}>
        <Text style={s.blockNoticeTitle}>You can&apos;t message {(partnerName ?? 'this person').split(' ')[0]} anymore</Text>
        <Text style={s.blockNoticeText}>This chat stays here so you can still read it.</Text>
      </View>
    )
  }

  if (blockStatus === 'i_blocked') {
    return (
      <View style={s.blockBar} onLayout={onLayout}>
        <Text style={s.blockNoticeTitle}>You blocked {(partnerName ?? 'this person').split(' ')[0]}</Text>
        <Text style={s.blockBarText}>They can&apos;t message you or send you a vibe. Unblock to chat again.</Text>
        <View style={s.blockBtnRow}>
          <Pressable style={s.unblockBtn} onPress={() => { hSuccess(); onUnblock() }}>
            <Text style={s.unblockBtnText}>Unblock</Text>
          </Pressable>
          <Pressable style={s.deleteBtn} onPress={() => { hError(); onDeleteChat() }}>
            <Text style={s.deleteBtnText}>Delete chat</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  // ── Recording active ────────────────────────────────────────────────────────

  if (recordState === 'recording') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <Pressable style={s.iconBtn} onPress={() => { hTap(); onRecordCancel() }} hitSlop={8}>
          <X size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
        </Pressable>
        <View style={s.recordCenter}>
          <RecordingWave isActive />
          <Text style={s.recordTimer}>{formatTime(recordDurationMs)}</Text>
        </View>
        <Pressable style={s.recordStopBtn} onPress={() => { hTap(); onRecordStop() }}>
          <Square size={15} color={Colors.background} strokeWidth={0} fill={Colors.background} />
        </Pressable>
      </View>
    )
  }

  // ── Voice preview (after stop, before send) ─────────────────────────────────

  if (recordState === 'preview' && recordedVoice) {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <Pressable style={s.iconBtn} onPress={() => { hTap(); onDiscardVoice() }} hitSlop={8}>
          <X size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
        </Pressable>
        <VoicePreviewPlayer uri={recordedVoice.uri} durationMs={recordedVoice.durationMs} />
        <Pressable style={s.sendBtn} onPress={() => { hSuccess(); onSendVoice() }}>
          <Send size={16} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
        </Pressable>
      </View>
    )
  }

  // ── Uploading / sending ─────────────────────────────────────────────────────

  if (recordState === 'sending') {
    return (
      <View style={s.recordBar} onLayout={onLayout}>
        <ActivityIndicator size="small" color={Colors.inkSecondary} />
        <Text style={s.sendingText}>Sending…</Text>
      </View>
    )
  }

  // ── Normal input ────────────────────────────────────────────────────────────

  const hasText = inputText.trim().length > 0

  return (
    <>
      <View onLayout={onLayout}>
        {editingMessage ? (
          <View style={s.editBar}>
            <Pencil size={14} color={Colors.inkSecondary} strokeWidth={2} />
            <Text style={s.editBarText}>Editing message</Text>
            <Pressable onPress={onCancelEdit} style={s.cancelEditBtn} hitSlop={8}>
              <X size={16} color={Colors.inkSecondary} strokeWidth={2} />
            </Pressable>
          </View>
        ) : replyingTo && (
          <ReplyBar msg={replyingTo} myId={myId} partnerName={partnerName} onCancel={onCancelReply} />
        )}
        <View style={s.inputRow}>
          <Pressable style={s.addBtn} onPress={() => { hTap(); openMediaSheet() }} hitSlop={4}>
            <Plus size={18} color={Colors.inkSecondary} strokeWidth={2.5} />
          </Pressable>

          {/* Input pill — mic is absolute inside so it doesn't affect height */}
          <View style={s.inputWrap}>
            <TextInput
              ref={inputRef}
              nativeID="chat-input"
              style={s.textInput}
              value={inputText}
              onChangeText={t => {
                // One message holds up to 1,000 characters, like Instagram.
                // Past that, nothing more goes in and a pill says to send it.
                if (t.length > MAX_MESSAGE_CHARS) {
                  showPill('That is the limit for one message. Send it and carry on in a new one.')
                  onTextChange(t.slice(0, MAX_MESSAGE_CHARS))
                  return
                }
                onTextChange(t)
              }}
              maxLength={MAX_MESSAGE_CHARS + 1}
              placeholder="Message…"
              placeholderTextColor={Colors.inkDisabled}
              multiline
            />
            {!hasText && (
              <Pressable onPress={() => { hHeavy(); onMicPress() }} style={s.micBtn} hitSlop={4}>
                <Mic size={17} color={Colors.inkSecondary} strokeWidth={2} />
              </Pressable>
            )}
          </View>

          {hasText && (
            <Pressable style={s.sendBtn} onPress={onSend}>
              <Send size={17} color={Colors.background} strokeWidth={2} fill={Colors.background} />
            </Pressable>
          )}
        </View>
      </View>

      <MediaPickerSheet ref={sheetRef} onCamera={handleCamera} onLibrary={handleLibrary} />
      <MediaPreviewModal
        media={pendingMedia}
        onSend={() => confirmSend(viewLimit)}
        onCancel={cancelPreview}
        onRemove={removeFromPreview}
        onUpdate={updatePreview}
        freeStyleCrop
        viewLimit={viewLimit}
        onViewLimitChange={setViewLimit}
      />
    </>
  )
}

const s = StyleSheet.create({
  blockNotice: { marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 18, paddingVertical: 16, alignItems: 'center', gap: 4, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.06) },
  blockNoticeTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary, textAlign: 'center' },
  blockNoticeText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, textAlign: 'center' },
  blockBar: { marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 14, gap: 6, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center' },
  blockBarText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, textAlign: 'center', marginBottom: 6 },
  blockBtnRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  unblockBtn: {
    flex: 1, height: 46, borderRadius: 23,
    backgroundColor: Colors.inkPrimary,
    alignItems: 'center', justifyContent: 'center',
  },
  unblockBtnText: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.background },
  deleteBtn: {
    flex: 1, height: 46, borderRadius: 23,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.destructive },

  editBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: withOpacity(Colors.inkPrimary, 0.06),
    gap: 8,
  },
  editBarText: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  cancelEditBtn: { padding: 4 },

  recordBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 14, paddingVertical: 10,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.05), gap: 10,
  },
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.06),
    alignItems: 'center', justifyContent: 'center',
  },
  recordCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordTimer: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary, minWidth: 36, textAlign: 'right' },
  recordStopBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: Colors.brandOrange, alignItems: 'center', justifyContent: 'center', elevation: 4,
  },
  sendingText: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, marginLeft: 8 },

  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10, gap: 8,
  },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.07),
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#252525',
    paddingLeft: 14,
    paddingRight: 40,   // reserves space for absolute mic — doesn't affect height
    paddingVertical: 9,
    minHeight: 40,
    maxHeight: 120,
    justifyContent: 'center',
  },
  textInput: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    color: Colors.inkPrimary,
    lineHeight: 20,
    paddingTop: 0,
    paddingBottom: 0,
  },
  micBtn: {
    position: 'absolute',
    right: 8,
    bottom: 7,
    width: 28, height: 28, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.brandOrange,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
    shadowColor: Colors.brandOrange,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 6, elevation: 4,
  },
})
