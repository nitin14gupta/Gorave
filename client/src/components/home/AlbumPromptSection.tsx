import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Dimensions, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { ImagePlus } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import { albumTakesPhotos } from '@/lib/album'
import { parseServerDate } from '@/lib/dates'
import { hTap } from '@/lib/haptics'
import { fetchMine } from '@/lib/myEventsCache'
import { invalidate } from '@/lib/queryCache'
import { CacheKeys, Colors, FontFamily } from '@/constants'

const W = Dimensions.get('window').width
const CARD_W = W - 56

function waitingForPhotos(events: EventSummary[]) {
  return events
    .filter(e => !e.is_cancelled && !!e.my_checked_in_at && !e.my_album_count && albumTakesPhotos(e))
    .sort((a, b) => (parseServerDate(b.date_time)?.getTime() ?? 0) - (parseServerDate(a.date_time)?.getTime() ?? 0))
}

export interface AlbumPromptSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

/** "Drop your pics": nights you were at that still take photos, until you've added yours. */
export const AlbumPromptSection = forwardRef<AlbumPromptSectionHandle, Props>(function AlbumPromptSection({ onEmptyChange }, ref) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const mountedRef = useRef(true)
  const reloadRef = useRef<(force: boolean) => unknown>(() => {})

  const load = useCallback((force: boolean) => {
    // Same cache entry the other Home sections use, no extra network round-trip.
    const fetch = () => fetchMine(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), () => { if (mountedRef.current) reloadRef.current(false) })
    return (force ? invalidate(CacheKeys.homeJoinedEvents).then(fetch) : fetch())
      .then(data => {
        if (!mountedRef.current) return
        const waiting = waitingForPhotos(data)
        setEvents(waiting)
        onEmptyChange?.(waiting.length === 0)
      })
      .catch(() => {})
  }, [onEmptyChange])

  useEffect(() => { reloadRef.current = load }, [load])
  useImperativeHandle(ref, () => ({ refresh: () => load(true) }), [load])
  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    load(false)
    return () => { mountedRef.current = false }
  }, [load]))

  if (events.length === 0) return null

  const single = events.length === 1
  return (
    <View style={s.wrap}>
      <SectionHeader title="Drop your pics" />
      <ScrollView
        horizontal
        scrollEnabled={!single}
        showsHorizontalScrollIndicator={false}
        snapToInterval={single ? undefined : CARD_W + 12}
        decelerationRate="fast"
        style={{ marginHorizontal: -16 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      >
        {events.map(e => <PromptCard key={e.id} event={e} width={single ? W - 32 : CARD_W} />)}
      </ScrollView>
    </View>
  )
})

function PromptCard({ event, width }: { event: EventSummary; width: number }) {
  const cover = event.cover_photos?.[0]?.url
  const open = () => {
    hTap()
    router.push({ pathname: '/(events)/[id]/album', params: { id: event.id, add: '1' } } as any)
  }
  return (
    <Pressable style={[s.card, { width }]} onPress={open} accessibilityRole="button">
      {cover ? <Image source={{ uri: cover }} style={s.cover} contentFit="cover" cachePolicy="memory-disk" /> : <View style={s.cover} />}
      <View style={s.text}>
        <Text style={s.title} numberOfLines={2}>Got pics from {event.title}?</Text>
        <Text style={s.sub}>Only people who were there can see them</Text>
        <View style={s.cta}>
          <ImagePlus size={15} color={Colors.background} strokeWidth={2.2} />
          <Text style={s.ctaText}>Add photos</Text>
        </View>
      </View>
    </Pressable>
  )
}

const s = StyleSheet.create({
  wrap: { gap: 10 },
  card: { flexDirection: 'row', gap: 12, padding: 10, borderRadius: 20, backgroundColor: Colors.surface },
  cover: { width: 92, height: 115, borderRadius: 12, backgroundColor: Colors.background },
  text: { flex: 1, justifyContent: 'center', gap: 2 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, lineHeight: 20, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
  cta: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: Colors.inkPrimary },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.background },
})
