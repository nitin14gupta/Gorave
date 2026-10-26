import { useEffect, useState, useCallback, useRef } from 'react'
import { Modal, View, Pressable, StyleSheet, Dimensions, StatusBar, FlatList } from 'react-native'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import Animated, {
  useSharedValue, useAnimatedStyle, withTiming, runOnJS,
} from 'react-native-reanimated'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { X } from 'lucide-react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'

const { width: W, height: H } = Dimensions.get('window')

export type MediaViewType = 'image' | 'gif' | 'video'

export interface MediaViewerItem {
  url: string
  type: MediaViewType
}

interface Props {
  visible: boolean
  items: MediaViewerItem[]
  initialIndex?: number
  onClose: () => void
}

function VideoViewer({ url, active }: { url: string; active: boolean }) {
  const player = useVideoPlayer(url, p => { p.loop = false })
  useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])
  return (
    <VideoView
      player={player}
      style={{ width: W, height: H }}
      contentFit="contain"
      nativeControls
    />
  )
}

/**
 * Full-screen photo and video viewer: pure black, swipe sideways between
 * items, swipe down to close. A glass X and a count pill sit on top.
 */
export function MediaViewerModal({ visible, items, initialIndex = 0, onClose }: Props) {
  const insets = useSafeAreaInsets()
  const translateY = useSharedValue(0)
  const bgOpacity = useSharedValue(1)
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const listRef = useRef<FlatList>(null)

  useEffect(() => {
    if (visible) {
      translateY.value = 0
      bgOpacity.value = 1
      setActiveIndex(initialIndex)
    }
  }, [visible, initialIndex])

  const pan = Gesture.Pan()
    .activeOffsetY([15, Infinity])
    .onUpdate(e => {
      if (e.translationY > 0) {
        translateY.value = e.translationY
        bgOpacity.value = Math.max(1 - e.translationY / 280, 0.15)
      }
    })
    .onEnd(e => {
      if (e.translationY > 80 || e.velocityY > 800) {
        translateY.value = withTiming(H, { duration: 220 })
        bgOpacity.value = withTiming(0, { duration: 200 }, () => runOnJS(onClose)())
      } else {
        translateY.value = withTiming(0)
        bgOpacity.value = withTiming(1)
      }
    })

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }))

  const bgStyle = useAnimatedStyle(() => ({
    opacity: bgOpacity.value,
  }))

  const handleMomentumEnd = useCallback((e: any) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / W)
    setActiveIndex(idx)
  }, [])

  if (!visible || items.length === 0) return null

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <StatusBar hidden />
      <Animated.View style={[StyleSheet.absoluteFill, s.bg, bgStyle]} />
      <GestureDetector gesture={pan}>
        <Animated.View style={[s.container, containerStyle]}>
          <FlatList
            ref={listRef}
            data={items}
            horizontal
            pagingEnabled
            initialScrollIndex={initialIndex}
            getItemLayout={(_, index) => ({ length: W, offset: W * index, index })}
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `${item.url}_${i}`}
            onMomentumScrollEnd={handleMomentumEnd}
            renderItem={({ item, index }) => (
              <View style={{ width: W, height: H, alignItems: 'center', justifyContent: 'center' }}>
                {item.type === 'video' ? (
                  <VideoViewer url={item.url} active={index === activeIndex} />
                ) : (
                  <Image
                    source={{ uri: item.url }}
                    style={{ width: W, height: H }}
                    contentFit="contain"
                    cachePolicy="memory-disk"
                    priority={index === activeIndex ? 'high' : 'low'}
                    transition={150}
                  />
                )}
              </View>
            )}
          />
        </Animated.View>
      </GestureDetector>

      <View pointerEvents="box-none" style={[s.top, { top: insets.top + 10 }]}>
        <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12}>
          <X size={20} color={Colors.white} strokeWidth={2.2} />
        </Pressable>
        {items.length > 1 ? (
          <View style={s.counter}>
            <Animated.Text style={s.counterText}>{activeIndex + 1} of {items.length}</Animated.Text>
          </View>
        ) : null}
        <View style={s.closeSpacer} />
      </View>
    </Modal>
  )
}

const s = StyleSheet.create({
  bg: { backgroundColor: '#000' },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  top: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: withOpacity(Colors.white, 0.16),
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeSpacer: { width: 40 },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: withOpacity(Colors.white, 0.16),
  },
  counterText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    color: Colors.white,
  },
})
