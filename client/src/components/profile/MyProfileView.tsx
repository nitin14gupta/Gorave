import { useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { Extrapolation, interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Plus, Settings, QrCode, Pencil, Eye } from 'lucide-react-native'
import { Colors, ComponentSize, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl, StepDots } from '@/components/ui'
import { ProfileStatsRow } from '@/components/profile/ProfileStatsRow'
import { hTap } from '@/lib/haptics'
import { MeSections, useMyNights, type MeViewProps } from './myProfileShared'

const W = Dimensions.get('window').width

/**
 * How others see you. Your profile the way someone opening it sees it:
 * your photos full width and square with story bars, parallax as you
 * scroll, your name on the photo. Under it on a rounded sheet: edit and
 * share, your numbers, your next night as a ticket, then the rest.
 */
export function MyProfileView(p: MeViewProps) {
  const insets = useSafeAreaInsets()
  const [idx, setIdx] = useState(0)
  const nights = useMyNights(p.profile.id)
  const pr = p.profile

  const photoStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(p.scrollY.value, [-W, 0, W], [-W / 2, 0, W * 0.5], Extrapolation.CLAMP) },
      { scale: interpolate(p.scrollY.value, [-W, 0], [2, 1], Extrapolation.CLAMP) },
    ],
  }))
  const textStyle = useAnimatedStyle(() => ({
    opacity: interpolate(p.scrollY.value, [0, W * 0.45], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <View style={s.root}>
      <Animated.ScrollView
        onScroll={p.scrollHandler}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingBottom: ComponentSize.navBar + 40 }}
      >
        <View style={s.hero}>
          <Animated.View style={[StyleSheet.absoluteFill, photoStyle]}>
            {p.photos.length ? (
              <FlatList
                data={p.photos}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={ph => ph.id}
                onMomentumScrollEnd={e => setIdx(Math.round(e.nativeEvent.contentOffset.x / W))}
                renderItem={({ item, index }) => (
                  <Pressable onPress={() => p.onOpenPhoto(index)}>
                    <Image source={{ uri: item.url }} style={{ width: W, height: W }} contentFit="cover" cachePolicy="memory-disk" priority="high" />
                  </Pressable>
                )}
              />
            ) : <View style={[StyleSheet.absoluteFill, s.noPhoto]}><Text style={s.noPhotoText}>{(pr.name ?? '?').charAt(0)}</Text></View>}
          </Animated.View>
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.5)', 'transparent']} style={s.topShade} />
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.8)']} style={s.bottomShade} />
          {p.photos.length > 1 ? (
            <View pointerEvents="none" style={[s.bars, { width: p.photos.length * 12 + 8 }]}>
              <StepDots step={idx + 1} total={p.photos.length} variant="overlay" style={{ bottom: 0 }} />
            </View>
          ) : null}
          <Animated.View pointerEvents="none" style={[s.nameBlock, textStyle]}>
            {/* <View style={s.seen}><Eye size={12} color={Colors.white} strokeWidth={2} /><Text style={s.seenText}>How people see you</Text></View> */}
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{pr.name ?? 'You'}{p.age ? `, ${p.age}` : ''}</Text>
              {p.hostBadgeImage ? <Image source={p.hostBadgeImage} style={s.badge} contentFit="contain" /> : null}
            </View>
            <Text style={s.meta} numberOfLines={1}>{[pr.username ? `@${pr.username}` : null, pr.city].filter(Boolean).join(' · ')}</Text>
          </Animated.View>
        </View>

        <View style={s.sheet}>
          <View style={s.actions}>
            <Pressable style={s.actionBtn} onPress={() => { hTap(); p.onEdit() }}>
              <Pencil size={16} color={Colors.inkPrimary} strokeWidth={2} />
              <Text style={s.actionText}>Edit profile</Text>
            </Pressable>
            <Pressable style={[s.actionBtn, s.actionDark]} onPress={() => { hTap(); p.onShare() }}>
              <QrCode size={16} color={Colors.background} strokeWidth={2} />
              <Text style={[s.actionText, { color: Colors.background }]}>Share</Text>
            </Pressable>
          </View>

          <ProfileStatsRow
            vibers={pr.vibers_count ?? 0}
            vibing={pr.vibing_count ?? 0}
            avgRating={pr.host_avg_rating ?? null}
            reviewCount={pr.host_review_count ?? 0}
            onVibersPress={p.onVibers}
            onVibingPress={p.onVibing}
            onReviewsPress={p.onReviews}
          />

          <MeSections {...p} nights={nights} />
        </View>
      </Animated.ScrollView>

      <Pressable style={[s.glass, { top: insets.top + 18, left: 14 }]} onPress={() => { hTap(); p.onCreate() }} hitSlop={8}>
        <Plus size={20} color={Colors.white} strokeWidth={2.2} />
      </Pressable>
      <Pressable style={[s.glass, { top: insets.top + 18, right: 14 }]} onPress={() => { hTap(); p.onSettings() }} hitSlop={8}>
        <Settings size={19} color={Colors.white} strokeWidth={2} />
      </Pressable>
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { width: W, height: W, overflow: 'hidden', backgroundColor: Colors.surface },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: FontFamily.displayExtraBold, fontSize: 96, color: Colors.inkDisabled },
  topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '50%' },
  // The springy StepDots, bottom right of the photo; the one you're on stretches.
  bars: { position: 'absolute', right: 20, bottom: 46, height: 6 },
  nameBlock: { position: 'absolute', left: 20, right: 84, bottom: 40, gap: 2 },
  seen: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)', marginBottom: 8 },
  seenText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, color: Colors.white },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: FontFamily.displayExtraBold, fontSize: 36, letterSpacing: -1, color: Colors.white },
  badge: { width: 26, height: 26 },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: withOpacity(Colors.white, 0.85) },
  glass: { position: 'absolute', width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' },

  sheet: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 18, gap: 16 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, height: 46, borderRadius: 23, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider },
  actionDark: { backgroundColor: Colors.inkPrimary, borderColor: Colors.inkPrimary },
  actionText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
})
