import { useCallback, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { Image, type ImageSource } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { type SharedValue } from 'react-native-reanimated'
import { ChevronRight, Ticket } from 'lucide-react-native'
import ApiService, { type EventSummary } from '@/api/apiService'
import type { ProfileResponse } from '@/types/api'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { isEventPast, parseServerDate } from '@/lib/dates'
import { TicketPaper } from '@/components/events/TicketView'
import { eventDateParts } from '@/components/events/EventCard'
import { EventRail, useProfileActivity } from '@/components/profile/ProfileActivity'
import { ProfileBioVoiceCard } from '@/components/profile/ProfileBioVoiceCard'
import { ProfileDetailsChips } from '@/components/profile/ProfileDetailsChips'

export interface MeViewProps {
  profile: ProfileResponse
  photos: { id: string; url: string }[]
  age: number | null
  hostBadgeImage: ImageSource | number | null
  refreshing: boolean
  onRefresh: () => void
  /** From useHeaderAndTabBarScroll, so the tab bar still tucks away. */
  scrollHandler: any
  scrollY: SharedValue<number>
  voicePlaying: boolean
  onToggleVoice: () => void
  onOpenPhoto: (index: number) => void
  onEdit: () => void
  onShare: () => void
  onSettings: () => void
  onCreate: () => void
  onVibers: () => void
  onVibing: () => void
  onReviews: () => void
  shareUrl: string
}

/** Your upcoming nights, joined and hosting, refreshed on focus. */
export function useMyNights(userId: string) {
  const [going, setGoing] = useState<EventSummary[]>([])
  const hosting = useProfileActivity(userId)
  useFocusEffect(useCallback(() => {
    let alive = true
    ApiService.getMyJoinedEvents()
      .then(list => {
        if (!alive) return
        const up = list
          .filter(e => !e.is_cancelled && !isEventPast(e))
          .sort((a, b) => (parseServerDate(a.date_time)?.getTime() ?? 0) - (parseServerDate(b.date_time)?.getTime() ?? 0))
        setGoing(up)
      })
      .catch(() => {})
    return () => { alive = false }
  }, []))
  return { going, hosting: hosting.events }
}

/** Your next night, as a maroon ticket stub. */
export function UpNextTicket({ event }: { event: EventSummary }) {
  const d = eventDateParts(event.date_time)
  const cover = event.cover_photos?.[0]?.url
  return (
    <Pressable style={s.ticket} onPress={() => router.push(`/(events)/${event.id}/ticket` as any)}>
      <TicketPaper />
      <View style={s.ticketDate}>
        <Text style={s.ticketMon}>{d?.mon}</Text>
        <Text style={s.ticketDay}>{d?.day}</Text>
        <Text style={s.ticketDow}>{d?.dow}</Text>
      </View>
      <View style={s.ticketPerf} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={s.ticketEyebrow}>UP NEXT</Text>
        <Text style={s.ticketTitle} numberOfLines={2}>{event.title}</Text>
        <Text style={s.ticketMeta} numberOfLines={1}>{[d?.time, event.area ?? event.city].filter(Boolean).join(' · ')}</Text>
        <View style={s.ticketCta}><Ticket size={13} color={Colors.white} strokeWidth={2} /><Text style={s.ticketCtaText}>Your ticket</Text></View>
      </View>
      {cover ? <Image source={{ uri: cover }} style={s.ticketCover} contentFit="cover" /> : null}
    </Pressable>
  )
}

/** Everything under the photos: your next night, your rails, bio, voice and interests. */
export function MeSections(p: MeViewProps & { nights: ReturnType<typeof useMyNights> }) {
  const { going, hosting: hostingEvents } = p.nights
  const next = going[0]
  const restGoing = going.slice(1)
  const pr = p.profile
  return (
    <View style={{ gap: 18 }}>
      {next ? <UpNextTicket event={next} /> : (
        <Pressable style={s.empty} onPress={() => router.push('/(tabs)/events' as any)}>
          <View style={{ flex: 1 }}>
            <Text style={s.emptyTitle}>No plans yet</Text>
            <Text style={s.emptySub}>Find a night out and it shows up here.</Text>
          </View>
          <ChevronRight size={18} color={Colors.inkDisabled} />
        </Pressable>
      )}

      {restGoing.length ? <View style={s.card}><EventRail title="ALSO GOING" events={restGoing} name={pr.name ?? 'You'} /></View> : null}
      {hostingEvents.length ? <View style={s.card}><EventRail title="YOU'RE HOSTING" events={hostingEvents} name={pr.name ?? 'You'} /></View> : null}

      <ProfileBioVoiceCard bio={pr.bio ?? null} voiceUrl={pr.voice_url ?? null} playing={p.voicePlaying} onTogglePlay={p.onToggleVoice} />
      <ProfileDetailsChips badges={pr.badges ?? []} interests={pr.interests ?? []} />

    </View>
  )
}

const s = StyleSheet.create({
  ticket: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 22, overflow: 'hidden', minHeight: 116 },
  ticketDate: { width: 52, alignItems: 'center' },
  ticketMon: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: withOpacity(Colors.white, 0.6), textTransform: 'uppercase' },
  ticketDay: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 38, color: Colors.white },
  ticketDow: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: withOpacity(Colors.white, 0.6) },
  ticketPerf: { width: 0, alignSelf: 'stretch', borderLeftWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(Colors.white, 0.25) },
  ticketEyebrow: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.6, color: withOpacity(Colors.white, 0.55) },
  ticketTitle: { fontFamily: FontFamily.headingBold, fontSize: 17, lineHeight: 21, color: Colors.white },
  ticketMeta: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: withOpacity(Colors.white, 0.7) },
  ticketCta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  ticketCtaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.white },
  ticketCover: { width: 64, height: 80, borderRadius: 10 },

  empty: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 20, borderWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(Colors.inkPrimary, 0.18) },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  emptySub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: 2 },

  card: { padding: 18, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
})
