import React, { useState, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, Pressable, Share } from 'react-native'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { Image } from 'expo-image'
import { Ban, Check, Flag, Link2, Share2, QrCode, MessageCircle } from 'lucide-react-native'
import { hError, hSuccess, hTap } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { APP_SCHEME } from '@/api/config'
import { BlockSheet } from './BlockSheet'
import { ReportSheet } from './ReportSheet'
import { ShareToChatSheet } from './ShareToChatSheet'

interface Props {
  visible: boolean
  userId: string
  username: string | null
  targetName: string | null
  avatarUrl?: string | null
  city?: string | null
  interests?: string[]
  isBlocked: boolean
  onBlock: () => Promise<void>
  onUnblock: () => Promise<void>
  onReport: (reason: string) => Promise<void>
  onClose: () => void
}

function renderBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.55} />
}

function ProfileMenuSheetCore({
  userId, username, targetName, avatarUrl, city, interests,
  isBlocked, onBlock, onUnblock, onReport, onClose,
}: Omit<Props, 'visible'>) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const [blockOpen, setBlockOpen] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [chatShareOpen, setChatShareOpen] = useState(false)
  const [blockLoading, setBlockLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const transitioning = useRef(false)

  useEffect(() => { sheetRef.current?.present() }, [])

  const openBlock = () => {
    if (isBlocked) hTap(); else hError()
    transitioning.current = true
    setBlockOpen(true)
    sheetRef.current?.dismiss()
  }

  const openReport = () => {
    hTap()
    transitioning.current = true
    setReportOpen(true)
    sheetRef.current?.dismiss()
  }

  const handleDismiss = () => {
    if (transitioning.current) { transitioning.current = false; return }
    onClose()
  }

  const handleBlock = async () => {
    setBlockLoading(true)
    try { await onBlock() }
    finally { setBlockLoading(false); setBlockOpen(false); onClose() }
  }

  const handleUnblock = async () => {
    setBlockLoading(true)
    try { await onUnblock() }
    finally { setBlockLoading(false); setBlockOpen(false); onClose() }
  }

  const handleCopyUrl = async () => {
    hSuccess()
    const url = username ? `${APP_SCHEME}://profile/${username}` : `${APP_SCHEME}://profile`
    await Clipboard.setStringAsync(url)
    setCopied(true)
    setTimeout(() => { setCopied(false); onClose() }, 900)
  }

  const handleShare = async () => {
    hTap()
    const handle = username ? `@${username}` : targetName ?? 'this person'
    const url = username ? `${APP_SCHEME}://profile/${username}` : ''
    await Share.share({ message: `Check out ${handle} on Gorave${url ? `: ${url}` : ''}` })
    onClose()
  }

  const handleQrCode = () => {
    hTap()
    onClose()
    router.push({
      pathname: '/(profile)/qr',
      params: {
        userId, username: username ?? '', name: targetName ?? '',
        avatar: avatarUrl ?? '', city: city ?? '', interests: (interests ?? []).join(','),
      },
    } as any)
  }

  const openChatShare = () => {
    hTap()
    transitioning.current = true
    setChatShareOpen(true)
    sheetRef.current?.dismiss()
  }

  return (
    <>
      <BottomSheetModal
        ref={sheetRef}
        enableDynamicSizing
        enablePanDownToClose
        onDismiss={handleDismiss}
        backdropComponent={renderBackdrop}
        backgroundStyle={s.bg}
        handleIndicatorStyle={s.handleIndicator}
      >
        <BottomSheetView style={s.content}>
          <View style={s.head}>
            <View style={s.avatar}>
              {avatarUrl ? <Image source={{ uri: avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.init}>{(targetName ?? '?').charAt(0).toUpperCase()}</Text>}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.name} numberOfLines={1}>{targetName ?? 'User'}</Text>
              {username ? <Text style={s.handle} numberOfLines={1}>@{username}</Text> : null}
            </View>
          </View>

          <View style={s.card}>
            <MenuRow icon={<Share2 size={18} color={Colors.inkPrimary} strokeWidth={1.8} />} label="Share profile" onPress={handleShare} />
            <MenuRow icon={<MessageCircle size={18} color={Colors.inkPrimary} strokeWidth={1.8} />} label="Send in chat" onPress={openChatShare} border />
            <MenuRow icon={<QrCode size={18} color={Colors.inkPrimary} strokeWidth={1.8} />} label="QR code" onPress={handleQrCode} border />
            <MenuRow icon={copied ? <Check size={18} color={Colors.inkPrimary} strokeWidth={2.2} /> : <Link2 size={18} color={Colors.inkPrimary} strokeWidth={1.8} />} label={copied ? 'Link copied' : 'Copy profile link'} onPress={handleCopyUrl} border />
          </View>

          <View style={s.card}>
            <MenuRow icon={<Flag size={18} color={Colors.destructive} strokeWidth={1.8} />} label="Report" onPress={openReport} danger />
            <MenuRow icon={<Ban size={18} color={isBlocked ? Colors.inkPrimary : Colors.destructive} strokeWidth={1.8} />} label={isBlocked ? 'Unblock' : 'Block'} onPress={openBlock} danger={!isBlocked} border />
          </View>

          <Pressable style={[s.cancel]} onPress={() => { hTap(); onClose() }}>
            <Text style={s.cancelText}>Cancel</Text>
          </Pressable>
        </BottomSheetView>
      </BottomSheetModal>

      <BlockSheet
        visible={blockOpen}
        targetName={targetName}
        isBlocked={isBlocked}
        loading={blockLoading}
        onBlock={handleBlock}
        onUnblock={handleUnblock}
        onClose={() => { setBlockOpen(false); onClose() }}
      />
      <ReportSheet
        visible={reportOpen}
        targetName={targetName}
        onSubmit={onReport}
        onClose={() => { setReportOpen(false); onClose() }}
      />
      <ShareToChatSheet
        visible={chatShareOpen}
        onClose={() => { setChatShareOpen(false); onClose() }}
        contentType="profile"
        metadata={{ user_id: userId, name: targetName, avatar_url: avatarUrl ?? null, city: city ?? null, interests: interests ?? [] }}
        previewTitle={targetName ?? 'User'}
        previewSubtitle={username ? `@${username}` : null}
        previewImage={avatarUrl}
      />
    </>
  )
}

