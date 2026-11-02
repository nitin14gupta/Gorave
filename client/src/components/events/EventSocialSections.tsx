import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import { router } from 'expo-router'
import { Camera, ChevronRight, Ghost, MessagesSquare, Star } from 'lucide-react-native'
import type { EventAlbum, EventDetail, EventGuest } from '@/api/apiService'
import { photosLabel } from '@/lib/album'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily, HOST_BADGE_IMAGES, withOpacity } from '@/constants'

interface Props {
  event: EventDetail
  eventId: string
  isHost: boolean
  guests: EventGuest[]
  guestTotal: number
  onOpenGuests: () => void
}

function openHost(event: EventDetail, isHost: boolean) {
  hTap()
  router.push(isHost ? '/(tabs)/profile' : `/(profile)/${event.host_id}` as any)
}

function openRatings(event: EventDetail) {
  hTap()
  router.push(`/(profile)/host-reviews?id=${event.host_id}&name=${encodeURIComponent(event.host_name ?? '')}` as any)
}

function openAlbum(eventId: string, add?: boolean) {
  hTap()
  router.push({ pathname: '/(events)/[id]/album', params: { id: eventId, ...(add ? { add: '1' } : {}) } } as any)
}

function HostFace({ event, size }: { event: EventDetail; size: number }) {
  const badge = event.host_badges?.find(b => HOST_BADGE_IMAGES[b])
  const badgeImage = badge ? HOST_BADGE_IMAGES[badge] : null
  return (
    <View>
      <View style={[s.face, { width: size, height: size, borderRadius: size / 2 }]}>
        {event.host_is_deleted ? (
          <Ghost size={size * 0.42} color={Colors.inkDisabled} strokeWidth={1.5} />
        ) : event.host_avatar ? (
          <Image source={{ uri: event.host_avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
        ) : (
          <Text style={s.initial}>{event.host_name?.[0]}</Text>
        )}
      </View>
      {!event.host_is_deleted && badgeImage ? (
        <View style={s.badge}><Image source={badgeImage} style={s.badgeImage} contentFit="contain" /></View>
      ) : null}
    </View>
  )
}

function Faces({ guests, total, size, max, overlap, ringColor }: { guests: EventGuest[]; total: number; size: number; max: number; overlap: number; ringColor: string }) {
  const ring = { width: size, height: size, borderRadius: size / 2, borderColor: ringColor }
  return (
    <View style={s.faces}>
      {guests.slice(0, max).map((g, i) => (
        <View key={g.id} style={[s.guest, ring, { marginLeft: i ? -overlap : 0, zIndex: max - i }]}>
          {g.avatar ? (
            <Image source={{ uri: g.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
          ) : (
            <Text style={s.guestInitial}>{(g.name ?? '?').charAt(0).toUpperCase()}</Text>
          )}
        </View>
      ))}
      {total > max ? (
        <View style={[s.guest, ring, { marginLeft: -overlap }]}><Text style={s.more}>+{total - max}</Text></View>
      ) : null}
    </View>
  )
}

const ratingText = (event: EventDetail) => (event.host_avg_rating != null ? event.host_avg_rating.toFixed(1) : 'New')
function albumLine(album: EventAlbum) {
  if (album.count > 0) return `${photosLabel(album.count)}${album.can_add ? ' · Add yours' : ''}`
  return album.can_add ? 'Be the first to drop a pic' : 'No photos from this night'
}

const hostName = (event: EventDetail, isHost: boolean) => (event.host_is_deleted ? '[deleted]' : isHost ? 'You' : event.host_name)

/**
 * Host, guests and album below the crowd card. No boxes: each keeps its own
 * shape, split by thin lines, so they don't read as one list of cards.
 */
export function EventSocialSections({ event, eventId, isHost, guests, guestTotal, onOpenGuests }: Props) {
  const album = event.album
  return (
    <View style={s.open}>
      {event.host_name ? (
        <View style={s.hostRow}>
          <Pressable style={s.hostMain} onPress={() => openHost(event, isHost)} accessibilityRole="button">
            <HostFace event={event} size={56} />
            <View style={s.flex}>
              <Text style={s.label}>Hosted by</Text>
              <Text style={s.hostName} numberOfLines={1}>{hostName(event, isHost)}</Text>
            </View>
          </Pressable>
          {!event.host_is_deleted ? (
            <Pressable style={s.ratingPill} onPress={() => openRatings(event)} hitSlop={6} accessibilityLabel="See ratings">
              <Star size={13} color={Colors.accentGold} fill={Colors.accentGold} strokeWidth={0} />
              <Text style={s.ratingValue}>{ratingText(event)}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {guestTotal > 0 ? (
        <Pressable style={s.block} onPress={() => { hTap(); onOpenGuests() }} accessibilityRole="button">
          <View style={s.blockHead}>
            <Text style={s.title}>Who&apos;s going</Text>
            <View style={s.link}>
              <Text style={s.linkText}>{guestTotal} going</Text>
              <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
            </View>
          </View>
          <Faces guests={guests} total={guestTotal} size={50} max={6} overlap={10} ringColor={Colors.background} />
        </Pressable>
      ) : null}

      {event.chat ? (
        <Pressable style={[s.block, s.chatRow]} onPress={() => { hTap(); router.push(`/(chat)/event/${eventId}` as any) }} accessibilityRole="button">
          <MessagesSquare size={20} color={Colors.inkPrimary} strokeWidth={1.8} />
          <View style={s.flex}>
            <Text style={s.title}>Group chat</Text>
            <Text style={s.label}>{event.chat.closed ? 'This chat has closed' : event.chat.unread > 0 ? `${event.chat.unread} new` : 'Everyone going is in here'}</Text>
          </View>
          <ChevronRight size={15} color={Colors.inkSecondary} strokeWidth={2} />
        </Pressable>
      ) : null}

      {album ? (
        <View style={s.block}>
          <Pressable style={s.banner} onPress={() => openAlbum(eventId, album.count === 0 && album.can_add)} accessibilityRole="button">
            {album.preview.length > 0 ? (
              <View style={s.bannerPhotos}>
                {album.preview.slice(0, 3).map(p => (
                  <Image key={p.key} source={{ uri: p.url, cacheKey: p.key }} style={s.flex} contentFit="cover" cachePolicy="memory-disk" transition={200} />
                ))}
              </View>
            ) : (
              <View style={s.bannerEmpty}><Camera size={26} color={Colors.inkDisabled} strokeWidth={1.5} /></View>
            )}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.78)']} locations={[0.3, 1]} style={StyleSheet.absoluteFill} />
            <View style={s.bannerText}>
              <View style={s.flex}>
                <Text style={s.bannerTitle}>After-party album</Text>
                <Text style={s.bannerSub} numberOfLines={1}>{albumLine(album)}</Text>
              </View>
              <ChevronRight size={18} color={Colors.white} strokeWidth={2} />
            </View>
          </Pressable>
        </View>
      ) : null}
    </View>
  )
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  face: { backgroundColor: Colors.elevated, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary },
  badge: { position: 'absolute', right: -3, bottom: -3, width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.background },
  badgeImage: { width: 15, height: 15 },
  faces: { flexDirection: 'row', alignItems: 'center' },
  guest: { borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.elevated },
  guestInitial: { fontFamily: FontFamily.headingBold, fontSize: 14, color: Colors.inkPrimary },
  more: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  label: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },

  open: { marginBottom: 8 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  hostMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  hostName: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.inkPrimary, marginTop: 1 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: Colors.surface },
  ratingValue: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  block: { gap: 14, paddingVertical: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  blockHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  chatRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  link: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontFamily: FontFamily.bodyMedium, fontSize: 13, color: Colors.inkSecondary },
  banner: { height: 164, borderRadius: 20, overflow: 'hidden', backgroundColor: Colors.surface },
  bannerPhotos: { ...StyleSheet.absoluteFill, flexDirection: 'row', gap: 2 },
  bannerEmpty: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 },
  bannerText: { position: 'absolute', left: 16, right: 14, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 8 },
  bannerTitle: { fontFamily: FontFamily.headingBold, fontSize: 18, color: Colors.white },
  bannerSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: withOpacity(Colors.white, 0.8), marginTop: 1 },
})
