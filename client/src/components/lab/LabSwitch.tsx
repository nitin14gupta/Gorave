import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSelection } from '@/lib/haptics'
import { useLabStore, useLabVariant, type LabVariant } from '@/store/labStore'

/**
 * Dev-only A|B pill floating at the top of a screen in the design lab.
 * Renders nothing in release builds.
 */
export function LabSwitch({ screen, top = 56 }: { screen: string; top?: number }) {
  const insets = useSafeAreaInsets()
  const v = useLabVariant(screen)
  const setPick = useLabStore(s => s.setPick)
  if (!__DEV__) return null
  return (
    <View pointerEvents="box-none" style={[s.host, { top: insets.top + top }]}>
      <View style={s.pill}>
        {(['a', 'b'] as LabVariant[]).map(k => (
          <Pressable
            key={k}
            hitSlop={6}
            style={[s.opt, v === k && s.optOn]}
            onPress={() => { if (v !== k) { hSelection(); setPick(screen, k) } }}
          >
            <Text style={[s.text, v === k && s.textOn]}>{k.toUpperCase()}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  host: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 100 },
  pill: {
    flexDirection: 'row', padding: 3, borderRadius: 999,
    backgroundColor: Colors.elevated,
    borderWidth: StyleSheet.hairlineWidth, borderColor: withOpacity(Colors.inkPrimary, 0.16),
  },
  opt: { width: 34, paddingVertical: 5, borderRadius: 999, alignItems: 'center' },
  optOn: { backgroundColor: Colors.inkPrimary },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  textOn: { color: Colors.background },
})
