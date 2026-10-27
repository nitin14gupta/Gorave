import { Fragment, memo, useEffect, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { Image } from 'expo-image'
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSpring, withTiming } from 'react-native-reanimated'
import { Flame, Hourglass, Ban, History } from 'lucide-react-native'
import { AutoSkeletonView } from 'react-native-auto-skeleton'
import { Colors, FontFamily, EVENT_ICONS, EVENT_ICON_FALLBACK, EVENT_IMAGE_ASPECT, withOpacity } from '@/constants'
import { parseServerDate, isEventPast } from '@/lib/dates'
import { hSelection } from '@/lib/haptics'
import { HotlistButton } from './HotlistButton'
import { EventQuickPeekSheet } from './EventQuickPeekSheet'
import type { EventSummary } from '@/api/apiService'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

const StaggerIn = memo(function StaggerIn({ index, style, children }: { index: number; style?: StyleProp<ViewStyle>; children: ReactNode }) {
  const opacity = useSharedValue(0)
  const scale = useSharedValue(0.6)

  useEffect(() => {
    opacity.value = withDelay(index * 35, withTiming(1, { duration: 220 }))
    scale.value = withDelay(index * 35, withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }))

  return <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
})

// Stacked avatars (up to 3) + "+N" overflow badge + "{count} going" label,
// each staggering in on mount. Shared by EventCard's grid layout and
// EventListCard's compact row so both list modes show the same social proof.
export function AttendeeAvatarStack({
  avatars,
  count,
  avatarSize = 18,
  style,
  textStyle,
}: {
  avatars: string[] | undefined
  count: number
  avatarSize?: number
  style?: StyleProp<ViewStyle>
  textStyle?: StyleProp<TextStyle>
}) {
  const avatarStyle = { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
  const overlap = -(avatarSize * 0.44)

  return (
    <View style={[aas.row, style]}>
      {avatars?.slice(0, 3).map((url, i) => (
        <StaggerIn key={url + i} index={i} style={[i > 0 && { marginLeft: overlap }, { zIndex: i }]}>
          <Image
            source={{ uri: url }}
            style={[aas.avatar, avatarStyle]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority="low"
            transition={150}
          />
        </StaggerIn>
      ))}
      {count > 3 && (
        <StaggerIn index={3} style={{ marginLeft: overlap, zIndex: 3 }}>
          <View style={[aas.avatar, avatarStyle, aas.avatarMore]}>
            <Text style={aas.avatarMoreText}>+{count - 3}</Text>
          </View>
        </StaggerIn>
      )}
      <Text style={[aas.going, textStyle]}>{count} going</Text>
    </View>
  )
}

const aas = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    borderWidth: 1.5, borderColor: Colors.surface,
    backgroundColor: Colors.surfaceMuted,
  },
  avatarMore: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Colors.elevated,
  },
  avatarMoreText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 8,
    color: Colors.inkSecondary,
  },
  going: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkDisabled, marginLeft: 4 },
})

export function HostPill({
  name,
  avatar,
  compact,
  style,
}: {
  name: string
  avatar: string | null
  compact?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[hp.pill, compact && hp.pillCompact, style]}>
      {avatar ? (
        <Image
          source={{ uri: avatar }}
          style={[hp.avatar, compact && hp.avatarCompact]}
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="low"
          transition={150}
        />
      ) : (
        <View style={[hp.avatar, compact && hp.avatarCompact, hp.avatarFallback]}>
          <Text style={[hp.initial, compact && hp.initialCompact]}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
      <Text style={[hp.text, compact && hp.textCompact]} numberOfLines={1}>{name}</Text>
    </View>
  )
}

const hp = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderRadius: 20, paddingLeft: 4, paddingRight: 10, paddingVertical: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: withOpacity(Colors.inkPrimary, 0.12),
    shadowColor: Colors.background,
    shadowOpacity: 0.4,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  pillCompact: {
    gap: 5, borderRadius: 16, paddingLeft: 3, paddingRight: 8, paddingVertical: 3,
  },
  avatar: { width: 20, height: 20, borderRadius: 10 },
  avatarCompact: { width: 16, height: 16, borderRadius: 8 },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  initial: { fontFamily: FontFamily.headingBold, fontSize: 11, color: Colors.inkPrimary },
  initialCompact: { fontSize: 9 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkPrimary },
  textCompact: { fontSize: 10 },
})

