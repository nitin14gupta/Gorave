import { View, Text, Pressable, StyleSheet } from 'react-native'
import Animated, { Extrapolation, interpolate, useAnimatedStyle, useSharedValue, type SharedValue } from 'react-native-reanimated'
import { Image } from 'expo-image'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { ChevronLeft, MoreVertical, Ghost, X } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'
import { formatLastSeen } from '@/lib/formatLastSeen'

interface Props {
  partnerName: string | null
  partnerUsername: string | null
  partnerAvatar: string | null
  partnerId: string | null
  partnerIsDeleted?: boolean
  isPartnerOnline: boolean
  partnerLastSeenAt?: string | null
  isWsConnected: boolean
  reconnectFailed?: boolean
  onManualReconnect?: () => void
  loading: boolean
  onMenuPress: () => void
  /** Bulk-select mode — swaps the back chevron for an X (exits select mode
   * instead of navigating back) and shows "N selected" instead of the
   * partner's name/status. */
  selectMode?: boolean
  selectedCount?: number
  onExitSelect?: () => void
  /** Lab A: 0 hides the avatar + name (the intro block is on screen), 1 shows them. */
  identityShown?: SharedValue<number>
  /** Lab B: scroll offset from the newest message; the header is tall at 0 and compact past ~90. */
  collapseScroll?: SharedValue<number>
}

export function ChatHeader({
  partnerName, partnerUsername, partnerAvatar, partnerId, partnerIsDeleted,
  isPartnerOnline, partnerLastSeenAt, isWsConnected, reconnectFailed, onManualReconnect, loading, onMenuPress,
  selectMode, selectedCount = 0, onExitSelect, identityShown, collapseScroll,
}: Props) {
  const insets = useSafeAreaInsets()
  const one = useSharedValue(1)
  const zero = useSharedValue(0)
  const shown = identityShown ?? one
  const scroll = collapseScroll ?? zero
  const tall = !!collapseScroll
  // B: 1 = tall at the newest messages, 0 = compact once you scroll up.
  const identityStyle = useAnimatedStyle(() => ({
    opacity: shown.value,
    transform: [{ translateY: (1 - shown.value) * 6 }],
  }))
  const avatarStyle = useAnimatedStyle(() => {
    const e = tall ? interpolate(scroll.value, [0, 90], [1, 0], Extrapolation.CLAMP) : 0
    const size = 38 + e * 18
    return { width: size, height: size, borderRadius: 12 + e * 6 }
  })
  const nameStyle = useAnimatedStyle(() => {
    const e = tall ? interpolate(scroll.value, [0, 90], [1, 0], Extrapolation.CLAMP) : 0
    return { fontSize: 17 + e * 5, lineHeight: 22 + e * 6 }
  })
  const padStyle = useAnimatedStyle(() => {
    const e = tall ? interpolate(scroll.value, [0, 90], [1, 0], Extrapolation.CLAMP) : 0
    return { paddingBottom: 12 + e * 8 }
  })

  if (selectMode) {
    return (
      <View style={[s.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={onExitSelect} style={s.backBtn} hitSlop={8}>
          <X size={22} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <View style={s.center}>
          <Text style={s.name}>{selectedCount} selected</Text>
        </View>
      </View>
    )
  }

  return (
    <>
      <Animated.View style={[s.header, { paddingTop: insets.top + 8 }, padStyle]}>
        <Pressable onPress={() => router.back()} style={s.backBtn} hitSlop={8}>
          <ChevronLeft size={24} color={Colors.inkPrimary} strokeWidth={2} />
        </Pressable>
        <Animated.View style={[s.center, identityStyle]}>
          <Pressable
            style={s.center}
            onPress={() => partnerId && router.push(`/(profile)/${partnerId}` as any)}
          >
            <Animated.View style={[s.avatarBox, avatarStyle]}>
              {partnerIsDeleted ? (
                <View style={[StyleSheet.absoluteFill, s.avatarDeleted]}>
                  <Ghost size={18} color={Colors.inkDisabled} strokeWidth={1.5} />
                </View>
              ) : partnerAvatar ? (
                <Image
                  source={{ uri: partnerAvatar }}
                  style={StyleSheet.absoluteFill}
                  cachePolicy="memory-disk"
                  priority="high"
                  transition={150}
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, s.avatarFallback]}>
                  <Text style={s.avatarInitial}>{(partnerName ?? '?').charAt(0)}</Text>
                </View>
              )}
            </Animated.View>
            <View style={{ flexShrink: 1 }}>
              <View style={s.nameRow}>
                <Animated.Text style={[s.name, partnerIsDeleted && s.nameDeleted, nameStyle]} numberOfLines={1}>{partnerName ?? 'Chat'}</Animated.Text>
                {isPartnerOnline && !partnerIsDeleted && <View style={s.onlineDot} />}
              </View>
              <Text style={s.sub}>
                {partnerIsDeleted
                  ? 'This account no longer exists'
                  : partnerUsername
                  ? `@${partnerUsername}`
                  : isPartnerOnline
                  ? 'Active now'
                  : partnerLastSeenAt
                  ? formatLastSeen(partnerLastSeenAt)
                  : 'Tap for profile'
                }
              </Text>
            </View>
          </Pressable>
        </Animated.View>
        <Pressable onPress={onMenuPress} hitSlop={8}>
          <MoreVertical size={22} color={Colors.inkSecondary} strokeWidth={1.8} />
        </Pressable>
      </Animated.View>

      {reconnectFailed && !loading && (
        <Pressable style={s.reconnectBanner} onPress={onManualReconnect} hitSlop={4}>
          <Text style={s.reconnectText}>Can&apos;t connect. Tap to retry</Text>
        </Pressable>
      )}
      {!reconnectFailed && !isWsConnected && !loading && (
        <View style={s.reconnectBanner}>
          <Text style={s.reconnectText}>Reconnecting…</Text>
        </View>
      )}
    </>
  )
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: Colors.background,
  },
  backBtn: { padding: 4, marginRight: 8 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarBox: { width: 38, height: 38, borderRadius: 12, overflow: 'hidden' },
  avatarFallback: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarDeleted: { backgroundColor: Colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontFamily: FontFamily.headingBold, fontSize: 16, color: Colors.inkPrimary },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontFamily: FontFamily.headingBold, fontSize: 17, color: Colors.inkPrimary },
  nameDeleted: { color: Colors.inkDisabled },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 11, color: Colors.inkSecondary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.onlineGreen },
  reconnectBanner: {
    backgroundColor: Colors.glassSurface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.glassBorder,
    paddingVertical: 5,
    alignItems: 'center',
  },
  reconnectText: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: Colors.inkSecondary },
})
