import { useCallback, useEffect, useRef, useState } from 'react'
import { StyleSheet, Text, View, Pressable, type LayoutChangeEvent } from 'react-native'
import { useCameraDevice, usePhotoOutput, type CameraRef } from 'react-native-vision-camera'
import { Camera as FaceCamera, type Face } from 'react-native-vision-camera-face-detector'
import { hSelection, hSuccess } from '@/lib/haptics'
import { Colors, FontFamily, withOpacity } from '@/constants'

// The oval guide: this share of the frame's width, this width-to-height ratio.
const OVAL_W = 0.62
const OVAL_RATIO = 0.78
// How long the face has to stay good before the photo takes itself.
const HOLD_MS = 1100

type Check = { ok: boolean; text: string }
const WAITING: Check = { ok: false, text: 'Put your face in the oval' }

/** What's wrong with the face right now, most important first. Positions are in the frame's own points. */
function judge(faces: Face[], w: number, h: number): Check {
  if (faces.length === 0) return WAITING
  if (faces.length > 1) return { ok: false, text: 'Only you in the photo' }
  const f = faces[0]
  const size = f.bounds.width / w
  if (size < 0.36) return { ok: false, text: 'Move your phone closer' }
  if (size > 0.8) return { ok: false, text: 'Move your phone back a little' }
  const cx = (f.bounds.x + f.bounds.width / 2) / w
  const cy = (f.bounds.y + f.bounds.height / 2) / h
  if (Math.abs(cx - 0.5) > 0.14 || Math.abs(cy - 0.5) > 0.16) return { ok: false, text: 'Centre your face in the oval' }
  if (Math.abs(f.yawAngle) > 14 || Math.abs(f.pitchAngle) > 16 || Math.abs(f.rollAngle) > 14) return { ok: false, text: 'Look straight at the camera' }
  const eyes = Math.min(f.leftEyeOpenProbability ?? 1, f.rightEyeOpenProbability ?? 1)
  if (eyes < 0.35) return { ok: false, text: 'Keep your eyes open' }
  return { ok: true, text: 'Perfect, hold still' }
}

/**
 * A live selfie with on-device face guidance (ML Kit): the oval turns green
 * when the face is centred, at the right distance, looking straight with eyes
 * open, red with a hint otherwise. Holding green for a moment takes the photo;
 * the shutter also only works while it's green.
 */
export function FaceCapture({ onCapture }: { onCapture: (uri: string) => void }) {
  const device = useCameraDevice('front')
  const photoOutput = usePhotoOutput({ quality: 0.8 })
  const camera = useRef<CameraRef | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [check, setCheck] = useState<Check>(WAITING)
  const [seen, setSeen] = useState(false)
  const goodSince = useRef<number | null>(null)
  const capturing = useRef(false)

  const capture = useCallback(async () => {
    if (capturing.current) return
    capturing.current = true
    try {
      const file = await photoOutput.capturePhotoToFile({}, {})
      hSuccess()
      onCapture(file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`)
    } catch {
      capturing.current = false
    }
  }, [photoOutput, onCapture])

  // Called many times a second: only update the screen when the advice changes.
  const onFaces = useCallback((faces: Face[]) => {
    if (!size.w) return
    const next = judge(faces, size.w, size.h)
    setSeen(true)
    setCheck(prev => {
      if (prev.text === next.text) return prev
      if (next.ok) hSelection()
      return next
    })
    if (next.ok) {
      goodSince.current ??= Date.now()
      if (Date.now() - goodSince.current > HOLD_MS) capture()
    } else {
      goodSince.current = null
    }
  }, [size, capture])

  useEffect(() => () => { capturing.current = true }, [])

  const onLayout = (e: LayoutChangeEvent) => setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
  const ring = !seen ? withOpacity(Colors.white, 0.8) : check.ok ? Colors.accentGreen : Colors.destructive

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout}>
      {device ? (
        <FaceCamera
          ref={camera}
          style={StyleSheet.absoluteFill}
          device={device}
          isActive
          outputs={[photoOutput]}
          autoMode
          cameraFacing="front"
          performanceMode="fast"
          runClassifications
          onFacesDetected={onFaces}
          onError={() => setCheck({ ok: false, text: 'The camera stopped. Go back and try again.' })}
        />
      ) : (
        <View style={s.noCam}><Text style={s.noCamText}>No front camera found</Text></View>
      )}

      <View pointerEvents="none" style={s.center}>
        <View style={[s.oval, { width: `${OVAL_W * 100}%`, borderColor: ring }]} />
      </View>
      <View pointerEvents="none" style={s.tipWrap}>
        <View style={[s.tip, seen && (check.ok ? s.tipOk : s.tipBad)]}>
          <Text style={s.tipText}>{check.text}</Text>
        </View>
      </View>

      <View style={s.shutterWrap}>
        <Pressable
          style={[s.shutter, !check.ok && s.shutterOff]}
          onPress={capture}
          disabled={!check.ok}
          accessibilityRole="button"
          accessibilityLabel={check.ok ? 'Take selfie' : check.text}
        >
          <View style={[s.shutterInner, check.ok && s.shutterInnerOk]} />
        </Pressable>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  center: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  oval: { aspectRatio: OVAL_RATIO, borderRadius: 999, borderWidth: 4 },
  tipWrap: { position: 'absolute', top: 14, left: 0, right: 0, alignItems: 'center' },
  tip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 18, backgroundColor: withOpacity('#000000', 0.55) },
  tipOk: { backgroundColor: Colors.accentGreen },
  tipBad: { backgroundColor: withOpacity(Colors.destructive, 0.9) },
  tipText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.white },
  shutterWrap: { position: 'absolute', bottom: 14, left: 0, right: 0, alignItems: 'center' },
  shutter: { width: 66, height: 66, borderRadius: 33, borderWidth: 4, borderColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
  shutterOff: { opacity: 0.4 },
  shutterInner: { width: 50, height: 50, borderRadius: 25, backgroundColor: withOpacity(Colors.white, 0.85) },
  shutterInnerOk: { backgroundColor: Colors.accentGreen },
  noCam: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  noCamText: { fontFamily: FontFamily.bodyMedium, fontSize: 14, color: Colors.inkSecondary },
})
