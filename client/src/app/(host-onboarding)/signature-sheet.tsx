import { View, Text, StyleSheet, Pressable } from 'react-native'
import { useRef, useState } from 'react'
import DrawPad, { DrawPadHandle } from 'expo-drawpad'
import { captureRef } from 'react-native-view-shot'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Eraser, Undo2 } from 'lucide-react-native'
import { useSharedValue } from 'react-native-reanimated'
import { router, Stack } from 'expo-router'
import { hTap, hSuccess } from '@/lib/haptics'
import { useSignatureCaptureStore } from '@/store/signatureCaptureStore'
import { useProfile } from '@/hooks/useProfile'
import { Colors, FontFamily, withOpacity } from '@/constants'

/**
 * Sign with your finger: white ink on the dark pad, above a signature line
 * with your name. Only the ink is captured and uploaded.
 */
export default function HostAgreementSignatureSheet() {
  const { bottom } = useSafeAreaInsets()
  const setSignatureUri = useSignatureCaptureStore(s => s.setUri)
  const { profile } = useProfile()
  const padRef = useRef<DrawPadHandle>(null)
  const canvasRef = useRef<View>(null)
  const pathLength = useSharedValue(0)
  const [hasDrawn, setHasDrawn] = useState(false)
  const [saving, setSaving] = useState(false)

  const ink = Colors.inkPrimary

  const clear = () => { hTap(); padRef.current?.erase(); setHasDrawn(false) }
  const undo = () => {
    hTap()
    padRef.current?.undo()
    setTimeout(() => { if (pathLength.value === 0) setHasDrawn(false) }, 0)
  }
  const confirm = async () => {
    if (!hasDrawn || !canvasRef.current || saving) return
    setSaving(true)
    try {
      const uri = await captureRef(canvasRef, { format: 'png', quality: 1, result: 'tmpfile' })
      hSuccess()
      setSignatureUri(uri)
      router.back()
    } catch {
      setSaving(false)
    }
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Sign here' }} />
      <View style={[s.container, { paddingBottom: bottom + 16 }]}>
        <View style={s.pad}>
          <View pointerEvents="none" style={s.baseWrap}>
            <Text style={[s.x, { color: ink }]}>×</Text>
            <View style={[s.base, { backgroundColor: withOpacity(ink, 0.6) }]} />
            <Text style={[s.name, { color: withOpacity(ink, 0.55) }]}>{profile?.name ?? ''}</Text>
          </View>
          {!hasDrawn ? (
            <View pointerEvents="none" style={s.hintWrap}>
              <Text style={[s.hint, { color: withOpacity(ink, 0.4) }]}>Sign above the line</Text>
            </View>
          ) : null}
          {/* Only the ink is captured (transparent behind it), so the
              agreement can lay it on its own paper and line.
              collapsable={false}: Android strips a plain View from the
              native tree during capture without it. */}
          <View ref={canvasRef} collapsable={false} style={StyleSheet.absoluteFill}>
            <DrawPad
              ref={padRef}
              stroke={ink}
              strokeWidth={2.8}
              pathLength={pathLength}
              onDrawStart={() => setHasDrawn(true)}
            />
          </View>
        </View>

        <View style={s.tools}>
          <Pressable style={[s.tool, !hasDrawn && { opacity: 0.4 }]} onPress={undo} disabled={!hasDrawn} hitSlop={6}>
            <Undo2 size={17} color={Colors.inkPrimary} strokeWidth={2} />
            <Text style={s.toolText}>Undo</Text>
          </Pressable>
          <Pressable style={[s.tool, !hasDrawn && { opacity: 0.4 }]} onPress={clear} disabled={!hasDrawn} hitSlop={6}>
            <Eraser size={17} color={Colors.inkPrimary} strokeWidth={2} />
            <Text style={s.toolText}>Clear</Text>
          </Pressable>
          <Pressable style={[s.use, !hasDrawn && { opacity: 0.35 }]} onPress={confirm} disabled={!hasDrawn || saving}>
            <Text style={s.useText}>{saving ? 'Saving…' : 'Use this signature'}</Text>
          </Pressable>
        </View>
      </View>
    </>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 18, gap: 14, backgroundColor: Colors.surface },
  pad: { flex: 1, borderRadius: 22, overflow: 'hidden', borderWidth: 1, borderColor: Colors.divider, backgroundColor: Colors.background },
  baseWrap: { position: 'absolute', left: 24, right: 24, bottom: 34 },
  x: { position: 'absolute', left: 0, bottom: 10, fontFamily: FontFamily.headingBold, fontSize: 22 },
  base: { height: 1.5 },
  name: { fontFamily: FontFamily.bodyMedium, fontSize: 12, marginTop: 6 },
  hintWrap: { position: 'absolute', left: 0, right: 0, top: '38%', alignItems: 'center' },
  hint: { fontFamily: FontFamily.bodySemiBold, fontSize: 15 },

  tools: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  tool: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 50, paddingHorizontal: 14, borderRadius: 25, backgroundColor: withOpacity(Colors.inkPrimary, 0.07) },
  toolText: { fontFamily: FontFamily.bodySemiBold, fontSize: 14, color: Colors.inkPrimary },
  use: { flex: 1, height: 50, borderRadius: 25, backgroundColor: Colors.inkPrimary, alignItems: 'center', justifyContent: 'center' },
  useText: { fontFamily: FontFamily.bodySemiBold, fontSize: 15, color: Colors.background },
})
