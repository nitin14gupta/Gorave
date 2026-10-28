import { useState, useCallback } from 'react'
import * as ImagePicker from 'expo-image-picker'
import { usePillStore } from '@/store/pillStore'

export interface PendingMedia {
  uri: string
  type: 'image' | 'video' | 'gif'
  width?: number
  height?: number
  /** Seconds, for videos (view once videos can be up to 12s). */
  duration?: number
}

/** null = keep in chat, 1 = view once, 2 = view twice. */
export type ViewLimit = 1 | 2 | null
export const VIEW_ONCE_MAX_VIDEO_SECONDS = 12

interface Options {
  onMediaSend: (uri: string, type: 'image' | 'video' | 'gif', width?: number, height?: number, duration?: number, viewLimit?: ViewLimit) => void
}

const MAX_SELECTION = 12
const MAX_VIDEO_DURATION_SEC = 60

// Videos are on (for view once/twice and normal sends). There is still no
// server-side transcoding, so clips are capped at 1 min, iOS exports them at
// 720p, and the server refuses anything over 50 MB.
const ALLOW_VIDEO = true
const VIDEO_PICK_OPTIONS = {
  videoMaxDuration: MAX_VIDEO_DURATION_SEC,
  videoExportPreset: ImagePicker.VideoExportPreset.H264_1280x720,
  videoQuality: ImagePicker.UIImagePickerControllerQualityType.Medium,
}

export function useMediaPicker({ onMediaSend }: Options) {
  const showPill = usePillStore(s => s.show)
  const [pendingMedia, setPendingMedia] = useState<PendingMedia[]>([])

  const handleCamera = useCallback(async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow camera access to take photos', 'error')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ALLOW_VIDEO ? ['images', 'videos'] : ['images'],
      quality: 0.85,
      ...VIDEO_PICK_OPTIONS,
    })
    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0]
      const type = asset.type === 'video' ? 'video' : 'image'
      if (type === 'video' && asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION_SEC) {
        showPill("That video is longer than 1 min — trim it and try again", 'error')
        return
      }
      setPendingMedia([{
        uri: asset.uri,
        type,
        width: asset.width,
        height: asset.height,
        duration: asset.duration ? asset.duration / 1000 : undefined,
      }])
    }
  }, [showPill])

  const handleLibrary = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showPill('Allow photo access to pick from gallery', 'error')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ALLOW_VIDEO ? ['images', 'videos'] : ['images'],
      quality: 0.85,
      allowsMultipleSelection: true,
      selectionLimit: MAX_SELECTION,
      ...VIDEO_PICK_OPTIONS,
    })
    if (!result.canceled && result.assets.length > 0) {
      const valid: PendingMedia[] = []
      let rejectedVideos = 0
      for (const asset of result.assets) {
        const isGif = asset.mimeType === 'image/gif' || asset.uri.toLowerCase().endsWith('.gif')
        const type = asset.type === 'video' ? 'video' : isGif ? 'gif' : 'image'
        if (type === 'video' && asset.duration && asset.duration / 1000 > MAX_VIDEO_DURATION_SEC) {
          rejectedVideos++
          continue
        }
        valid.push({
          uri: asset.uri, type, width: asset.width, height: asset.height,
          duration: asset.duration ? asset.duration / 1000 : undefined,
        })
      }
      if (rejectedVideos > 0) {
        showPill(
          rejectedVideos > 1
            ? `${rejectedVideos} videos are longer than 1 min and were skipped`
            : "That video is longer than 1 min and was skipped",
          'error',
        )
      }
      if (valid.length > 0) setPendingMedia(valid)
    }
  }, [showPill])

  const confirmSend = useCallback(async (viewLimit: ViewLimit = null) => {
    const batch = pendingMedia
    setPendingMedia([])
    for (const item of batch) {
      // GIFs always stay in the chat.
      await onMediaSend(item.uri, item.type, item.width, item.height, item.duration, item.type === 'gif' ? null : viewLimit)
    }
  }, [pendingMedia, onMediaSend])

  const removeFromPreview = useCallback((index: number) => {
    setPendingMedia(prev => prev.filter((_, i) => i !== index))
  }, [])

  const updatePreview = useCallback((index: number, updated: PendingMedia) => {
    setPendingMedia(prev => {
      const copy = [...prev]
      copy[index] = updated
      return copy
    })
  }, [])

  const cancelPreview = useCallback(() => setPendingMedia([]), [])

  return { handleCamera, handleLibrary, pendingMedia, confirmSend, cancelPreview, removeFromPreview, updatePreview }
}
