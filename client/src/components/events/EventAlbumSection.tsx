import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Camera, ChevronRight } from 'lucide-react-native'
import type { EventAlbum } from '@/api/apiService'
import { photosLabel } from '@/lib/album'
import { hTap } from '@/lib/haptics'
import { Colors, FontFamily } from '@/constants'

/** The way into the album on an ended event. Only shows for people the server lets in. */
export function EventAlbumSection({ album, eventId }: { album?: EventAlbum | null; eventId: string }) {
  if (!album) return null
  const sub = album.count > 0
    ? `${photosLabel(album.count)}${album.can_add ? ' · Add yours' : ''}`
    : album.can_add ? 'Be the first to drop a pic' : 'No photos from this night'
  return (
    <Pressable style={s.row} onPress={() => { hTap(); router.push(`/(events)/${eventId}/album` as any) }} accessibilityRole="button">
      {album.preview.length > 0 ? (
        <View style={s.stack}>
          {album.preview.slice(0, 3).map((p, i) => (
            <Image key={p.key} source={{ uri: p.url, cacheKey: p.key }} style={[s.thumb, { marginLeft: i ? -18 : 0, zIndex: 3 - i }]} contentFit="cover" cachePolicy="memory-disk" />
          ))}
        </View>
      ) : (
        <View style={s.iconWrap}><Camera size={20} color={Colors.inkPrimary} strokeWidth={1.8} /></View>
      )}
      <View style={s.text}>
        <Text style={s.title}>After-party album</Text>
        <Text style={s.sub} numberOfLines={1}>{sub}</Text>
      </View>
      <ChevronRight size={18} color={Colors.inkSecondary} strokeWidth={2} />
    </Pressable>
  )
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 16, backgroundColor: Colors.surface },
  stack: { flexDirection: 'row' },
  thumb: { width: 44, height: 55, borderRadius: 10, borderWidth: 2, borderColor: Colors.surface, backgroundColor: Colors.background },
  iconWrap: { width: 44, height: 55, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  text: { flex: 1, gap: 2 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary },
})
