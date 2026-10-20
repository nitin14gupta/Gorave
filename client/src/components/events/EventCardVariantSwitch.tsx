import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'
import { hSelection } from '@/lib/haptics'
import { useEventCardVariantStore, type EventCardVariant } from '@/store/eventCardVariantStore'

const OPTIONS: { key: EventCardVariant; label: string }[] = [
  { key: 'a', label: 'A · Poster' },
  { key: 'b', label: 'B · Ticket' },
]

/** Dev-only A|B toggle for the event card design. Renders nothing in release builds. */
export function EventCardVariantSwitch({ style }: { style?: StyleProp<ViewStyle> }) {
  const variant = useEventCardVariantStore(s => s.variant)
  const setVariant = useEventCardVariantStore(s => s.setVariant)
  if (!__DEV__) return null
  return (
    <View style={[s.wrap, style]}>
      {OPTIONS.map(o => {
        const on = o.key === variant
        return (
          <Pressable
            key={o.key}
            style={[s.opt, on && s.optOn]}
            onPress={() => { if (!on) { hSelection(); setVariant(o.key) } }}
            hitSlop={6}
          >
            <Text style={[s.text, on && s.textOn]}>{o.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

const s = StyleSheet.create({
  wrap: {
    flexDirection: 'row', padding: 3, borderRadius: 999,
    backgroundColor: Colors.elevated,
    borderWidth: StyleSheet.hairlineWidth, borderColor: withOpacity(Colors.inkPrimary, 0.12),
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 6,
  },
  opt: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  optOn: { backgroundColor: Colors.inkPrimary },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 12, color: Colors.inkSecondary },
  textOn: { color: Colors.background },
})