export function formatEventDate(iso: string | null | undefined) {
  const d = parseServerDate(iso)
  if (!d) return 'Date TBC'
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatPrice(price: number, isFree: boolean) {
  return isFree ? 'Free' : `₹${price}`
}

// The one place that owns what a price badge looks like — same reasoning as
// HostPill above: callers (EventCard, the map-mode preview strip) position
// it themselves via `style`, but never hand-roll their own bg/text colors.
export function PriceBadge({
  price,
  isFree,
  compact,
  style,
}: {
  price: number
  isFree: boolean
  compact?: boolean
  style?: StyleProp<ViewStyle>
}) {
  return (
    <View style={[pb.badge, compact && pb.badgeCompact, isFree && pb.badgeFree, style]}>
      <Text style={[pb.text, compact && pb.textCompact]}>{formatPrice(price, isFree)}</Text>
    </View>
  )
}

const pb = StyleSheet.create({
  badge: { backgroundColor: Colors.brandOrange, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  badgeCompact: { borderRadius: 7, paddingHorizontal: 7, paddingVertical: 3 },
  badgeFree: { backgroundColor: Colors.accentGreen },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkPrimary },
  textCompact: { fontSize: 12 },
})

interface Props {
  event: EventSummary
  onPress: () => void
  /** Show host name on the card (for joined-events) */
  showHost?: boolean
  /** Dim card and show Past badge */
  isPast?: boolean
  /** Show Cancelled badge */
  isCancelled?: boolean
  /** Optional tappable strip rendered at the bottom of the card (e.g. "View Ticket", "View Reviews") */
  footer?: ReactNode
}

const DOW = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "Sat", 24, "Oct", "8:30 pm", split so cards can lay the date out their own way. */
export function eventDateParts(iso: string | null | undefined) {
  const d = parseServerDate(iso)
  if (!d) return null
  const h = d.getHours()
  const m = d.getMinutes()
  const time = `${h % 12 || 12}${m ? ':' + String(m).padStart(2, '0') : ''} ${h < 12 ? 'am' : 'pm'}`
  return { dow: DOW[d.getDay()], day: d.getDate(), mon: MON[d.getMonth()], time }
}

export const EventCard = memo(function EventCard({ event, onPress, showHost, isPast, isCancelled, footer }: Props) {
  const [peekOpen, setPeekOpen] = useState(false)
  const cover = event.cover_photos?.[0]?.url
  const TypeIcon = EVENT_ICONS[event.event_type] ?? EVENT_ICON_FALLBACK
  const parts = eventDateParts(event.date_time)
  const area = event.area || event.location_name
  const host = event.host_name && !event.host_is_deleted ? event.host_name : null
  // Don't offer hotlisting an event that's already ended — respects both the
  // explicit `isPast` prop (e.g. Joined Events' Past tab) and the event's
  // own dates, so it's safe even where callers don't pass `isPast`.
  const eventIsPast = isPast || isEventPast(event)
  const live = !isPast && !isCancelled

  // One short line about where you stand, shown only when it matters.
  const note = isCancelled
    ? { Icon: Ban, text: 'Cancelled' }
    : isPast
      ? { Icon: History, text: 'Past' }
      : live && event.my_rsvp_status === 'requested'
        ? { Icon: Hourglass, text: 'Requested' }
        : live && event.spots_left > 0 && event.spots_left <= 10
          ? { Icon: Flame, text: `${event.spots_left} spots left` }
          : null

  // Tiny tactile press feedback — same spring the app's buttons already use,
  // just a gentler target scale since a card is a much bigger tap target.
  const pressScale = useSharedValue(1)
  const pressStyle = useAnimatedStyle(() => ({ transform: [{ scale: pressScale.value }] }))

  const photo = cover ? (
    <Image source={{ uri: cover }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" priority="low" transition={150} />
  ) : (
    <LinearGradient colors={[Colors.surface, Colors.deepBackground]} style={[StyleSheet.absoluteFill, s.placeholder]}>
      <TypeIcon size={36} color={Colors.inkDisabled} strokeWidth={1.5} />
    </LinearGradient>
  )
  const price = formatPrice(event.price_inr, event.is_free)

  return (
    <Fragment>
    <View style={isPast && s.cardPast}>
    <AnimatedPressable
      style={[s.card, pressStyle]}
      onPress={onPress}
      onLongPress={() => { hSelection(); setPeekOpen(true) }}
      delayLongPress={350}
      onPressIn={() => { pressScale.set(withSpring(0.985, { duration: 120 })) }}
      onPressOut={() => { pressScale.set(withSpring(1, { duration: 120 })) }}
    >
      {/* The 4:5 photo is the whole card; the details sit on it. */}
      <View style={pa.poster}>
        {photo}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.88)']}
          locations={[0, 0.45, 1]}
          style={pa.scrim}
          pointerEvents="none"
        />
        <View style={pa.top}>
          {parts ? (
            <View style={pa.dateChip}>
              <Text style={pa.dateDay}>{parts.day}</Text>
              <Text style={pa.dateMon}>{parts.mon}</Text>
            </View>
          ) : null}
          {note ? (
            <View style={[pa.chip, isCancelled && pa.chipCancelled]}>
              <note.Icon size={11} color={Colors.white} strokeWidth={2.4} />
              <Text style={pa.chipText} numberOfLines={1}>{note.text}</Text>
            </View>
          ) : null}
        </View>
        <View style={pa.bottom}>
          {showHost && host ? (
            <View style={pa.hostRow}>
              <HostAvatar name={host} avatar={event.host_avatar} size={16} />
              <Text style={pa.host} numberOfLines={1}>{host}</Text>
            </View>
          ) : null}
          <Text style={pa.title} numberOfLines={2}>{event.title}</Text>
          <Text style={pa.meta} numberOfLines={1}>
            {parts ? `${parts.dow} · ${parts.time}` : 'Date TBC'}{area ? ` · ${area}` : ''}
          </Text>
          <View style={pa.foot}>
            {event.attendee_count > 0 ? (
              <AttendeeAvatarStack avatars={event.attendee_avatars} count={event.attendee_count} avatarSize={16} textStyle={pa.going} />
            ) : <View />}
            <View style={pa.price}><Text style={pa.priceText}>{price}</Text></View>
          </View>
        </View>
      </View>

      {footer ? <View style={s.footerWrap}>{footer}</View> : null}
    </AnimatedPressable>

    {/* A true sibling of the card's Pressable, not a descendant: a nested
        touchable breaks both taps on Android. */}
    {!eventIsPast && (
      <HotlistButton eventId={event.id} initial={event.is_hotlisted} style={pa.hotlist} size={14} />
    )}
    </View>
    <EventQuickPeekSheet visible={peekOpen} event={event} onClose={() => setPeekOpen(false)} />
    </Fragment>
  )
})

function HostAvatar({ name, avatar, size }: { name: string; avatar: string | null; size: number }) {
  const st = { width: size, height: size, borderRadius: size / 2 }
  return avatar ? (
    <Image source={{ uri: avatar }} style={[st, s.hostAvatar]} contentFit="cover" cachePolicy="memory-disk" priority="low" />
  ) : (
    <View style={[st, s.hostAvatar, s.hostAvatarFallback]}>
      <Text style={[s.hostInitial, { fontSize: size * 0.55 }]}>{name.charAt(0).toUpperCase()}</Text>
    </View>
  )
}

// Same shape as the real card, shimmering — shown while events are still
// loading. Own transparent wrapper (AutoSkeletonView treats any child with a
// background as a bone, so a filled container shimmers as one blob).
export function EventCardSkeleton() {
  return (
    <AutoSkeletonView isLoading animationType="gradient" defaultRadius={20} gradientColors={[Colors.skeletonBase, Colors.skeletonHighlight]}>
      <View style={[pa.poster, s.skBlock, { borderRadius: 20 }]} />
    </AutoSkeletonView>
  )
}

/** Skeletons laid out like the real list: two posters per row. */
export function EventCardSkeletonList({ count = 4, cellWidth }: { count?: number; cellWidth: number }) {
  return (
    <View style={s.skGrid}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: cellWidth }}><EventCardSkeleton /></View>
      ))}
    </View>
  )
}

