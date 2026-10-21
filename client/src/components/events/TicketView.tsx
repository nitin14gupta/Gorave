import { useState, type RefObject } from 'react'
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, LinearGradient as SvgLinear, RadialGradient, Rect, Stop } from 'react-native-svg'
import QRCode from 'react-native-qrcode-svg'
import ViewShot, { type ViewShotRef } from 'react-native-view-shot'
import { ArrowLeft, ChevronRight, Download, Navigation, Share2, Ticket as TicketIcon } from 'lucide-react-native'
import { Colors, FontFamily, LogoBlack, withOpacity, eventImageHeight, EVENT_ICONS, EVENT_ICON_FALLBACK } from '@/constants'
import { LogoMark } from '@/components/ui'
import { eventDateParts } from '@/components/events/EventCard'
import { hTap } from '@/lib/haptics'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import type { EventDetail, TicketInfo } from '@/api/apiService'

const { width: W, height: SCREEN_H } = Dimensions.get('window')
const HERO_H = Math.min(eventImageHeight(W), SCREEN_H * 0.62)

// The website's ticket (website/src/components/ui/TicketCard.tsx): maroon
// paper, coral and orange washes in opposite corners, cream QR paper.
export const TICKET = {
  paperTop: '#2b1612',
  paperMid: '#3a1a14',
  paperEnd: '#1b1110',
  qrPaper: '#F7F3EC',
  qrInk: '#171310',
}

export interface TicketViewProps {
  ticket: TicketInfo
  /** The event, for the cover photo and area. Null until it loads. */
  event: EventDetail | null
  /** Wraps the stub, which "Save to Photos" captures. */
  cardRef: RefObject<ViewShotRef | null>
  onBack: () => void
  onShare: () => void
  onSave: () => void
  onDirections: () => void
  onAllTickets: () => void
}

/** "TKT-1A2B3C4D", the short reference printed under the QR. */
function ticketRef(token: string) {
  return `TKT-${token.replace(/[^a-zA-Z0-9]/g, '').slice(-8).toUpperCase()}`
}

/**
 * The ticket, gig-ticket style (DICE, Resident Advisor): the event's poster
 * fills the top and drifts slower than the scroll, and the maroon stub from
 * the website tears off below it with the date set big and the QR.
 */
