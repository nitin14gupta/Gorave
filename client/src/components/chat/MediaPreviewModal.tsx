import { useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, Pressable, StyleSheet, Dimensions, Modal, FlatList } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { VideoView, useVideoPlayer } from 'expo-video'
import { X, Send, Play, Check, Crop, ChevronDown } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import ImagePicker from 'react-native-image-crop-picker'
import { PrimaryButton } from '@/components/ui/PrimaryButton'
import { VIEW_ONCE_MAX_VIDEO_SECONDS, type PendingMedia, type ViewLimit } from '@/hooks/useMediaPicker'
import { ViewLimitIcon } from './ViewLimitIcon'
import { hSelection } from '@/lib/haptics'

const { width: SW } = Dimensions.get('window')
const THUMB_SIZE = 56

function VideoPreview({ uri, active }: { uri: string; active: boolean }) {
  const player = useVideoPlayer(uri, p => { p.loop = true })
  useEffect(() => {
    if (active) player.play()
    else player.pause()
  }, [active, player])
  return <VideoView player={player} style={mp.media} contentFit="contain" nativeControls />
}

interface Props {
  media: PendingMedia[]
  onSend: () => void
  onCancel: () => void
  onRemove: (index: number) => void
  onUpdate?: (index: number, updated: PendingMedia) => void
  actionLabel?: string
  titleLabel?: string
  cropAspectRatio?: number
  freeStyleCrop?: boolean
  /** Chat only: keep in chat / view once / view twice. Hidden when not given. */
  viewLimit?: ViewLimit
  onViewLimitChange?: (limit: ViewLimit) => void
}

const VIEW_OPTIONS: { limit: ViewLimit; label: string }[] = [
  { limit: 1, label: 'View once' },
  { limit: 2, label: 'View twice' },
  { limit: null, label: 'Unlimited views' },
]

// Instagram's control: a pill showing the current choice; tapping it opens a
// small menu above it. The choice is remembered for next time.
function ViewLimitMenu({ value, onChange, noun, onClose, bottom }: {
  value: ViewLimit; onChange: (l: ViewLimit) => void; noun: string; onClose: () => void; bottom: number
}) {
  return (
    <>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[vl.menu, { bottom }]}>
        <Text style={vl.caption}>Set how many times {noun} can be viewed.</Text>
        {VIEW_OPTIONS.map(o => {
          const on = o.limit === value
          return (
            <Pressable
              key={o.label}
              style={vl.item}
              android_ripple={{ color: withOpacity(Colors.inkPrimary, 0.06) }}
              onPress={() => { hSelection(); onChange(o.limit); onClose() }}
            >
              <ViewLimitIcon limit={o.limit} size={24} />
              <Text style={vl.itemLabel}>{o.label}</Text>
              {on ? <Check size={20} color={Colors.inkPrimary} strokeWidth={2.4} /> : null}
            </Pressable>
          )
        })}
      </View>
    </>
  )
}

const vl = StyleSheet.create({
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    height: 48, paddingLeft: 12, paddingRight: 14, borderRadius: 24,
    backgroundColor: withOpacity(Colors.inkPrimary, 0.08),
  },
  pillLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  menu: {
    position: 'absolute', left: 16, width: 280,
    borderRadius: 20, paddingTop: 14, paddingBottom: 6,
    backgroundColor: Colors.elevated,
    borderWidth: 1, borderColor: Colors.divider,
  },
  caption: { fontFamily: FontFamily.bodyRegular, fontSize: 13, lineHeight: 18, color: Colors.inkSecondary, paddingHorizontal: 18, paddingBottom: 6 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, height: 54 },
  itemLabel: { flex: 1, fontFamily: FontFamily.bodyMedium, fontSize: 16, color: Colors.inkPrimary },
})

