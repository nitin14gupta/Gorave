import { useState } from 'react'
import { Dimensions, FlatList, Pressable, StyleSheet, Text, View } from 'react-native'
import { Image } from 'expo-image'
import { LinearGradient } from 'expo-linear-gradient'
import Animated from 'react-native-reanimated'
import { ArrowLeft, MoreHorizontal } from 'lucide-react-native'
import type { ExtendedProfile } from '@/api/apiService'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { BrandedRefreshControl, StepDots } from '@/components/ui'
import { UserProfileStatsRow } from '@/components/profile/UserProfileStatsRow'
import { UserProfileBadgesInterests } from '@/components/profile/UserProfileBadgesInterests'
import { UserProfileVoiceIntro } from '@/components/profile/UserProfileVoiceIntro'
import { UserProfileBlockedOverlay } from '@/components/profile/UserProfileBlockedOverlay'
import { UserProfileCtaBar } from '@/components/profile/UserProfileCtaBar'
import { useParallaxHero } from '@/hooks/useParallaxHero'
import { ProfileFoldBar } from './ProfileFoldBar'
import { hTap } from '@/lib/haptics'
import { EventRail, ReviewsPeek, useProfileActivity } from './ProfileActivity'

const W = Dimensions.get('window').width
const CARD = W - 32

export interface ProfileCta {
  isConnected: boolean
  theySentVibe: boolean
  isPending: boolean
  isCooldown: boolean
  cooldownUntil?: string | null
  following: boolean
  onMessage: () => void
  onAccept: () => void
  onSendVibe: () => void
  onCooldownExpired: () => void
  onFollowToggle: () => void
}

export interface UserProfileViewProps {
  profile: ExtendedProfile
  photos: { id: string; url: string }[]
  age: number | null
  hostBadgeImage: any
  blockedByMe: boolean
  onUnblock: () => void
  refreshing: boolean
  onRefresh: () => void
  onBack: () => void
  onMenu: () => void
  onOpenPhoto: (index: number) => void
  voicePlaying: boolean
  onToggleVoice: () => void
  cta: ProfileCta
  insetsBottom: number
}


/**
 * Profile photos are square, so the first one takes the
 * top of the screen at full width with parallax; swipe through the rest
 * with story bars across the top. The name sits on the photo, and the
 * details sit on a rounded sheet that rides up over it.
 */
