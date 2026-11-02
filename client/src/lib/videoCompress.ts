import { Platform } from 'react-native'
import * as FileSystem from 'expo-file-system/legacy'

// iOS already exports picked videos at 720p (see useMediaPicker); this matches it.
const MAX_EDGE = 1280
const BITRATE = 2_500_000

async function fileSize(uri: string) {
  const info = await FileSystem.getInfoAsync(uri)
  return info.exists ? info.size : 0
}

/**
 * Android hands over the original camera file, so shrink it before upload.
 * Never blocks a send: on any failure, or if the result isn't smaller, the
 * original goes instead.
 */
export async function compressVideoForUpload(uri: string): Promise<string> {
  if (Platform.OS !== 'android') return uri
  try {
    // Loaded here so an app build without the native module still sends videos.
    const { Video } = await import('react-native-compressor')
    const compressed = await Video.compress(uri, { compressionMethod: 'manual', maxSize: MAX_EDGE, bitrate: BITRATE })
    const [before, after] = await Promise.all([fileSize(uri), fileSize(compressed)])
    return after > 0 && after < before ? compressed : uri
  } catch {
    return uri
  }
}
