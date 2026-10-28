import { View, Text, StyleSheet } from 'react-native'
import { Colors, FontFamily } from '@/constants'

/**
 * The view once / view twice mark: a dashed ring with the number inside,
 * the shape people already know from WhatsApp. `null` = keep in chat (∞).
 */
export function ViewLimitIcon({ limit, size = 22, color = Colors.inkPrimary, dim = false }: {
  limit: 1 | 2 | null
  size?: number
  color?: string
  dim?: boolean
}) {
  return (
    <View
      style={[
        s.ring,
        { width: size, height: size, borderRadius: size / 2, borderColor: color, opacity: dim ? 0.45 : 1 },
        limit == null && s.solid,
      ]}
    >
      <Text style={[s.num, { color, fontSize: limit == null ? size * 0.62 : size * 0.5 }]}>
        {limit == null ? '∞' : limit}
      </Text>
    </View>
  )
}

const s = StyleSheet.create({
  ring: { borderWidth: 1.6, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  solid: { borderStyle: 'solid' },
  num: { fontFamily: FontFamily.bodySemiBold, includeFontPadding: false, textAlignVertical: 'center' },
})
