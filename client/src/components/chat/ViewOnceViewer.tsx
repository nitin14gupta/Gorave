import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native'
import { useState } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { X } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { ViewLimitIcon } from './ViewLimitIcon'

export interface OpenedLimitedMedia {
  url: string
  type: 'image' | 'video'
  viewLimit: 1 | 2
  viewsUsed: number
}

function LimitedVideo({ url }: { url: string }) {
  // Plays once through, no controls to scrub back or save.
  const player = useVideoPlayer(url, p => { p.loop = false; p.play() })
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls={false} />
}

/**
 * Full screen view of a view once/twice photo or video. Nothing to download,
 * share or forward; closing it is the only way out. The open was already
 * counted by the server when this link was handed out.
 */
export function ViewOnceViewer({ media, onClose }: { media: OpenedLimitedMedia | null; onClose: () => void }) {
  const insets = useSafeAreaInsets()
  const [loaded, setLoaded] = useState(false)
  if (!media) return null

  const left = media.viewLimit - media.viewsUsed
  const label = media.type === 'video' ? 'Video' : 'Photo'
  const sub = left > 0 ? `${left} view left` : media.viewLimit === 1 ? 'View once' : 'Last view'

  return (
    <Modal visible animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <View style={s.root}>
        {media.type === 'video' ? (
          <LimitedVideo url={media.url} />
        ) : (
          <>
            <Image
              source={{ uri: media.url }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              // Never kept on the phone: view once means it's gone after this.
              cachePolicy="none"
              onLoad={() => setLoaded(true)}
            />
            {!loaded && <ActivityIndicator style={StyleSheet.absoluteFill} color={Colors.white} />}
          </>
        )}

        <View style={[s.header, { paddingTop: insets.top + 8 }]}>
          <View style={s.badge}>
            <ViewLimitIcon limit={media.viewLimit} color={Colors.white} />
            <View>
              <Text style={s.title}>{label}</Text>
              <Text style={s.sub}>{sub}</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={s.close}>
            <X size={20} color={Colors.white} strokeWidth={2.2} />
          </Pressable>
        </View>
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  header: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.white },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: 12, color: withOpacity(Colors.white, 0.7) },
  close: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: withOpacity(Colors.white, 0.16),
  },
})
