import { useEffect, useState, useCallback } from 'react'
import { View, Text, StyleSheet, Pressable } from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { hTap } from '@/lib/haptics'
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio'
import { BrandedLoader } from '@/components/ui'
import { useProfile } from '@/hooks/useProfile'
import { useAuthStore } from '@/store/auth'
import { Colors, FontFamily, HOST_BADGE_IMAGES } from '@/constants'
import { useImageViewer } from '@/hooks/useImageViewer'
import { MediaViewerModal } from '@/components/chat/MediaViewerModal'
import { useHeaderAndTabBarScroll } from '@/hooks/useHeaderAndTabBarScroll'
import { useExpandTabBarOnFocus } from '@/hooks/useExpandTabBarOnFocus'
import { buildProfileShareUrl } from '@/lib/deepLink'
import { MyProfileView } from '@/components/profile/MyProfileView'


export default function ProfileScreen() {
  const { profile, loading, error, refresh } = useProfile()
  const { viewingMedia, openMedia, closeMedia } = useImageViewer()
  const [refreshing, setRefreshing] = useState(false)
  const { scrollHandler, scrollY } = useHeaderAndTabBarScroll()
  useExpandTabBarOnFocus()
  const insets = useSafeAreaInsets()

  const player = useAudioPlayer(null)
  const status = useAudioPlayerStatus(player)

  useEffect(() => {
    if (profile?.voice_url) player.replace({ uri: profile.voice_url })
  }, [profile?.voice_url])

  useEffect(() => {
    if (profile?.dob !== undefined) useAuthStore.getState().setDob(profile.dob ?? null)
  }, [profile?.dob])

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    await refresh()
    setRefreshing(false)
  }, [refresh])

  const toggleVoice = () => {
    hTap()
    if (status.playing) {
      player.pause()
    } else {
      // Only seek back to the start once playback has actually finished —
      // seeking on every tap adds a ~1s rebuffer stall for no reason when
      // resuming from a fresh or paused state.
      if (status.duration > 0 && status.currentTime >= status.duration - 0.05) {
        player.seekTo(0)
      }
      player.play()
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <BrandedLoader />
      </View>
    )
  }

  if (error || !profile) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: Colors.inkSecondary, fontFamily: FontFamily.bodyRegular, fontSize: 14, marginBottom: 16 }}>
          {error ?? 'Could not load profile'}
        </Text>
        <Pressable onPress={() => { hTap(); refresh() }} style={{ paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20 }}>
          <Text style={{ color: Colors.inkPrimary, fontFamily: FontFamily.bodySemiBold, fontSize: 14 }}>Retry</Text>
        </Pressable>
      </View>
    )
  }

  const interests = profile?.interests ?? []
  const photos = profile?.photos ?? []
  const hostBadgeName = profile?.host_badges?.[0] ?? null
  const hostBadgeImage = hostBadgeName ? HOST_BADGE_IMAGES[hostBadgeName] : null
  const vibers = profile?.vibers_count ?? 0
  const vibing = profile?.vibing_count ?? 0
  const age = profile?.dob ? Math.floor((new Date().getTime() - new Date(profile.dob).getTime()) / 3.156e10) : null

  const openFollows = (type: 'followers' | 'following') =>
    router.push({ pathname: '/(profile)/follows', params: { userId: profile.id, type, name: encodeURIComponent(profile.name ?? ''), vibersCount: vibers, vibingCount: vibing } } as any)

  return (
    <View style={styles.root}>
      <MyProfileView
        profile={profile}
        photos={photos}
        age={age}
        hostBadgeImage={hostBadgeImage}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        scrollHandler={scrollHandler}
        scrollY={scrollY}
        voicePlaying={status.playing}
        onToggleVoice={toggleVoice}
        onOpenPhoto={i => openMedia(photos.map(ph => ({ url: ph.url, type: 'image' as const })), i)}
        onEdit={() => router.push('/(profile)/edit')}
        onShare={() => router.push({
          pathname: '/(profile)/qr',
          params: {
            userId: profile.id,
            username: profile.username ?? '',
            name: profile.name ?? '',
            avatar: photos[0]?.url ?? '',
            city: profile.city ?? '',
            interests: interests.join(','),
          },
        } as any)}
        onSettings={() => router.push('/(settings)')}
        onCreate={() => router.push('/(events)/create' as any)}
        onVibers={() => openFollows('followers')}
        onVibing={() => openFollows('following')}
        onReviews={() => router.push({ pathname: '/(profile)/host-reviews', params: { id: profile.id, name: encodeURIComponent(profile.name ?? '') } } as any)}
        shareUrl={buildProfileShareUrl(profile.id, profile.username)}
      />

      {viewingMedia && (
        <MediaViewerModal
          visible={!!viewingMedia}
          items={viewingMedia.items}
          initialIndex={viewingMedia.initialIndex}
          onClose={closeMedia}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center' },

})
