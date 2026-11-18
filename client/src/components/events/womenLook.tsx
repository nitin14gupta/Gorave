import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Venus } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

/**
 * How a women-only night looks on every event card: "Rose glass". The title
 * block sits on a frosted rose panel with a hairline rose edge, and a rose
 * "Women only" tag sits in it. Row cards get a soft rose surface; map pins a
 * rose ring.
 */

/** women_pct of 100 means the night is for women only. */
export const isWomenOnly = (womenPct?: number | null) => womenPct != null && womenPct >= 100

const ROSE = Colors.womenOnly

/** The frosted rose panel the title block sits on (poster cards). */
export const womenGlassPanel: ViewStyle = {
  backgroundColor: withOpacity(ROSE, 0.24),
  borderWidth: StyleSheet.hairlineWidth * 2,
  borderColor: withOpacity(ROSE, 0.7),
  borderRadius: 14,
  padding: 10,
}

/** Row cards (EventListCard): a soft rose surface. */
export const womenRowStyle: ViewStyle = {
  backgroundColor: withOpacity(ROSE, 0.1),
  borderWidth: 1,
  borderColor: withOpacity(ROSE, 0.45),
}

/** Map pins: a rose ring. */
export const womenPinStyle: ViewStyle = { borderWidth: 2.5, borderColor: ROSE }

/** The tag. `onPhoto` sits in the glass panel on a poster; otherwise in a card's text. */
export function WomenTag({ onPhoto = true, style }: { onPhoto?: boolean; style?: ViewStyle }) {
  return (
    <View style={[t.row, onPhoto ? t.glass : t.tint, style]} accessibilityLabel="Women only">
      <Venus size={onPhoto ? 11 : 12} color={onPhoto ? Colors.white : ROSE} strokeWidth={2.4} />
      <Text style={[t.text, { color: onPhoto ? Colors.white : ROSE }]}>Women only</Text>
    </View>
  )
}

const t = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', borderRadius: 999 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
  glass: { backgroundColor: withOpacity(ROSE, 0.55), borderWidth: StyleSheet.hairlineWidth * 2, borderColor: withOpacity(Colors.white, 0.5), paddingHorizontal: 8, paddingVertical: 4 },
  tint: { backgroundColor: withOpacity(ROSE, 0.14), paddingHorizontal: 7, paddingVertical: 2 },
})
