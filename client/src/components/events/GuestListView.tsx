import { useMemo, useState } from 'react'
import { Dimensions, Pressable, ScrollView, SectionList, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, Check, ScanLine } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl } from '@/components/ui'
import { WOMEN_COLOR, MEN_COLOR } from '@/components/events/EventPeopleCard'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { hSelection } from '@/lib/haptics'
import { router } from 'expo-router'
import type { EventAttendee } from '@/api/apiService'
import type { useAttendees } from '@/hooks/useAttendees'
import { parseServerDate } from '@/lib/dates'

type A = ReturnType<typeof useAttendees>

export interface GuestsViewProps {
  event: A['event']
  going: EventAttendee[]
  checkedIn: EventAttendee[]
  notArrived: EventAttendee[]
  waitlist: EventAttendee[]
  genderCounts: A['genderCounts']
  scannerStatus: A['scannerStatus']
  refreshing: boolean
  onRefresh: () => void
  onScanner: () => void
  onBack: () => void
}

export const openGuest = (a: EventAttendee) => router.push(`/(profile)/${a.id}` as any)

/** "8:42 pm", when they were scanned in. */
export function inAt(iso: string | null) {
  const d = parseServerDate(iso)
  if (!d) return ''
  const h = d.getHours(), m = d.getMinutes()
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`
}

export function scannerLabel(status: A['scannerStatus']) {
  return status === 'open' ? 'Open the door scanner' : status === 'ended' ? 'Event has ended' : 'Scanner opens 3 hours before'
}

const HERO_H = Math.round(Dimensions.get('window').height * 0.3)
const AnimatedSectionList = Animated.createAnimatedComponent(SectionList) as unknown as typeof SectionList
type Filter = 'all' | 'here' | 'coming'

/**
 * Guest list, as the door list: the event photo up top (parallax), how
 * many are in against how many are coming, then everyone still to come
 * followed by everyone in, each marked with the time they arrived. The
 * waitlist follows, and the scanner sits at the bottom.
 */
export function GuestListView(p: GuestsViewProps) {
  const insets = useSafeAreaInsets()
  const { onScroll, photoStyle, textStyle } = useParallaxHero(HERO_H)
  const [filter, setFilter] = useState<Filter>('all')
  const cover = p.event?.cover_photos?.[0]?.url
  const total = p.going.length
  const here = p.checkedIn.length
  const g = p.genderCounts

  const sections = useMemo(() => {
    const list = filter === 'here' ? p.checkedIn : filter === 'coming' ? p.notArrived : p.going
    // People still to come first, so the door sees who's left.
    const sorted = [...list].sort((a, b) =>
      Number(!!a.checked_in_at) - Number(!!b.checked_in_at) || (a.name ?? '').localeCompare(b.name ?? ''))
    const out: { title: string; data: EventAttendee[] }[] = sorted.length ? [{ title: '', data: sorted }] : []
    if (filter === 'all' && p.waitlist.length) out.push({ title: 'Waitlist', data: p.waitlist })
    return out
  }, [filter, p.going, p.checkedIn, p.notArrived, p.waitlist])

  const header = (
    <View>
      <View style={s.hero}>
        <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
          {cover ? <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />}
        </Animated.View>
        <LinearGradient colors={['rgba(0,0,0,0.45)', 'transparent', Colors.background]} locations={[0, 0.35, 1]} style={StyleSheet.absoluteFill} />
        <Animated.View style={[s.heroText, textStyle]}>
          <Text style={s.kicker}>GUEST LIST</Text>
          <Text style={s.title} numberOfLines={2}>{p.event?.title ?? ''}</Text>
        </Animated.View>
      </View>

      <View style={s.board}>
        <View style={s.boardRow}>
          <Stat n={here} label="in" />
          <View style={s.boardDivider} />
          <Stat n={total - here} label="to come" />
          <View style={s.boardDivider} />
          <Stat n={p.waitlist.length} label="waiting" />
        </View>
        <View style={s.arrival}><View style={[s.arrivalFill, { width: total ? `${(here / total) * 100}%` : '0%' }]} /></View>
        {p.event?.women_pct != null && total > 0 ? (
          <View style={s.mixRow}>
            <Dot color={WOMEN_COLOR} /><Text style={s.mixText}>{g.women} women</Text>
            <Dot color={MEN_COLOR} /><Text style={s.mixText}>{g.men} men</Text>
            {g.other ? <><Dot color={Colors.inkSecondary} /><Text style={s.mixText}>{g.other} others</Text></> : null}
          </View>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.segs}>
        {([['all', `Everyone ${total}`], ['here', `In ${here}`], ['coming', `To come ${total - here}`]] as [Filter, string][]).map(([k, label]) => {
          const on = filter === k
          return (
            <Pressable key={k} style={[s.seg, on && s.segOn]} onPress={() => { hSelection(); setFilter(k) }}>
              <Text style={[s.segText, on && s.segTextOn]}>{label}</Text>
            </Pressable>
          )
        })}
      </ScrollView>
    </View>
  )

  return (
    <View style={s.root}>
      <AnimatedSectionList
        sections={sections}
        keyExtractor={(a: EventAttendee) => a.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        stickySectionHeadersEnabled={false}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={header}
        renderSectionHeader={({ section }) => (section.title ? <Text style={s.letter}>{section.title}</Text> : <View style={{ height: 8 }} />)}
        renderItem={({ item, index, section }) => <Row a={item} waitlistPos={section.title === 'Waitlist' ? index + 1 : undefined} />}
        ListEmptyComponent={<Text style={s.empty}>{filter === 'here' ? 'Nobody scanned in yet.' : filter === 'coming' ? 'Everyone is in.' : 'No guests yet. Share the event to fill the list.'}</Text>}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
      />

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={p.onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>

      <View style={[s.footer, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable style={[s.cta, p.scannerStatus !== 'open' && s.ctaOff]} onPress={p.onScanner}>
          <ScanLine size={18} color={p.scannerStatus === 'open' ? Colors.background : Colors.inkSecondary} strokeWidth={2.2} />
          <Text style={[s.ctaText, p.scannerStatus !== 'open' && { color: Colors.inkSecondary }]}>{scannerLabel(p.scannerStatus)}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statN}>{n}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  )
}

function Dot({ color }: { color: string }) {
  return <View style={[s.dot, { backgroundColor: color }]} />
}

function Row({ a, waitlistPos }: { a: EventAttendee; waitlistPos?: number }) {
  const isIn = !!a.checked_in_at
  return (
    <Pressable style={s.row} onPress={() => openGuest(a)}>
      <View style={s.avatar}>
        {a.avatar ? <Image source={{ uri: a.avatar }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" /> : <Text style={s.initial}>{(a.name ?? '?').charAt(0)}</Text>}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.name} numberOfLines={1}>{a.name ?? 'Guest'}</Text>
        <Text style={s.sub} numberOfLines={1}>{a.username ? `@${a.username}` : a.city ?? ''}</Text>
      </View>
      {waitlistPos ? (
        <Text style={s.wait}>#{waitlistPos}</Text>
      ) : isIn ? (
        <View style={s.inPill}>
          <Check size={12} color={Colors.background} strokeWidth={3} />
          <Text style={s.inText}>{inAt(a.checked_in_at)}</Text>
        </View>
      ) : (
        <Text style={s.coming}>Not here yet</Text>
      )}
    </Pressable>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { height: HERO_H, overflow: 'hidden' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 8, gap: 6 },
  kicker: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: withOpacity(Colors.white, 0.75) },
  title: { fontFamily: FontFamily.displayExtraBold, fontSize: 28, lineHeight: 31, letterSpacing: -0.6, color: Colors.white },
  back: { position: 'absolute', left: 16, width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  board: { marginHorizontal: 16, marginTop: 10, padding: 16, borderRadius: 20, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 14 },
  boardRow: { flexDirection: 'row', alignItems: 'center' },
  boardDivider: { width: StyleSheet.hairlineWidth, alignSelf: 'stretch', backgroundColor: Colors.divider },
  stat: { flex: 1, alignItems: 'center' },
  statN: { fontFamily: FontFamily.displayExtraBold, fontSize: 32, color: Colors.inkPrimary },
  statLabel: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },
  arrival: { height: 6, borderRadius: 3, backgroundColor: withOpacity(Colors.inkPrimary, 0.08), overflow: 'hidden' },
  arrivalFill: { height: '100%', borderRadius: 3, backgroundColor: Colors.inkPrimary },
  mixRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  dot: { width: 8, height: 8, borderRadius: 4, marginLeft: 4 },
  mixText: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkSecondary },

  segs: { gap: 8, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 4 },
  seg: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1, borderColor: Colors.divider },
  segOn: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  segText: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  segTextOn: { color: Colors.background },

  letter: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1, color: Colors.inkDisabled, paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingVertical: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
  inPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: Colors.inkPrimary },
  inText: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.background },
  coming: { fontFamily: FontFamily.bodyMedium, fontSize: 12, color: Colors.inkDisabled },
  wait: { fontFamily: FontFamily.displayExtraBold, fontSize: 16, color: Colors.inkDisabled },
  empty: { fontFamily: FontFamily.bodyRegular, fontSize: 14, color: Colors.inkSecondary, paddingHorizontal: 20, paddingTop: 24 },

  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 20, paddingTop: 12, backgroundColor: Colors.background, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },
  cta: { height: 54, borderRadius: 999, backgroundColor: Colors.inkPrimary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaOff: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  ctaText: { fontFamily: FontFamily.bodySemiBold, fontSize: 16, color: Colors.background },
})