export function TicketView({ ticket, event, cardRef, onBack, onShare, onSave, onDirections, onAllTickets }: TicketViewProps) {
  const insets = useSafeAreaInsets()
  const parts = eventDateParts(ticket.date_time)
  const cover = event?.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[ticket.event_type] ?? EVENT_ICON_FALLBACK
  const area = event?.area || ticket.location_name

  // Parallax: the poster moves at half speed and stretches on pull-down.
  const { onScroll, photoStyle: heroStyle, textStyle: heroTextStyle } = useParallaxHero(HERO_H)

  return (
    <View style={s.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[s.hero, { height: HERO_H }]}>
          <Animated.View style={[StyleSheet.absoluteFill, heroStyle]}>
            {cover ? (
              <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="high" />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.heroFallback]}>
                <TypeIcon size={48} color={Colors.inkDisabled} strokeWidth={1.2} />
              </View>
            )}
          </Animated.View>
          <LinearGradient
            colors={['rgba(0,0,0,0.45)', 'transparent', 'rgba(0,0,0,0.25)', Colors.background]}
            locations={[0, 0.25, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View style={[s.heroText, heroTextStyle]}>
            <View style={s.inRow}>
              <TicketIcon size={13} color={Colors.white} strokeWidth={2.2} />
              <Text style={s.inText}>YOU’RE IN</Text>
            </View>
            <Text style={s.heroTitle} numberOfLines={3}>{ticket.event_title}</Text>
            {ticket.host_name ? <Text style={s.heroHost}>by {ticket.host_name}</Text> : null}
          </Animated.View>
        </View>

        <View style={s.stubWrap}>
          <ViewShot ref={cardRef as any} options={{ format: 'png', quality: 1 }}>
            <View style={s.stub}>
              <TicketPaper />

              <View style={s.when}>
                <View style={s.dateBlock}>
                  <Text style={s.dow}>{parts?.dow.toUpperCase() ?? 'TBC'}</Text>
                  <Text style={s.day}>{parts?.day ?? '--'}</Text>
                  <Text style={s.mon}>{parts?.mon.toUpperCase() ?? ''}</Text>
                </View>
                <View style={s.whenInfo}>
                  <Text style={s.small}>DOORS</Text>
                  <Text style={s.big}>{parts?.time ?? 'TBC'}</Text>
                  {area ? (
                    <>
                      <Text style={[s.small, { marginTop: 10 }]}>WHERE</Text>
                      <Text style={s.mid} numberOfLines={2}>{area}</Text>
                    </>
                  ) : null}
                </View>
              </View>

              <View style={s.perf}>
                <View style={[s.notch, s.notchL]} />
                <View style={s.dash} />
                <View style={[s.notch, s.notchR]} />
              </View>

              <View style={s.qrBlock}>
                <View style={s.qrPaper}>
                  <QRCode
                    value={ticket.ticket_token}
                    size={208}
                    color={TICKET.qrInk}
                    backgroundColor={TICKET.qrPaper}
                    ecl="H"
                    logo={LogoBlack}
                    logoSize={44}
                    logoBackgroundColor={TICKET.qrPaper}
                    logoMargin={6}
                    logoBorderRadius={10}
                  />
                </View>
                <View style={s.refRow}>
                  <Text style={s.ref}>{ticketRef(ticket.ticket_token)}</Text>
                  <Text style={s.refDot}>·</Text>
                  <Text style={s.ref}>ADMIT ONE</Text>
                  <LogoMark size={14} opacity={0.7} />
                </View>
              </View>
            </View>
          </ViewShot>
        </View>

        <View style={s.list}>
          <Row icon={<Navigation size={18} color={Colors.inkPrimary} strokeWidth={2} />} label="Get directions" sub={ticket.location_name ?? undefined} onPress={onDirections} />
          <Row icon={<Download size={18} color={Colors.inkPrimary} strokeWidth={2} />} label="Save to Photos" onPress={onSave} />
          <Row icon={<Share2 size={18} color={Colors.inkPrimary} strokeWidth={2} />} label="Tell your friends" onPress={onShare} />
          <Row icon={<TicketIcon size={18} color={Colors.inkPrimary} strokeWidth={2} />} label="All my tickets" onPress={onAllTickets} last />
        </View>
      </Animated.ScrollView>

      <Pressable style={[s.back, { top: insets.top + 8 }]} onPress={onBack} hitSlop={8}>
        <ArrowLeft size={20} color={Colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

/**
 * The maroon paper behind a stub, same recipe as the website's ticket.
 * It measures its box and draws at that exact size: percentage sizes in an
 * absolutely placed Svg only resolve once, so the paper fell short of
 * cards that grow after their first layout.
 */
export function TicketPaper() {
  const [size, setSize] = useState({ w: 0, h: 0 })
  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={e => {
        const { width, height } = e.nativeEvent.layout
        if (width !== size.w || height !== size.h) setSize({ w: width, h: height })
      }}
    >
      {size.w > 0 && size.h > 0 ? (
        <Svg width={size.w} height={size.h}>
          <Defs>
            <SvgLinear id="paper" x1="0" y1="0" x2="0.55" y2="1">
              <Stop offset="0" stopColor={TICKET.paperTop} />
              <Stop offset="0.45" stopColor={TICKET.paperMid} />
              <Stop offset="1" stopColor={TICKET.paperEnd} />
            </SvgLinear>
            <RadialGradient id="coral" cx={size.w} cy={0} rx={size.w * 1.2} ry={size.h * 0.7} fx={size.w} fy={0} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={Colors.brandCoral} stopOpacity={0.55} />
              <Stop offset="0.6" stopColor={Colors.brandCoral} stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="orange" cx={0} cy={size.h} rx={size.w * 0.9} ry={size.h * 0.6} fx={0} fy={size.h} gradientUnits="userSpaceOnUse">
              <Stop offset="0" stopColor={Colors.brandOrange} stopOpacity={0.45} />
              <Stop offset="0.6" stopColor={Colors.brandOrange} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#paper)" />
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#coral)" />
          <Rect x={0} y={0} width={size.w} height={size.h} fill="url(#orange)" />
        </Svg>
      ) : null}
    </View>
  )
}

function Row({ icon, label, sub, onPress, last }: { icon: React.ReactNode; label: string; sub?: string; onPress: () => void; last?: boolean }) {
  return (
    <Pressable style={[s.row, !last && s.rowBorder]} onPress={() => { hTap(); onPress() }}>
      <View style={s.rowIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={s.rowLabel}>{label}</Text>
        {sub ? <Text style={s.rowSub} numberOfLines={1}>{sub}</Text> : null}
      </View>
      <ChevronRight size={16} color={Colors.inkDisabled} strokeWidth={2} />
    </Pressable>
  )
}

const ON_TICKET = Colors.white

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { width: W, overflow: 'hidden' },
  heroFallback: { backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center' },
  heroText: { position: 'absolute', left: 20, right: 20, bottom: 56, gap: 6 },
  inRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  inText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.8, color: Colors.white },
  heroTitle: { fontFamily: FontFamily.displayExtraBold, fontSize: 34, lineHeight: 36, letterSpacing: -0.8, color: Colors.white },
  heroHost: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: withOpacity(Colors.white, 0.8) },

  back: {
    position: 'absolute', left: 16,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center',
  },

  stubWrap: { marginTop: -36, paddingHorizontal: 16 },
  stub: { borderRadius: 22, overflow: 'hidden', backgroundColor: TICKET.paperMid },
  when: { flexDirection: 'row', padding: 20, gap: 20 },
  dateBlock: {
    width: 84, alignItems: 'center', paddingVertical: 8, paddingRight: 20,
    borderRightWidth: StyleSheet.hairlineWidth, borderRightColor: withOpacity(ON_TICKET, 0.25),
  },
  dow: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.6, color: withOpacity(ON_TICKET, 0.6) },
  day: { fontFamily: FontFamily.displayExtraBold, fontSize: 48, lineHeight: 52, color: ON_TICKET, letterSpacing: -1 },
  mon: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, letterSpacing: 1.6, color: withOpacity(ON_TICKET, 0.6) },
  whenInfo: { flex: 1, justifyContent: 'center' },
  small: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, letterSpacing: 1.4, color: withOpacity(ON_TICKET, 0.5) },
  big: { fontFamily: FontFamily.headingBold, fontSize: 24, color: ON_TICKET, marginTop: 2 },
  mid: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: ON_TICKET, marginTop: 2 },

  perf: { flexDirection: 'row', alignItems: 'center', height: 24 },
  notch: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.background },
  notchL: { marginLeft: -12 },
  notchR: { marginRight: -12 },
  dash: { flex: 1, height: 0, borderTopWidth: 1.5, borderStyle: 'dashed', borderColor: withOpacity(ON_TICKET, 0.25), marginHorizontal: 8 },

  qrBlock: { alignItems: 'center', paddingTop: 16, paddingBottom: 22, gap: 14 },
  qrPaper: { padding: 14, borderRadius: 16, backgroundColor: TICKET.qrPaper },
  refRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  ref: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.2, color: withOpacity(ON_TICKET, 0.6) },
  refDot: { color: withOpacity(ON_TICKET, 0.4) },

  list: { marginTop: 20, marginHorizontal: 16, borderRadius: 18, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  rowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.divider },
  rowIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: withOpacity(Colors.inkPrimary, 0.06), alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.inkPrimary },
  rowSub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary, marginTop: 1 },
})