export function UserProfileView(p: UserProfileViewProps) {
  const { onScroll, photoStyle, scrollY } = useParallaxHero(W)
  const [idx, setIdx] = useState(0)
  const pr = p.profile
  const act = useProfileActivity(pr.id)
  // Events they're going to that they aren't also hosting.
  const hostIds = new Set(act.events.map(e => e.id))
  const goingTo = (pr.events_attending ?? []).filter(e => !hostIds.has(e.id))
  const photoCard = (ph: { id: string; url: string } | undefined, index: number) =>
    ph ? (
      <Pressable key={ph.id} style={s.photo} onPress={() => p.onOpenPhoto(index)}>
        <Image source={{ uri: ph.url }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
      </Pressable>
    ) : null

  return (
    <View style={s.root}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        refreshControl={<BrandedRefreshControl refreshing={p.refreshing} onRefresh={p.onRefresh} />}
        contentContainerStyle={{ paddingBottom: p.blockedByMe ? 40 : 130 }}
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
                    <Image source={{ uri: item.url }} style={{ width: W, height: W }} contentFit="cover" cachePolicy="memory-disk" priority="high" transition={150} />
                  </Pressable>
                )}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, s.noPhoto]}><Text style={s.noPhotoText}>{(pr.name ?? '?').charAt(0)}</Text></View>
            )}
          </Animated.View>
          <LinearGradient pointerEvents="none" colors={['rgba(0,0,0,0.5)', 'transparent']} style={s.topShade} />
          <LinearGradient pointerEvents="none" colors={['transparent', 'rgba(0,0,0,0.78)']} style={s.bottomShade} />

          {p.photos.length > 1 ? (
            <View pointerEvents="none" style={[s.bars, { width: p.photos.length * 12 + 8 }]}>
              <StepDots step={idx + 1} total={p.photos.length} variant="overlay" style={{ bottom: 0 }} />
            </View>
          ) : null}

          <View pointerEvents="none" style={s.nameBlock}>
            <View style={s.nameRow}>
              <Text style={s.name} numberOfLines={1}>{pr.name ?? 'User'}{p.age ? `, ${p.age}` : ''}</Text>
              {p.hostBadgeImage ? <Image source={p.hostBadgeImage} style={s.badge} contentFit="contain" /> : null}
            </View>
            <Text style={s.meta} numberOfLines={1}>{[pr.username ? `@${pr.username}` : null, pr.city].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>

        <View style={s.sheet}>
          {p.blockedByMe ? (
            <UserProfileBlockedOverlay onUnblock={p.onUnblock} />
          ) : (
            <>
              {(pr.mutual_count ?? 0) > 0 ? <Text style={s.mutual}>{pr.mutual_count} mutual {pr.mutual_count === 1 ? 'connection' : 'connections'}</Text> : null}
              <View style={s.stats}>
                <UserProfileStatsRow
                  userId={pr.id}
                  name={pr.name}
                  vibersCount={pr.vibers_count ?? 0}
                  vibingCount={pr.vibing_count ?? 0}
                  hostAvgRating={pr.host_avg_rating}
                  hostReviewCount={pr.host_review_count ?? 0}
                />
              </View>

              {pr.bio ? (
                <View style={s.card}>
                  <Text style={s.label}>ABOUT</Text>
                  <Text style={s.bio}>{pr.bio}</Text>
                </View>
              ) : null}

              {pr.voice_url ? (
                <View style={s.card}>
                  <Text style={s.label}>IN THEIR OWN VOICE</Text>
                  <UserProfileVoiceIntro playing={p.voicePlaying} onTogglePlay={p.onToggleVoice} />
                </View>
              ) : null}

              {photoCard(p.photos[1], 1)}

              {(pr.badges?.length ?? 0) > 0 || (pr.interests?.length ?? 0) > 0 ? (
                <View style={s.card}>
                  <Text style={s.label}>INTO</Text>
                  <UserProfileBadgesInterests badges={pr.badges} interests={pr.interests} />
                </View>
              ) : null}

              {goingTo.length ? <View style={s.card}><EventRail title="GOING TO" events={goingTo} name={pr.name ?? 'They'} /></View> : null}
              {act.events.length ? <View style={s.card}><EventRail title="HOSTING NEXT" events={act.events} name={pr.name ?? 'They'} /></View> : null}

              {p.photos.slice(2).map((ph, i) => photoCard(ph, i + 2))}

              {act.reviews.length ? <View style={s.card}><ReviewsPeek reviews={act.reviews} avg={act.avg} count={act.count} userId={pr.id} name={pr.name} /></View> : null}
            </>
          )}
        </View>
      </Animated.ScrollView>

      <ProfileFoldBar
        scrollY={scrollY}
        title={`${pr.name ?? 'Profile'}${p.age ? `, ${p.age}` : ''}`}
        left={{ label: 'Back', onPress: p.onBack, icon: c => <ArrowLeft size={20} color={c} strokeWidth={2.2} /> }}
        right={{ label: 'More', onPress: () => { hTap(); p.onMenu() }, icon: c => <MoreHorizontal size={20} color={c} strokeWidth={2.2} /> }}
      />

      {!p.blockedByMe ? <UserProfileCtaBar insetsBottom={p.insetsBottom} {...p.cta} onMessagePress={p.cta.onMessage} onAcceptPress={p.cta.onAccept} onSendVibePress={p.cta.onSendVibe} onCooldownExpiredPress={p.cta.onCooldownExpired} onFollowTogglePress={p.cta.onFollowToggle} /> : null}
    </View>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  hero: { width: W, height: W, overflow: 'hidden', backgroundColor: Colors.surface },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  noPhotoText: { fontFamily: FontFamily.displayExtraBold, fontSize: 96, color: Colors.inkDisabled },
  topShade: { position: 'absolute', left: 0, right: 0, top: 0, height: 140 },
  bottomShade: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '45%' },
  // The springy StepDots, bottom right of the photo; the one you're on stretches.
  bars: { position: 'absolute', right: 20, bottom: 46, height: 6 },
  nameBlock: { position: 'absolute', left: 20, right: 84, bottom: 40 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flexShrink: 1, fontFamily: FontFamily.displayExtraBold, fontSize: 36, letterSpacing: -1, color: Colors.white },
  badge: { width: 26, height: 26 },
  meta: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: withOpacity(Colors.white, 0.85), marginTop: 2 },

  sheet: { marginTop: -24, borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: Colors.background, paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  mutual: { fontFamily: FontFamily.bodySemiBold, fontSize: 13, color: Colors.inkSecondary },
  stats: { alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: Colors.divider, marginTop: -4, paddingBottom: 12 },
  bio: { fontFamily: FontFamily.headingBold, fontSize: 21, lineHeight: 28, letterSpacing: -0.3, color: Colors.inkPrimary },
  card: { padding: 18, borderRadius: 24, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.divider, gap: 12 },
  label: { fontFamily: FontFamily.bodySemiBold, fontSize: 11, letterSpacing: 1.4, color: Colors.inkDisabled },
  photo: { width: CARD, alignSelf: 'center', height: CARD, borderRadius: 24, overflow: 'hidden', backgroundColor: Colors.surface },
})