const s = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: Colors.background,
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  cardPast: { opacity: 0.65 },
  placeholder: { alignItems: 'center', justifyContent: 'center' },
  footerWrap: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.divider },

  hostAvatar: { borderWidth: 1, borderColor: withOpacity(Colors.white, 0.6) },
  hostAvatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  hostInitial: { fontFamily: FontFamily.headingBold, color: Colors.inkPrimary },

  skBlock: { backgroundColor: Colors.surfaceMuted },
  skGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
})

const pa = StyleSheet.create({
  poster: { width: '100%', aspectRatio: EVENT_IMAGE_ASPECT, overflow: 'hidden' },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '62%' },
  top: { position: 'absolute', top: 10, left: 10, right: 48, flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  dateChip: {
    minWidth: 40, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 12, alignItems: 'center',
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: withOpacity(Colors.white, 0.18),
  },
  dateDay: { fontFamily: FontFamily.headingBold, fontSize: 17, lineHeight: 19, color: Colors.white },
  dateMon: { fontFamily: FontFamily.bodySemiBold, fontSize: 9, letterSpacing: 0.8, color: withOpacity(Colors.white, 0.8), textTransform: 'uppercase' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1,
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 999,
    backgroundColor: 'rgba(10,10,10,0.55)',
    borderWidth: StyleSheet.hairlineWidth, borderColor: withOpacity(Colors.white, 0.18),
  },
  chipCancelled: { backgroundColor: withOpacity(Colors.destructive, 0.85) },
  chipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white, flexShrink: 1 },
  hotlist: {
    position: 'absolute', top: 10, right: 10,
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(10,10,10,0.55)',
    alignItems: 'center', justifyContent: 'center',
  },
  bottom: { position: 'absolute', left: 12, right: 12, bottom: 12, gap: 4 },
  hostRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 1 },
  host: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: withOpacity(Colors.white, 0.85), flexShrink: 1 },
  title: { fontFamily: FontFamily.headingBold, fontSize: 16, lineHeight: 20, color: Colors.white, letterSpacing: -0.2 },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 11, color: withOpacity(Colors.white, 0.78) },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, gap: 6 },
  going: { fontFamily: FontFamily.bodyMedium, fontSize: 10, color: withOpacity(Colors.white, 0.78), marginLeft: 4 },
  price: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, backgroundColor: withOpacity(Colors.white, 0.16) },
  priceText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.white },
})