function MenuRow({ icon, label, onPress, danger, border }: { icon: React.ReactNode; label: string; onPress: () => void; danger?: boolean; border?: boolean }) {
  return (
    <Pressable style={[s.row, border && s.rowBorder]} onPress={onPress}>
      <View style={[s.rowIcon, danger && s.rowIconDanger]}>{icon}</View>
      <Text style={[s.rowText, danger && s.rowTextDanger]}>{label}</Text>
    </Pressable>
  )
}

export function ProfileMenuSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <ProfileMenuSheetCore {...rest} />
}

const s = StyleSheet.create({
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handleIndicator: { backgroundColor: withOpacity(Colors.inkPrimary, 0.18) },
  content: { paddingHorizontal: 20, paddingBottom: 36, paddingTop: 8, gap: 12 },

  head: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 4 },
  avatar: { width: 56, height: 56, borderRadius: 18, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  init: { fontFamily: FontFamily.headingBold, fontSize: 22, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, letterSpacing: -0.5, color: Colors.inkPrimary },
  handle: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary, marginTop: 1 },

  card: { borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.04), borderWidth: 1, borderColor: Colors.divider, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  rowIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: withOpacity(Colors.inkPrimary, 0.07), alignItems: 'center', justifyContent: 'center' },
  rowIconDanger: { backgroundColor: withOpacity(Colors.destructive, 0.1) },
  rowText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowTextDanger: { color: Colors.destructive },

  cancel: { height: 54, borderRadius: 999, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08), marginTop: 2 },
  cancelText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.inkPrimary },
})
