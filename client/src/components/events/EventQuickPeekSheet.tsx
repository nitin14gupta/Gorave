import React, { useEffect, useRef } from 'react'
import { Pressable, Share, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop } from '@gorhom/bottom-sheet'
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet'
import { useRouter } from 'expo-router'
import { Share2, UserCircle2, ArrowUpRight } from 'lucide-react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hTap } from '@/lib/haptics'
import { useAuthStore } from '@/store/auth'
import { usePillStore } from '@/store/pillStore'
import { parseServerDate } from '@/lib/dates'
import { useImageShare } from '@/hooks/useImageShare'
import { buildEventShareUrl } from '@/lib/deepLink'
import { formatDateTime } from './eventDetailUtils'
import { EventShareCard } from './EventShareCard'
import type { EventSummary } from '@/api/apiService'

function formatEventDate(iso: string | null | undefined) {
  const d = parseServerDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function renderPeekBackdrop(props: BottomSheetBackdropProps) {
  return <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" opacity={0.5} />
}

interface CoreProps {
  event: EventSummary
  onClose: () => void
}

function EventQuickPeekSheetCore({ event, onClose }: CoreProps) {
  const sheetRef = useRef<BottomSheetModal>(null)
  const shareCardRef = useRef<View>(null)
  const router = useRouter()
  const myId = useAuthStore(state => state.userId)
  const showPill = usePillStore(s => s.show)
  const { shareImage } = useImageShare()
  const coverUrl = event.cover_photos?.[0]?.url
  useEffect(() => { sheetRef.current?.present() }, [])

  // Same "classic" poster (image + title + date) that's the first slide in
  // EventShareSheet on the event detail screen — captured and shared as one
  // image, not a plain text share.
  const handleShare = async () => {
    hTap()
    if (!coverUrl) {
      onClose()
      const message = `Check out "${event.title}" on Gorave!\n${formatEventDate(event.date_time)}${event.location_name ? `\n📍 ${event.location_name}` : ''}`
      Share.share({ message, title: event.title }).catch(() => {})
      return
    }
    const dateTimeLabel = formatDateTime(event.date_time)
    const message = `I'm going to "${event.title}"! 🎉\n${dateTimeLabel}\n${buildEventShareUrl(event.id)}`
    const result = await shareImage(shareCardRef, { message, title: event.title })
    if (!result.shared && result.error === 'failed') showPill("Couldn't share, try again", 'error')
  }

  const handleOpen = () => {
    hTap()
    onClose()
    router.push(`/(events)/${event.id}` as any)
  }

  const handleViewHost = () => {
    hTap()
    onClose()
    if (!event.host_id) return
    router.push((event.host_id === myId ? '/(tabs)/profile' : `/(profile)/${event.host_id}`) as any)
  }

  return (
    <>
    {/* Off-screen — never shown, just captured and shared as an image when
        "Share Event" is tapped. Same card used by the detail screen's share sheet. */}
    {coverUrl && (
      <View style={s.shareCardHost} pointerEvents="none">
        <EventShareCard
          ref={shareCardRef}
          imageUrl={coverUrl}
          title={event.title}
          dateTimeLabel={formatDateTime(event.date_time)}
        />
      </View>
    )}
    <BottomSheetModal
      ref={sheetRef}
      enableDynamicSizing
      enablePanDownToClose
      onDismiss={onClose}
      backdropComponent={renderPeekBackdrop}
      backgroundStyle={s.bg}
      handleIndicatorStyle={s.handle}
    >
      <BottomSheetView style={s.content}>
        <Pressable style={s.poster} onPress={handleOpen}>
          {coverUrl ? <Image source={{ uri: coverUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} /> : null}
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.85)']} locations={[0.45, 1]} style={StyleSheet.absoluteFill} />
          <View style={s.posterInfo}>
            <Text style={s.when}>{formatEventDate(event.date_time)}{event.area ? ` · ${event.area}` : ''}</Text>
            <Text style={s.title} numberOfLines={2}>{event.title}</Text>
            <View style={s.posterFoot}>
              <Text style={s.going}>{event.attendee_count > 0 ? `${event.attendee_count} going` : 'Be the first in'}</Text>
              <View style={s.price}><Text style={s.priceText}>{event.is_free ? 'Free' : `₹${event.price_inr}`}</Text></View>
            </View>
          </View>
        </Pressable>

        {event.host_name && !event.host_is_deleted ? (
          <Pressable style={s.hostRow} onPress={handleViewHost}>
            {event.host_avatar ? <Image source={{ uri: event.host_avatar }} style={s.hostAvatar} contentFit="cover" /> : <View style={[s.hostAvatar, s.hostFallback]}><Text style={s.hostInit}>{event.host_name.charAt(0)}</Text></View>}
            <Text style={s.hostText} numberOfLines={1}>Hosted by <Text style={s.hostName}>{event.host_id === myId ? 'you' : event.host_name}</Text></Text>
          </Pressable>
        ) : null}

        <View style={s.actions}>
          <Action icon={<ArrowUpRight size={20} color={Colors.background} strokeWidth={2.2} />} label="Open" onPress={handleOpen} primary />
          <Action icon={<Share2 size={19} color={Colors.inkPrimary} strokeWidth={2} />} label="Share" onPress={handleShare} />
          {event.host_name && !event.host_is_deleted ? (
            <Action icon={<UserCircle2 size={20} color={Colors.inkPrimary} strokeWidth={2} />} label="Host" onPress={handleViewHost} />
          ) : null}
        </View>
      </BottomSheetView>
    </BottomSheetModal>
    </>
  )
}

function Action({ icon, label, onPress, primary }: { icon: React.ReactNode; label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable style={s.action} onPress={onPress}>
      <View style={[s.actionCircle, primary && s.actionPrimary]}>{icon}</View>
      <Text style={s.actionLabel}>{label}</Text>
    </Pressable>
  )
}

interface Props extends CoreProps {
  visible: boolean
}

export function EventQuickPeekSheet({ visible, ...rest }: Props) {
  if (!visible) return null
  return <EventQuickPeekSheetCore {...rest} />
}

const s = StyleSheet.create({
  shareCardHost: { position: 'absolute', top: 0, left: -9999 },
  bg: { backgroundColor: Colors.surface, borderRadius: 28 },
  handle: { backgroundColor: withOpacity(Colors.inkPrimary, 0.2) },
  content: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 28, gap: 14 },
  poster: { alignSelf: 'center', width: '78%', aspectRatio: 4 / 5, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.surfaceMuted },
  posterInfo: { position: 'absolute', left: 16, right: 16, bottom: 16, gap: 4 },
  when: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: withOpacity(Colors.white, 0.85) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 24, lineHeight: 27, letterSpacing: -0.5, color: Colors.white },
  posterFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  going: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: withOpacity(Colors.white, 0.85) },
  price: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.white },
  priceText: { fontFamily: FontFamily.headingBold, fontSize: 12, color: Colors.nearBlack },
  hostRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  hostAvatar: { width: 24, height: 24, borderRadius: 12 },
  hostFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hostInit: { fontFamily: FontFamily.headingBold, fontSize: 11, color: Colors.inkPrimary },
  hostText: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
  hostName: { fontFamily: FontFamily.bodySemiBold, color: Colors.inkPrimary },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 4 },
  action: { alignItems: 'center', gap: 6 },
  actionCircle: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: withOpacity(Colors.inkPrimary, 0.08) },
  actionPrimary: { backgroundColor: Colors.inkPrimary },
  actionLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
})
