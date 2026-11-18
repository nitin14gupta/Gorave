import { StyleSheet, Text, View, type ViewStyle } from 'react-native'
import { Venus } from 'lucide-react-native'
import { Colors, FontFamily, withOpacity } from '@/constants'

/** women_pct of 100 means the night is for women only. */
export const isWomenOnly = (womenPct?: number | null) => womenPct != null && womenPct >= 100

/**
 * "Women only" in the app's one rose accent. `onPhoto` sits on a poster
 * (solid, readable on any photo); `inline` sits in a card's text.
 */
export function WomenOnlyBadge({ variant = 'onPhoto', style }: { variant?: 'onPhoto' | 'inline'; style?: ViewStyle }) {
  const onPhoto = variant === 'onPhoto'
  return (
    <View style={[s.chip, onPhoto ? s.onPhoto : s.inline, style]} accessibilityLabel="Women only">
      <Venus size={onPhoto ? 11 : 12} color={onPhoto ? Colors.white : Colors.womenOnly} strokeWidth={2.4} />
      <Text style={[s.text, { color: onPhoto ? Colors.white : Colors.womenOnly }]} numberOfLines={1}>Women only</Text>
    </View>
  )
}

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, alignSelf: 'flex-start' },
  onPhoto: { backgroundColor: withOpacity(Colors.womenOnly, 0.92), paddingHorizontal: 8, paddingVertical: 4 },
  inline: { backgroundColor: withOpacity(Colors.womenOnly, 0.14), paddingHorizontal: 7, paddingVertical: 2 },
  text: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
})