export function MediaPreviewModal({
  media, onSend, onCancel, onRemove, onUpdate, actionLabel = 'Send', titleLabel = 'Ready to send?',
  cropAspectRatio = 1, freeStyleCrop = false, viewLimit, onViewLimitChange,
}: Props) {
  const insets = useSafeAreaInsets()
  const [pickedIndex, setActiveIndex] = useState(0)
  // Removing the last item steps back onto the new last one.
  const activeIndex = media.length > 0 ? Math.min(pickedIndex, media.length - 1) : pickedIndex
  const mainListRef = useRef<FlatList>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const thumbListRef = useRef<FlatList>(null)

  const handleMomentumEnd = useCallback((e: any) => {
    setActiveIndex(Math.round(e.nativeEvent.contentOffset.x / SW))
  }, [])

  const goToIndex = useCallback((index: number) => {
    setActiveIndex(index)
    mainListRef.current?.scrollToIndex({ index, animated: true })
  }, [])

  const handleCrop = async (uri: string, index: number) => {
    try {
      // Output size follows the requested ratio: square stays 800×800, anything
      // else is 1200 px on the short side (4:5 event photos → 1200×1500).
      const square = Math.abs(cropAspectRatio - 1) < 0.01
      const w = square ? 800 : cropAspectRatio < 1 ? 1200 : Math.round(1200 * cropAspectRatio)
      const h = square ? 800 : cropAspectRatio < 1 ? Math.round(1200 / cropAspectRatio) : 1200

      const options: any = {
        path: uri,
        cropping: true,
        mediaType: 'photo',

        // --- Custom UI Options (Black Palette) ---
        cropperToolbarTitle: 'Adjust Photo',
        cropperToolbarColor: Colors.background, // Black header
        cropperStatusBarLight: false, // For dark status bar (light icons)
        cropperToolbarWidgetColor: Colors.inkPrimary, // White text/icons in header
        cropperActiveWidgetColor: Colors.background, // Neutral dark color for active buttons (scale/rotate)
        cropperChooseColor: Colors.inkPrimary, // iOS Choose button
        cropperCancelColor: Colors.inkPrimary, // iOS Cancel button
        hideBottomControls: false, // Ensure scale/rotate bottom bar is visible
        enableRotationGesture: true, // Allow two-finger rotation
      }

      if (freeStyleCrop) {
        options.freeStyleCropEnabled = true
      } else {
        options.freeStyleCropEnabled = false
        options.width = w
        options.height = h
      }

      const result = await ImagePicker.openCropper(options)

      if (onUpdate) {
        onUpdate(index, {
          ...media[index],
          uri: result.path,
          width: result.width,
          height: result.height,
        })
      }
    } catch (e) {
      console.log('Crop cancelled')
    }
  }

  if (media.length === 0) return null

  const multi = media.length > 1
  const choosing = !!onViewLimitChange
  const limit = viewLimit ?? null
  // A view once video longer than 12s can't go (the server refuses it too).
  const tooLong = limit === 1 && media.some(m => m.type === 'video' && (m.duration ?? Infinity) > VIEW_ONCE_MAX_VIDEO_SECONDS + 0.5)
  const hasGif = limit !== null && media.some(m => m.type === 'gif')
  const warning = tooLong
    ? `View once videos can be up to ${VIEW_ONCE_MAX_VIDEO_SECONDS} seconds`
    : hasGif
    ? 'GIFs always stay in the chat'
    : null
  const allVideo = media.every(m => m.type === 'video')
  const noun = multi ? 'these' : allVideo ? 'this video' : 'this photo'
  const current = VIEW_OPTIONS.find(o => o.limit === limit)!

  return (
    <Modal visible animationType="fade" statusBarTranslucent>
      <View style={[mp.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={mp.header}>
          <Pressable style={mp.glass} onPress={onCancel} hitSlop={10}>
            <X size={20} color={Colors.inkPrimary} strokeWidth={2.4} />
          </Pressable>
          {/* Centred on the screen, not between the two buttons (they differ in width). */}
          {multi ? (
            <View style={mp.countWrap} pointerEvents="none">
              <View style={mp.countPill}><Text style={mp.headerTitle}>{activeIndex + 1} of {media.length}</Text></View>
            </View>
          ) : null}
          {onUpdate && media[activeIndex]?.type !== 'video' ? (
            <Pressable style={mp.cropPill} onPress={() => handleCrop(media[activeIndex].uri, activeIndex)} hitSlop={6}>
              <Crop size={16} color={Colors.inkPrimary} strokeWidth={2.2} />
              <Text style={mp.cropText}>Crop</Text>
            </Pressable>
          ) : <View style={mp.glass} />}
        </View>

        <FlatList
          ref={mainListRef}
          data={media}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, i) => `${item.uri}_${i}`}
          onMomentumScrollEnd={handleMomentumEnd}
          getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
          style={mp.mainList}
          renderItem={({ item, index }) => (
            <View style={mp.mediaWrap}>
              {item.type === 'video'
                ? <VideoPreview uri={item.uri} active={index === activeIndex} />
                : (
                  <View style={mp.frame}>
                    <Image source={{ uri: item.uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
                  </View>
                )
              }
            </View>
          )}
        />

        {multi && (
          <FlatList
            ref={thumbListRef}
            data={media}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item, i) => `thumb_${item.uri}_${i}`}
            style={mp.thumbStrip}
            contentContainerStyle={mp.thumbStripContent}
            renderItem={({ item, index }) => (
              <Pressable onPress={() => goToIndex(index)} style={mp.thumbWrap}>
                <Image
                  source={{ uri: item.uri }}
                  style={[mp.thumb, index === activeIndex && mp.thumbActive]}
                  contentFit="cover"
                />
                {item.type === 'video' && (
                  <View style={mp.thumbPlayBadge}>
                    <Play size={10} color={Colors.inkPrimary} fill={Colors.inkPrimary} strokeWidth={0} />
                  </View>
                )}
                <Pressable
                  style={mp.thumbRemove}
                  hitSlop={8}
                  onPress={() => {
                    onRemove(index)
                    if (index <= activeIndex) setActiveIndex(i => Math.max(0, i - 1))
                  }}
                >
                  <X size={10} color={Colors.inkPrimary} strokeWidth={3} />
                </Pressable>
              </Pressable>
            )}
          />
        )}

        <View style={mp.footer}>
          {choosing ? (
            warning ? <Text style={[mp.choiceHint, tooLong && mp.choiceHintWarn]}>{warning}</Text> : null
          ) : (
            <>
              <Text style={mp.hint}>{titleLabel}</Text>
              {multi ? <Text style={mp.hintSub}>{media.length} selected · swipe to check each one</Text> : null}
            </>
          )}
          <View style={choosing ? mp.sendRow : mp.sendBtn}>
            {choosing ? (
              <Pressable style={vl.pill} onPress={() => { hSelection(); setMenuOpen(o => !o) }} hitSlop={4}>
                <ViewLimitIcon limit={limit} size={22} />
                <Text style={vl.pillLabel}>{current.label}</Text>
                <ChevronDown size={16} color={Colors.inkSecondary} strokeWidth={2.4} />
              </Pressable>
            ) : null}
            <PrimaryButton
              label={`${actionLabel}${multi ? ` ${media.length}` : ''}`}
              onPress={onSend}
              disabled={tooLong}
              icon={actionLabel === 'Add' ? (
                <Check size={19} color={Colors.background} strokeWidth={2.5} />
              ) : (
                <Send size={19} color={Colors.background} strokeWidth={2.5} fill={Colors.background} />
              )}
              style={choosing ? mp.sendCompact : undefined}
            />
          </View>
        </View>

        {choosing && menuOpen ? (
          <ViewLimitMenu
            value={limit}
            onChange={onViewLimitChange!}
            noun={noun}
            onClose={() => setMenuOpen(false)}
            bottom={insets.bottom + 76}
          />
        ) : null}
      </View>

    </Modal>
  )
}

