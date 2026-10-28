import { View, Text, StyleSheet } from 'react-native'
import { Check } from 'lucide-react-native'
import { Colors, FontFamily } from '@/constants'

/**
 * The view once / view twice mark: a dashed ring with the number inside,
 * the shape people already know from WhatsApp and Instagram. `null` =
 * unlimited views: a solid ring with a tick, as on Instagram.
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
      {limit == null ? (
        <Check size={size * 0.58} color={color} strokeWidth={2.6} />
      ) : (
        <Text style={[s.num, { color, fontSize: size * 0.5 }]}>{limit}</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  ring: { borderWidth: 1.6, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  solid: { borderStyle: 'solid' },
  num: { fontFamily: FontFamily.bodySemiBold, includeFontPadding: false, textAlignVertical: 'center' },
})
