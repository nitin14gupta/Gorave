import { SectionHeader } from '@/components/ui/SectionHeader'
import { forwardRef, memo, useCallback, useImperativeHandle, useRef, useState, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import { Image } from 'expo-image'
import { QrCode, Ticket } from 'lucide-react-native'
import { router, useFocusEffect } from 'expo-router'
import ApiService, { type EventSummary } from '@/api/apiService'
import { invalidate } from '@/lib/queryCache'
import { fetchMine } from '@/lib/myEventsCache'
import { SosPill } from '@/components/events/SosButton'
import { parseServerDate, isEventActive } from '@/lib/dates'
import { hTap } from '@/lib/haptics'
import { CacheKeys, Colors, FontFamily, withOpacity } from '@/constants'


function activeSorted(events: EventSummary[]) {
  return events
    .filter(e => isEventActive(e) && !e.is_cancelled)
    .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
}

/** "Ends 11:30 pm", from the end time (or six hours after the start). */
function endsLabel(e: EventSummary): string {
  const start = parseServerDate(e.date_time)
  const end = parseServerDate(e.end_time) ?? (start ? new Date(start.getTime() + 6 * 3600_000) : null)
  if (!end) return 'On now'
  const h = end.getHours()
  const m = end.getMinutes()
  return `Ends ${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`
}

/**
 * You're at this event right now, so the two things you could need are one
 * tap away: your ticket for the door, and SOS. Full width, never squeezed:
 * the 4:5 poster, LIVE with when it ends and where, the title, two buttons.
 */
const ActiveEventCard = memo(function ActiveEventCard({ event }: { event: EventSummary }) {
  const cover = event.cover_photos?.[0]?.url
  const area = event.area || event.city || event.location_name
  const openEvent = () => { hTap(); router.push(`/(events)/${event.id}` as any) }
  const openTicket = () => { hTap(); router.push(`/(events)/${event.id}/ticket` as any) }
  const meta = [endsLabel(event), area].filter(Boolean).join(' · ')

  return (
    <Pressable style={a.card} onPress={openEvent}>
      <View style={a.poster}>
        {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" /> : (
          <View style={[StyleSheet.absoluteFill, a.posterFallback]}><Ticket size={22} color={Colors.inkDisabled} strokeWidth={1.6} /></View>
        )}
      </View>
      <View style={a.body}>
        <View style={a.liveRow}>
          <View style={live.pill}><View style={live.dot} /><Text style={live.text}>LIVE</Text></View>
          <Text style={a.meta} numberOfLines={1}>{meta}</Text>
        </View>
        <Text style={a.title} numberOfLines={2}>{event.title}</Text>
        <View style={a.actions}>
          <Pressable style={a.ticketBtn} onPress={openTicket}>
            <QrCode size={15} color={Colors.inkPrimary} strokeWidth={2.2} />
            <Text style={a.ticketText}>Show ticket</Text>
          </Pressable>
          <SosPill eventId={event.id} style={a.sos} />
        </View>
      </View>
    </Pressable>
  )
})

export interface ActiveEventsSectionHandle {
  /** Force a fresh fetch, bypassing the cache — used by pull-to-refresh. */
  refresh: () => Promise<void>
}

interface Props {
  onEmptyChange?: (empty: boolean) => void
}

export const ActiveEventsSection = forwardRef<ActiveEventsSectionHandle, Props>(function ActiveEventsSection(
  { onEmptyChange },
  ref,
) {
  const [events, setEvents] = useState<EventSummary[]>([])
  const mountedRef = useRef(true)

  // The background refresh calls back into load to re-read the fresh copy.
  const reloadRef = useRef<(force: boolean) => unknown>(() => {})
  const load = useCallback((force: boolean) => {
    const fetch = () =>
      fetchMine(CacheKeys.homeJoinedEvents, () => ApiService.getMyJoinedEvents(), () => { if (mountedRef.current) reloadRef.current(false) })
    return (force ? invalidate(CacheKeys.homeJoinedEvents).then(fetch) : fetch())
      .then(data => {
        if (!mountedRef.current) return
        const sorted = activeSorted(data)
        setEvents(sorted)
        onEmptyChange?.(sorted.length === 0)
      })
      .catch(() => {})
  }, [onEmptyChange])

  useEffect(() => { reloadRef.current = load }, [load])

  useImperativeHandle(ref, () => ({
    refresh: () => load(true),
  }), [load])

  useFocusEffect(useCallback(() => {
    mountedRef.current = true
    load(false)
    return () => { mountedRef.current = false }
  }, [load]))

  if (events.length === 0) return null

  return (
    <View style={s.wrap}>
      <SectionHeader title="Happening Now" leading={<View style={s.liveDot} />} />
      {/* Rarely more than one at a time, so they stack instead of scrolling sideways. */}
      <View style={s.list}>
        {events.map(e => <ActiveEventCard key={e.id} event={e} />)}
      </View>
    </View>
  )
})

const s = StyleSheet.create({
  wrap: { gap: 10 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.destructive },
  list: { gap: 12 },
})

const live = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, height: 22, borderRadius: 7,
    backgroundColor: Colors.destructive,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.white },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 10.5, letterSpacing: 1, color: Colors.white },
})

const a = StyleSheet.create({
  card: {
    flexDirection: 'row', gap: 14, padding: 12, borderRadius: 22,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider,
  },
  poster: { width: 92, height: 115, borderRadius: 14, overflow: 'hidden' }, // 4:5
  posterFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, justifyContent: 'space-between' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  meta: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 12.5, color: Colors.inkSecondary },
  title: { fontFamily: FontFamily.headingBold, fontSize: 17, lineHeight: 21, color: Colors.inkPrimary, marginTop: 6 },
  actions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  ticketBtn: {
    flex: 1, height: 40, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
  },
  ticketText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  sos: { height: 40, paddingHorizontal: 16 },
})