const mp = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    height: 48,
  },
  glass: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: withOpacity(Colors.inkPrimary, 0.1),
  },
  countWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  countPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: withOpacity(Colors.inkPrimary, 0.1) },
  cropPill: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14, borderRadius: 20, backgroundColor: withOpacity(Colors.inkPrimary, 0.1) },
  cropText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  frame: { width: SW - 32, flex: 1, marginVertical: 12, borderRadius: 24, overflow: 'hidden', backgroundColor: withOpacity(Colors.inkPrimary, 0.04) },
  headerTitle: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 14,
    color: Colors.inkPrimary,
  },
  mainList: { flex: 1 },
  mediaWrap: {
    width: SW,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  media: { width: SW, height: '100%' },
  thumbStrip: { flexGrow: 0, marginBottom: 12 },
  thumbStripContent: { paddingHorizontal: 12, gap: 8 },
  thumbWrap: { width: THUMB_SIZE, height: THUMB_SIZE },
  thumb: {
    width: THUMB_SIZE, height: THUMB_SIZE, borderRadius: 10,
    borderWidth: 2, borderColor: 'transparent',
  },
  thumbActive: { borderColor: Colors.inkPrimary },
  thumbPlayBadge: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: withOpacity(Colors.background, 0.25),
    borderRadius: 10,
  },
  thumbRemove: {
    position: 'absolute',
    top: -5, right: -5,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: 'rgba(20,20,20,0.9)',
    borderWidth: 1, borderColor: withOpacity(Colors.inkPrimary, 0.25),
    alignItems: 'center', justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: 12,
    alignItems: 'center',
    gap: 10,
  },
  hint: {
    fontFamily: FontFamily.displayExtraBold,
    fontSize: 22,
    letterSpacing: -0.4,
    color: Colors.inkPrimary,
  },
  hintSub: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, marginTop: -6 },
  choiceHint: { fontFamily: FontFamily.bodyRegular, fontSize: 13, color: Colors.inkSecondary, textAlign: 'center' },
  choiceHintWarn: { fontFamily: FontFamily.bodySemiBold, color: Colors.destructive },
  sendBtn: { width: '100%' },
  sendRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  sendCompact: { minWidth: 130 },
})
